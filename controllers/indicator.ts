import { Router, Request, Response, NextFunction } from 'express'
import mongoose from 'mongoose'
import indicatorRepository from '../src/repositories/indicator.repository'

const indicatorRouter = Router()

indicatorRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (Object.entries(req.query).length === 0) {
      const indicators = await indicatorRepository.findAllWithOds()
      res.json(indicators)
    } else {
      const quadrant = Number(req.query.quadrant)
      const indicators = await indicatorRepository.findByQuadrant(quadrant)
      res.json(indicators)
    }
  } catch (error) {
    next(error)
  }
})

indicatorRouter.get('/byQuadrantAndNumber', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const quadrant = Number(req.query.quadrant)
    const number = Number(req.query.number)
    const indicator = await indicatorRepository.findByQuadrantAndNumber(quadrant, number)
    res.status(200).json(indicator)
  } catch (error) {
    next(error)
  }
})

indicatorRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const indicator = await indicatorRepository.findByIdWithOds(req.params.id)
    if (indicator) {
      res.json(indicator)
    } else {
      res.status(404).end()
    }
  } catch (error) {
    next(error)
  }
})

indicatorRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await indicatorRepository.deleteById(req.params.id)
    res.status(204).end()
  } catch (error) {
    next(error)
  }
})

indicatorRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  const body = req.body
  if (body.name === undefined) {
    res.status(400).json({ error: 'name missing' })
  }
  try {
    const arrayODS = body.ods.map((ods: string) => new mongoose.Types.ObjectId(ods))
    const saved = await indicatorRepository.create({
      name: body.name,
      description: body.description,
      number: body.number,
      quadrant: body.quadrant,
      quadrantName: body.quadrantName,
      red: body.red,
      yellow: body.yellow,
      green: body.green,
      ods: arrayODS
    })
    res.json(saved.toJSON())
  } catch (error) {
    next(error)
  }
})

indicatorRouter.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body
    const arrayODS = body.ods.map((ods: string) => new mongoose.Types.ObjectId(ods))
    const updateIndicator = await indicatorRepository.updateById(req.params.id, {
      name: body.name,
      description: body.description,
      number: body.number,
      quadrant: body.quadrant,
      quadrantName: body.quadrantName,
      red: body.red,
      yellow: body.yellow,
      green: body.green,
      ods: arrayODS
    })
    res.json(updateIndicator)
  } catch (error) {
    next(error)
  }
})

export = indicatorRouter
