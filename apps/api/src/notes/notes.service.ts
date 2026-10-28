import { Injectable, NotFoundException } from '@nestjs/common';

import type { BookNote } from '@reading/shared';

import { PrismaService } from '../prisma/prisma.service.js';
import type { SaveNoteDto } from './dto/save-note.dto.js';

const NOTE_SELECT = {
  id: true,
  text: true,
  page: true,
  createdAt: true,
  updatedAt: true,
} as const;

function toBookNote(row: {
  id: string;
  text: string;
  page: number | null;
  createdAt: Date;
  updatedAt: Date;
}): BookNote {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// Private notes: only their author ever sees them
@Injectable()
export class NotesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, userBookId: string): Promise<BookNote[]> {
    await this.findOwnEntry(userId, userBookId);

    const rows = await this.prisma.note.findMany({
      where: { userBookId },
      orderBy: { createdAt: 'desc' },
      select: NOTE_SELECT,
    });

    return rows.map(toBookNote);
  }

  async create(
    userId: string,
    userBookId: string,
    dto: SaveNoteDto,
  ): Promise<BookNote> {
    await this.findOwnEntry(userId, userBookId);

    const row = await this.prisma.note.create({
      data: { userBookId, text: dto.text, page: dto.page ?? null },
      select: NOTE_SELECT,
    });

    return toBookNote(row);
  }

  async update(
    userId: string,
    id: string,
    dto: SaveNoteDto,
  ): Promise<BookNote> {
    await this.findOwnNote(userId, id);

    const row = await this.prisma.note.update({
      where: { id },
      data: { text: dto.text, page: dto.page ?? null },
      select: NOTE_SELECT,
    });

    return toBookNote(row);
  }

  async remove(userId: string, id: string): Promise<void> {
    const { count } = await this.prisma.note.deleteMany({
      where: { id, userBook: { userId } },
    });

    if (count === 0) {
      throw new NotFoundException('Note not found');
    }
  }

  private async findOwnEntry(userId: string, userBookId: string) {
    const entry = await this.prisma.userBook.findFirst({
      where: { id: userBookId, userId },
      select: { id: true },
    });

    if (!entry) {
      throw new NotFoundException('Book not found on your shelf');
    }
  }

  // The relation filter is the ownership check
  private async findOwnNote(userId: string, id: string) {
    const note = await this.prisma.note.findFirst({
      where: { id, userBook: { userId } },
      select: { id: true },
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }
  }
}
