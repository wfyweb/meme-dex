import { Injectable, Logger } from '@nestjs/common';
import { CreateRankSwapDto } from './dto/create-token.dto';
import { v4 as uuidv4 } from 'uuid';
// import { mockToken } from './data';
import * as dayjs from 'dayjs';
import {
  StaticData,
  DynamicData,
  StatisticToken,
} from 'src/sequelize/token.model';
import { Op, OrderItem } from 'sequelize';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
@Injectable()
export class TokenService {
  constructor(private httpService: HttpService) {}
  private readonly logger = new Logger(TokenService.name);
  async getRankSwaps(createRankSwapDto: CreateRankSwapDto) {
    const {
      orderby,
      direction,
      min_created,
      max_created,
      min_liquidity,
      max_liquidity,
      min_marketcap,
      max_marketcap,
      min_holder_count,
      max_holder_count,
      min_swaps,
      max_swaps,
      min_volume,
      max_volume,
      filters,
      min_insider_rate,
      max_insider_rate,
      page = 1, // 设置默认值
      pageSize = 1000, // 设置默认值
    } = createRankSwapDto;

    const where: any = {};
    const include: any = [
      {
        model: StaticData,
        attributes: [
          'chain',
          'symbol',
          'name',
          'logo_url',
          'decimals',
          'address',
          'open_timestamp',
          'renounced_mint',
          'frozen',
          'burn_status',
        ],
      },
    ];
    const order: OrderItem[] = [];

    // 时间
    if (min_created !== undefined) {
      where.createdAt = { [Op.gte]: dayjs(min_created).toDate() };
    }
    if (max_created !== undefined) {
      where.createdAt = {
        ...where.createdAt,
        [Op.lte]: dayjs(max_created).toDate(),
      };
    }

    // 其他筛选条件
    if (min_liquidity !== undefined) {
      where.liquidity = { [Op.gte]: min_liquidity };
    }
    if (max_liquidity !== undefined) {
      where.liquidity = { ...where.liquidity, [Op.lte]: max_liquidity };
    }
    if (min_marketcap !== undefined) {
      where.market_cap = { [Op.gte]: min_marketcap };
    }
    if (max_marketcap !== undefined) {
      where.market_cap = { ...where.market_cap, [Op.lte]: max_marketcap };
    }
    if (min_holder_count !== undefined) {
      where.holder_count = { [Op.gte]: min_holder_count };
    }
    if (max_holder_count !== undefined) {
      where.holder_count = {
        ...where.holder_count,
        [Op.lte]: max_holder_count,
      };
    }
    if (min_swaps !== undefined) {
      where.swaps = { [Op.gte]: min_swaps };
    }
    if (max_swaps !== undefined) {
      where.swaps = { ...where.swaps, [Op.lte]: max_swaps };
    }
    if (min_volume !== undefined) {
      where.volume = { [Op.gte]: min_volume };
    }
    if (max_volume !== undefined) {
      where.volume = { ...where.volume, [Op.lte]: max_volume };
    }
    if (min_insider_rate !== undefined) {
      where.insider_rate = { [Op.gte]: min_insider_rate };
    }
    if (max_insider_rate !== undefined) {
      where.insider_rate = {
        ...where.insider_rate,
        [Op.lte]: max_insider_rate,
      };
    }

    // 处理 filters
    if (filters && filters.length > 0) {
      const staticDataWhere: any = {};
      if (filters.includes('renounced')) {
        staticDataWhere.renounced_mint = 1;
      }
      if (filters.includes('frozen')) {
        staticDataWhere.frozen = 1;
      }
      if (filters.includes('burn')) {
        staticDataWhere.burn_status = 'burn';
      }
      if (Object.keys(staticDataWhere).length > 0) {
        include[0].where = staticDataWhere;
      }

      if (filters.includes('distribed')) {
        where.distribed = { [Op.gte]: 0 };
      }
      if (filters.includes('creator_close')) {
        where.creator_token_status = 'creator_close';
      }
      if (filters.includes('creator_hold')) {
        where.creator_token_status = 'creator_hold';
      }
      if (filters.includes('token_burnt')) {
        where.dev_token_burn_ratio = { [Op.gte]: 0 };
      }
    }

    // 排序条件
    if (orderby) {
      if (orderby === 'open_timestamp') {
        order.push([
          { model: StaticData, as: 'staticData' },
          'open_timestamp',
          direction,
        ]);
      } else {
        order.push([orderby, direction]);
      }
    }

    const limit = pageSize; // 每页的记录数
    const offset = (page - 1) * pageSize; // 计算偏移量
    try {
      const tokens = await DynamicData.findAll({
        where,
        include,
        order,
        limit, // 限制每页的记录数
        offset, // 从第offset条记录开始
      });
      //  解构出 staticData 和其他属性
      const _tokens = tokens.map((item) => {
        const { staticData, ...rest } = item.toJSON();
        return {
          ...staticData,
          ...rest,
        };
      });
      const totalCount = await DynamicData.count();
      return {
        code: 0,
        message: 'Rank swaps fetched successfully',
        data: _tokens,
        page,
        pageSize,
        total: totalCount,
      };
    } catch (error) {
      console.log('🚀 ~ TokenService ~ getRankSwaps ~ error:', error);
      return {
        code: 1,
        message: 'Failed to find tokens.',
        error: error.message || error,
      };
    }
  }

