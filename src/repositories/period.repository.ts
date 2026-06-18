// Repositorio de Period (controllers/period.js).
import mongoose, { Types } from 'mongoose'
import Period from '../../models/period'
// Modelos en CommonJS (export =) usados por POST /new (clonado de periodo).
import IndicatorInstance from '../../models/indicatorInstance'
import Indicator from '../../models/indicator'
import Subindicator from '../../models/subindicator'
import Type from '../../models/type'
import BaseRepository, { ModelDocType } from './base.repository'

type PeriodDoc = ModelDocType<typeof Period>

export class PeriodRepository extends BaseRepository<PeriodDoc> {
  constructor() {
    super(Period)
  }

  // GET / (con header tenant) -> Period.find({ gad: tenantID })
  async findByTenant(tenantID: string): Promise<PeriodDoc[]> {
    return this.findAll(
      { gad: new Types.ObjectId(tenantID) } as Record<string, unknown>
    )
  }

  // POST /new: clona instancias de indicadores + subindicadores para el nuevo
  // periodo. Replica FIEL controllers/period.js (lineas 104-149):
  //   - crea Period
  //   - Type.find({ mandatory:true }), Indicator.find()
  //   - por cada indicador: IndicatorInstance + un Subindicator por cada type
  // Devuelve el array de instancias guardadas y formateadas (toJSON), igual que
  // el legacy (que respondia res.json(savedInstances)).
  async createNewPeriodWithInstances(
    tenantID: mongoose.Types.ObjectId,
    user: mongoose.Types.ObjectId,
    year: string
  ): Promise<unknown[]> {
    const newPeriod = new Period({
      createdBy: user,
      gad: tenantID,
      year
    })
    const newPeriodSave = await newPeriod.save()

    const types = await Type.find({ mandatory: true })
    const indicators = await Indicator.find()
    const promises = indicators.map(async (indicator) => {
      const instance = new IndicatorInstance({
        indicatorID: new mongoose.Types.ObjectId(indicator.id),
        gadID: tenantID,
        qualification: 0,
        create: new Date(),
        state: false,
        period: newPeriodSave._id,
        year,
        createdBy: user,
        lastUpdate: new Date(),
        subindicators: []
      })
      types.forEach((type) => {
        const subindicator = new Subindicator({
          indicadorID: instance._id,
          requireCover: false,
          typeID: new mongoose.Types.ObjectId(type.id),
          name: type.name,
          responsible: 'Administracion',
          qualification: 0,
          created: new Date(),
          state: false,
          lastUpdate: new Date(),
          createdBy: user,
          commits: [],
          evidences: []
        })
        subindicator.save()
        instance.subindicators.push(subindicator._id)
      })
      const savedIndicator = await instance.save()
      const savedAndFormattedIndicator = savedIndicator.toJSON()
      return savedAndFormattedIndicator
    })
    return Promise.all(promises)
  }
}

export const periodRepository = new PeriodRepository()
export default periodRepository
