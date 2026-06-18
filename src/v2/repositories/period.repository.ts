// Repositorio v2 de Period (coleccion period.model).
import mongoose from 'mongoose'
import Period from '../models/period.model'
// Modelos v2 usados por el clonado de periodo (POST /periods?clone=true).
import IndicatorInstance from '../models/indicator-instance.model'
import Indicator from '../models/indicator.model'
import Subindicator from '../models/subindicator.model'
import Type from '../models/type.model'
import BaseRepository, { ModelDocType } from './base.repository'

type PeriodDoc = ModelDocType<typeof Period>

export class PeriodRepository extends BaseRepository<PeriodDoc> {
  constructor() {
    super(Period)
  }

  // POST /periods?clone=true: crea el periodo y clona las instancias de
  // indicadores + subindicadores sobre los modelos v2 (nombres limpios:
  // gadId/indicatorInstanceId/typeId/responsibleText). Devuelve el array de
  // instancias guardadas y formateadas (toJSON).
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
        indicatorInstanceId: new mongoose.Types.ObjectId(indicator.id),
        gadId: tenantID,
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
          indicatorInstanceId: instance._id,
          requireCover: false,
          typeId: new mongoose.Types.ObjectId(type.id),
          name: type.name,
          responsibleText: 'Administracion',
          responsibleUserIds: [],
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
      return savedIndicator.toJSON()
    })
    return Promise.all(promises)
  }
}

export const periodRepository = new PeriodRepository()
export default periodRepository
