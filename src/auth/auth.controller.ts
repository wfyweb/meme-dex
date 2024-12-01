import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateEmailDto, CreateAddressDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // @Post()
  // create(@Body() CreateEmailDto: CreateEmailDto) {
  //   return this.authService.create(CreateEmailDto);
  // }

  @Get('/loginNonce/:address')
  loginNonce(@Param('address') address: string) {
    return this.authService.loginNonce(address)
  }
  @Post('/verifyMessage')
  verifyMessage(@Body() CreateAddressDto: CreateAddressDto) {
    return this.authService.verifyMessage(CreateAddressDto)
  }

}
