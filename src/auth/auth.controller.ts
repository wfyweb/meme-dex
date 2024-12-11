import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateEmailDto, CreateAddressDto } from './dto/create-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // @Post()
  // create(@Body() CreateEmailDto: CreateEmailDto) {
  //   return this.authService.create(CreateEmailDto);
  // }

  @Get('/loginNonce/:address')
  loginNonce(@Param('address') address: string) {
    return this.authService.loginNonce(address);
  }
  @Get('/generateReferralCode/:userId')
  generateReferralCode(@Param('userId') userId: string) {
    return this.authService.generateReferralCode(userId);
  }
  @Get('/getReward/:userId')
  getReward(@Param('userId') userId: string) {
    return this.authService.getReward(userId);
  }
  @Get('/getReferral/:userId')
  getReferral(@Param('userId') userId: string) {
    return this.authService.getReferral(userId);
  }
  @Post('/verifyMessage')
  verifyMessage(@Body() CreateAddressDto: CreateAddressDto) {
    return this.authService.verifyMessage(CreateAddressDto);
  }

  @Post('/register')
  register(@Body() CreateEmailDto: CreateEmailDto) {
    return this.authService.registerUser(CreateEmailDto);
  }
}
