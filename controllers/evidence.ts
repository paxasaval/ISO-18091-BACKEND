import { Router, Request, Response, NextFunction, RequestHandler } from 'express'
import mongoose from 'mongoose'
import evidenceRepository from '../src/repositories/evidence.repository'
import subIndicatorRepository from '../src/repositories/subindicator.repository'
import indicatorInstanceRepository from '../src/repositories/indicatorInstance.repository'
import characteristicRepository from '../src/repositories/characteristic.repository'
import { requireAuth, requireNotUser } from '../src/middleware/auth'
import notificationService from '../src/services/notification.service'
import subindicatorService from '../src/services/subindicator.service'
import qualificationService from '../src/services/qualification.service'
import Rol from '../models/rol'
import Rubric from '../models/rubric'
import Commit from '../models/commit'

const evidenveRouter = Router()

// DIVERGENCIA JUSTIFICADA (igual que period.ts): el legacy
// controllers/evidence.js compara rol.name !== process.env.ROL_ADMIN
// ('Administrador'), NO contra utils/config.js / env.ROL_ADMIN (que esta
// mapeado a ROL_ADMIN_KEY, un ObjectId distinto). Se preserva la lectura
// directa de process.env.ROL_ADMIN para mantener el comportamiento observable.
const ROL_ADMIN = process.env.ROL_ADMIN

// Middleware de rol para los endpoints que en el legacy comparaban
// rol.name !== ROL_ADMIN (DELETE /:id y PUT /qualify/:id). Mismos status y
// mensajes que el legacy.
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

evidenveRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const evidenves = await evidenceRepository.findAll()
    res.json(evidenves)
  } catch (error) {
    next(error)
  }
})

evidenveRouter.get('/subindicatorID/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const evidences = await evidenceRepository.findBySubindicator(req.params.id)
    res.status(200).json(evidences)
  } catch (error) {
    next(error)
  }
})

evidenveRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const evidence = await evidenceRepository.findByIdDeep(req.params.id)
    if (evidence) {
      return res.status(200).json(evidence)
    } else {
      return res.status(404).end()
    }
  } catch (error) {
    next(error)
  }
})

evidenveRouter.delete('/:id', requireAuth, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.token?.id
    const id = req.params.id
    const evidenceDelete = (await evidenceRepository.deleteById(id)) as unknown as {
      subIndicatorID: unknown
    }
    const subindicatorBD = await subIndicatorRepository.findByIdForQualification(
      String(evidenceDelete.subIndicatorID)
    )
    const subindicatorUpdated = qualificationService.autoQualifySubindicator(
      subindicatorBD as never
    ) as unknown as {
      id: unknown
      indicadorID: unknown
      lastUpdate: Date
      lastUpdateBy: unknown
    }
    subindicatorUpdated.lastUpdate = new Date()
    subindicatorUpdated.lastUpdateBy = user
    await subIndicatorRepository.updateById(
      String(subindicatorUpdated.id),
      subindicatorUpdated as Record<string, unknown>,
      { new: true }
    )

    const indicatorBD = await indicatorInstanceRepository.findById(
      String(subindicatorUpdated.indicadorID),
      { populate: { path: 'subindicators' } }
    )
    const inddicatorUpdated = qualificationService.autoQualificationIndicator(
      indicatorBD as never
    ) as unknown as { id: unknown, lastUpdate: Date, lastUpdateBy: unknown }
    inddicatorUpdated.lastUpdate = new Date()
    inddicatorUpdated.lastUpdateBy = user
    await indicatorInstanceRepository.updateById(
      String(inddicatorUpdated.id),
      inddicatorUpdated as Record<string, unknown>,
      { new: true }
    )
    return res.json({ message: 'evidencia eliminada con exito' })
  } catch (error) {
    next(error)
  }
})

