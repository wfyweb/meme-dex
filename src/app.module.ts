import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { SequelizeModule } from '@nestjs/sequelize';
import { TokenModule } from './token/token.module';
@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: 'ep-raspy-boat-a5tmzkdx.us-east-2.aws.neon.tech',
      port: 5432,
      username: 'neondb_owner',
      password: 'OaDmjFpn6Ng1',
      database: 'neondb',
      ssl: true,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
      autoLoadModels: true,
      synchronize: true,
    }),
    PrismaModule,
    AuthModule,
    TokenModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
