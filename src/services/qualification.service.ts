// Servicio de calificacion (Fase 3).
//
// Porta EXACTAMENTE la logica de dominio embebida en el legacy, preservando
// comportamientos peculiares/buggy. Coexisten DOS algoritmos de calificacion de
// subindicador DISTINTOS:
//
//   - qualifySubindicator       (de utils/middleware.js): promedio por
//     caracteristica + umbrales de porcentaje sobre score/totalScore.
//   - autoQualifySubindicator   (de controllers/evidence.js): basado en
//     existencia de evidencia por caracteristica, tier critico y conteos.
//
// NO son intercambiables; se mantienen separados a proposito.
//
// Igualmente coexisten dos variantes de calificacion de indicador:
//   - updateIndicator           (utils/middleware.js): muta, lee gad/publishAuto
//     y PERSISTE el indicador con autoQualification.
//   - autoQualificationIndicator(controllers/evidence.js): solo muta y devuelve
//     el indicador, SIN persistir ni tocar gad/publishAuto.

import type { Request } from 'express'
import {
  indicatorInstanceRepository,
  gadRepository
} from '../repositories'

// Los documentos que recibe esta logica vienen poblados; el legacy accede a
// campos de subdocumentos (characteristic.score, evidence.qualification, etc.)
// que no estan en las interfaces de Document. Usamos tipos laxos locales para
// reflejar fielmente el acceso dinamico del JS original sin reescribir el
// comportamiento.

interface CharacteristicLike {
  _id: unknown
  score: number
  tier: number
}

interface EvidenceLike {
  characteristicID: { equals(id: unknown): boolean }
  qualification: number
}

interface SubindicatorLike {
  id?: unknown
  evidences: EvidenceLike[]
  score: number
  totalScore: number
  qualification: number
  state?: boolean
  lastUpdate?: Date
  lastUpdateBy?: unknown
  indicadorID: unknown
}

interface IndicatorLike {
  id?: unknown
  subindicators: Array<{ qualification: number }>
  qualification: number
  state?: boolean
  lastUpdate?: Date
  lastUpdateBy?: unknown
}

export class QualificationService {
  // utils/middleware.js qualifySubindicator (lineas ~85-130).
  // Promedio de qualification por caracteristica; suma de promedios = score.
  // Umbrales: percent >= 0.9 -> 3, > 0.5 -> 2, > 0.2 -> 1, else 0.
  qualifySubindicator<T extends SubindicatorLike>(
    subindcatorBD: T,
    arrayCharacteristics: CharacteristicLike[]
  ): T {
    const arrayEvidences = subindcatorBD.evidences
    let qualifySubindicator = 0
    let scoreSubindicator = 0
    arrayCharacteristics.forEach((characteristic) => {
      const total = characteristic.score // cambiar por el total de valuation
      scoreSubindicator += total
      let avgQualify = 0
      let numEvidenc = 0
      let totalEvidence = 0
      const founded = arrayEvidences.filter((evidence) =>
        evidence.characteristicID.equals(characteristic._id)
      )
      if (founded.length > 0) {
        founded.forEach((e) => {
          numEvidenc += 1
          totalEvidence += e.qualification
        })
        avgQualify = totalEvidence / numEvidenc
        qualifySubindicator += avgQualify
      }
    })

    subindcatorBD.score = qualifySubindicator
    subindcatorBD.totalScore = scoreSubindicator

    const total = subindcatorBD.totalScore
    const percent = subindcatorBD.score / total

    if (percent >= 0.9) {
      subindcatorBD.qualification = 3
    } else if (percent > 0.5) {
      subindcatorBD.qualification = 2
    } else if (percent > 0.2) {
      subindcatorBD.qualification = 1
    } else {
      subindcatorBD.qualification = 0
    }
    return subindcatorBD
  }

  // controllers/evidence.js autoQualifySubindicator (lineas ~343-405).
  // Algoritmo DISTINTO al anterior: cuenta existencia de evidencia por
  // caracteristica, considera caracteristicas criticas (tier > 1) y aplica
  // umbrales propios. Lee arrayCharacteristics desde subindcatorBD.typeID.
  autoQualifySubindicator<
    T extends SubindicatorLike & {
      typeID: { characteristics: CharacteristicLike[] }
    }
  >(subindcatorBD: T): T {
    const arrayCharacteristics = subindcatorBD.typeID.characteristics
    // red
    const existEvidence: boolean[] = []
    // yellow
    const existEvidenceCritic: boolean[] = []
    const arrayEvidences = subindcatorBD.evidences
    let qualifySubindicator = 0
    let scoreSubindicator = 0
    arrayCharacteristics.forEach((characteristic) => {
      const total = characteristic.score
      scoreSubindicator += total
      const founded = arrayEvidences.filter((evidence) =>
        evidence.characteristicID.equals(characteristic._id)
      )
      // comprobar si existe evidencia para c/u caracteristica
      if (founded.length > 0) {
        existEvidence.push(true)
        let sum = 0
        founded.forEach((evidence) => {
          sum += evidence.qualification
        })
        const qualify = sum / total
        qualifySubindicator += qualify
      } else {
        existEvidence.push(false)
      }
      // comprobar si falta evidencia para una caracteristica critica
      if (characteristic.tier > 1 && founded.length === 0) {
        existEvidenceCritic.push(false)
      } else {
        // si la caracteristica no es critica o no hay evidencia
        existEvidenceCritic.push(true)
      }
    })
    subindcatorBD.score = qualifySubindicator
    subindcatorBD.totalScore = scoreSubindicator

    const count = existEvidence.reduce(
      (acc, curr) => {
        if (curr) {
          acc.trueCount++
        } else {
          acc.falseCount++
        }
        return acc
      },
      { trueCount: 0, falseCount: 0 }
    )
    const total = arrayCharacteristics.length
    const percent = count.trueCount / total
    // Si existen todas las evidencias = verde
    if (!existEvidence.includes(false)) {
      subindcatorBD.qualification = 3
      // Si hay mas del 50% de evidencias = yellow
    } else if (count.trueCount > count.falseCount) {
      subindcatorBD.qualification = 2
      // Si falta una evidencia critica || hay mas del 10% pero menos del 50% = rojo
    } else if (
      existEvidenceCritic.includes(false) ||
      (percent > 0.1 && percent <= 0.5)
    ) {
      subindcatorBD.qualification = 1
    } else {
      subindcatorBD.qualification = 0
    }
    return subindcatorBD
  }

