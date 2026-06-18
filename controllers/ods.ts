import { Router, Request, Response, NextFunction } from 'express'
import odsRepository from '../src/repositories/ods.repository'

const odsRouter = Router()

odsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await odsRepository.findAll({})
    // Comportamiento legacy: solo responde si hay resultados.
    if (result.length > 0) {
      res.json(result)
    }
  } catch (error) {
    next(error)
  }
})

odsRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  const body = req.body
  if (body.name === undefined) {
    res.status(400).json({ error: 'name missing' })
  }
  try {
    const saved = await odsRepository.create({
      name: body.name,
      number: body.number,
      img: body.img
    })
    res.json(saved.toJSON())
  } catch (error) {
    next(error)
  }
})

odsRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await odsRepository.findById(req.params.id)
    if (result) {
      res.json(result)
    } else {
      res.status(404).end()
    }
  } catch (error) {
    next(error)
  }
})

odsRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await odsRepository.deleteById(req.params.id)
    res.status(204).end()
  } catch (error) {
    next(error)
  }
})

odsRouter.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updateOds = await odsRepository.updateById(req.params.id, {
      name: req.body.name,
      number: req.body.number,
      img: req.body.img
    })
    res.json(updateOds)
  } catch (error) {
    next(error)
  }
})

export = odsRouter
