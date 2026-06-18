import { Router, Request, Response, NextFunction } from 'express'
import valuationRepository from '../src/repositories/valuation.repository'

const valuationRouter = Router()

valuationRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const valuationBD = await valuationRepository.findAll({})
    res.status(200).json(valuationBD)
  } catch (error) {
    next(error)
  }
})

valuationRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body
    if (body.maxValue === undefined) {
      res.status(400).json({ error: 'max value missing' })
    }
    const saved = await valuationRepository.create({
      name: body.name,
      category: body.category,
      maxValue: body.maxValue
    })
    res.status(200).json(saved.toJSON())
  } catch (error) {
    next(error)
  }
})

export = valuationRouter
