import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private configService: ConfigService) {}

  // DATABASE_URL ortam değişkenini alır
  getDatabaseUrl(): string {
    return this.configService.get<string>('DATABASE_URL');
  }

  // Basit bir örnek metod
  getHello(): string {
    return 'Hello World!';
  }
}
