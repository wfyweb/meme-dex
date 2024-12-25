import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateEmailDto {
  @ApiProperty({
    description: '邮箱验证码',
    example: '0102',
    required: false,
  })
  @IsString()
  'email_code': string;
  @ApiProperty({
    description: '邮箱',
    example: '1234567890@xx.com',
    required: false,
  })
  @IsString()
  'email': string;
  @ApiProperty({
    description: '密码',
    example: '',
    required: false,
  })
  @IsString()
  'password': string;
  @ApiProperty({
    description: '邀请码',
    example: 'E80a',
    required: false,
  })
  @IsOptional()
  @IsString()
  referralCode?: string; // 可选
}
export class loginEmailDto {
  @ApiProperty({
    description: '邮箱',
    example: '1234567890@xx.com',
    required: false,
  })
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
    example: '2m1xMkr6L3BV7zmAkuPrkMczjn533xi4MpomnD9X2Kmp',
    required: false,
  })
  @IsString()
  'address': string;
  @ApiProperty({
    description: '签名信息',
    example:
      'meme-dex wants you to sign in with your Solana wallet_sign_statement \naccount:24PNhTaNtomHhoy3fTRaMhAFCRj4uHqhZEEoWrKDbR5p\nnonce: qpllchiq',
    required: false,
  })
  @IsString()
  'message': string;
  @ApiProperty({
    description: '签名内容',
    example:
      'uGCxw8U4Tx5kMwLwBvobjETGjgGlVk4m/iku4rX+q7gBu+KNQHEtRLw061f0KIXTL0Jv/u3OeVDNxpNUnctdAg==',
    required: false,
  })
  @IsString()
  'signature': string;
  @ApiProperty({
    description: '邀请码',
    example: 'E80a',
    required: false,
  })
  @IsOptional()
  @IsString()
  referralCode?: string; // 可选
}
