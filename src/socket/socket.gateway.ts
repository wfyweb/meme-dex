import {
  WebSocketGateway,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Socket } from 'net';
import { SocketService } from './socket.service';

@WebSocketGateway()
export class SocketGateway {
  constructor(private readonly socketService: SocketService) {}

  @SubscribeMessage('kline')
  handleKline(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    return this.socketService.handleKline(data, client);
  }

  @SubscribeMessage('kinfo')
  handleKinfo(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    return this.socketService.handleKinfo(data, client);
  }
}
