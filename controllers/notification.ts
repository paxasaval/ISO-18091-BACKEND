import { Router, Request, Response, NextFunction } from 'express'
import notificationRepository from '../src/repositories/notification.repository'

const notifyRouter = Router()

notifyRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await notificationRepository.findAll({})
    // Comportamiento legacy: solo responde si hay resultados.
    if (result.length > 0) {
      res.json(result)
    }
  } catch (error) {
    next(error)
  }
})

notifyRouter.get('/allMyNotify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userID } = req.query
    const notifications = await notificationRepository.findAllForUser(String(userID))
    res.json(notifications)
  } catch (error) {
    next(error)
  }
})

notifyRouter.get('/numOfUnreadNotify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userID } = req.query
    const notifications = await notificationRepository.countUnreadForUser(String(userID))
    res.json(notifications)
  } catch (error) {
    next(error)
  }
})

notifyRouter.get('/unreadNotify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userID } = req.query
    const notifications = await notificationRepository.findUnreadForUser(String(userID))
    res.json(notifications)
  } catch (error) {
    next(error)
  }
})

notifyRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  const body = req.body
  if (body.name === undefined) {
    res.status(400).json({ error: 'name missing' })
  }
  try {
    const saved = await notificationRepository.create({
      name: body.name,
      number: body.number,
      img: body.img
    } as Record<string, unknown>)
    res.json(saved.toJSON())
  } catch (error) {
    next(error)
  }
})

notifyRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await notificationRepository.findById(req.params.id)
    if (result) {
      res.json(result)
    } else {
      res.status(404).end()
    }
  } catch (error) {
    next(error)
  }
})

notifyRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await notificationRepository.deleteById(req.params.id)
    res.status(204).end()
  } catch (error) {
    next(error)
  }
})

notifyRouter.put('/checkNotify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.body.id
    const notificationUpdate = await notificationRepository.updateById(id, { state: 2 })
    res.json(notificationUpdate)
  } catch (error) {
    next(error)
  }
})

notifyRouter.put('/uncheckNotify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.body.id
    const notificationUpdate = await notificationRepository.updateById(id, { state: 1 })
    res.json(notificationUpdate)
  } catch (error) {
    next(error)
  }
})

export = notifyRouter
