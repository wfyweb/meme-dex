import { PartialType } from '@nestjs/swagger';
import { CreateEmailDto } from './create-auth.dto';

export class UpdateAuthDto extends PartialType(CreateEmailDto) {}
