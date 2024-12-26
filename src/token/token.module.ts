import { Module } from '@nestjs/common';
import { TokenService } from './token.service';
import { TokenController } from './token.controller';
import { HttpModule } from '@nestjs/axios';
import { SequelizeModule } from '@nestjs/sequelize';
import { StaticData, DynamicData } from './token.model';
@Module({
  imports: [SequelizeModule.forFeature([StaticData, DynamicData]), HttpModule], // 确保导入 HttpModule
  // imports: [SequelizeModule.forFeature([StaticData, DynamicData])],
  controllers: [TokenController],
  providers: [TokenService],
})
export class TokenModule {}
