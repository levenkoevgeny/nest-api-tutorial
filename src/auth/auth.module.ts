import { Module } from '@nestjs/common';
import { AuthContoller } from './auth.contoller';
import { AuthService } from './auth.service';
import { JwtModule } from "@nestjs/jwt";
import { JwtStrategy } from "./strategy";

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthContoller],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
