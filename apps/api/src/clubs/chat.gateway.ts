import { HttpException, Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  type OnGatewayInit,
} from '@nestjs/websockets';
import { plainToInstance, type ClassConstructor } from 'class-transformer';
import { validate } from 'class-validator';
import type { DefaultEventsMap, Namespace, Socket } from 'socket.io';

import {
  CHAT_EVENTS,
  CHAT_NAMESPACE,
  type ChatAck,
  type ChatMessage,
} from '@reading/shared';

import { TokenService } from '../auth/token.service.js';
import { JoinClubDto, SendMessageDto } from './dto/chat.dto.js';
import { MessagesService } from './messages.service.js';

interface ChatSocketData {
  userId: string;
}

// Event names are typed through CHAT_EVENTS; the generic types `data`
type ChatSocket = Socket<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  ChatSocketData
>;

// One Socket.IO room per club: emitting to it reaches exactly the people
// who have that club's chat open
function room(clubId: string): string {
  return `club:${clubId}`;
}

// The socket counterpart of a controller. ws://<api>/chat
@WebSocketGateway({ namespace: CHAT_NAMESPACE })
export class ChatGateway implements OnGatewayInit {
  private readonly logger = new Logger(ChatGateway.name);

  // With a namespace, this is the namespace (it has .to(), .use())
  @WebSocketServer()
  private readonly server: Namespace;

  constructor(
    private readonly tokens: TokenService,
    private readonly messages: MessagesService,
  ) {}

  // Middleware runs before a connection is accepted: a socket without a
  // valid access token never connects (the app gets connect_error). The
  // token is checked once; on reconnect the app sends a fresh one.
  afterInit(server: Namespace) {
    server.use((socket, next) => {
      const token: unknown = socket.handshake.auth.token;

      if (typeof token !== 'string') {
        next(new Error('Unauthorized'));

        return;
      }

      void this.tokens.verifyAccessToken(token).then((userId) => {
        if (!userId) {
          next(new Error('Unauthorized'));

          return;
        }

        (socket as ChatSocket).data.userId = userId;
        next();
      });
    });
  }

  // The chat screen opened: start receiving this club's new messages
  @SubscribeMessage(CHAT_EVENTS.join)
  async join(
    @ConnectedSocket() socket: ChatSocket,
    @MessageBody() body: unknown,
  ): Promise<ChatAck> {
    return this.answer(JoinClubDto, body, async ({ clubId }) => {
      await this.messages.ensureMember(socket.data.userId, clubId);
      await socket.join(room(clubId));
    });
  }

  @SubscribeMessage(CHAT_EVENTS.leave)
  async leave(
    @ConnectedSocket() socket: ChatSocket,
    @MessageBody() body: unknown,
  ): Promise<ChatAck> {
    return this.answer(JoinClubDto, body, async ({ clubId }) => {
      await socket.leave(room(clubId));
    });
  }

  // Saved first, then pushed to everyone else in the room. The sender gets
  // the saved message back through the acknowledgement instead.
  @SubscribeMessage(CHAT_EVENTS.send)
  async send(
    @ConnectedSocket() socket: ChatSocket,
    @MessageBody() body: unknown,
  ): Promise<ChatAck<ChatMessage>> {
    return this.answer(SendMessageDto, body, async (payload) => {
      const message = await this.messages.send(socket.data.userId, payload);

      socket.to(room(payload.clubId)).emit(CHAT_EVENTS.new, message);

      return message;
    });
  }

  // Validates the payload and turns every outcome into an acknowledgement.
  // A ValidationPipe would answer with a separate "exception" event instead,
  // and the sender's emit would wait for its answer until it times out.
  private async answer<Dto extends object, T>(
    dtoClass: ClassConstructor<Dto>,
    body: unknown,
    handle: (dto: Dto) => Promise<T>,
  ): Promise<ChatAck<T>> {
    const dto = plainToInstance(dtoClass, body ?? {});
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      const error = errors
        .flatMap((issue) => Object.values(issue.constraints ?? {}))
        .join(', ');

      return { ok: false, error };
    }

    try {
      return { ok: true, data: await handle(dto) };
    } catch (error) {
      if (error instanceof HttpException) {
        return { ok: false, error: error.message };
      }

      this.logger.error(error);

      return { ok: false, error: 'Something went wrong' };
    }
  }
}
