import { Controller, Post, UseGuards, Body, Get, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { GetUser } from '../visas/get-user.decorator';
import { User } from '@prisma/client';

@ApiTags('auth')
@Controller('v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registro de nuevo ciudadano (LDAP Público)' })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @UseGuards(AuthGuard('ldap-citizen'))
  @Post('login')
  @ApiOperation({ summary: 'Login para ciudadanos (Puerto 389)' })
  @ApiBody({ type: LoginDto })
  async login(@GetUser() user: User) {
    return this.authService.login(user);
  }

  @UseGuards(AuthGuard('ldap-internal'))
  @Post('office/login')
  @ApiOperation({ summary: 'Login para funcionarios (Puerto 390)' })
  @ApiBody({ type: LoginDto })
  async officeLogin(@GetUser() user: User) {
    return this.authService.login(user);
  }

  @Get('verify-email')
  @ApiOperation({ summary: 'Verificar correo electrónico del usuario' })
  verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }
}