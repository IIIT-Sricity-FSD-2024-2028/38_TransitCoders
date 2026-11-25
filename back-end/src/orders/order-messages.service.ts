import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DatabaseService } from '../common/database/database.service';
import { Role } from '../common/constants/roles.constant';
import { NotificationsService } from '../notifications/notifications.service';
import { IUser } from '../users/interfaces/user.interface';
import { OrdersService } from './orders.service';

export interface OrderMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: Role;
  body: string;
  createdAt: string;
}

@Injectable()
export class OrderMessagesService {
  constructor(
    private readonly orders: OrdersService,
    private readonly db: DatabaseService,
    private readonly notifications: NotificationsService,
  ) {}

  private thread(id: string, channel: string, user: IUser) {
    if (channel !== 'hub' && channel !== 'customer') throw new BadRequestException('Unknown message channel');
    const order = this.orders.getAuthorizedOrder(id, user);
    const agentId = order.assignedAgentId;
    if (!agentId) throw new BadRequestException('Messages become available once an agent is assigned');

    const isAgent = user.role === Role.DELIVERY_AGENT && user.id === agentId;
    const isHub = channel === 'hub' && user.role === Role.HUB_MANAGER &&
      user.hubId && user.hubId === order.pickupHubId;
    const isCustomer = channel === 'customer' && user.role === Role.CUSTOMER && user.id === order.customerId;
    if (!isAgent && !isHub && !isCustomer) throw new ForbiddenException('You cannot access this conversation');
    return { order, agentId, isAgent };
  }

  list(id: string, channel: string, user: IUser): OrderMessage[] {
    const { order, agentId } = this.thread(id, channel, user);
    return this.db.query<OrderMessage>(
      `SELECT id, senderId, senderName, senderRole, body, createdAt FROM order_messages
       WHERE orderId = ? AND channel = ? AND agentId = ? ORDER BY rowid DESC LIMIT 100`,
      [order.id, channel, agentId],
    ).reverse();
  }

  send(id: string, channel: string, body: string, user: IUser): OrderMessage {
    const cleanBody = body.trim();
    if (!cleanBody) throw new BadRequestException('Enter a message');
    return this.db.transaction(() => {
      const { order, agentId, isAgent } = this.thread(id, channel, user);
      const recipients = isAgent && channel === 'hub'
        ? this.db.query<{ id: string }>(
          'SELECT id FROM users WHERE role = ? AND hubId = ? AND isActive = 1',
          [Role.HUB_MANAGER, order.pickupHubId ?? ''],
        )
        : this.db.query<{ id: string }>(
          'SELECT id FROM users WHERE id = ? AND role = ? AND isActive = 1',
          [isAgent ? order.customerId : agentId, isAgent ? Role.CUSTOMER : Role.DELIVERY_AGENT],
        );
      if (!recipients.length) throw new BadRequestException('There is no active recipient for this conversation');
      const message: OrderMessage = {
        id: randomUUID(), senderId: user.id, senderName: user.name, senderRole: user.role,
        body: cleanBody, createdAt: new Date().toISOString(),
      };
      this.db.run(
        `INSERT INTO order_messages (id, orderId, channel, agentId, senderId, senderName, senderRole, body, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [message.id, order.id, channel, agentId, user.id, user.name, user.role, cleanBody, message.createdAt],
      );
      for (const recipient of recipients) {
        this.notifications.notify(recipient.id, 'message', `New message from ${user.name} about ${order.orderId}.`, order.id);
      }
      return message;
    });
  }
}
