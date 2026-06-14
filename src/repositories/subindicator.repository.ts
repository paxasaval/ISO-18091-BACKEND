// Repositorio de SubIndicator (controllers/subindicator.js).
//
// Es el unico modelo con mongoose-paginate-v2 (PaginateModel), por lo que usa
// SubIndicator.paginate(...) ademas de los aggregate complejos del controlador.
import mongoose, { PipelineStage } from 'mongoose'
import SubIndicator from '../../models/subindicator'
import BaseRepository, { ModelDocType } from './base.repository'

type SubIndicatorDoc = ModelDocType<typeof SubIndicator>

// El populate de paginate usa la forma de mongoose-paginate-v2 (PaginateOptions).
type PaginatePopulate = Parameters<typeof SubIndicator.paginate>[1]

export class SubIndicatorRepository extends BaseRepository<SubIndicatorDoc> {
  constructor() {
    super(SubIndicator)
  }

  // GET /all -> populate commits, evidences, typeID(+characteristics), createdBy
  async findAllPopulated(): Promise<SubIndicatorDoc[]> {
    return this.findAll({}, {
      populate: [
        { path: 'commits', model: 'Commit' },
        { path: 'evidences', model: 'Evidence' },
        { path: 'typeID', populate: { path: 'characteristics' } },
        { path: 'createdBy' }
      ]
    })
  }

  // GET / -> SubIndicator.paginate({}, { offset, limit, populate: [...] })
  async paginateAll(offset: number, limit: number) {
    const options: PaginatePopulate = {
      offset,
      limit,
      populate: [
        { path: 'evidences', model: 'Evidence' },
        { path: 'evidences', model: 'Evidence' },
        { path: 'typeID', populate: { path: 'characteristics' } },
        { path: 'createdBy' }
      ]
    }
    return SubIndicator.paginate({}, options)
  }

  // GET /indicator/:id -> paginate({ indicadorID: id }, { offset, limit, populate })
  async paginateByIndicator(indicadorID: string, offset: number, limit: number) {
    const options: PaginatePopulate = {
      offset,
      limit,
      populate: [
        { path: 'evidences', model: 'Evidence' },
        { path: 'typeID', populate: { path: 'characteristics' } },
        { path: 'createdBy' }
      ]
    }
    return SubIndicator.paginate({ indicadorID }, options)
  }

  // GET /indicator/:id/all -> find({ indicadorID }).populate([...])
  async findByIndicator(indicadorID: string): Promise<SubIndicatorDoc[]> {
    return this.findAll(
      { indicadorID } as Record<string, unknown>,
      {
        populate: [
          { path: 'evidences', model: 'Evidence' },
          { path: 'typeID', populate: { path: 'characteristics' } },
          { path: 'createdBy' }
        ]
      }
    )
  }

  // GET /indicator/:indicatorID/type/:typeID
  async findByIndicatorAndType(
    indicadorID: string,
    typeID: string
  ): Promise<SubIndicatorDoc | null> {
    return this.findOne(
      {
        indicadorID: new mongoose.Types.ObjectId(indicadorID),
        typeID: new mongoose.Types.ObjectId(typeID)
      } as Record<string, unknown>,
      {
        populate: [
          { path: 'typeID' },
          { path: 'evidences', populate: { path: 'characteristicID' } },
          { path: 'createdBy' }
        ]
      }
    )
  }

  // GET /:id -> findById con cadena de populate profunda.
  async findByIdDeep(id: string): Promise<SubIndicatorDoc | null> {
    return this.findById(id, {
      populate: [
        { path: 'indicadorID', populate: { path: 'indicatorID' } },
        { path: 'commits', model: 'Commit' },
        { path: 'evidences', model: 'Evidence' },
        { path: 'typeID', populate: { path: 'characteristics' } },
        { path: 'createdBy' }
      ]
    })
  }

  // Calificacion (Fase 3): replica el populate de updateSubindicator/2 en
  // utils/middleware.js -> findById(id).populate('evidences').populate(typeID +
  // characteristics). Tambien lo usa controllers/evidence.js (delete) para
  // autoQualifySubindicator.
  async findByIdForQualification(id: string): Promise<SubIndicatorDoc | null> {
    return this.findById(id, {
      populate: [
        { path: 'evidences' },
        { path: 'typeID', populate: { path: 'characteristics' } }
      ]
    })
  }

