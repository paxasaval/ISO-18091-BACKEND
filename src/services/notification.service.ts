// Servicio de notificaciones (Fase 3).
//
// Porta EXACTAMENTE notify (utils/middleware.js, lineas ~239-362). Se preservan
// el contenido literal de los mensajes, las ramas por type (1/2/3) e itemType
// (1=indicador, 2=subindicador, 3=evidencia) y la logica de evidencia ya
// calificada (qualificationBy). Los console.log del legacy NO se portan.
//
// Comportamientos peculiares preservados:
//   - itemType=1 puebla 'Indicator'/'gadID' (el path real seria 'indicatorID';
//     ver indicatorInstance.repository.findByIdForNotify) pero luego accede a
//     item.indicatorID.* y item.gadID._id tal cual el legacy.
//   - El admin se busca con rol = env.ROL_ADMIN_KEY.

import type { Request } from 'express'
import env from '../config/env'
import { NotificationType, NotificationItemType } from '../constants'
import {
  indicatorInstanceRepository,
  subIndicatorRepository,
  indicatorRepository,
  evidenceRepository,
  userRepository,
  notificationRepository
} from '../repositories'

export class NotificationService {
  async notify(
    type: number,
    from: unknown,
    itemType: number,
    itemID: string,
    // req se conserva en la firma para fidelidad con el legacy aunque notify no
    // lo use (las otras funciones del modulo si lo usan).
    req: Request
  ): Promise<void> {
    void req
    // Primero identificamos el tipo de notificacion
    let finalContent = ''
    if (type === NotificationType.Added) {
      finalContent += 'Se agrego un nuevo elemento de tipo '
    }
    if (type === NotificationType.Modified) {
      finalContent += 'Se ha modificado el elemento de tipo '
    }
    if (type === NotificationType.Deleted) {
      finalContent += 'Se eliminado el elemento de tipo '
    }
    // Segundo identificamos el tipo
    if (itemType === NotificationItemType.Indicator) {
      const item = (await indicatorInstanceRepository.findByIdForNotify(
        itemID
      )) as unknown as {
        indicatorID: { quadrant: number, number: number, name: string }
        year: string
        gadID: { _id: unknown }
      }
      finalContent += `Indicadaor ${item.indicatorID.quadrant}.${item.indicatorID.number} ${item.indicatorID.name} del periodo ${item.year}`
      const admin = await userRepository.findAdminsByTenant(
        item.gadID._id,
        env.ROL_ADMIN_KEY
      )
      for (const user of admin) {
        await notificationRepository.create({
          from: from,
          sendTo: user,
          content: finalContent,
          type: type,
          state: 1,
          date: new Date(),
          itemID: itemID,
          itemType: 1
        } as Record<string, unknown>)
      }
    }
    if (itemType === NotificationItemType.Subindicator) {
      const item = (await subIndicatorRepository.findByIdForNotify(
        itemID
      )) as unknown as {
        name: string
        indicadorID: {
          indicatorID: unknown
          year: string
          gadID: { _id: unknown }
        }
      }
      const indicadorID = item.indicadorID
      const indicatorCatalog = (await indicatorRepository.findById(
        String(indicadorID.indicatorID)
      )) as unknown as { name: string }
      finalContent += `Subindicador ${item.name} en el indicador ${indicatorCatalog.name} periodo ${indicadorID.year}  `
      const admin = await userRepository.findAdminsByTenant(
        indicadorID.gadID._id,
        env.ROL_ADMIN_KEY
      )
      for (const user of admin) {
        await notificationRepository.create({
          from: from,
          sendTo: user,
          content: finalContent,
          type: type,
          state: 1,
          date: new Date(),
          itemID: itemID,
          itemType: 2
        } as Record<string, unknown>)
      }
    }
    if (itemType === NotificationItemType.Evidence) {
      const item = (await evidenceRepository.findByIdForNotify(
        itemID
      )) as unknown as {
        name: string
        author: unknown
        qualificationBy?: { toString(): string }
        subIndicatorID: { name: string, indicadorID: unknown }
      }
      finalContent += `Evidencia ${item.name} del subindicador ${item.subIndicatorID.name} `
      const indicadorID = (await indicatorInstanceRepository.findById(
        String(item.subIndicatorID.indicadorID)
      )) as unknown as { gadID: { _id: unknown } }
      finalContent += `(${itemID})`
      // verificar si esta calificada
      if (item.qualificationBy) {
        // Verificar si es por calificacion
        if (from === item.qualificationBy.toString()) {
          const user = (await userRepository.findById(
            String(item.qualificationBy)
          )) as unknown as { name: string }
          finalContent = `Se ha calificado la evidencia ${item.name} por el usuario ${user.name}`
          await notificationRepository.create({
            from: from,
            sendTo: item.author,
            content: finalContent,
            type: type,
            state: 1,
            date: new Date(),
            itemID: itemID,
            itemType: 3
          } as Record<string, unknown>)
        } else {
          await notificationRepository.create({
            from: from,
            sendTo: item.qualificationBy,
            content: finalContent,
            type: type,
            state: 1,
            date: new Date(),
            itemID: itemID,
            itemType: 3
          } as Record<string, unknown>)
        }
      } else {
        const admin = await userRepository.findAdminsByTenant(
          indicadorID.gadID._id,
          env.ROL_ADMIN_KEY
        )
        for (const user of admin) {
          await notificationRepository.create({
            from: from,
            sendTo: user,
            content: finalContent,
            type: type,
            state: 1,
            date: new Date(),
            itemID: itemID,
            itemType: 3
          } as Record<string, unknown>)
        }
      }
    }
  }
}

export const notificationService = new NotificationService()
export default notificationService
