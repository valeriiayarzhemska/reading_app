import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  COMMENTS_PAGE_SIZE,
  NotificationType,
  POSTS_PAGE_SIZE,
  type FeedKind,
  type Page,
  type PostComment,
  type PostItem,
} from '@reading/shared';

import type { Prisma } from '../generated/prisma/client.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CoverStorage } from '../uploads/cover-storage.service.js';
import type { CreateCommentDto, CreatePostDto } from './dto/posts.dto.js';

const AUTHOR_SELECT = {
  id: true,
  nickname: true,
  displayName: true,
  avatarUrl: true,
} as const;

// Everything a post card shows, the viewer's own parts included, in one
// query: each "my" field is a relation filtered by the viewer
function postSelect(viewerId: string) {
  return {
    id: true,
    text: true,
    photoUrl: true,
    quoteText: true,
    quotePage: true,
    createdAt: true,
    author: { select: AUTHOR_SELECT },
    book: {
      select: {
        id: true,
        title: true,
        authors: true,
        coverUrl: true,
        // Is it on my shelf: at most one of my entries
        userBooks: {
          where: { userId: viewerId },
          select: { id: true },
          take: 1,
        },
      },
    },
    _count: { select: { likes: true, comments: true } },
    likes: { where: { userId: viewerId }, select: { userId: true } },
    comments: {
      orderBy: { createdAt: 'desc' },
      take: 1,
      select: { text: true, author: { select: { nickname: true } } },
    },
  } satisfies Prisma.PostSelect;
}

type PostRow = Prisma.PostGetPayload<{
  select: ReturnType<typeof postSelect>;
}>;

function toPostItem(row: PostRow, viewerId: string): PostItem {
  const [latest] = row.comments;

  return {
    id: row.id,
    text: row.text,
    photoUrl: row.photoUrl,
    quote:
      row.quoteText === null
        ? null
        : { text: row.quoteText, page: row.quotePage },
    createdAt: row.createdAt.toISOString(),
    author: row.author,
    book: row.book && {
      id: row.book.id,
      title: row.book.title,
      authors: row.book.authors,
      coverUrl: row.book.coverUrl,
      onMyShelf: row.book.userBooks.length > 0,
    },
    likesCount: row._count.likes,
    likedByMe: row.likes.length > 0,
    commentsCount: row._count.comments,
    latestComment: latest
      ? { authorNickname: latest.author.nickname, text: latest.text }
      : null,
    isMine: row.author.id === viewerId,
  };
}

function commentSelect(viewerId: string) {
  return {
    id: true,
    text: true,
    createdAt: true,
    author: { select: AUTHOR_SELECT },
    _count: { select: { likes: true } },
    likes: { where: { userId: viewerId }, select: { userId: true } },
  } satisfies Prisma.CommentSelect;
}

type CommentRow = Prisma.CommentGetPayload<{
  select: ReturnType<typeof commentSelect>;
}>;