  // notify itemType=2 (utils/middleware.js): findById(itemID).populate({
  //   path:'indicadorID', populate:[{ path:'gadID' },{ path:'period' }] })
  async findByIdForNotify(id: string): Promise<SubIndicatorDoc | null> {
    return this.findById(id, {
      populate: {
        path: 'indicadorID',
        populate: [{ path: 'gadID' }, { path: 'period' }]
      }
    })
  }

  // GET /indicator/:id/generalSubindicators (typeID.mandatory === true)
  // Aggregate fiel al controlador; se parametriza solo el indicadorID.
  async aggregateGeneral(indicatorID: string): Promise<unknown[]> {
    return this.buildMandatoryAggregate(indicatorID, true)
  }

  // Pipeline compartido entre general (mandatory true) y, como base, los
  // especificos (mandatory false). 'general' no pagina; 'specific' aplica $facet
  // (ver aggregateSpecificPaginated).
  private buildMandatoryAggregate(
    indicatorID: string,
    mandatory: boolean
  ): Promise<unknown[]> {
    const select = { __v: 0, _id: 0 }
    const pipeline: PipelineStage[] = [
      { $match: { indicadorID: new mongoose.Types.ObjectId(indicatorID) } },
      {
        $lookup: {
          from: 'evidences',
          localField: 'evidences',
          foreignField: '_id',
          as: 'evidences',
          pipeline: [{ $project: select }]
        }
      },
      {
        $lookup: {
          from: 'types',
          localField: 'typeID',
          foreignField: '_id',
          as: 'typeID',
          pipeline: [{ $project: select }]
        }
      },
      { $unwind: { path: '$typeID', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'characteristics',
          localField: 'typeID.characteristics',
          foreignField: '_id',
          as: 'typeID.characteristics',
          pipeline: [{ $project: select }]
        }
      },
      { $match: { 'typeID.mandatory': mandatory } },
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'createdBy',
          pipeline: [{ $project: select }]
        }
      },
      { $unwind: { path: '$createdBy', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          id: '$_id',
          indicadorID: 1,
          requireCover: 1,
          cover: 1,
          observationCover: 1,
          typeID: 1,
          name: 1,
          responsible: 1,
          qualification: 1,
          created: 1,
          lastUpdate: 1,
          state: 1,
          createdBy: 1,
          commits: 1,
          evidences: 1,
          _id: 0
        }
      }
    ]
    return SubIndicator.aggregate(pipeline).exec()
  }

  // GET /indicator/:id/subindicatorsSpecific (typeID.mandatory === false + $facet)
  // Devuelve el resultado crudo del aggregate ([{ totalCount, results }]); el
  // armado de la paginacion/respuesta queda en la capa superior.
  async aggregateSpecificPaginated(
    indicatorID: string,
    offset: number,
    limit: number
  ): Promise<unknown[]> {
    const select = { __v: 0, _id: 0 }
    const pipeline: PipelineStage[] = [
      { $match: { indicadorID: new mongoose.Types.ObjectId(indicatorID) } },
      {
        $lookup: {
          from: 'evidences',
          localField: 'evidences',
          foreignField: '_id',
          as: 'evidences',
          pipeline: [{ $project: select }]
        }
      },
      {
        $lookup: {
          from: 'types',
          localField: 'typeID',
          foreignField: '_id',
          as: 'typeID',
          pipeline: [{ $project: select }]
        }
      },
      { $unwind: { path: '$typeID', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'characteristics',
          localField: 'typeID.characteristics',
          foreignField: '_id',
          as: 'typeID.characteristics',
          pipeline: [{ $project: select }]
        }
      },
      { $match: { 'typeID.mandatory': false } },
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'createdBy',
          pipeline: [{ $project: select }]
        }
      },
      { $unwind: { path: '$createdBy', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          id: '$_id',
          indicadorID: 1,
          requireCover: 1,
          cover: 1,
          observationCover: 1,
          typeID: 1,
          name: 1,
          responsible: 1,
          qualification: 1,
          created: 1,
          lastUpdate: 1,
          state: 1,
          createdBy: 1,
          commits: 1,
          evidences: 1,
          _id: 0
        }
      },
      {
        $facet: {
          totalCount: [{ $count: 'count' }],
          results: [{ $skip: offset }, { $limit: limit }]
        }
      }
    ]
    return SubIndicator.aggregate(pipeline).exec()
  }
}

export const subIndicatorRepository = new SubIndicatorRepository()
export default subIndicatorRepository
