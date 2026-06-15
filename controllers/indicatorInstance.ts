import { Router, Request, Response, NextFunction, RequestHandler } from 'express'
import mongoose from 'mongoose'
import indicatorInstanceRepository from '../src/repositories/indicatorInstance.repository'
import { requireAuth } from '../src/middleware/auth'
import Rol from '../models/rol'

const indicatorInstanceRouter = Router()

// DIVERGENCIA JUSTIFICADA (igual que period.ts/evidence.ts): el legacy
// controllers/indicatorInstance.js compara rol.name !== process.env.ROL_ADMIN
// ('Administrador'), NO contra env.ROL_ADMIN (mapeado a ROL_ADMIN_KEY). Se
// preserva la lectura directa para mantener el comportamiento observable.
const ROL_ADMIN = process.env.ROL_ADMIN

// PUT /:id comparaba rol.name !== ROL_ADMIN. Mismos status/mensajes.
const requireAdmin: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const decodedToken = req.token
  if (!decodedToken) {
    return res.status(401).json({ error: 'token missing or invalid' })
  }
  const rol = await Rol.findById(decodedToken.rol)
  if (!rol) {
    return res.status(401).json({ error: 'rol missing or invalid' })
  } else if ((rol as unknown as { name: string }).name !== ROL_ADMIN) {
    return res.status(401).json({ error: 'unauthorized rol' })
  }
  return next()
}

indicatorInstanceRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantID = String(req.header('tenant'))
    // Quirk legacy preservado: `Object.entries(req.query) === 0` es SIEMPRE
    // false (un array nunca es estrictamente igual a 0), por lo que el flujo
    // SIEMPRE entra al else (rama por period/quadrant). Se mantiene el bug.
    if ((Object.entries(req.query) as unknown as number) === 0) {
      const indicators = await indicatorInstanceRepository.findAllPopulated()
      res.json(indicators)
    } else {
      const period = req.query.period as string
      const quadrant = Number(req.query.quadrant)
      const indicators = (await indicatorInstanceRepository.findByYearAndTenant(
        period,
        tenantID
      )) as unknown as Array<{
        indicatorID: { quadrant: number, number: number }
      }>
      res.json(
        indicators
          .filter((indicator) => indicator.indicatorID.quadrant === quadrant)
          .sort((a, b) => a.indicatorID.number - b.indicatorID.number)
      )
    }
  } catch (error) {
    next(error)
  }
})

indicatorInstanceRouter.get('/byIndicatorIDAndPeriod', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const indicatorInstance = await indicatorInstanceRepository.findByIndicatorPeriodTenant(
      req.query.indicatorID as string,
      req.query.period as string,
      String(req.header('tenant'))
    )
    res.status(200).json(indicatorInstance)
  } catch (error) {
    next(error)
  }
})

indicatorInstanceRouter.get('/byQuadrantAndPeriod', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const quadrant = Number(req.query.quadrant)
    const indicatorInstance = await indicatorInstanceRepository.aggregateByQuadrantAndPeriod(
      quadrant,
      req.query.period as string,
      String(req.header('tenant'))
    )
    res.status(200).json(indicatorInstance)
  } catch (error) {
    next(error)
  }
})

indicatorInstanceRouter.get('/summarySubindicators', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const indicators = (await indicatorInstanceRepository.findByPeriodTenantWithSubindicators(
      req.query.period as string,
      String(req.header('tenant'))
    )) as unknown as Array<{ subindicators: Array<{ qualification: number }> }>
    const subindcators = indicators.map((indicator) => indicator.subindicators).flat()
    const result: Record<number, number> = {
      0: 0,
      1: 0,
      2: 0,
      3: 0
    }
    subindcators.forEach((subindicator) => {
      const qualify = subindicator.qualification
      if (Object.prototype.hasOwnProperty.call(result, qualify)) {
        result[qualify]++
      }
    })
    res.status(200).json({
      qualify_0: result[0],
      qualify_1: result[1],
      qualify_2: result[2],
      qualify_3: result[3]
    })
  } catch (error) {
    next(error)
  }
})

indicatorInstanceRouter.get('/summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const period = req.query.period as string
    const tenantID = String(req.header('tenant'))
    const result = [
      { quadrantName: '', qualify_0: 0, qualify_1: 0, qualify_2: 0, qualify_3: 0 },
      { quadrantName: '', qualify_0: 0, qualify_1: 0, qualify_2: 0, qualify_3: 0 },
      { quadrantName: '', qualify_0: 0, qualify_1: 0, qualify_2: 0, qualify_3: 0 },
      { quadrantName: '', qualify_0: 0, qualify_1: 0, qualify_2: 0, qualify_3: 0 }
    ]
    for (let i = 1; i < 5; i++) {
      const indicatorInstance = (await indicatorInstanceRepository.aggregateByQuadrant(
        i,
        period,
        tenantID
      )) as Array<{
        indicatorID: { quadrantName: string }
        qualification: number
      }>
      result[i - 1].quadrantName = indicatorInstance[0].indicatorID.quadrantName
      result[i - 1].qualify_0 = indicatorInstance.filter(
        (indicator) => indicator.qualification === 0
      ).length
      result[i - 1].qualify_1 = indicatorInstance.filter(
        (indicator) => indicator.qualification === 1
      ).length
      result[i - 1].qualify_2 = indicatorInstance.filter(
        (indicator) => indicator.qualification === 2
      ).length
      result[i - 1].qualify_3 = indicatorInstance.filter(
        (indicator) => indicator.qualification === 3
      ).length
    }
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
})

indicatorInstanceRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const indicator = await indicatorInstanceRepository.findByIdDeep(req.params.id)
    if (indicator) {
      res.json(indicator)
    } else {
      res.status(404).end()
    }
  } catch (error) {
    next(error)
  }
})

indicatorInstanceRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await indicatorInstanceRepository.deleteById(req.params.id)
    res.status(204).end()
  } catch (error) {
    next(error)
  }
})

indicatorInstanceRouter.put('/:id', requireAuth, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body
    const id = req.params.id
    const arraySubindicators = body.subindicators.map(
      (subindicator: string) => new mongoose.Types.ObjectId(subindicator)
    )
    const user = new mongoose.Types.ObjectId(req.token?.id)
    const indicator = {
      qualification: body.qualification,
      lastUpdate: new Date(),
      lastUpdateBy: user,
      subindicators: arraySubindicators
    }
    const updateIndicator = await indicatorInstanceRepository.updateById(id, indicator, {
      new: true
    })
    res.status(200).json(updateIndicator)
  } catch (error) {
    next(error)
  }
})

export = indicatorInstanceRouter