evidenveRouter.post('/', requireAuth, requireNotUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body
    const user = req.token?.id
    if (body.name === undefined) {
      res.status(400).json({ error: 'name missing' })
    }
    const characteristicBD = (await characteristicRepository.findById(
      body.characteristicID,
      { populate: 'valuation' }
    )) as unknown as { valuation: unknown }
    // valuation se conserva igual que el legacy (no se usa despues).
    void characteristicBD.valuation
    const savedEvidence = await evidenceRepository.create({
      characteristicID: body.characteristicID,
      subIndicatorID: body.subIndicatorID,
      name: body.name,
      link: body.link,
      note: body.note,
      content: body.content || [],
      state: true,
      verified: body.verified || false,
      qualification: body.qualification || 1,
      author: new mongoose.Types.ObjectId(user),
      commits: [],
      ...(body.extras ? { extras: body.extras } : {})
    } as Record<string, unknown>)
    await notificationService.notify(1, user, 3, String(savedEvidence.id), req)

    await subindicatorService.recalcSubindicatorFromEvidence(
      savedEvidence as unknown as { subIndicatorID: unknown, author: unknown },
      req,
      { includeNewEvidence: true }
    )
    const savedAndFormattedevidenve = savedEvidence.toJSON()
    res.json(savedAndFormattedevidenve)
  } catch (error) {
    next(error)
  }
})

// Calificar evidencias
evidenveRouter.put('/qualify/:id', requireAuth, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.token?.id
    const body = req.body
    const id = req.params.id
    if (!id && !body.qualification) {
      return res.status(400).json({ error: 'missing id or qualification' })
    }
    let rubric: unknown
    const evidenceCurrent = (await evidenceRepository.findById(id)) as unknown as {
      _id: unknown
      rubric: unknown[]
      qualification: unknown
      qualificationBy: unknown
      verified: unknown
      qualificationDate: Date
      commits: unknown[]
    }
    if (evidenceCurrent.rubric.length === 0) {
      rubric = await Promise.all(
        body.rubric.map(async (r: { valuation: string, qualification: unknown }) => {
          const newRubric = new Rubric({
            valuation: new mongoose.Types.ObjectId(r.valuation),
            qualification: r.qualification,
            evidence: evidenceCurrent._id
          })
          const rSave = await newRubric.save()
          return rSave._id
        })
      )
    } else {
      const array = body.rubric
      for (const i of array) {
        const rubricDB = (await Rubric.findOne({
          valuation: i.valuation,
          evidence: evidenceCurrent._id
        })) as unknown as { _id: unknown }
        await Rubric.findByIdAndUpdate(
          rubricDB._id as string,
          { qualification: i.qualification },
          { new: true }
        )
      }
    }
    evidenceCurrent.rubric = rubric as unknown[]
    evidenceCurrent.qualification = body.qualification
    evidenceCurrent.qualificationBy = body.user
    // Quirk legacy preservado: bitwise OR sobre false (body.verified | false).
    evidenceCurrent.verified = (body.verified as number) | (false as unknown as number)
    evidenceCurrent.qualificationDate = new Date()
    if (body.commit) {
      const comit = new Commit({
        autor: user,
        body: body.commit,
        created: new Date(),
        lastUpdate: new Date()
      })
      const commitSave = await comit.save()
      const arrayUpdate = evidenceCurrent.commits.concat(commitSave._id)
      evidenceCurrent.commits = arrayUpdate
    }
    const updateEvidence = (await evidenceRepository.updateById(
      id,
      evidenceCurrent as Record<string, unknown>,
      { new: true }
    )) as unknown as { id: unknown, subIndicatorID: unknown }
    await notificationService.notify(2, user, 3, String(updateEvidence.id), req)

    await subindicatorService.recalcSubindicatorFromEvidence(
      updateEvidence as unknown as { subIndicatorID: unknown, author: unknown },
      req,
      { includeNewEvidence: false }
    )
    await subIndicatorRepository.updateById(
      String(updateEvidence.subIndicatorID),
      { lastUpdate: new Date() },
      { new: true }
    )
    return res.json(updateEvidence)
  } catch (error) {
    next(error)
  }
})

evidenveRouter.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body
    const id = req.params.id
    const evidenve = {
      name: body.name,
      characteristicID: body.characteristicID,
      subIndicatorID: body.subIndicatorID,
      link: body.link,
      verified: body.verified || false,
      note: body.note,
      commits: []
    }
    const updateEvidenve = await evidenceRepository.updateById(id, evidenve, {
      new: true
    })
    res.json(updateEvidenve)
  } catch (error) {
    next(error)
  }
})

export = evidenveRouter
