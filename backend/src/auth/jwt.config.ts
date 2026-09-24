import { ConfigService } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';

export const jwtConfig = (config: ConfigService): JwtModuleOptions => ({
  secret: config.get<string>('JWT_ACCESS_SECRET')!,
  // @ts-ignore - StringValue type compatibility
  signOptions: { expiresIn: config.get<string>('JWT_ACCESS_EXPIRES') ?? '15m' },
});

export const jwtRefreshConfig = (config: ConfigService): JwtModuleOptions => ({
  secret: config.get<string>('JWT_REFRESH_SECRET')!,
  // @ts-ignore - StringValue type compatibility
  signOptions: { expiresIn: config.get<string>('JWT_REFRESH_EXPIRES') ?? '7d' },
});