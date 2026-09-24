import { Injectable, ConflictException, UnauthorizedException, Inject } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    @Inject('JWT_REFRESH') private jwtRefresh: JwtService,
  ) {}

  private generateTokens(user: { id: number; email: string; username: string }) {
    const payload = { sub: user.id, email: user.email, username: user.username };
    const accessToken = this.jwt.sign(payload);
    const refreshToken = this.jwtRefresh.sign(payload);
    return { accessToken, refreshToken };
  }

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { username: dto.username }] },
    });
    if (exists) throw new ConflictException('Email or username already in use');

    const hash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: { email: dto.email, username: dto.username, password: hash },
      select: { id: true, email: true, username: true, createdAt: true },
    });
    const tokens = this.generateTokens(user);
    return { user, ...tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.identifier }, { username: dto.identifier }] },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');

    const { password, ...userWithoutPassword } = user;
    const tokens = this.generateTokens(userWithoutPassword);
    return { user: userWithoutPassword, ...tokens };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtRefresh.verify(refreshToken);
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedException('User not found');
      const { password, ...safe } = user;
      const tokens = this.generateTokens(safe);
      return { user: safe, ...tokens };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}