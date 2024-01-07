const logger = require('./logger')
const Subindicator = require('../models/subindicator')
const IndicatorInstance = require('../models/indicatorInstance')
const Indicator = require('../models/indicator')
const Evidence = require('../models/evidence')
const gad = require('../models/gad')
const User = require('../models/users')
const Notify = require('../models/notifications')
const { ROL_ADMIN } = require('../utils/config')

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

  //let existEvidence = []
  //let existEvidenceCritic = []
  subindcatorBD.evidences = subindcatorBD.evidences.concat(evidence)//agregamos la nueva evidencia
  const subindcatorQualify = qualifySubindicator(subindcatorBD,arrayCharacteristics)
  //console.log(req)
  const gadID = req.get('tenant')
  const gadBD = await gad.findById(gadID)
  if(gadBD.publishAuto){
    subindcatorQualify.state = true
  }
  subindcatorQualify.lastUpdate = new Date()
  subindcatorQualify.lastUpdateBy = evidence.author//el ultimo oque registro evidencia
  const subindicatorUpdate = await Subindicator.findByIdAndUpdate(subindcatorQualify.id,subindcatorQualify,{ new:true })//hemos actualizado y recalificado el suubindicador
  //console.log('2',subindicatorUpdate)

  const indicatorUpdated = await updateIndicator(subindicatorUpdate,req)//ahora actualizamos el indicador
  return indicatorUpdated
}

const qualifySubindicator = (subindcatorBD,arrayCharacteristics) => {
  const arrayEvidences = subindcatorBD.evidences
  let qualifySubindicator = 0
  let scoreSubindicator = 0
  arrayCharacteristics.forEach(characteristic => {
    const total = characteristic.score//cambiar por el total de valuation
    scoreSubindicator+=total
    let avgQualify = 0
    let numEvidenc = 0
    let totalEvidence = 0
    const founded = arrayEvidences.filter(evidence => evidence.characteristicID.equals(characteristic._id))
    if (founded.length>0){
      founded.forEach((e) => {
        numEvidenc+=1
        totalEvidence+=e.qualification
      })
      avgQualify=totalEvidence/numEvidenc
      qualifySubindicator+=avgQualify
    }

  })

  subindcatorBD.score=qualifySubindicator
  subindcatorBD.totalScore=scoreSubindicator

  const total = subindcatorBD.totalScore
  const percent = subindcatorBD.score/total
  console.log(percent,'/',total)

  //Si existen todas las evidencias = verde Y ha sido planedo Y ha sido diagnosticado
  if(percent>=0.9){
    subindcatorBD.qualification=3
  //Si hay mas del 50% de evidencias = yellow Y has sido planeado o diagnosticado
  }else if(percent>0.5){
    subindcatorBD.qualification=2

    //Si falta una evidencia critica || hay mas de  l 10% de evidencias pero menos del 50% = rojo
  }else if(percent>0.2){
    subindcatorBD.qualification=1

  }else {
    subindcatorBD.qualification=0

  }
  return subindcatorBD
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
    //console.log('1')
  //si tengo un amarillo y numero de ealuador es mayor a la mitad de suubindicadores estas en amarillo
  } else if (count2 > 0 && numberEvaluated > arraySubindicators.length / 2) {
    indicator.qualification = 2
    qualification=2
    //console.log('2')
  //si tengo todas en verde esta en verde el indicador
  } else if (count3 === arraySubindicators.length && count3>4) {
    indicator.qualification = 3
    qualification=3
    //console.log('3')
  //si tengo mas de la mitad en verde estas en amarillo
  }else if (count3>arraySubindicators.length/2){
    indicator.qualification = 2
    qualification=2
    //console.log('2')
  //si numero de evualos es mayor 0 estas en rojo
  } else if (numberEvaluated > 0) {
    indicator.qualification = 1
    qualification=1
    //console.log('1')
    //console.log('check')
  //si no ningun subindicador evaluado estas en gris
  } else {
    indicator.qualification = 0
    qualification=0
  }
  // Actualizar la fecha y el responsable de la última actualización
  indicator.lastUpdate = new Date()
  indicator.lastUpdateBy = subindicator.lastUpdateBy
  //console.log(req)
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

