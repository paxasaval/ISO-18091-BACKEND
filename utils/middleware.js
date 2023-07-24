const logger = require('./logger')
const Subindicator = require('../models/subindicator')
const IndicatorInstance = require('../models/indicatorInstance')
const gad = require('../models/gad')
const requestLogger = (request, response, next) => {
  logger.info('Method:', request.method)
  logger.info('Path:  ', request.path)
  logger.info('Body:  ', request.body)
  logger.info('Header:',request.header('tenant'))
  logger.info('---')
  next()
}

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

const errorHandler = (error, request, response, next) => {
  logger.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: `malformatted id by ${error.model.modelName}` })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  } else if (error.name ===  'JsonWebTokenError') {
    return response.status(400).json({
      error: 'invalid token'
    })
  } else if (error.name === 'TokenExpiredError') {
    return response.status(401).json({
      error: 'token expired'
    })
  }

  next(error)
}

const getTokenFrom = (req) => {
  const authorization = req.get('authorization')
  if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
    return authorization.substring(7)
  }
  return null
}

const updateSubindicator = async(evidence,req) => {
  const subindicatorID =String(evidence.subIndicatorID)
  const subindcatorBD = await Subindicator.findById(subindicatorID)
    .populate({
      path:'evidences'
    })
    .populate({
      path:'typeID',
      populate:{
        path:'characteristics'
      }
    })
  const arrayCharacteristics = subindcatorBD.typeID.characteristics

  let existEvidence = []
  let existEvidenceCritic = []
  subindcatorBD.evidences = subindcatorBD.evidences.concat(evidence)//agregamos la nueva evidencia
  const arrayEvidences = subindcatorBD.evidences
  let qualifySubindicator = 0
  let scoreSubindicator = 0
  arrayCharacteristics.forEach(characteristic => {
    const total = characteristic.score
    scoreSubindicator+=total
    const founded = arrayEvidences.filter(evidence => evidence.characteristicID.equals(characteristic._id))
    //comprobar si existe evidencia para c/u caracteristica
    if(characteristic.tier>0){
      if(founded.length>0){
        existEvidence.push(true)
        let sum = 0
        founded.forEach(evidence => {
          sum+=evidence.qualification
        })
        const qualify = sum/total
        qualifySubindicator+=qualify
      }else{
        existEvidence.push(false)
      }
    }
    //comprobar si falta evidencia para una caracteristica critica
    if((characteristic.tier>1 && founded.length===0) ){
      existEvidenceCritic.push(false)
    }else{
      //si la caracteristica no es critica o no hay evidencia
      existEvidenceCritic.push(true)
    }
  })
  console.log('score',scoreSubindicator)
  console.log('qualify',qualifySubindicator)
  console.log('evidences',existEvidence)
  subindcatorBD.score=qualifySubindicator
  subindcatorBD.totalScore=scoreSubindicator

  const count = existEvidence.reduce((acc,curr) => {
    if(curr){
      acc.trueCount++
    }else{
      acc.falseCount++
    }
    return acc
  },{ trueCount:0,falseCount:0 })
  const total = arrayCharacteristics.length
  const percent = count.trueCount/total
  //console.log(existEvidence)
  //Si existen todas las evidencias = verde Y ha sido planedo Y ha sido diagnosticado
  if(!existEvidence.includes(false) && ((subindcatorBD.isPlanned && subindcatorBD.isDiagnosed)||(!subindcatorBD.requireCover))){
    console.log('Calificacion:',3)
    subindcatorBD.qualification=3
  //Si hay mas del 50% de evidencias = yellow Y has sido planeado o diagnosticado
  }else if(count.trueCount>=count.falseCount && ((subindcatorBD.isPlanned||subindcatorBD.isDiagnosed)||(!subindcatorBD.requireCover)) ){
    subindcatorBD.qualification=2
    console.log('Calificacion:',2)

    //Si falta una evidencia critica || hay mas de  l 10% de evidencias pero menos del 50% = rojo
  }else if(existEvidenceCritic.includes(false)|| (percent>0.1 && percent<=0.5)){
    subindcatorBD.qualification=1
    console.log('Calificacion:',1)

  }else {
    subindcatorBD.qualification=0
    console.log('Calificacion:',0)

  }
  const gadID = req.get('tenant')
  const gadBD = await gad.findById(gadID)
  if(gadBD.publishAuto){
    subindcatorBD.state = true
  }
  subindcatorBD.lastUpdate = new Date()
  subindcatorBD.lastUpdateBy = evidence.author//el ultimo oque registro evidencia
  const subindicatorUpdate = await Subindicator.findByIdAndUpdate(subindcatorBD.id,subindcatorBD,{ new:true })//hemos actualizado y recalificado el suubindicador
  //console.log('2',subindicatorUpdate)

  const indicatorUpdated = await updateIndicator(subindicatorUpdate,req)//ahora actualizamos el indicador
  return indicatorUpdated
}
const updateIndicator = async (subindicator,req) => {
  // Convertir el indicadorID a una cadena
  const indicadorID = String(subindicator.indicadorID)

  // Buscar el indicador por su ID y poblar los subindicadores
  const indicator = await IndicatorInstance.findById(indicadorID).populate({
    path: 'subindicators',
  })

  const arraySubindicators = indicator.subindicators

  // Variables auxiliares para contar los subindicadores por calificación
  let count1 = 0
  let count2 = 0
  let count3 = 0

  // Iterar sobre los subindicadores y contar las calificaciones
  arraySubindicators.forEach((subindicator) => {
    if (subindicator.qualification === 1) {
      count1++
    } else if (subindicator.qualification === 2) {
      count2++
    } else if (subindicator.qualification === 3) {
      count3++
    }
  })

  // Calcular el número total de subindicadores evaluados
  const numberEvaluated = count1 + count2 + count3
  let qualification=0
  // Actualizar la calificación del indicador según las condiciones
  //si tengo un rojo todo esta en rojo
  if (count1 > 0) {
    indicator.qualification = 1
    qualification=1
    console.log('1')
  //si tengo un amarillo y numero de ealuador es mayor a la mitad de suubindicadores estas en amarillo
  } else if (count2 > 0 && numberEvaluated > arraySubindicators.length / 2) {
    indicator.qualification = 2
    qualification=2
    console.log('2')
  //si tengo todas en verde esta en verde el indicador
  } else if (count3 === arraySubindicators.length && count3>4) {
    indicator.qualification = 3
    qualification=3
    console.log('3')
  //si tengo mas de la mitad en verde estas en amarillo
  }else if (count3>arraySubindicators.length/2){
    indicator.qualification = 2
    qualification=2
    console.log('2')
  //si numero de evualos es mayor 0 estas en rojo
  } else if (numberEvaluated > 0) {
    indicator.qualification = 1
    qualification=1
    console.log('1')
    //console.log('check')
  //si no ningun subindicador evaluado estas en gris
  } else {
    indicator.qualification = 0
    qualification=0
  }

  // Actualizar la fecha y el responsable de la última actualización
  indicator.lastUpdate = new Date()
  indicator.lastUpdateBy = subindicator.lastUpdateBy
  const gadID = req.get('tenant')
  const gadBD = await gad.findById(gadID)
  if(gadBD.publishAuto){
    indicator.state = true
  }
  // Actualizar y retornar el indicador actualizado
  const indicatorUpdated = await IndicatorInstance.findByIdAndUpdate(
    indicadorID,
    { ...indicator,autoQualification:qualification },
    { new: true }
  )

  return indicatorUpdated
}

const updateSubindicator2 = async(evidence) => {
  const subindicatorID =String(evidence.subIndicatorID)
  const subindcatorBD = await Subindicator.findById(subindicatorID)
    .populate({
      path:'evidences'
    })
    .populate({
      path:'typeID',
      populate:{
        path:'characteristics'
      }
    })

  subindcatorBD.lastUpdate = new Date()
  subindcatorBD.lastUpdateBy = evidence.author//el ultimo oque registro evidencia
  const subindicatorUpdate = await Subindicator.findByIdAndUpdate(subindcatorBD.id,subindcatorBD,{ new:true })//hemos actualizado y recalificado el suubindicador
  console.log('2',subindicatorUpdate)
  const indicatorUpdated = await updateIndicator(subindicatorUpdate)//ahora actualizamos el indicador
  return indicatorUpdated
}
module.exports = {
  requestLogger,
  unknownEndpoint,
  errorHandler,
  getTokenFrom,
  updateSubindicator,
  updateSubindicator2
}