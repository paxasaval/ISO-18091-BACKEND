import { Router, Request, Response, NextFunction } from 'express'
import commitRepository from '../src/repositories/commit.repository'

const commitRouter = Router()

commitRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const commit = await commitRepository.findAll({})
    res.json(commit)
  } catch (error) {
    next(error)
  }
})

commitRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const commit = await commitRepository.findById(req.params.id)
    if (commit) {
      res.json(commit)
    } else {
      res.status(404).end()
    }
  } catch (error) {
    next(error)
  }
})

commitRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await commitRepository.deleteById(req.params.id)
    res.status(204).end()
  } catch (error) {
    next(error)
  }
})

commitRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  const body = req.body
  if (body.name === undefined) {
    res.status(400).json({ error: 'name missing' })
  }
  try {
    const saved = await commitRepository.create({
      body: body.body,
      autor: body.autor,
      created: new Date(),
      lastUpdate: new Date()
    })
    res.json(saved.toJSON())
  } catch (error) {
    next(error)
  }
})

commitRouter.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updateCommit = await commitRepository.updateById(req.params.id, {
      body: req.body.body,
      lastUpdate: new Date()
    })
    res.json(updateCommit)
  } catch (error) {
    next(error)
  }
})

export = commitRouter
