import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { ReportTarget } from '@reading/shared';

import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateReportDto } from './dto/create-report.dto.js';

// Who wrote the reported item, and the club it lives in (for chat messages)
interface Target {
  authorId: string;
  clubId?: string;
}

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(reporterId: string, dto: CreateReportDto): Promise<void> {
    const target = await this.findTarget(dto.targetType, dto.targetId);

    if (!target) {
      throw new NotFoundException('Nothing to report here');
    }

    if (target.authorId === reporterId) {
      throw new BadRequestException('You cannot report your own content');
    }

    // Only what you can see: a club's messages are for its members
    if (target.clubId) {
      const member = await this.prisma.clubMember.findUnique({
        where: { clubId_userId: { clubId: target.clubId, userId: reporterId } },
        select: { userId: true },
      });

      if (!member) {
        throw new NotFoundException('Nothing to report here');
      }
    }

    // Reporting the same item again updates the reason, no duplicates
    await this.prisma.report.upsert({
      where: {
        reporterId_targetType_targetId: {
          reporterId,
          targetType: dto.targetType,
          targetId: dto.targetId,
        },
      },
      create: {
        reporterId,
        targetType: dto.targetType,
        targetId: dto.targetId,
        reason: dto.reason,
        note: dto.note || null,
      },
      update: { reason: dto.reason, note: dto.note || null, resolvedAt: null },
    });

    // No moderation tool yet: the server log is where reports show up
    this.logger.warn(
      `Report: ${dto.targetType} ${dto.targetId} (${dto.reason}) by ${reporterId}`,
    );
  }

  // One table, five kinds: each kind knows where its author is
  private async findTarget(
    type: ReportTarget,
    id: string,
  ): Promise<Target | null> {
    switch (type) {
      case ReportTarget.BOOK: {
        // Only hand-added books are user content; imported ones come from
        // Open Library or Google
        const book = await this.prisma.book.findUnique({
          where: { id },
          select: { createdById: true },
        });

        return book?.createdById ? { authorId: book.createdById } : null;
      }

      case ReportTarget.POST: {
        const post = await this.prisma.post.findUnique({
          where: { id },
          select: { authorId: true },
        });

        return post;
      }

      case ReportTarget.COMMENT: {
        const comment = await this.prisma.comment.findUnique({
          where: { id },
          select: { authorId: true },
        });

        return comment;
      }

      case ReportTarget.MESSAGE: {
        const message = await this.prisma.message.findUnique({
          where: { id },
          select: { authorId: true, clubId: true },
        });

        return message;
      }

      case ReportTarget.REVIEW: {
        const review = await this.prisma.review.findUnique({
          where: { id },
          select: { userBook: { select: { userId: true } } },
        });

        return review ? { authorId: review.userBook.userId } : null;
      }
    }
  }
}
