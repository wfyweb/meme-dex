import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TokenService } from './token.service';
import { CreateRankSwapDto } from './dto/create-token.dto';
import { UpdateTokenDto } from './dto/update-token.dto';

@Controller('token')
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}

  @Post('/rank/swaps')
  getRankSwaps(@Body() CreateRankSwapDto: CreateRankSwapDto) {
    return this.tokenService.getRankSwaps(CreateRankSwapDto);
  }
  // 创建代表列表，仅用于测试，把假数据导入数据库中
  @Post('/create')
  createToken(@Body() CreateRankSwapDto: CreateRankSwapDto) {
    return this.tokenService.createToken()
  }
}
