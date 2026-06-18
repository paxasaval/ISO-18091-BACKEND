// Repositorio de IndicatorInstance (controllers/indicatorInstance.js).
import mongoose, { PipelineStage } from 'mongoose'
import IndicatorInstance from '../../models/indicatorInstance'
import BaseRepository, { ModelDocType } from './base.repository'

type IndicatorInstanceDoc = ModelDocType<typeof IndicatorInstance>

export class IndicatorInstanceRepository extends BaseRepository<IndicatorInstanceDoc> {
  constructor() {
    super(IndicatorInstance)
  }

  // GET / (sin query) -> find({}) con cadena de populate completa.
  async findAllPopulated(): Promise<IndicatorInstanceDoc[]> {
    return this.findAll({}, {
      populate: [
        { path: 'gadID' },
        { path: 'indicatorID' },
        { path: 'subindicators', model: 'SubIndicator' },
        { path: 'subindicators.createdBy', model: 'User' },
        { path: 'createdby' }
      ]
    })
  }

  // GET /?period=&quadrant= -> find({ year, gadID }).populate(indicatorID+ods, subindicators+createdBy)
  // El filtrado por quadrant y el sort por number se hacen sobre indicatorID poblado;
  // el controlador los aplica en memoria. Aqui devolvemos los documentos poblados.
  async findByYearAndTenant(
    year: string,
    tenantID: string
  ): Promise<IndicatorInstanceDoc[]> {
    return this.findAll(
      { year, gadID: new mongoose.Types.ObjectId(tenantID) } as Record<string, unknown>,
      {
        populate: [
          { path: 'indicatorID', populate: { path: 'ods' } },
          { path: 'subindicators', model: 'SubIndicator', populate: { path: 'createdBy' } }
        ]
      }
    )
  }

  // GET /byIndicatorIDAndPeriod
  async findByIndicatorPeriodTenant(
    indicatorID: string,
    period: string,
    tenantID: string
  ): Promise<IndicatorInstanceDoc | null> {
    return this.findOne(
      {
        indicatorID: new mongoose.Types.ObjectId(indicatorID),
        period: new mongoose.Types.ObjectId(period),
        gadID: new mongoose.Types.ObjectId(tenantID)
      } as Record<string, unknown>,
      {
        populate: [
          { path: 'indicatorID', populate: { path: 'ods' } },
          {
            path: 'subindicators',
            model: 'SubIndicator',
            populate: [{ path: 'createdBy' }, { path: 'evidences' }]
          }
        ]
      }
    )
  }

  // GET /summarySubindicators -> find({ period, gadID }).populate('subindicators')
  async findByPeriodTenantWithSubindicators(
    period: string,
    tenantID: string
  ): Promise<IndicatorInstanceDoc[]> {
    return this.findAll(
      {
        period: new mongoose.Types.ObjectId(period),
        gadID: new mongoose.Types.ObjectId(tenantID)
      } as Record<string, unknown>,
      { populate: 'subindicators' }
    )
  }

  // GET /:id
  async findByIdDeep(id: string): Promise<IndicatorInstanceDoc | null> {
    return this.findById(id, {
      populate: [
        { path: 'indicatorID', populate: { path: 'ods' } },
        {
          path: 'subindicators',
          model: 'SubIndicator',
          populate: [{ path: 'createdBy' }, { path: 'evidences' }]
        },
        { path: 'gadID' }
      ]
    })
  }

  // notify itemType=1 (utils/middleware.js): findById(itemID)
  //   .populate('Indicator').populate('gadID').
  // NOTA: el populate 'Indicator' replica el legacy TAL CUAL (no es el path
  // real 'indicatorID', por lo que no puebla nada util); se preserva el bug.
  async findByIdForNotify(id: string): Promise<IndicatorInstanceDoc | null> {
    return this.findById(id, { populate: ['Indicator', 'gadID'] })
  }

  // GET /byQuadrantAndPeriod -> aggregate con $match quadrant + $sort number.
  async aggregateByQuadrantAndPeriod(
    quadrant: number,
    period: string,
    tenantID: string
  ): Promise<unknown[]> {
    return IndicatorInstance.aggregate(
      this.buildQuadrantPipeline(period, tenantID, { matchQuadrant: quadrant, sort: true })
    ).exec()
  }

  // GET /summary -> mismo pipeline base por quadrant (1..4), sin lookup de
  // subindicators ni sort; el controlador agrega los conteos por calificacion.
  async aggregateByQuadrant(
    quadrant: number,
    period: string,
    tenantID: string
  ): Promise<unknown[]> {
    return IndicatorInstance.aggregate(
      this.buildQuadrantPipeline(period, tenantID, {
        matchQuadrant: quadrant,
        sort: false,
        includeSubindicatorsLookup: false
      })
    ).exec()
  }

  // Pipeline compartido por byQuadrantAndPeriod y summary.
  private buildQuadrantPipeline(
    period: string,
    tenantID: string,
    opts: { matchQuadrant: number, sort: boolean, includeSubindicatorsLookup?: boolean }
  ): PipelineStage[] {
    const select = { __v: 0, _id: 0 }
    const includeSubindicators = opts.includeSubindicatorsLookup ?? true
    const pipeline: PipelineStage[] = [
      {
        $match: {
          period: new mongoose.Types.ObjectId(period),
          gadID: new mongoose.Types.ObjectId(tenantID)
        }
      },
      {
        $lookup: {
          from: 'indicators',
          localField: 'indicatorID',
          foreignField: '_id',
          as: 'indicatorID',
          pipeline: [{ $project: select }]
        }
      },
      { $unwind: { path: '$indicatorID', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'ods',
          localField: 'indicatorID.ods',
          foreignField: '_id',
          as: 'indicatorID.ods',
          pipeline: [{ $project: select }]
        }
      },
      {
        $lookup: {
          from: 'gad',
          localField: 'gadID',
          foreignField: '_id',
          as: 'gadID',
          pipeline: [{ $project: select }]
        }
      },
      { $match: { 'indicatorID.quadrant': opts.matchQuadrant } }
    ]

    if (includeSubindicators) {
      pipeline.push({
        $lookup: {
          from: 'subindicators',
          localField: 'subindicators',
          foreignField: '_id',
          as: 'subindicators',
          pipeline: [{ $project: select }]
        }
      })
    }
    if (opts.sort) {
      pipeline.push({ $sort: { 'indicatorID.number': 1 } })
    }
    return pipeline
  }
}

export const indicatorInstanceRepository = new IndicatorInstanceRepository()
export default indicatorInstanceRepository
