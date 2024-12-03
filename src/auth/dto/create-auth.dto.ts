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
        // example: 'BgTkrowL9zCub7HRdg534qkNUnmQq1Szj72CK8hh7nxQ',
        example: '24PNhTaNtomHhoy3fTRaMhAFCRj4uHqhZEEoWrKDbR5p',
        required: false,
    })
    @IsString()
    'address': string;
    @ApiProperty({
        description: '签名信息',
        example: 'welcome',
        required: false,
    })
    @IsString()
    'message': string;
    @ApiProperty({
        description: '签名内容',
        // example: '7FZDZ5Q325faRSGkkyG0w105eAchMCpNOfKLNjcCnWBGgXQUpknYL5ZSK65uZjfhEErloFJKqggGV+rSPHMECw==',
        example: 'w/iJ9q3IvB3noyQKAPdatBA/f90IgPN0AibxzjmCUgbkh+Dp83DpPyrSEBfN/GL75Qws6skY/2SqAc0N138WCQ==',
        required: false,
    })
    @IsString()
    'signature': string;
}
 
