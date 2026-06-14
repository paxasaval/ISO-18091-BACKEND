// Repositorio de Notification (controllers/notification.js + utils notify).
import { Types } from 'mongoose'
import Notify from '../../models/notifications'
import BaseRepository, { ModelDocType } from './base.repository'

type NotifyDoc = ModelDocType<typeof Notify>

export class NotificationRepository extends BaseRepository<NotifyDoc> {
  constructor() {
    super(Notify)
  }

  // GET /allMyNotify -> Notify.find({ sendTo: user }).sort({ date: -1 })
  async findAllForUser(userID: string): Promise<NotifyDoc[]> {
    return this.findAll(
      { sendTo: new Types.ObjectId(userID) } as Record<string, unknown>,
      { sort: { date: -1 } }
    )
  }

  // GET /unreadNotify -> Notify.find({ sendTo: user, state: 1 })
  async findUnreadForUser(userID: string): Promise<NotifyDoc[]> {
    return this.findAll(
      { sendTo: new Types.ObjectId(userID), state: 1 } as Record<string, unknown>
    )
  }

  // GET /numOfUnreadNotify -> Notify.countDocuments({ sendTo: user, state: 1 })
  async countUnreadForUser(userID: string): Promise<number> {
    return this.count(
      { sendTo: new Types.ObjectId(userID), state: 1 } as Record<string, unknown>
    )
  }
}

export const notificationRepository = new NotificationRepository()
export default notificationRepository
