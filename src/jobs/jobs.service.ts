import { Injectable, Logger } from '@nestjs/common';
import { Timeout } from '@nestjs/schedule';
import { initRaydium, raydiumV4Address } from './config';
import { v4 as uuidv4 } from 'uuid';

import { StaticData, DynamicData } from 'src/sequelize/token.model';
@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);
  //   @Timeout(5000)
  //   handleTime(){
  //     this.logger.log('test log 5s');
  //   }
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

    await StaticData.bulkCreate(static_pool);
    await DynamicData.bulkCreate(dynamic_pool);
    this.logger.log('add pool address: ', data[0]?.id);
  }
}