const updateSubindicator2 = async(evidence,req) => {
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
  const subindcatorQualify = qualifySubindicator(subindcatorBD,arrayCharacteristics)
  const gadID = req.get('tenant')
  const gadBD = await gad.findById(gadID)
  if(gadBD.publishAuto){
    subindcatorQualify.state = true
  }
  subindcatorQualify.lastUpdate = new Date()
  subindcatorQualify.lastUpdateBy = evidence.author//el ultimo oque registro evidencia
  const subindicatorUpdate = await Subindicator.findByIdAndUpdate(subindcatorQualify.id,subindcatorQualify,{ new:true })//hemos actualizado y recalificado el suubindicador
  //console.log('2',subindicatorUpdate)
  const indicatorUpdated = await updateIndicator(subindicatorUpdate,req)//ahora actualizamos el indicador
  return indicatorUpdated
}

const notify = async(type,from,itemType,itemID,req) => {
  //Primero identificamos el tipo de notificacion
  console.log('Empieza notificacion')
  let finalContent = ''
  if(type===1){
    finalContent+= 'Se agrego un nuevo elemento de tipo '
  }
  if(type===2){
    finalContent+= 'Se ha modificado el elemento de tipo '
  }
  if(type===3){
    finalContent+= 'Se eliminado el elemento de tipo '
  }
  //Segundo identificamos el tipo
  if(itemType===1){
    console.log('Notificando operacion sobre indicador...')
    const item = await IndicatorInstance.findById(itemID).populate('Indicator').populate('gadID')
    finalContent+=`Indicadaor ${item.indicatorID.quadrant}.${item.indicatorID.number} ${item.indicatorID.name} del periodo ${item.year}`
    const admin = await User.find({ gadID:item.gadID._id,rol:ROL_ADMIN })
    for (const user of admin) {
      const newNotify = new Notify({
        from: from,
        sendTo: user,
        content: finalContent,
        type: type,
        state: 1,
        date: new Date(),
        itemID: itemID,
        itemType: 1
      })
      console.log(newNotify)
      await newNotify.save()
      console.log('Notificacion enviada')
      console.log(finalContent)
    }
  }
  if(itemType===2){
    console.log('Notificando operacion sobre subindicador...')
    const item = await Subindicator.findById(itemID).populate({ path:'indicadorID',populate:[{ path:'gadID' },{ path:'period' }] })
    const indicadorID = item.indicadorID
    //console.log(indicadorID.indicatorID)
    const indicatorCatalog = await Indicator.findById(indicadorID.indicatorID)
    //console.log('indicador:',indicatorCatalog)
    finalContent+=`Subindicador ${item.name} en el indicador ${indicatorCatalog.name} periodo ${indicadorID.year}  `
    const admin = await User.find({ gadID:indicadorID.gadID._id,rol:ROL_ADMIN })
    for (const user of admin) {
      const newNotify = new Notify({
        from: from,
        sendTo: user,
        content: finalContent,
        type: type,
        state: 1,
        date: new Date(),
        itemID: itemID,
        itemType: 2
      })
      console.log(newNotify)
      await newNotify.save()
      console.log('Notificacion enviada')
    }
  }
  if(itemType===3){
    console.log('Notificando operacion sobre evidencia...')
    const item = await Evidence.findById(itemID).populate('subIndicatorID')
    finalContent+=`Evidencia ${item.name} del subindicador ${item.subIndicatorID.name} `
    const indicadorID = await IndicatorInstance.findById(item.subIndicatorID.indicadorID)
    finalContent+=`(${itemID})`
    //verificar si esta calificada
    if(item.verified){
      //Verificar si es por calificacion
      if(from===item.qualificationBy){
        const user = await User.findById(item.qualificationBy)
        finalContent=`Se ha calificado la evidencia ${item.name} por el usuario ${user.name}`
        const newNotify = new Notify({
          from: from,
          sendTo: item.author,
          content: finalContent,
          type: type,
          state: 1,
          date: new Date(),
          itemID: itemID,
          itemType: 3
        })
        console.log(newNotify)
        await newNotify.save()
      }else{
        const newNotify = new Notify({
          from: from,
          sendTo: item.qualificationBy,
          content: finalContent,
          type: type,
          state: 1,
          date: new Date(),
          itemID: itemID,
          itemType: 3
        })
        console.log(newNotify)
        await newNotify.save()
      }
    }else{
      const admin = await User.find({ gadID:indicadorID.gadID._id,rol:ROL_ADMIN })
      for (const user of admin) {
        const newNotify = new Notify({
          from: from,
          sendTo: user,
          content: finalContent,
          type: type,
          state: 1,
          date: new Date(),
          itemID: itemID,
          itemType: 3
        })
        console.log(newNotify)
        await newNotify.save()
        console.log('Notificacion enviada')
      }
    }

  }
  console.log(finalContent)
}
module.exports = {
  requestLogger,
  unknownEndpoint,
  errorHandler,
  getTokenFrom,
  updateSubindicator,
  updateSubindicator2,
  notify
}