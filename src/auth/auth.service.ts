import { ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import * as argon from 'argon2'
import { AuthDto } from "./dto";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
@Injectable({})
export class AuthService {
  constructor(private prisma: PrismaService,
              private jwt: JwtService,
              private config: ConfigService
  ) {}

  async signup(dto: AuthDto) {
    const hash = await argon.hash(dto.password)
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        hash,
      }
    })
    return this.signToken(user.id, user.email)
  }
  async signin(dto: AuthDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email
      }})
    if (!user) throw new ForbiddenException("Incorrect")
    const pwMatches = await argon.verify(user.hash, dto.password)
    if (!pwMatches) throw new ForbiddenException("Incorrect")
    return this.signToken(user.id, user.email)
  }

  async signToken(userId: number, email: string): Promise<{ access_token:string}>{
    const secret = this.config.get('JWT_SECRET')

    const payload = {
      sub: userId,
      email
    }

    const token = await this.jwt.signAsync(payload, {
      expiresIn: '15m',
      secret: secret,
    })
    return {access_token: token}
  }
}
