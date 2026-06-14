import { Router, Request, Response, NextFunction } from 'express'
import rolRepository from '../src/repositories/rol.repository'

const rolRouter = Router()

rolRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rol = await rolRepository.findAll({})
    res.status(200).json(rol)
  } catch (error) {
    next(error)
  }
})

rolRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  const body = req.body
  if (body.name === undefined) {
    res.status(400).json({ error: 'name missing' })
  }
  try {
    const saved = await rolRepository.create({
      name: body.name,
      description: body.description
    })
    res.json(saved.toJSON())
  } catch (error) {
    next(error)
  }
})

rolRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await rolRepository.findById(req.params.id)
    if (result) {
      res.json(result)
    } else {
      res.status(404).end()
    }
  } catch (error) {
    next(error)
  }
})

rolRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await rolRepository.deleteById(req.params.id)
    res.status(204).end()
  } catch (error) {
    next(error)
  }
})

rolRouter.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updateRol = await rolRepository.updateById(req.params.id, {
      name: req.body.name,
      description: req.body.description
    })
    res.json(updateRol)
  } catch (error) {
    next(error)
  }
})

export = rolRouter
