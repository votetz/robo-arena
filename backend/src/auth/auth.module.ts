import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { jwtConfig, jwtRefreshConfig } from './jwt.config';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: jwtConfig,
    }),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    {
      provide: 'JWT_REFRESH',
      useFactory: async (config: ConfigService) => {
        const opts = jwtRefreshConfig(config);
        const { JwtService } = await import('@nestjs/jwt');
        return new JwtService(opts);
      },
      inject: [ConfigService],
    },
  ],
  controllers: [AuthController],
  exports: [AuthService, 'JWT_REFRESH'],
})
export class AuthModule {}