import { Router, Request, Response, NextFunction } from 'express'
import mongoose from 'mongoose'
import characteristicRepository from '../src/repositories/characteristic.repository'

const characteristicRouter = Router()

characteristicRouter.get('/', (req: Request, res: Response, next: NextFunction) => {
  // Quirk legacy: req.query SIEMPRE es un objeto (truthy) en Express, por lo que
  // la rama `if(!query)` es codigo muerto y nunca se ejecuta. Se preserva el flujo
  // real: SIEMPRE se hace Characteristic.find({ typeID: req.query.type }) (type
  // puede ser undefined).
  const query = req.query
  if (!query) {
    characteristicRepository.findAll({})
      .then((result) => {
        if (result.length > 0) {
          res.json(result)
        }
      })
      .catch((error) => next(error))
  } else {
    const type = req.query.type as string
    characteristicRepository.findByType(type)
      .then((characteristic) => {
        res.json(characteristic)
      })
      .catch((error) => next(error))
  }
})

characteristicRouter.post('/', (req: Request, res: Response, next: NextFunction) => {
  const body = req.body
  if (body.name === undefined) {
    res.status(400).json({ error: 'name missing' })
  }
  const valuation = body.valuation
  const valuationArray = valuation.map((str: string) => new mongoose.Types.ObjectId(str))
  characteristicRepository.create({
    name: body.name,
    group: body.group,
    groupName: body.groupName,
    score: body.score || 0,
    help: body.help || '',
    isRequired: body.isRequired || true,
    required: body.required || true,
    tier: body.tier,
    unique: body.unique || false,
    parts: body.parts || [],
    valuation: valuationArray,
    allowed_formats: body.allowed_formats
  })
    .then((savedCharacteristic) => savedCharacteristic.toJSON())
    .then((savedAndFormattedCharacteristic) => res.json(savedAndFormattedCharacteristic))
    .catch((error) => next(error))
})

characteristicRouter.post('/addValuationArray', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body
    const id = req.query.id as string
    const valuation = body.valuation
    const valuationArray = valuation.map((str: string) => new mongoose.Types.ObjectId(str))
    const characteristicUpload = await characteristicRepository.updateValuation(id, valuationArray)
    res.json(characteristicUpload)
  } catch (error) {
    next(error)
  }
})

characteristicRouter.post('/changeType', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body
    const id = req.query.id as string
    const type = body.type
    const characteristicUpload = await characteristicRepository.updateType(id, type)
    res.json(characteristicUpload)
  } catch (error) {
    next(error)
  }
})

characteristicRouter.post('/changeFormat', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body
    const id = req.query.id as string
    const format = body.format
    const characteristicUpload = await characteristicRepository.updateFormat(id, format)
    res.json(characteristicUpload)
  } catch (error) {
    next(error)
  }
})

characteristicRouter.post('/addExtra', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body
    const id = req.query.id as string
    const extras = body.extras
    const characteristicUpload = await characteristicRepository.updateExtras(id, extras)
    res.json(characteristicUpload)
  } catch (error) {
    next(error)
  }
})

characteristicRouter.get('/valuation', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.query.id as string
    const characteristicBD = await characteristicRepository.findByIdWithValuation(id)
    res.json(characteristicBD)
  } catch (error) {
    next(error)
  }
})

characteristicRouter.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  const id = req.params.id
  characteristicRepository.findById(id)
    .then((result) => {
      if (result) {
        res.json(result)
      } else {
        res.status(404).end()
      }
    })
    .catch((error) => next(error))
})

characteristicRouter.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
  const id = req.params.id
  characteristicRepository.deleteById(id)
    .then(() => {
      res.status(204).end()
    })
    .catch((error) => next(error))
})

characteristicRouter.put('/:id', (req: Request, res: Response, next: NextFunction) => {
  const id = req.params.id
  const body = req.body
  const characteristic = {
    name: body.name,
    group: body.group,
    groupName: body.groupName,
    required: body.required,
    score: body.score || 0,
    tier: body.tier,
    isRequired: body.isRequired,
    unique: body.unique
  }
  characteristicRepository.updateById(id, characteristic)
    .then((updateCharacteristic) => {
      res.json(updateCharacteristic)
    })
    .catch((error) => next(error))
})

export = characteristicRouter
