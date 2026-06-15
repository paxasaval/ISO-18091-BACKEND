// Repositorio v2 de Notification (coleccion notification.model).
import Notification from '../models/notification.model'
import BaseRepository, { ModelDocType } from './base.repository'

type NotificationDoc = ModelDocType<typeof Notification>

export class NotificationRepository extends BaseRepository<NotificationDoc> {
  constructor() {
    super(Notification)
  }
}

export const notificationRepository = new NotificationRepository()
export default notificationRepository
