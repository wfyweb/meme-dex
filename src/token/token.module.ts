import { Module } from '@nestjs/common';
import { TokenService } from './token.service';
import { TokenController } from './token.controller';
import { HttpModule } from '@nestjs/axios';
import { SequelizeModule } from '@nestjs/sequelize';
import {
  StaticData,
  DynamicData,
  StatisticToken,
} from 'src/sequelize/token.model';
@Module({
  imports: [
    SequelizeModule.forFeature([StaticData, DynamicData, StatisticToken]),
    HttpModule,
  ],
  controllers: [TokenController],
  providers: [TokenService],
})
export class TokenModule {}
