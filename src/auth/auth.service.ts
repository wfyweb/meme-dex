import { Injectable, HttpException } from '@nestjs/common';
import { CreateAddressDto } from './dto/create-auth.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { v4 } from 'uuid';
import { ethers } from 'ethers';
import { PublicKey } from "@solana/web3.js";
import { sign } from "tweetnacl";
import { decodeUTF8 } from "tweetnacl-util";
@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) { }
  isValidSolanaAddress(address: string) {
    try {
      // 尝试创建一个 PublicKey 对象
      new PublicKey(address);
      return true;
    } catch (error) {
      return false;
    }
  }
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
    const { address, message, signature } = CreateAddressDto
    const nonce = Math.floor(Math.random() * 1000000) + ''
    console.log(address, message, signature)
    try {
      const addressRecord = await this.prisma.account.findFirst({
        where: {
          uniqueId: address,
        },
      });
      if (!addressRecord) {
        // 未查询到该用户
        // throw new HttpException('The user was not found.', 400);
        return {
          code: 400,
          msg: 'The user was not found',
        }
      }


      // 是否Solana链钱包
      if (this.isValidSolanaAddress(address)) {
        console.log('start==> sol', addressRecord, message)
        try {
          const pubKey = new PublicKey(address);
          const signatureBuffer = new Uint8Array(Buffer.from(signature, 'base64')); // base64转化为Uint8Array格式
          // const _message  = `meme-dex wants you to sign in with your Solana account:\nGdS4cqHxVfEeQuoKc8CtXhYB1KFQRUiyyuFz52yT5on\nNonce: ${addressRecord}`
          const messageBytes = decodeUTF8(message);
          const isValid = sign.detached.verify(
            messageBytes,
            signatureBuffer,
            pubKey.toBytes() // Uint8Array
          );
          if (isValid) {
            // 查到用户，更新nonce, type
            await this.prisma.$transaction(async (prisma) => {
              return await Promise.all([
                prisma.user.update({
                  where: {
                    id: addressRecord.userId
                  },
                  data: {
                    nonce
                  }
                }),
                prisma.account.update({
                  where: {
                    id: addressRecord.id,
                  },
                  data: {
                    type: 'wallet:sol'
                  }
                }),
              ])
            })
            return {
              code: 0,
              msg: 'Login successful',
            }
          } else {
            throw new HttpException('verify message fail.', 400);
          }
        } catch (error) {

          // throw new HttpException(error, 400);
          return {
            code: 400,
            msg: error,
          }
        }
      } else if (ethers.utils.isAddress(address)) {
        // eth 钱包
        try {
          const recoveredAddress = ethers.utils.verifyMessage(message, signature)
          if (recoveredAddress.toLowerCase() === address.toLowerCase()) {
            // 查到用户，更新nonce
            await this.prisma.$transaction(async (prisma) => {
              return await Promise.all([
                prisma.user.update({
                  where: {
                    id: addressRecord.userId
                  },
                  data: {
                    nonce
                  }
                }),
                prisma.account.update({
                  where: {
                    id: addressRecord.id,
                  },
                  data: {
                    type: 'wallet:eth'
                  }
                }),
              ])
            })
            return {
              code: 0,
              msg: 'Login successful',
            }
          } else {
            throw new HttpException('verify message fail.', 400);
          }
        } catch (error) {
          throw new HttpException(error, 400);
        }
      } else {
        throw new HttpException('The wallet address is error.', 400);
      }

    } catch (error) {
      return {
        code: 400,
        msg: 'The user was not found',
      }
    }
  }
}
