// src/token/dto/create-rank-swap.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsArray, IsEnum, Matches } from 'class-validator';
export class CreateRankSwapDto {
  @ApiProperty({
    description: '查询排序的字段：open_timestamp：时间 liquidity：池子 marketcap：市值 holder_count 持有者 swaps 交易数 volume 成交额 price：价格 change1m: 1m涨跌幅 change5m: 5m涨跌幅 change1h:1h涨跌幅',
    required: false, 
    example: 'liquidity', 
  })
  @IsOptional()
  @IsString()
  orderby?: string;

  @ApiProperty({
    description: '排序方向：asc升序 desc降序',
    required: false, 
    example: 'asc', 
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  direction?: 'asc' | 'desc';

  @ApiProperty({
    description: '开始时间，时间格式 YYYY-MM-DD HH:mm:ss',
    required: false, 
    example: '2020-10-01 10:30:25', 
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/, {
    message: 'min_created must be in the format YYYY-MM-DD HH:mm:ss',
  })
  min_created?: string;

  @ApiProperty({
    description: '结束时间，时间格式 YYYY-MM-DD HH:mm:ss',
    required: false, 
    example: '2020-10-23 09:30:25', 
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/, {
    message: 'max_created must be in the format YYYY-MM-DD HH:mm:ss',
  })
  max_created?: string;

  @ApiProperty({
    description: '池子区间，最小池子',
    required: false, 
    example: '1000', 
  })
  @IsOptional()
  @IsNumber()
  min_liquidity?: number;

  @ApiProperty({
    description: '池子区间，最大池子',
    required: false, 
    example: '100000', 
  })
  @IsOptional()
  @IsNumber()
  max_liquidity?: number;

  @ApiProperty({
    description: '市值区间，最小市值',
    required: false, 
    example: '1000', 
  })
  @IsOptional()
  @IsNumber()
  min_marketcap?: number;

  @ApiProperty({
    description: '市值区间，最大市值',
    required: false, 
    example: '100000', 
  })
  @IsOptional()
  @IsNumber()
  max_marketcap?: number;


  @ApiProperty({
    description: '持有者数量区间，最少持有者',
    required: false, 
    example: '1000', 
  })
  @IsOptional()
  @IsNumber()
  min_holder_count?: number;

  @ApiProperty({
    description: '持有者数量区间，最多持有者',
    required: false, 
    example: '100000', 
  })
  @IsOptional()
  @IsNumber()
  max_holder_count?: number;

  @ApiProperty({
    description: '交易量区间，最小交易量',
    required: false, 
    example: '1000', 
  })
  @IsOptional()
  @IsNumber()
  min_swaps?: number;

  @ApiProperty({
    description: '交易量区间，最大交易量',
    required: false, 
    example: '100000', 
  })
  @IsOptional()
  @IsNumber()
  max_swaps?: number;


  @ApiProperty({
    description: '成交额区间，最大成交额',
    required: false, 
    example: '1000', 
  })
  @IsOptional()
  @IsNumber()
  min_volume?: number;

  @ApiProperty({
    description: '成交额区间，最大成交额',
    required: false, 
    example: '100000', 
  })
  @IsOptional()
  @IsNumber()
  max_volume?: number;

  @ApiProperty({
    description: '安全监测,Dev 多选查询字段： burn:烧池子 distribed: Top10 frozen: 黑名单 renounced： Mint丢弃 ，creator_hold:DEV 未清仓 creator_close:DEV 清仓 token_burnt：DEV 烧币',
    required: false, 
    example: '100000', 
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  filters?: string[];

  @ApiProperty({
    description: '老鼠仓区间: 查询最小老鼠仓占比，区值0～1代表百分比',
    required: false, 
    example: '0.1', 
  })
  @IsOptional()
  @IsNumber()
  min_insider_rate?: number;

  @ApiProperty({
    description: '老鼠仓区间: 查询最大老鼠仓占比',
    required: false, 
    example: '1', 
  })
  @IsOptional()
  @IsNumber()
  max_insider_rate?: number;
}