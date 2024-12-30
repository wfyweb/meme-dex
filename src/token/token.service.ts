import { Injectable } from '@nestjs/common';
import { CreateRankSwapDto } from './dto/create-token.dto';
import { v4 as uuidv4 } from 'uuid';
import { mockToken } from './data';
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
          ...rest,
          ...staticData,
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
  async createToken() {
    try {
      const recordAll = await Promise.all(
        mockToken.map(async (mock) => {
          const staticId = uuidv4();
          const [staticData, dynamicData] = await Promise.all([
            StaticData.create({
              id: staticId,
              chain: mock.chain,
              symbol: mock.symbol,
              address: mock.address,
              open_timestamp: new Date(mock.open_timestamp * 1000),
              renounced_mint: mock.renounced_mint,
              burn_status: mock.burn_status,
              frozen: mock.renounced_freeze_account,
            }),
            DynamicData.create({
              id: uuidv4(),
              staticId,
              liquidity: mock.liquidity,
              market_cap: mock.market_cap,
              holder_count: mock.holder_count,
              price: mock.price,
              swaps: mock.swaps,
              volume: mock.volume,
              sells: mock.sells,
              buys: mock.buys,
              distribed: mock.top_10_holder_rate,
              insider_rate: mock.rat_trader_amount_rate,
              creator_token_status: mock.creator_token_status,
              dev_token_burn_ratio: mock.dev_token_burn_ratio,
            }),
          ]);

          console.log(
            '🚀 ~ TokenService ~ record ~ record:',
            staticData.toJSON(),
            dynamicData.toJSON(),
          );
          return { staticId, ...staticData.toJSON(), ...dynamicData.toJSON() };
        }),
      );

      return {
        code: 0,
        data: recordAll,
        total: recordAll.length,
      };
    } catch (error) {
      console.error('Error in createToken:', error);
      return {
        code: 1,
        message: 'Failed to create tokens.',
        error: error.message || error,
      };
    }
  }
  async addRayToken() {
    try {
      await this.getRaydiumPolls();
    } catch (error) {
      console.error('Error in createToken:', error);
      return {
        code: 1,
        message: 'Failed to create tokens.',
        error: error.message || error,
      };
    }
  }
  // 总计： 12-27 10:00  5565 * 100 = 5564 * 100 + 81 = 556481
  async getRaydiumPolls(
    page: number = 1,
    pageSize: number = 1000,
  ): Promise<void> {
    try {
      const url = `https://api-v3.raydium.io/pools/info/list?poolType=all&poolSortField=default&sortType=desc&page=${page}&pageSize=${pageSize}`;
      const response = await lastValueFrom(this.httpService.get(url));
      const { data } = response.data;
      // 最后一夜记录token长度
      if (data.length > 0 && !data.hasNextPage) {
        await StatisticToken.create({
          id: uuidv4(),
          page,
          count: (page - 1) * pageSize + data.length,
          remark: 'Complete add token log',
        });
        console.log("🚀 ~ 'Complete add token log");
        return;
      }
      if (data.length === 0 || !data.hasNextPage) {
        console.log("🚀 ~ 'Complete add token log  data 0");
        // 如果没有更多数据，停止递归
        return new Promise((resolve, reject) => {
          reject({
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
          typeof pool.open_timestamp === 'string' &&
          !isNaN(Date.parse(pool.open_timestamp))
        ) {
          openTimestamp = new Date(pool.open_timestamp).toISOString(); // or just use pool.open_timestamp if it is already ISO formatted
        } else if (!isNaN(pool.open_timestamp)) {
          openTimestamp = new Date(pool.open_timestamp * 1000).toISOString(); // Convert UNIX timestamp to ISO string
        }
        // 池子信息
        const token = pool.mintA.symbol !== 'WSOL' ? pool.mintA : pool.mintB;
        return {
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

      await this.poolRepository(page, pageSize, pools);
      // 递归调用
      await this.getRaydiumPolls(page + 1);
    } catch (error) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          reject({
            code: 1,
            message: 'getRaydiumPolls error page is' + page,
            error: error.message || error,
          });
        }, 1000);
      });
    }
  }

  async poolRepository(page, pageSize, pools) {
    try {
      const static_pool = pools.map((pool) => {
        return {
          id: pool.staticId,
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
      console.log(`poolRepository Complete is page ${page}`);
    } catch (error) {
      console.error('Error in poolRepository:', error);
      await StatisticToken.create({
        id: uuidv4(),
        page,
        remark: `page ${page} pageSize ${pageSize}  Error in poolRepository: ${error}`,
      });
      return {
        code: 1,
        message: 'Failed to poolRepository tokens.',
        error: error.message || error,
      };
    }
  }
}
