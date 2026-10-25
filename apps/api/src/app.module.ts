import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';

import { AuthModule } from './auth/auth.module.js';
import { BooksModule } from './books/books.module.js';
import { ClubsModule } from './clubs/clubs.module.js';
import { CollectionsModule } from './collections/collections.module.js';
import { PrismaExceptionFilter } from './common/prisma-exception.filter.js';
import { FollowsModule } from './follows/follows.module.js';
import { HealthController } from './health/health.controller.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { PostsModule } from './posts/posts.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ReadingSessionsModule } from './reading-sessions/reading-sessions.module.js';
import { ReviewsModule } from './reviews/reviews.module.js';
import { StatsModule } from './stats/stats.module.js';
import { UploadsModule } from './uploads/uploads.module.js';
import { UserBooksModule } from './user-books/user-books.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    BooksModule,
    ClubsModule,
    CollectionsModule,
    FollowsModule,
    NotificationsModule,
    PostsModule,
    ReadingSessionsModule,
    ReviewsModule,
    StatsModule,
    UploadsModule,
    UserBooksModule,
    UsersModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    },
    { provide: APP_FILTER, useClass: PrismaExceptionFilter },
  ],
})
export class AppModule {}
