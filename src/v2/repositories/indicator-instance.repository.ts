// Repositorio v2 de IndicatorInstance (coleccion v2_indicator_instances).
// Extiende BaseRepository con los metodos de consulta que necesita
// indicatorInstance.routes v2.
import mongoose, { PipelineStage } from 'mongoose'
import IndicatorInstance from '../models/indicator-instance.model'
import BaseRepository, { ModelDocType } from './base.repository'

type IndicatorInstanceDoc = ModelDocType<typeof IndicatorInstance>

export class IndicatorInstanceRepository extends BaseRepository<IndicatorInstanceDoc> {
  constructor() {
    super(IndicatorInstance)
  }

  // GET /?period=&tenant -> find({ year, gadId }).populate(indicatorInstanceId+ods, subindicators)
  async findByYearAndTenant(
    year: string,
    tenantId: string
  ): Promise<IndicatorInstanceDoc[]> {
    return this.findAll(
      { year, gadId: new mongoose.Types.ObjectId(tenantId) } as unknown as Record<string, unknown>,
      {
        populate: [
          { path: 'indicatorInstanceId', populate: { path: 'ods' } },
          { path: 'subindicators', model: 'SubindicatorV2', populate: { path: 'createdBy' } }
        ]
      }
    )
  }

  // GET /:id -> populate profundo
  async findByIdDeep(id: string): Promise<IndicatorInstanceDoc | null> {
    return this.findById(id, {
      populate: [
        { path: 'indicatorInstanceId', populate: { path: 'ods' } },
        {
          path: 'subindicators',
          model: 'SubindicatorV2',
          populate: [{ path: 'createdBy', select: 'name email' }, { path: 'evidences' }]
        },
        { path: 'gadId' }
      ]
    })
  }

  // GET /summary?period -> aggregate por cuadrante sobre v2_indicator_instances.
  // Devuelve instancias con qualification para contar por nivel 0-3.
  async aggregateByQuadrant(
    quadrant: number,
    period: string,
    tenantId: string
  ): Promise<unknown[]> {
    const pipeline: PipelineStage[] = [
      {
        $match: {
          period: new mongoose.Types.ObjectId(period),
          gadId: new mongoose.Types.ObjectId(tenantId)
        }
      },
      {
        $lookup: {
          from: 'v2_indicators',
          localField: 'indicatorInstanceId',
          foreignField: '_id',
          as: 'indicatorInstanceId',
          pipeline: [{ $project: { __v: 0 } }]
        }
      },
      { $unwind: { path: '$indicatorInstanceId', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'v2_ods',
          localField: 'indicatorInstanceId.ods',
          foreignField: '_id',
          as: 'indicatorInstanceId.ods',
          pipeline: [{ $project: { __v: 0 } }]
        }
      },
      {
        $lookup: {
          from: 'v2_gad',
          localField: 'gadId',
          foreignField: '_id',
          as: 'gadId',
          pipeline: [{ $project: { __v: 0 } }]
        }
      },
      { $match: { 'indicatorInstanceId.quadrant': quadrant } }
    ]
    return IndicatorInstance.aggregate(pipeline).exec()
  }

  // GET /?period=&quadrant= -> aggregate con sort por number
  async aggregateByQuadrantAndPeriod(
    quadrant: number,
    period: string,
    tenantId: string
  ): Promise<unknown[]> {
    const pipeline: PipelineStage[] = [
      {
        $match: {
          period: new mongoose.Types.ObjectId(period),
          gadId: new mongoose.Types.ObjectId(tenantId)
        }
      },
      {
        $lookup: {
          from: 'v2_indicators',
          localField: 'indicatorInstanceId',
          foreignField: '_id',
          as: 'indicatorInstanceId',
          pipeline: [{ $project: { __v: 0 } }]
        }
      },
      { $unwind: { path: '$indicatorInstanceId', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'v2_ods',
          localField: 'indicatorInstanceId.ods',
          foreignField: '_id',
          as: 'indicatorInstanceId.ods',
          pipeline: [{ $project: { __v: 0 } }]
        }
      },
      {
        $lookup: {
          from: 'v2_gad',
          localField: 'gadId',
          foreignField: '_id',
          as: 'gadId',
          pipeline: [{ $project: { __v: 0 } }]
        }
      },
      { $match: { 'indicatorInstanceId.quadrant': quadrant } },
      {
        $lookup: {
          from: 'v2_subindicators',
          localField: 'subindicators',
          foreignField: '_id',
          as: 'subindicators',
          pipeline: [{ $project: { __v: 0 } }]
        }
      },
      { $sort: { 'indicatorInstanceId.number': 1 } }
    ]
    return IndicatorInstance.aggregate(pipeline).exec()
  }
}

export const indicatorInstanceRepository = new IndicatorInstanceRepository()
export default indicatorInstanceRepository
