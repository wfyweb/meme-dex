import { Injectable } from '@nestjs/common';
import { Socket } from 'net';

const DURATION = 3600; // k线跨度/秒 3600一个小时
const INTERVAL = 5; // k线周期 5s 时间级别

@Injectable()
export class SocketService {
  private klineSimulator: KLineSimulator;
  constructor() {
    this.klineSimulator = new KLineSimulator();
    this.klineSimulator.generateKlineData(DURATION, INTERVAL); // 生成初始 K线数据
    this.startGeneratingKline(); // 开始周期性生成新的 K线数据
  }
  onEmit(event: string, data: any, client: Socket) {
    client.emit(event, {
      data,
    });
  }

  // K线数据
  handleKline(data: any, client: Socket) {
    this.onEmit('kline', this.klineSimulator.getKlineData(), client);
  }
  // 单个 K线数据
  handleKinfo(data: any, client: Socket) {
    setInterval(() => {
      const latestKline = this.klineSimulator.getKlineData().slice(-1)[0]; // 获取最新的 K线
      this.onEmit('kinfo', latestKline, client);
    }, 5000);
  }
  /**
   * 每5秒增加一条 K 线数据
   */
  private startGeneratingKline() {
    this.klineSimulator.startGeneratingKline();
  }
}

class KLineSimulator {
  private klineData: Array<object> = []; // 存储 K 线数据
  private currentPrice: number = 100; // 初始价格
  private volume: number = 100; // 初始成交量

  /**
   * 生成 K 线模拟数据
   * @param {number} duration - K 线时间范围,单位:秒
   * @param {number} interval - K 线时间间隔,单位:秒
   * @param {number} volatility - 价格波动率,取值范围 0 - 1
   */
  generateKlineData(
    duration: number = 3600,
    interval: number = 60,
    volatility: number = 0.5,
  ): Array<object> {
    const data: Array<object> = [];

    for (let time = 0; time < duration; time += interval) {
      const open = this.currentPrice;
      const high = open * (1 + volatility * Math.random());
      const low = open * (1 - volatility * Math.random());
      const close = low + (high - low) * Math.random();
      const formattedTime = new Date(Date.now() + time * 1000).toISOString();

      data.push({
        t: formattedTime, // 时间
        o: open.toFixed(2), // 开盘价
        h: high.toFixed(2), // 最高价
        l: low.toFixed(2), // 最低价
        c: close.toFixed(2), // 收盘价
        v: this.volume.toFixed(2), // 成交量
      });

      this.currentPrice = close; // 更新当前价格
      this.volume = this.volume * (1 + (Math.random() - 0.5) * 0.2); // 更新成交量
    }

    this.klineData.push(...data); // 将生成的数据推入 klineData 数组
    return data;
  }

  /**
   * 模拟增加K线
   */
  startGeneratingKline(interval: number = 5) {
    setInterval(() => {
      const lastKline = this.klineData[this.klineData.length - 1];
      const newKline = this.generateNextKline(lastKline);
      this.klineData.push(newKline);
    }, interval * 1000);
  }

  /**
   * 根据前一条 K线数据生成下一条 K线
   * @param {Object} prevKline - 前一条 K线数据
   * @returns {Object} - 新生成的 K线数据
   */
  private generateNextKline(prevKline: any): object {
    const volatility = 0.1; // 行情波动率
    const nextTime = new Date(
      new Date(prevKline.t).getTime() + INTERVAL * 1000,
    ); // 新 K线时间为上一 K线时间 + 5s

    const open = parseFloat(prevKline.c);
    const high = open * (1 + volatility * Math.random());
    const low = open * (1 - volatility * Math.random());
    const close = low + (high - low) * Math.random();
    const volume = parseFloat(prevKline.v) * (1 + (Math.random() - 0.5) * 0.2); // 随机生成成交量
    return {
      t: nextTime.toISOString(),
      o: open.toFixed(2),
      h: high.toFixed(2),
      l: low.toFixed(2),
      c: close.toFixed(2),
      v: volume.toFixed(2),
    };
  }

  public getKlineData() {
    return this.klineData;
  }
}
