import { ConflictException, Injectable } from '@nestjs/common';
import {
  nicknameError,
  type Me,
  type NicknameAvailability,
} from '@reading/shared';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CompleteOnboardingDto } from './dto/complete-onboarding.dto.js';
import type { UpdateProfileDto } from './dto/update-profile.dto.js';
import { ME_SELECT, toMe } from './me.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async nicknameAvailability(
    userId: string,
    nickname: string,
  ): Promise<NicknameAvailability> {
    const error = nicknameError(nickname);

    if (error) {
      return { available: false, error };
    }

    const owner = await this.prisma.user.findUnique({
      where: { nickname },
      select: { id: true },
    });

    // Your own current nickname counts as available
    return { available: !owner || owner.id === userId, error: null };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<Me> {
    if (dto.nickname !== undefined) {
      const { available } = await this.nicknameAvailability(
        userId,
        dto.nickname,
      );

      if (!available) {
        throw new ConflictException('This nickname is already taken');
      }
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        displayName: dto.displayName,
        nickname: dto.nickname,
        // "No bio" has one representation: null, never ""
        bio: dto.bio === undefined ? undefined : dto.bio || null,
        links: dto.links,
      },
      select: ME_SELECT,
    });

    return toMe(user);
  }

  async completeOnboarding(
    userId: string,
    dto: CompleteOnboardingDto,
  ): Promise<Me> {
    const { available } = await this.nicknameAvailability(userId, dto.nickname);

    if (!available) {
      throw new ConflictException('This nickname is already taken');
    }

    // Two people can still pass the check above at the same moment: then the
    // unique index rejects the second update (P2002 → 409 via the filter)
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        displayName: dto.displayName,
        nickname: dto.nickname,
        onboardedAt: new Date(),
      },
      select: ME_SELECT,
    });

    return toMe(user);
  }
}