function toPostComment({ _count, likes, ...row }: CommentRow): PostComment {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    likesCount: _count.likes,
    likedByMe: likes.length > 0,
  };
}

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: CoverStorage,
    private readonly notifications: NotificationsService,
  ) {}

  // Newest first. Subscriptions: my own posts and those of people I follow.
  async feed(
    viewerId: string,
    kind: FeedKind,
    cursor?: string,
  ): Promise<Page<PostItem>> {
    const rows = await this.prisma.post.findMany({
      where:
        kind === 'following'
          ? {
              OR: [
                { authorId: viewerId },
                // Authors who have me among their followers
                { author: { followers: { some: { followerId: viewerId } } } },
              ],
            }
          : undefined,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: POSTS_PAGE_SIZE + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      select: postSelect(viewerId),
    });

    const hasMore = rows.length > POSTS_PAGE_SIZE;
    const page = rows.slice(0, POSTS_PAGE_SIZE);

    return {
      items: page.map((row) => toPostItem(row, viewerId)),
      nextCursor: hasMore ? page[page.length - 1].id : null,
    };
  }

  async detail(viewerId: string, id: string): Promise<PostItem> {
    const row = await this.prisma.post.findUnique({
      where: { id },
      select: postSelect(viewerId),
    });

    if (!row) {
      throw new NotFoundException('Post not found');
    }

    return toPostItem(row, viewerId);
  }

  // A saved quote becomes a post with a quote card. Its text and page are
  // copied: the private quote can change later, the post stays as shared.
  async shareQuote(
    userId: string,
    quote: { bookId: string; text: string; page: number | null },
  ): Promise<PostItem> {
    const { id } = await this.prisma.post.create({
      data: {
        authorId: userId,
        text: '',
        bookId: quote.bookId,
        quoteText: quote.text,
        quotePage: quote.page,
      },
      select: { id: true },
    });

    return this.detail(userId, id);
  }

  async create(userId: string, dto: CreatePostDto): Promise<PostItem> {
    if (dto.text === '' && !dto.photoUrl) {
      throw new BadRequestException('A post needs text or a photo');
    }

    if (
      dto.photoUrl &&
      !this.storage.isOwnImage(userId, dto.photoUrl, 'posts')
    ) {
      throw new BadRequestException(
        'photoUrl must come from /uploads/post-photo',
      );
    }

    if (dto.bookId) {
      const book = await this.prisma.book.findUnique({
        where: { id: dto.bookId },
        select: { id: true },
      });

      if (!book) {
        throw new NotFoundException('Book not found');
      }
    }

    const { id } = await this.prisma.post.create({
      data: {
        authorId: userId,
        text: dto.text,
        bookId: dto.bookId ?? null,
        photoUrl: dto.photoUrl ?? null,
      },
      select: { id: true },
    });

    return this.detail(userId, id);
  }

  async remove(userId: string, id: string): Promise<void> {
    // Someone else's post is "not found" for deleting
    const { count } = await this.prisma.post.deleteMany({
      where: { id, authorId: userId },
    });

    if (count === 0) {
      throw new NotFoundException('Post not found');
    }
  }

  async like(userId: string, postId: string): Promise<void> {
    const post = await this.findPost(postId);
    const { count } = await this.prisma.postLike.createMany({
      data: [{ postId, userId }],
      skipDuplicates: true,
    });

    // count is 0 for a repeated like: no second notification
    if (count > 0) {
      await this.notifications.notify({
        userId: post.authorId,
        actorId: userId,
        type: NotificationType.POST_LIKE,
        postId,
      });
    }
  }

  async unlike(userId: string, postId: string): Promise<void> {
    const post = await this.findPost(postId);
    const { count } = await this.prisma.postLike.deleteMany({
      where: { postId, userId },
    });

    if (count > 0) {
      await this.notifications.withdraw({
        userId: post.authorId,
        actorId: userId,
        type: NotificationType.POST_LIKE,
        postId,
      });
    }
  }

  // Oldest first, like a conversation
  async comments(
    viewerId: string,
    postId: string,
    cursor?: string,
  ): Promise<Page<PostComment>> {
    await this.findPost(postId);

    const rows = await this.prisma.comment.findMany({
      where: { postId },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: COMMENTS_PAGE_SIZE + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      select: commentSelect(viewerId),
    });

    const hasMore = rows.length > COMMENTS_PAGE_SIZE;
    const page = rows.slice(0, COMMENTS_PAGE_SIZE);

    return {
      items: page.map(toPostComment),
      nextCursor: hasMore ? page[page.length - 1].id : null,
    };
  }

  async addComment(
    userId: string,
    postId: string,
    dto: CreateCommentDto,
  ): Promise<PostComment> {
    const post = await this.findPost(postId);

    const row = await this.prisma.comment.create({
      data: { postId, authorId: userId, text: dto.text },
      select: commentSelect(userId),
    });

    await this.notifications.notify({
      userId: post.authorId,
      actorId: userId,
      type: NotificationType.POST_COMMENT,
      postId,
      commentId: row.id,
    });

    return toPostComment(row);
  }

  async likeComment(userId: string, commentId: string): Promise<void> {
    const comment = await this.findComment(commentId);
    const { count } = await this.prisma.commentLike.createMany({
      data: [{ commentId, userId }],
      skipDuplicates: true,
    });

    if (count > 0) {
      await this.notifications.notify(this.commentLikeEvent(userId, comment));
    }
  }

  // Your own comments only. Its likes and its notification go with it
  // (onDelete: Cascade).
  async removeComment(userId: string, commentId: string): Promise<void> {
    const { count } = await this.prisma.comment.deleteMany({
      where: { id: commentId, authorId: userId },
    });

    if (count === 0) {
      throw new NotFoundException('Comment not found');
    }
  }

  async unlikeComment(userId: string, commentId: string): Promise<void> {
    const comment = await this.findComment(commentId);
    const { count } = await this.prisma.commentLike.deleteMany({
      where: { commentId, userId },
    });

    if (count > 0) {
      await this.notifications.withdraw(this.commentLikeEvent(userId, comment));
    }
  }

  private commentLikeEvent(
    actorId: string,
    comment: { id: string; authorId: string; postId: string },
  ) {
    return {
      userId: comment.authorId,
      actorId,
      type: NotificationType.COMMENT_LIKE,
      // The post too: tapping the notification opens it
      postId: comment.postId,
      commentId: comment.id,
    };
  }

  // With its author: who gets notified about likes and comments
  private async findPost(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      select: { id: true, authorId: true },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }

  private async findComment(id: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      select: { id: true, authorId: true, postId: true },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return comment;
  }
}
