import { PartialType } from '@nestjs/swagger';
import { CreateRankSwapDto } from './create-token.dto';

export class UpdateTokenDto extends PartialType(CreateRankSwapDto) {}