  async addRayToken() {
    try {
      const totalCount = await DynamicData.count();
      const page = Math.floor(totalCount / 1000) + 1;
      this.logger.log(
        '🚀 ~ TokenService ~ addRayToken ~ totalCount:',
        totalCount,
        page,
      );
      await this.getRaydiumPolls(page, 1000);
    } catch (error) {
      console.error('Error in createToken:', error);
      return {
        code: 1,
        message: 'Failed to create tokens.',
        error: error.message || error,
      };
    }
  }
  // 总计： 12-27 10:00  5758 * 100 + 54 = 575854
  async getRaydiumPolls(page: number = 1, pageSize: number = 1000) {
    try {
      const url = `https://api-v3.raydium.io/pools/info/list?poolType=all&poolSortField=liquidity&sortType=desc&page=${page}&pageSize=${pageSize}`;
      const response = await lastValueFrom(this.httpService.get(url));
      const { data } = response.data;
      if (data?.data.length === 0 && !data.hasNextPage) {
        this.logger.log('🚀 ~ Complete add token log  data 0');
        // 如果没有更多数据，停止递归
        return new Promise((resolve, reject) => {
          resolve({
            code: 0,
            message: 'Complete add token log',
          });
        });
      }
      // 处理每个 pool 数据并保存到数据库
      const pools = data.data.map((pool) => {
        let openTimestamp: any = null;
        // Check if open_timestamp is a valid date string or a UNIX timestamp
        if (
          typeof pool.openTime === 'string' &&
          !isNaN(Date.parse(pool.openTime))
        ) {
          openTimestamp = new Date(pool.openTime).toISOString(); // or just use pool.open_timestamp if it is already ISO formatted
        } else if (!isNaN(Date.parse(pool.openTime))) {
          openTimestamp = new Date(pool.openTime * 1000).toISOString(); // Convert UNIX timestamp to ISO string
        }
        // 池子信息
        const token = pool.mintA.symbol !== 'WSOL' ? pool.mintA : pool.mintB;
        return {
          pool_address: pool.id,
          staticId: uuidv4(),
          programId: pool.programId,
          decimals: token.decimals,
          name: token.name,
          logo_url: token.logoURI,
          chain: 'sol',
          symbol: token.symbol,
          address: token.address,
          price: pool.price,
          liquidity:
            pool.lpAmount * pool.lpPrice ? pool.lpAmount * pool.lpPrice : 0,
          burn_ratio: pool.burnPercent
            ? pool.burnPercent / 100
            : pool.burnPercent,
          open_timestamp: openTimestamp,
          create_address: null,
        };
      });
      // 最后一页，检查表里是否已存，未存插入，没存返回
      if (data?.data.length > 0 && !data.hasNextPage) {
        await this.checkLastPage(page, pageSize, pools);
        const _remark = {
          isComplete: 1,
          state: 'success',
          page,
          pageSize,
          message: `Complete add token log`,
        };
        await StatisticToken.create({
          id: uuidv4(),
          page,
          count: data.length,
          remark: JSON.stringify(_remark),
        });
        this.logger.log("🚀 ~ 'Complete add token log");
        return;
      }
      await this.poolRepository(page, pageSize, pools);
      // 递归调用
      await this.getRaydiumPolls(page + 1);
    } catch (error) {
      this.logger.error('🚀 ~ TokenService ~ getRaydiumPolls ~ error:', error);
      return {
        code: 1,
        message: 'getRaydiumPolls error page is' + page,
        error: error,
      };
    }
  }

