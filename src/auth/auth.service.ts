import { Injectable, HttpException} from '@nestjs/common';
import { CreateAddressDto, CreateEmailDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { v4 } from 'uuid';
import { ethers } from 'ethers';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) { }
  // 获取用户noce
  async loginNonce(address: string) {
    // 生成nocne
    const nonce = Math.floor(Math.random() * 1000000) + ''
    const addressRecord = await this.prisma.account.findFirst({
      where: {
        uniqueId: address,
      },
    });
    // 没有查到地址，新加用户
    if (!addressRecord) {
      const userId = v4();
      await this.prisma.$transaction(async (prisma) => {
        return await Promise.all([
          prisma.user.create({
            data: {
              id: userId,
              nonce,
            },
          }),
          prisma.account.create({
            data: {
              userId,
              type: 'wallet',
              uniqueId: address
            },
          }),
        ])
      })
    } else {
      // 查到用户，更新nonce
      // await this.prisma.user.update({
      //   where: {
      //     id: addressRecord.userId
      //   },
      //   data: {
      //     nonce
      //   }
      // });
    }
    return {
      code: 0,
      nonce,
    }
  }
  // 钱包验签
  async verifyMessage(CreateAddressDto: CreateAddressDto) {
    const {address, message, signature} = CreateAddressDto
    const addressRecord = await this.prisma.account.findFirst({
      where: {
        uniqueId: address,
      },
    });
    if(!addressRecord) {
      // 未查询到该用户
      throw new HttpException('The user was not found.', 400);
    }

   try {
    // TODO type 区分链
    const recoveredAddress = ethers.utils.verifyMessage(message, signature)
    if (recoveredAddress.toLowerCase() === address.toLowerCase()) {
      const nonce = Math.floor(Math.random() * 1000000) + ''
      // 查到用户，更新nonce
      await this.prisma.user.update({
        where: {
          id: addressRecord.userId
        },
        data: {
          nonce
        }
      });
      return {
        code: 0,
        msg: 'Login successful',
      }
    }else{
      throw new HttpException('verify message fail.', 400);
    }
   } catch (error) {
    throw new HttpException(error, 400);
   }

  }
  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  update(id: number, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }
}
