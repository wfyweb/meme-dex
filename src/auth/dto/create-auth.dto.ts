import { ApiProperty } from '@nestjs/swagger';
import {
    IsString,
} from 'class-validator';


export class CreateEmailDto {
    @ApiProperty({
        description: '邮箱',
        example: '1234567890@xx.com',
        required: false,
    })
    @ApiProperty({
        description: '邮箱验证码',
        example: '0102',
        required: false,
    })
    @IsString()
    'email_code': string;
    @IsString()
    'email': string;
    @ApiProperty({
        description: '密码',
        example: '',
        required: false,
    })
    @IsString()
    'password': string;
}

export class CreateAddressDto {
    @ApiProperty({
        description: '钱包地址',
        example: '0xRf92a67192fBbFfC2d01HB6FfF0445aB70006187',
        required: false,
    })
    @IsString()
    'address': string;
    @ApiProperty({
        description: '签名信息',
        example: '',
        required: false,
    })
    @IsString()
    'message': string;
    @ApiProperty({
        description: '签名内容',
        example: '',
        required: false,
    })
    @IsString()
    'signature': string;
}
 
