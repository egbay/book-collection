import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { BooksController } from './books.controller';
import { BooksService } from './books.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.simple(),
        }),
      ],
    }),
  ],
  controllers: [BooksController],
  providers: [
    BooksService,
    PrismaService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  exports: [BooksService],
})
export class BooksModule {}
