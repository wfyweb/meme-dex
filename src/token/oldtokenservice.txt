import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRankSwapDto } from './dto/create-token.dto';
import { v4 } from 'uuid';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HttpService } from '@nestjs/axios';
import { mockToken } from './data';
import * as dayjs from 'dayjs'
@Injectable()
export class TokenService {
  constructor(private readonly prisma: PrismaService, private httpService: HttpService) { }

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
    } = createRankSwapDto;
    // const whereStatic: any = {}; // 静态数据查询条件
    const whereDynamic: any = {}; // 动态数据查询条件
    // whereDynamic 是否包含staticData属性
    const isCreateDynamicStaticData = () => {
      if (!whereDynamic.hasOwnProperty('staticData')) {
        whereDynamic.staticData = {}
      }
    }
    // 时间
    if (min_created !== undefined) {
      isCreateDynamicStaticData()
      const time = dayjs(min_created).toDate()
      whereDynamic.staticData.open_timestamp = { gte: time };
    }
    if (max_created !== undefined) {
      isCreateDynamicStaticData()
      const time = dayjs(min_created).toDate()
      whereDynamic.staticData.open_timestamp = { ...whereDynamic.staticData.open_timestamp, lte: time };
    }
    // 池子
    if (min_liquidity !== undefined) {
      whereDynamic.liquidity = { gte: min_liquidity };
    }
    if (max_liquidity !== undefined) {
      whereDynamic.liquidity = { ...whereDynamic.liquidity, lte: max_liquidity };
    }
    // 市值
    if (min_marketcap !== undefined) {
      whereDynamic.market_cap = { gte: min_marketcap };
    }
    if (max_marketcap !== undefined) {
      whereDynamic.market_cap = { ...whereDynamic.market_cap, lte: max_marketcap };
    }
    // 持有者
    if (min_holder_count !== undefined) {
      whereDynamic.holder_count = { gte: min_holder_count };
    }
    if (max_holder_count !== undefined) {
      whereDynamic.holder_count = { ...whereDynamic.holder_count, lte: max_holder_count };
    }
    // 交易数
    if (min_swaps !== undefined) {
      whereDynamic.swaps = { gte: min_swaps };
    }
    if (max_swaps !== undefined) {
      whereDynamic.swaps = { ...whereDynamic.swaps, lte: max_swaps };
    }
    // 成交额
    if (min_volume !== undefined) {
      whereDynamic.volume = { gte: min_volume };
    }
    if (max_volume !== undefined) {
      whereDynamic.volume = { ...whereDynamic.volume, lte: max_volume };
    }
    // 老鼠仓
    if (min_insider_rate !== undefined) {
      whereDynamic.insider_rate = { gte: min_insider_rate };
    }
    if (max_insider_rate !== undefined) {
      whereDynamic.insider_rate = { ...whereDynamic.insider_rate, lte: max_insider_rate };
    }
    // 处理 filters ['']
    // renounced：Mint丢弃 frozen: 黑名单 burn:烧池子  
    // distribed: Top10 creator_hold: DEV未清仓 creator_close:DEV清仓 token_burnt：DEV烧币
    if (filters && filters.length > 0) {
      if (filters.includes('renounced')) {
        isCreateDynamicStaticData()
        whereDynamic.staticData.renounced_mint = 1
      }
      if (filters.includes('frozen')) {
        isCreateDynamicStaticData()
        whereDynamic.staticData.frozen = 1
      }
      if (filters.includes('burn')) {
        isCreateDynamicStaticData()
        whereDynamic.staticData.burn_status = 'burn'
      }
      // Top10持仓 DEV未清仓 DEV清仓 DEV烧币查询逻辑
      if (filters.includes('distribed')) {
        whereDynamic.distribed = { gte: 0 }
      }
      // creator_token_status的值：creator_hold ：未清仓/持仓  creator_close 清仓  creator_buy 加仓 creator_add_liquidity 加池子
      if (filters.includes('creator_close')) {
        whereDynamic.creator_token_status = 'creator_close'
      }
      if (filters.includes('creator_hold')) {
        whereDynamic.creator_token_status = 'creator_hold'
      }
      if (filters.includes('token_burnt')) {
        whereDynamic.dev_token_burn_ratio = { gte: 0 }
      }
    }
    // 排序条件
    const orderBy: any = {};
    if (orderby) {
      // 查询staticData表中字段
      if (orderby === 'open_timestamp') {
        orderBy.staticData = {}
        orderBy.staticData.open_timestamp = direction === 'desc' ? 'desc' : 'asc';
      } else {
        orderBy[orderby] = direction === 'desc' ? 'desc' : 'asc';
      }
    }
    console.log(whereDynamic, orderBy)
    // 执行 Prisma 查询，同时关联 StaticData 和 DynamicData
    const tokens = await this.prisma.dynamicData.findMany({
      where: whereDynamic,
      include: {
        staticData: {
          select: {
            chain: true,
            symbol: true,
            address: true,
            open_timestamp: true,
            renounced_mint: true,
            frozen: true,
            burn_status: true,
          },
        },
      },
      orderBy,
    });
    //  解构出 staticData 和其他属性
    const _tokens = tokens.map(item => {
      const { staticData, ...rest } = item;
      return {
        ...rest,
        ...staticData,
      };
    });
    return {
      message: 'Rank swaps fetched successfully',
      data: _tokens,
    };
  }

  // 测试接口，用于假数据导入表中
  async createToken() {
    try {
      // 使用 Promise.all 处理所有异步操作
      const recordAll = await Promise.all(
        mockToken.map(async (mock) => {
          const staticId = v4(); // 生成唯一的 staticId
          // 使用 Prisma 的事务来确保数据一致性
          const record = await this.prisma.$transaction(async (prisma) => {
            return await Promise.all([
              prisma.staticData.create({
                data: {
                  id: staticId,
                  chain: mock.chain,
                  symbol: mock.symbol,
                  address: mock.address,
                  open_timestamp: new Date(mock.open_timestamp * 1000),
                  renounced_mint: mock.renounced_mint,
                  burn_status: mock.burn_status,
                  frozen: mock.renounced_freeze_account,
                },
              }),
              prisma.dynamicData.create({
                data: {
                  staticId: staticId, // 保持与 staticId 的关联
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
                },
              }),
            ]);
          });

          console.log("🚀 ~ TokenService ~ record ~ record:", record);
          return { staticId, ...(record[0] || {}), ...(record[1] || {}) }; // 确保返回的数据
        })
      );

      return {
        code: 0,
        data: recordAll,
      };
    } catch (error) {
      console.error("Error in createToken:", error);
      return {
        code: 1,
        message: "Failed to create tokens.",
        error: error.message || error, // 返回错误信息
      };
    }
  }
  // 爬取gmgn数据
  gmgnData(): Observable<any> {
    const url = 'https://gmgn.ai/defi/quotation/v1/rank/sol/swaps/24h?orderby=open_timestamp&direction=asc'

    // 设置请求头，包括 Cookie 和其他信息
    const headers = {
      "Content-Type": "application/json",
      "Accept": "application/json, text/plain, */*",
      "Accept-Encoding": "gzip, deflate, br, zstd",
      "Accept-Language": "zh-CN,zh;q=0.9",
      "Cookie": "_ga=GA1.1.704559857.1732005617; cf_clearance=2tJ9rks4R30xo9vlDyNlQgrAbQ.oa6qQLpKnb9Z_lXU-1732594509-1.2.1.1-yys1xnbVD6oLASFq6mG8ZqEP2lt2deF6U16oP1gWnP6bIOwpcMcc6qUmbq2ZRiqB.aGDmOAo_GtrEuSekDWRXMxbdhr5WxeSMBDiTkbKqEjnjsrRY2xHXN_0PETytTX1Bc1LqV2PB6gHNRB3z.WRnpwQfBDrx5CLHWBGaPoUE2_dkhKBhrvT7vozE7geFXKgm1MYya2TUyq88yhX8ajBf31Xd9w9GfVxvA7qSxaO.1JrEdF5AwuRUSlATF9KObTHfc2ojeXa0lkB43JjjYqLigbDQXnczMnvbJX18i0QBEQ5sW_IpZx_CiT4hsvKjWYOXmowtxQZqxA.aC0r.ugbUnxRwwo54qms653321sXfCDMGuCNyoKfHDsnjM2s7IVJNO_ENKBd98yn7W48TEXMoopASr2HpemFenDiBfrjpx9L6xVnPck4CFoAvUwC9g5F; __cf_bm=oP7rdg1kmbMsilGc10jo8mj5dec9N_yRRPWstQY1oAQ-1732594516-1.0.1.1-1WXfs3Qp5pV1W5vUSOXEUMRpNaX8m98nt6TqQdmtZRKzhVmS.J_QMpUy446OBGpMIG5szrYdfEcnnkHdMc8KEQ; _ga_0XM0LYXGC8=GS1.1.1732593565.11.1.1732594884.0.0.0",
      "Referer": "https://gmgn.ai/?chain=sol",
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
      "If-None-Match": "W/\"1dca5-IkpNBXXrhcHLJTyGOC/EWtOzIg4\"",
      "Sec-CH-UA": "\"Chromium\";v=\"130\", \"Google Chrome\";v=\"130\", \"Not?A_Brand\";v=\"99\"",
      "Sec-CH-UA-Mobile": "?0",
      "Sec-CH-UA-Platform": "\"macOS\"",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-origin",
    };
    return this.httpService.get(url, { headers }).pipe(
      map(response => response.data), // 提取数据
      catchError(error => throwError(() => new Error('Error fetching data: ' + error)))
    );
  }
}


