import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { InjectRepository } from '@nestjs/typeorm';
import { isUUID } from 'class-validator';
import { Namespace, Socket } from 'socket.io';
import { Subscription } from 'rxjs';
import { JwtPayloadDto } from '../auth/dto/jwt-payload.dto';
import { Student } from '../students/entities/student.entity';
import { UsersService } from '../users/users.service';
import { Repository } from 'typeorm';
import { AchievementEvents } from './achievement.events';

interface AchievementSocketData {
  userId: string;
}

type AchievementSocket = Socket<
  Record<string, never>,
  Record<string, never>,
  Record<string, never>,
  AchievementSocketData
>;

@Injectable()
@WebSocketGateway({
  namespace: 'achievements',
  transports: ['websocket'],
  pingInterval: 10000,
  pingTimeout: 5000,
})
export class AchievementsGateway implements OnGatewayInit, OnModuleDestroy {
  @WebSocketServer()
  private server: Namespace;

  private subscription?: Subscription;

  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    private readonly achievementEvents: AchievementEvents,
  ) {}

  afterInit(server: Namespace): void {
    server.use((socket: AchievementSocket, next) => {
      void this.authenticate(socket).then(
        () => next(),
        () => next(new Error('Unauthorized')),
      );
    });
    this.subscription = this.achievementEvents.events$.subscribe((event) => {
      server
        .to(this.studentRoom(event.studentId))
        .emit('achievement.unlocked', event);
    });
  }

  onModuleDestroy(): void {
    this.subscription?.unsubscribe();
  }

  @SubscribeMessage('student.subscribe')
  async subscribeToStudent(
    @ConnectedSocket() socket: AchievementSocket,
    @MessageBody() body: { studentId?: string },
  ): Promise<{ studentId: string; subscribed: true }> {
    if (!body?.studentId || !isUUID(body.studentId)) {
      throw new WsException('Student not found');
    }
    const owned = await this.studentRepository.existsBy({
      id: body.studentId,
      ownerUserId: socket.data.userId,
      isActive: true,
    });
    if (!owned) throw new WsException('Student not found');
    await socket.join(this.studentRoom(body.studentId));
    return { studentId: body.studentId, subscribed: true };
  }

  @SubscribeMessage('student.unsubscribe')
  async unsubscribeFromStudent(
    @ConnectedSocket() socket: AchievementSocket,
    @MessageBody() body: { studentId?: string },
  ): Promise<{ studentId: string; subscribed: false }> {
    if (!body?.studentId || !isUUID(body.studentId)) {
      throw new WsException('Student not found');
    }
    await socket.leave(this.studentRoom(body.studentId));
    return { studentId: body.studentId, subscribed: false };
  }

  private async authenticate(socket: AchievementSocket): Promise<void> {
    const authToken = socket.handshake.auth?.token as unknown;
    const authorization = socket.handshake.headers.authorization;
    const token =
      typeof authToken === 'string'
        ? authToken.replace(/^Bearer\s+/i, '')
        : authorization?.replace(/^Bearer\s+/i, '');
    if (!token) throw new Error('Unauthorized');
    const payload = await this.jwtService.verifyAsync<JwtPayloadDto>(token);
    if (!payload.sub) throw new Error('Unauthorized');
    const user = await this.usersService.fetchUserDetailsForRequest(
      payload.sub,
    );
    if (!user?.isActive) throw new Error('Unauthorized');
    socket.data.userId = user.id;
  }

  private studentRoom(studentId: string): string {
    return `student:${studentId}`;
  }
}
