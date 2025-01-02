import { PoolFetchType } from '@raydium-io/raydium-sdk-v2';
import { Injectable, Logger } from '@nestjs/common';
import { Timeout, Cron } from '@nestjs/schedule';
import { initRaydium, raydiumV4Address } from './config';
import { v4 as uuidv4 } from 'uuid';
import {
  StaticData,
  DynamicData,
  StatisticToken,
} from 'src/sequelize/token.model';
@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);
  //   @Timeout(3000)
  @Cron('0 0 * * *') // 每天凌晨0点执行
  async addRayToken() {
    this.logger.log('add raydiumCreate data ');
    try {
      const totalCount = await DynamicData.count();
      const page = Math.floor(totalCount / 1000) + 1;
      this.logger.log(
        `🚀 ~ TokenService ~ addRayToken ~ totalCount: ${totalCount}, page: ${page}`,
      );
      await this.getRaydiumPolls(page, 1000, totalCount);
    } catch (error) {
      console.error('Error in createToken:', error);
      return {
        code: 1,
        message: 'Failed to create tokens.',
        error: error.message || error,
      };
    }
  }
  // 取ray池子
  async getRaydiumPolls(
    page: number = 1,
    pageSize: number = 1000,
    totalCount: number,
  ) {
    try {
      const raydium = await initRaydium();
      // 取池子列表
      const { data, hasNextPage } = await raydium.api.getPoolList({
        type: PoolFetchType.All,
        sort: 'liquidity',
        order: 'desc',
        pageSize,
        page,
      });
      if (data.length === 0 && !hasNextPage) {
        this.logger.log('🚀 ~ invalid pool');
        // 没有数据，停止递归
        return new Promise((resolve) => {
          resolve({
            code: 0,
            message: 'invalid pool',
          });
        });
      }
      // 处理每个 pool 数据并保存到数据库
      let pools = data.map((pool) => {
        let openTimestamp: any = null;
        // Check if open_timestamp is a valid date string or a UNIX timestamp
        if (
          typeof pool.openTime === 'string' &&
          !isNaN(Date.parse(pool.openTime))
        ) {
          openTimestamp = new Date(pool.openTime).toISOString(); // or just use pool.open_timestamp if it is already ISO formatted
        } else if (!isNaN(Date.parse(pool.openTime))) {
          // @ts-ignore
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
            // @ts-ignore
            pool.lpAmount * pool.lpPrice ? pool.lpAmount * pool.lpPrice : 0,
          burn_ratio: pool.burnPercent
            ? pool.burnPercent / 100
            : pool.burnPercent,
          open_timestamp: openTimestamp,
          create_address: null,
        };
      });
      // 最后一页，检查表里是否已存，未存插入，没存返回
      if (data.length > 0 && !hasNextPage) {
        const newPools = await this.checkLastPage(totalCount, pageSize, pools);
        if (newPools.length > 0) {
          await this.poolRepository(page, pageSize, newPools);
        }
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
        // 当前表最后一页有数据，进行过滤插入
      } else {
        // 计算总页数
        const totalPages = Math.ceil(totalCount / pageSize);
        // 检查当前页是否是最后一页
        const isLastPage = page === totalPages && totalCount % pageSize > 0;
        if (isLastPage) {
          pools = await this.checkLastPage(totalCount, pageSize, pools);
        }
      }

      await this.poolRepository(page, pageSize, pools);
      // 递归调用
      await this.getRaydiumPolls(page + 1, pageSize, totalCount + pools.length);
    } catch (error) {
      this.logger.error('🚀 ~ TokenService ~ getRaydiumPolls ~ error:', error);
      return {
        code: 1,
        message: 'getRaydiumPolls error page is' + page,
        error: error,
      };
    }
  }
  // 池子数据存入token表
  async poolRepository(page, pageSize, pools) {
    this.logger.log(
      '🚀 ~ TokenService ~ poolRepository ~ pools:',
      pools.length,
    );
    if (pools.length === 0) return;
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
  // 检测最后一页数据，过滤重复数据
  async checkLastPage(totalCount, pageSize, pools) {
    try {
      const tokens = await StaticData.findAll({
        order: [['order', 'DESC']], // 按 order 字段降序，最大在前面
        limit: totalCount % pageSize,
      });
      const poolAddressList = new Set(tokens.map((item) => item.pool_address));
      // 过滤 pools 中的元素，保留其 pool_address 不在 poolAddressList 中的元素
      const newPools = pools.filter(
        (item) => !poolAddressList.has(item.pool_address),
      );
      this.logger.log(
        '🚀 ~ JobsService ~ checkLastPage ~ newPools:',
        newPools.length,
      );
      return newPools;
    } catch (error) {
      this.logger.error('🚀 ~ TokenService ~ checkLastPage ~ error:', error);
    }
  }
  // 使用 @Timeout
  @Timeout(1000)
  async raydiumCreate() {
    this.logger.log('start raydiumCreate log');
    try {
      const raydium = await initRaydium();
      // 监听LP 创建
      raydium.connection.onLogs(
        'allWithVotes',
        ({ logs, err, signature }) => {
          if (logs.some((log) => log.includes('initialize2'))) {
            this.fetchPoolInfo(signature, raydium.connection);
          }
        },
        'confirmed',
      );
    } catch (error) {
      this.logger.log(error);
    }
  }

  async fetchPoolInfo(signature, connection) {
    try {
      // 解析交易的详细信息
      const tx = await connection.getParsedTransaction(signature, {
        maxSupportedTransactionVersion: 0,
        commitment: 'confirmed',
      });
      const accounts = tx?.transaction.message.instructions.find((ix) => {
        return ix.programId.toBase58() === raydiumV4Address;
      }).accounts;

      if (!accounts) {
        this.logger.log('No accounts found in the transaction.');
        return;
      }
      // 获取池子地址index为4
      const LPIndex = 4;
      const LPAccount = accounts[LPIndex];
      const raydium = await initRaydium();
      // 池子地址，查询池子信息
      //   https://github.com/raydium-io/raydium-sdk-V2/blob/master/src/api/api.ts
      setTimeout(async () => {
        // 调用v3 get_pools_info_ids 接口
        const data = await raydium.api.fetchPoolById({
          ids: LPAccount.toBase58(), // 7pNVpfNgpQXcE97jDSw1uJq6ixX2MKanCVCwRHT9gH7p
        });
        this.logger.log('🚀 ~ JobsService ~ setTimeout ~ data:', data);
        if (data?.length > 0 && data[0] !== null) {
          this.setPoolInfo(data);
          // 记录新增失败的池子
        } else {
          const _remark = {
            isComplete: 0,
            state: 'await',
            pool_address: LPAccount.toBase58(),
            message: `await pool address add token`,
          };
          await StatisticToken.create({
            id: uuidv4(),
            page: 0,
            count: 1,
            remark: JSON.stringify(_remark),
          });
        }
      }, 10000);
    } catch (error) {
      this.logger.log('fetchPoolInfo ~ error: ', error);
    }
  }
  async setPoolInfo(data) {
    const pools = data.map((pool) => {
      let openTimestamp: any = null;
      // Check if open_timestamp is a valid date string or a UNIX timestamp
      if (
        typeof pool?.openTime === 'string' &&
        !isNaN(Date.parse(pool?.openTime))
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
          // @ts-ignore
          pool.lpAmount * pool?.lpPrice ? pool?.lpAmount * pool?.lpPrice : 0,
        burn_ratio: pool.burnPercent
          ? pool.burnPercent / 100
          : pool.burnPercent,
        open_timestamp: openTimestamp,
        create_address: null,
      };
    });
    const static_pool = pools.map((pool) => {
      return {
        id: pool.staticId,
        // @ts-ignore
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

    const staticData = await StaticData.bulkCreate(static_pool);
    await DynamicData.bulkCreate(dynamic_pool);
    this.logger.log('add pool address: ', data[0]?.id);
    return staticData;
  }
  // @Timeout(5000)
  @Cron('0 * * * *') // 每小时的第0分钟执行
  async handleCron() {
    const awiteTokens = await StatisticToken.findAll({
      where: {
        page: 0,
      },
    });
    const poolAddress = awiteTokens
      .map((item) => {
        const { pool_address = null, state = '' } = JSON.parse(item.remark);
        if (state === 'await') {
          return pool_address;
        }
      })
      .filter(Boolean);
    try {
      const raydium = await initRaydium(); // 8uUAtLoSstn26cWCKcNf1yVvTGzStwn1nGLvunP1HYV6，7pNVpfNgpQXcE97jDSw1uJq6ixX2MKanCVCwRHT9gH7p
      const data = await raydium.api.fetchPoolById({
        ids: poolAddress.join(','),
      });
      // this.logger.log('🚀 ~ JobsService ~ handleCron ~ data:', data);
      if (data?.length > 0 && data[0] !== null) {
        const staticData = await this.setPoolInfo(data);
        if (staticData.length > 0) {
          const ids = awiteTokens.map((item) => item.id);
          await StatisticToken.destroy({
            where: {
              id: ids,
            },
          });
        }
      }
    } catch (error) {
      this.logger.error('🚀 ~ JobsService ~ handleCron ~ error:', error);
    }
  }
}