  async poolRepository(page, pageSize, pools) {
    this.logger.log(
      '🚀 ~ TokenService ~ poolRepository ~ pools:',
      pools.length,
    );
    try {
      const static_pool = pools.map((pool) => {
        return {
          id: pool.staticId,
          pool_address: pool.pool_address,
          chain: pool.chain,
          symbol: pool.symbol,
          name: pool.name,
          logo_url: pool.logo_url,
          decimals: pool.decimals,
          address: pool.address,
          programId: pool.programId,
          create_address: pool.create_address,
          open_timestamp: pool.open_timestamp,
        };
      });

      const dynamic_pool = pools.map((pool) => {
        return {
          id: uuidv4(),
          staticId: pool.staticId,
          liquidity: pool.liquidity,
        };
      });

      await StaticData.bulkCreate(static_pool);
      await DynamicData.bulkCreate(dynamic_pool);
      const _remark = {
        state: 'success',
        page,
        pageSize,
        message: `page ${page} pageSize ${pageSize}  poolRepository Complete is page`,
      };
      await StatisticToken.create({
        id: uuidv4(),
        page,
        count: pools.length,
        remark: JSON.stringify(_remark),
      });
      this.logger.log(`poolRepository Complete is page ${page}`);
      return `poolRepository Complete is page ${page}`;
    } catch (error) {
      console.error('Error in poolRepository:', error);
      const remark = {
        state: 'error',
        page,
        pageSize,
        message: `Error in poolRepository: ${error}`,
      };
      const stateToken = await StatisticToken.create({
        id: uuidv4(),
        page,
        count: pools.length,
        remark: JSON.stringify(remark),
      });
      return {
        code: 500,
        message: 'Failed to poolRepository tokens.',
        error: error.message || error,
        stateToken,
      };
    }
  }
  // 检测最后1000条更新
  async checkLastPage(page, pageSize, pools) {
    try {
      const totalCount = await DynamicData.count();
      const tokens = await StaticData.findAll({
        order: [['order', 'DESC']], // 按 order 字段降序排序
        limit: totalCount % pageSize,
      });
      const poolAddressList = new Set(tokens.map((item) => item.pool_address));
      // 过滤 pools 中的元素，保留其 pool_address 不在 poolAddressList 中的元素
      const newPools = pools.filter(
        (item) => !poolAddressList.has(item.pool_address),
      );
      console.log(
        '🚀 ~ TokenService ~ checkLastPage ~ newPools:',
        newPools.length,
      );
      if (newPools.length > 0) {
        await this.poolRepository(page, pageSize, newPools);
      }
    } catch (error) {
      this.logger.error('🚀 ~ TokenService ~ checkLastPage ~ error:', error);
    }
  }
  async getLastPageTokes() {
    const totalCount = await DynamicData.count();
    const tokens = await StaticData.findAll({
      order: [['order', 'DESC']], // 按 order 字段降序排序
      limit: totalCount % 1000,
    });
    return {
      code: 0,
      data: {
        count: tokens.length,
        tokens,
      },
    };
  }
}
// 写入token函数。 开始page1  pagesize 1000     ray 接口总数目前57.5w  5758 * 100 + 54 = 575854 => 12-29 10:00
//    1: 当前库的分页加 1
//    2  调用上传函数
//    3  递归调用
//    4. data长度 大于0，hasNextPage判断是最后一页
//    5  最后一页检测数据，没有在存入
//    6. 结束
