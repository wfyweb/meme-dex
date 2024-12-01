import { Module } from '@nestjs/common';
import { TokenService } from './token.service';
import { TokenController } from './token.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule], // 确保导入 HttpModule
  controllers: [TokenController],
  providers: [TokenService],
})
export class TokenModule {}
