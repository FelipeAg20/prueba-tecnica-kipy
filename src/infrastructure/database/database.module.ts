import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BookEntity } from './entities/BookEntity';
import { UserEntity } from './entities/UserEntity';
import { LoanEntity } from './entities/LoanEntity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'library_user'),
        password: configService.get('DB_PASSWORD', 'library_password'),
        database: configService.get('DB_DATABASE', 'digital_library'),
        entities: [BookEntity, UserEntity, LoanEntity],
        synchronize: true, // Set to false in production
        logging: configService.get('NODE_ENV') === 'development',
      }),
    }),
    TypeOrmModule.forFeature([BookEntity, UserEntity, LoanEntity]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
