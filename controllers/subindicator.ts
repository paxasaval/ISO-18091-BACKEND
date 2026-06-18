import { Router, Request, Response, NextFunction } from 'express'
import mongoose from 'mongoose'
import subIndicatorRepository from '../src/repositories/subindicator.repository'
import { requireAuth, requireNotUser } from '../src/middleware/auth'
import notificationService from '../src/services/notification.service'
import { NotificationType, NotificationItemType } from '../src/constants'

const subIndicatorRouter = Router()

// Replica getPagination del legacy (controllers/subindicator.js lineas 12-17).
const getPagination = (page: unknown, size: unknown) => {
  const limit = size ? +(size as string) : 3
  const offset = page ? (page as unknown as number) * limit : 0
  return { limit, offset }
}

subIndicatorRouter.get('/all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subIndicators = await subIndicatorRepository.findAllPopulated()
    res.json(subIndicators)
  } catch (error) {
    next(error)
  }
})

subIndicatorRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, size } = req.query
    const { limit, offset } = getPagination(page, size)
    const subIndicators = await subIndicatorRepository.paginateAll(offset, limit)
    res.json(subIndicators)
  } catch (error) {
    next(error)
  }
})

subIndicatorRouter.get('/indicator/:id/generalSubindicators', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await subIndicatorRepository.aggregateGeneral(req.params.id)
    res.json(data)
  } catch (error) {
    next(error)
  }
})

subIndicatorRouter.get('/indicator/:id/all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subIndicators = await subIndicatorRepository.findByIndicator(req.params.id)
    res.json(subIndicators)
  } catch (error) {
    next(error)
  }
})

subIndicatorRouter.get('/indicator/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, size } = req.query
    const { limit, offset } = getPagination(page, size)
    const subIndicators = await subIndicatorRepository.paginateByIndicator(
      req.params.id,
      offset,
      limit
    )
    res.json(subIndicators)
  } catch (error) {
    next(error)
  }
})

subIndicatorRouter.get('/indicator/:id/subindicatorsSpecific', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id
    const { page, size } = req.query
    const { limit, offset } = getPagination(page, size)

    const data = (await subIndicatorRepository.aggregateSpecificPaginated(
      id,
      offset,
      limit
    )) as Array<{
      totalCount: Array<{ count: number }>
      results: unknown[]
    }>

    if (data[0].results.length === 0) {
      return res.status(204).json({ message: 'no subindcators specific' })
    }
    const totalCount = data[0].totalCount[0].count
    const subindicators = data[0].results
    const JSONsubindicators = JSON.parse(JSON.stringify(subindicators))
    const totalPages = Math.ceil(totalCount / Number(size))
    const hasNextPage = Number(page) < totalPages - 1
    const hasPrevPage = Number(page) > 0
    const pagination = {
      pag: Number(page),
      size: Number(size),
      totalPages: totalPages,
      nextPage: hasNextPage ? Number(page) + 1 : null,
      prevPage: hasPrevPage ? Number(page) - 1 : null,
      existNextPage: hasNextPage,
      existPrevpage: hasPrevPage,
      totalDocs: totalCount
    }
    return res.json({
      pagination,
      docs: JSONsubindicators
    })
  } catch (error) {
    next(error)
  }
})

subIndicatorRouter.get('/indicator/:indicatorID/type/:typeID', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subindicator = await subIndicatorRepository.findByIndicatorAndType(
      req.params.indicatorID,
      req.params.typeID
    )
    res.status(200).json(subindicator)
  } catch (error) {
    next(error)
  }
})

subIndicatorRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subIndicator = await subIndicatorRepository.findByIdDeep(req.params.id)
    if (subIndicator) {
      res.json(subIndicator)
    } else {
      res.status(404).end()
    }
  } catch (error) {
    next(error)
  }
})

subIndicatorRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await subIndicatorRepository.deleteById(req.params.id)
    res.status(204).end()
  } catch (error) {
    next(error)
  }
})

subIndicatorRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body
    if (body.name === undefined) {
      res.status(400).json({ error: 'name missing' })
    }
    const arrayCommits = body.commits.map(
      (commit: string) => new mongoose.Types.ObjectId(commit)
    )
    const arrayEvidences = body.evidences.map(
      (evidence: string) => new mongoose.Types.ObjectId(evidence)
    )
    const savedSubIndicator = await subIndicatorRepository.createAndLinkToIndicator({
      indicadorID: new mongoose.Types.ObjectId(body.indicadorID),
      typeID: new mongoose.Types.ObjectId(body.typeID),
      name: body.name,
      responsible: body.responsible,
      qualification: body.qualification,
      created: new Date(),
      lastUpdate: new Date(),
      state: true,
      createdBy: new mongoose.Types.ObjectId(body.createdBy),
      commits: arrayCommits,
      evidences: arrayEvidences
    })
    const savedAndFormattedSubIndicator = savedSubIndicator.toJSON()
    res.json(savedAndFormattedSubIndicator)
  } catch (error) {
    next(error)
  }
})

subIndicatorRouter.post('/newSubindicator', requireAuth, requireNotUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const decodedToken = req.token
    const body = req.body
    if (body.name === undefined) {
      res.status(400).json({ error: 'name missing' })
    }
    const user = new mongoose.Types.ObjectId(decodedToken?.id)
    const arrayCommits = body.commits.map(
      (commit: string) => new mongoose.Types.ObjectId(commit)
    )
    const arrayEvidences = body.evidences.map(
      (evidence: string) => new mongoose.Types.ObjectId(evidence)
    )
    const savedSubIndicator = await subIndicatorRepository.createAndLinkToIndicator({
      typeID: new mongoose.Types.ObjectId(body.typeID),
      name: body.name,
      indicadorID: new mongoose.Types.ObjectId(body.indicadorID),
      requireCover: body.requireCover || true,
      cover: body.cover,
      observationCover: body.observationCover,
      isPlanned: body.isPlanned,
      isDiagnosed: body.isDiagnosed,
      responsible: body.responsible,
      qualification: body.qualification,
      created: new Date(),
      lastUpdate: new Date(),
      state: false,
      createdBy: user,
      commits: arrayCommits,
      evidences: arrayEvidences
    })
    const savedAndFormattedSubIndicator = savedSubIndicator.toJSON()
    await notificationService.notify(
      NotificationType.Added,
      user,
      NotificationItemType.Subindicator,
      String(savedSubIndicator.id),
      req
    )
    res.json(savedAndFormattedSubIndicator)
  } catch (error) {
    next(error)
  }
})

subIndicatorRouter.put('/addInfo', requireAuth, requireNotUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.query.id as string
    const subindicatorBD = await subIndicatorRepository.findById(id)
    const extras = req.body.extraInfo
    ;(subindicatorBD as unknown as { extraInfo: unknown }).extraInfo = extras

    const savedAndFormattedSubIndicator = await subIndicatorRepository.updateById(
      id,
      subindicatorBD as unknown as Record<string, unknown>,
      { new: true }
    )
    res.json(savedAndFormattedSubIndicator)
  } catch (error) {
    next(error)
  }
})

subIndicatorRouter.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body
    const id = req.params.id
    const arrayCommits = body.commits.map(
      (commit: string) => new mongoose.Types.ObjectId(commit)
    )
    const arrayEvidences = body.evidences.map(
      (evidence: string) => new mongoose.Types.ObjectId(evidence)
    )
    const subIndicator = {
      name: body.name,
      responsible: body.responsible,
      typeID: body.typeID,
      qualification: body.qualification,
      lastUpdate: new Date(),
      commits: arrayCommits,
      evidences: arrayEvidences
    }
    const updateSubIndicator = await subIndicatorRepository.updateById(
      id,
      subIndicator,
      { new: true }
    )
    res.json(updateSubIndicator)
  } catch (error) {
    next(error)
  }
})

export = subIndicatorRouter
