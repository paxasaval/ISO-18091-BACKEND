// Repositorio v2 de ImprovementPlan (coleccion improvement-plan.model).
import ImprovementPlan from '../models/improvement-plan.model'
import BaseRepository, { ModelDocType } from './base.repository'

type ImprovementPlanDoc = ModelDocType<typeof ImprovementPlan>

export class ImprovementPlanRepository extends BaseRepository<ImprovementPlanDoc> {
  constructor() {
    super(ImprovementPlan)
  }
}

export const improvementPlanRepository = new ImprovementPlanRepository()
export default improvementPlanRepository
