import { Injectable, HttpException } from '@nestjs/common';
import {
  CreateAddressDto,
  CreateEmailDto,
  loginEmailDto,
} from './dto/create-auth.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { v4 } from 'uuid';
import { ethers } from 'ethers';
import { PublicKey } from '@solana/web3.js';
import { sign } from 'tweetnacl';
import { decodeUTF8 } from 'tweetnacl-util';
const token =
  'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZGRyZXNzIjoiMm0xeE1rcjZMM0JWN3ptQWt1UHJrTWN6am41MzN4aTRNcG9tbkQ5WDJLbXAiLCJhdWQiOiJnbWduLmFpL2FjY2VzcyIsImNoYWluIjoic29sIiwiZXhwIjoxNzMzMjE3MTk3LCJpYXQiOjE3MzMyMTYyOTcsImlzcyI6ImdtZ24uYWkvc2lnbmVyIiwic3ViIjoiZ21nbi5haS9hY2Nlc3MiLCJ2ZXJzaW9uIjoiMi4wIn0.OF5XR-2IdkdBLHooiGcc-yqXlcg-9hXlURB0Y2aKSsohjA_zauzCwWqhCdlXroJusDJHrirEBA7qCy11XYYLyQ';
@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}
  isValidSolanaAddress(address: string) {
    try {
      // 尝试创建一个 PublicKey 对象
      new PublicKey(address);
      return true;
    } catch (error) {
      return false;
    }
  }
  isValidValue(val) {
    if (val === null || val === undefined || val === '') {
      return false;
    }

    return true;
  }
  // 获取用户noce
  async loginNonce(address: string) {
    // 生成nocne
    const nonce = Math.floor(Math.random() * 1000000) + '';
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
              uniqueId: address,
            },
          }),
        ]);
      });
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
    };
  }
  // 钱包验签
  async verifyMessage(CreateAddressDto: CreateAddressDto) {
    const { address, message, signature, referralCode } = CreateAddressDto;
    const nonce = Math.floor(Math.random() * 1000000) + '';
    console.log('address', address, message, signature);
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
        };
      }

      // 是否Solana链钱包
      if (this.isValidSolanaAddress(address)) {
        console.log('start==> sol', addressRecord, message);
        try {
          const pubKey = new PublicKey(address);
          const signatureBuffer = new Uint8Array(
            Buffer.from(signature, 'base64'),
          ); // base64转化为Uint8Array格式
          // const _message  = `meme-dex wants you to sign in with your Solana account:\nGdS4cqHxVfEeQuoKc8CtXhYB1KFQRUiyyuFz52yT5on\nNonce: ${addressRecord}`
          const messageBytes = decodeUTF8(message);
          const isValid = sign.detached.verify(
            messageBytes,
            signatureBuffer,
            pubKey.toBytes(), // Uint8Array
          );
          if (isValid) {
            // 查到用户，更新nonce, type
            const users = await this.prisma.$transaction(async (prisma) => {
              return await Promise.all([
                prisma.user.update({
                  where: {
                    id: addressRecord.userId,
                  },
                  data: {
                    nonce,
                  },
                }),
                prisma.account.update({
                  where: {
                    id: addressRecord.id,
                  },
                  data: {
                    type: 'wallet:sol',
                  },
                }),
              ]);
            });
            // 入参有邀请码，且用户没被邀请
            if (referralCode && !users[0]?.referredBy) {
              this.rewardUser(addressRecord.userId, referralCode);
            }
            return {
              code: 0,
              msg: 'Login successful',
              data: { token },
            };
          } else {
            throw new HttpException('verify message fail.', 400);
          }
        } catch (error) {
          // throw new HttpException(error, 400);
          return {
            code: 400,
            msg: error,
          };
        }
      } else if (ethers.utils.isAddress(address)) {
        // eth 钱包
        try {
          const recoveredAddress = ethers.utils.verifyMessage(
            message,
            signature,
          );
          if (recoveredAddress.toLowerCase() === address.toLowerCase()) {
            // 查到用户，更新nonce
            const users = await this.prisma.$transaction(async (prisma) => {
              return await Promise.all([
                prisma.user.update({
                  where: {
                    id: addressRecord.userId,
                  },
                  data: {
                    nonce,
                  },
                }),
                prisma.account.update({
                  where: {
                    id: addressRecord.id,
                  },
                  data: {
                    type: 'wallet:eth',
                  },
                }),
              ]);
            });
            // 入参有邀请码，且用户没被邀请
            if (referralCode && !users[0]?.referredBy) {
              this.rewardUser(addressRecord.userId, referralCode);
            }
            return {
              code: 0,
              msg: 'Login successful',
              data: { token },
            };
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
      };
    }
  }
  // 用户生成邀请码
  async generateReferralCode(userId: string) {
    const userRecord = await this.prisma.user.findFirst({
      where: { id: userId },
    });
    if (!userRecord) throw new Error('User not found');
    if (!userRecord.referralCode) {
      const referralCode = this.generateUniqueCode(); // 生成唯一代码逻辑
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          referralCode,
        },
      });
      return {
        code: 0,
        data: referralCode,
        msg: 'User ReferralCode',
      };
    } else {
      return {
        code: 0,
        data: userRecord.referralCode,
        msg: 'User ReferralCode',
      };
    }
  }
  // 邮箱登录
  async login(loginEmailDto: loginEmailDto) {
    const { email, password } = loginEmailDto;
    if (!this.isValidValue(email)) {
      return {
        code: 400,
        msg: 'Please enter your email address',
      };
    }
    if (!this.isValidValue(password)) {
      return {
        code: 400,
        msg: 'Please input a password',
      };
    }
    const user = await this.prisma.account.findUnique({
      where: { uniqueId: email },
    });
    if (!user) {
      return {
        code: 400,
        msg: 'The user was not found',
      };
    } else if (user.password !== password) {
      return {
        code: 400,
        msg: 'Your password is incorrect, please try again',
      };
    } else {
      return {
        code: 0,
        msg: 'Login successful',
        data: { token },
      };
    }
  }
  // 注册账号 邀请码
  async registerUser(CreateEmailDto: CreateEmailDto) {
    const { email, password, referralCode } = CreateEmailDto;
    const userId = v4();
    const newUser = await this.prisma.$transaction(async (prisma) => {
      return await Promise.all([
        prisma.user.create({
          data: {
            id: userId,
          },
        }),
        prisma.account.create({
          data: {
            userId,
            type: 'email',
            uniqueId: email,
            password,
          },
        }),
      ]);
    });
    // 如果有邀请码，将新用户的 referredBy 字段设置为推荐人的 ID
    if (referralCode) {
      this.rewardUser(userId, referralCode);
    }
    return {
      code: 0,
      msg: 'register user success',
      data: {
        id: newUser[1].userId,
        email: newUser[1].uniqueId,
      },
    };
  }
  private async rewardUser(userId: string, referralCode: string) {
    const referrer = await this.prisma.user.findFirst({
      where: { referralCode }, // 通过referralCode查询邀请人
    });
    if (referrer) {
      await this.prisma.$transaction(async (prisma) => {
        return await Promise.all([
          prisma.user.update({
            where: {
              id: userId,
            },
            data: {
              referredBy: referrer.id,
            },
          }),
          prisma.referral.create({
            data: {
              userId: userId,
              referralCode,
              referredBy: referrer.id,
            },
          }),
        ]);
      });
      // 奖励邀请人
      const rewardAmount = 0; // 具体奖励金额
      await this.prisma.reward.create({
        data: {
          userId: userId,
          referredBy: referrer.id,
          amount: rewardAmount,
        },
      });
    }
  }
  // 生成6位数邀请码
  generateUniqueCode() {
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const length = 6;

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters[randomIndex];
    }
    return result;
  }

  async getReward(userId: string) {
    const rewardRecord = await this.prisma.reward.findMany({
      where: { referredBy: userId },
    });

    return {
      code: 0,
      data: rewardRecord,
    };
  }

  async getReferral(userId: string) {
    const referralRecord = await this.prisma.referral.findMany({
      where: { referredBy: userId },
    });
    return {
      code: 0,
      data: referralRecord,
    };
  }
}