  // utils/middleware.js updateIndicator (lineas ~132-210).
  // Cuenta subindicadores por calificacion, aplica reglas, setea
  // lastUpdate/lastUpdateBy, lee gad por req.get('tenant') y si publishAuto
  // pone state=true, y PERSISTE con { ...indicator, autoQualification }.
  async updateIndicator(
    subindicator: SubindicatorLike,
    req: Request
  ): Promise<unknown> {
    // Convertir el indicadorID a una cadena
    const indicadorID = String(subindicator.indicadorID)

    // Buscar el indicador por su ID y poblar los subindicadores
    const indicator = (await indicatorInstanceRepository.findById(
      indicadorID,
      { populate: { path: 'subindicators' } }
    )) as unknown as IndicatorLike

    const arraySubindicators = indicator.subindicators

    // Variables auxiliares para contar los subindicadores por calificacion
    let count1 = 0
    let count2 = 0
    let count3 = 0

    arraySubindicators.forEach((sub) => {
      if (sub.qualification === 1) {
        count1++
      } else if (sub.qualification === 2) {
        count2++
      } else if (sub.qualification === 3) {
        count3++
      }
    })

    const numberEvaluated = count1 + count2 + count3
    let qualification = 0
    if (count1 > 0) {
      indicator.qualification = 1
      qualification = 1
    } else if (count2 > 0 && numberEvaluated > arraySubindicators.length / 2) {
      indicator.qualification = 2
      qualification = 2
    } else if (count3 === arraySubindicators.length && count3 > 4) {
      indicator.qualification = 3
      qualification = 3
    } else if (count3 > arraySubindicators.length / 2) {
      indicator.qualification = 2
      qualification = 2
    } else if (numberEvaluated > 0) {
      indicator.qualification = 1
      qualification = 1
    } else {
      indicator.qualification = 0
      qualification = 0
    }
    indicator.lastUpdate = new Date()
    indicator.lastUpdateBy = subindicator.lastUpdateBy
    const gadID = req.get('tenant') as string
    const gadBD = (await gadRepository.findById(gadID)) as unknown as {
      publishAuto: boolean
    }
    if (gadBD.publishAuto) {
      indicator.state = true
    }
    const indicatorUpdated = await indicatorInstanceRepository.updateById(
      indicadorID,
      { ...indicator, autoQualification: qualification } as Record<
        string,
        unknown
      >,
      { new: true }
    )
    return indicatorUpdated
  }

  // controllers/evidence.js autoQualificationIndicator (lineas ~286-342).
  // Similar a updateIndicator PERO solo muta y devuelve el indicator: NO
  // persiste ni toca gad/publishAuto.
  autoQualificationIndicator<T extends IndicatorLike>(indicator: T): T {
    const arraySubindicators = indicator.subindicators

    let count1 = 0
    let count2 = 0
    let count3 = 0

    arraySubindicators.forEach((subindicator) => {
      if (subindicator.qualification === 1) {
        count1++
      } else if (subindicator.qualification === 2) {
        count2++
      } else if (subindicator.qualification === 3) {
        count3++
      }
    })

    const numberEvaluated = count1 + count2 + count3
    let qualification = 0
    if (count1 > 0) {
      indicator.qualification = 1
      qualification = 1
    } else if (count2 > 0 && numberEvaluated > arraySubindicators.length / 2) {
      indicator.qualification = 2
      qualification = 2
    } else if (count3 === arraySubindicators.length && count3 > 4) {
      indicator.qualification = 3
      qualification = 3
    } else if (count3 > arraySubindicators.length / 2) {
      indicator.qualification = 2
      qualification = 2
    } else if (numberEvaluated > 0) {
      indicator.qualification = 1
      qualification = 1
    } else {
      indicator.qualification = 0
      qualification = 0
    }
    // El legacy descarta `qualification` aqui (solo lo usaba para console.log);
    // la mutacion relevante es indicator.qualification. Se referencia para
    // mantener el flujo identico sin emitir logs.
    void qualification
    return indicator
  }
}

export const qualificationService = new QualificationService()
export default qualificationService
