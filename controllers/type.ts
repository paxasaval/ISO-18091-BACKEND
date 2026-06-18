import { Router, Request, Response, NextFunction } from 'express'
import mongoose from 'mongoose'
import typeRepository from '../src/repositories/type.repository'

const typeRouter = Router()

typeRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mandatory = req.query.mandatory
    if (mandatory) {
      const mandatoryB = mandatory === 'true' ? true : false
      const types = await typeRepository.findByMandatory(mandatoryB)
      res.json(types)
    } else {
      const types = await typeRepository.findAllWithCharacteristics()
      res.json(types)
    }
  } catch (error) {
    next(error)
  }
})

typeRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const type = await typeRepository.findByIdWithCharacteristics(req.params.id)
    if (type) {
      res.json(type)
    } else {
      res.status(404).end()
    }
  } catch (error) {
    next(error)
  }
})

typeRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await typeRepository.deleteById(req.params.id)
    res.status(204).end()
  } catch (error) {
    next(error)
  }
})

typeRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  const body = req.body
  if (body.name === undefined) {
    res.status(400).json({ error: 'name missing' })
  }
  try {
    const arrayCharacteristics = body.characteristics.map(
      (characteristic: string) => new mongoose.Types.ObjectId(characteristic)
    )
    const saved = await typeRepository.create({
      name: body.name,
      green: body.green,
      yellow: body.yellow,
      red: body.red,
      mandatory: body.mandatory,
      characteristics: arrayCharacteristics
    })
    res.json(saved.toJSON())
  } catch (error) {
    next(error)
  }
})

typeRouter.post('/addExtraInfo', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.query.id as string
    const extras = req.body.extras
    const characteristicUpload = await typeRepository.updateById(id, { extraInfo: extras })
    res.json(characteristicUpload)
  } catch (error) {
    next(error)
  }
})

typeRouter.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body
    const arrayCharacteristics = body.characteristics.map(
      (characteristic: string) => new mongoose.Types.ObjectId(characteristic)
    )
    const updatetype = await typeRepository.updateById(req.params.id, {
      name: body.name,
      green: body.green,
      yellow: body.yellow,
      red: body.red,
      mandatory: body.mandatory,
      characteristics: arrayCharacteristics
    })
    res.json(updatetype)
  } catch (error) {
    next(error)
  }
})

export = typeRouter
