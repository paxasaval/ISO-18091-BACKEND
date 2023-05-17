const evidenveRouter = require('express').Router()
const Evidenve = require('../models/evidence')
//const { default: mongoose } = require('mongoose')
const Subindicator = require('../models/subindicator')
const jwt = require('jsonwebtoken')
const { getTokenFrom } = require('../utils/middleware')
const Rol = require('../models/rol')
const IndicatorInstance = require('../models/indicatorInstance')
const  mongoose  = require('mongoose')
const Commit = require('../models/commit')
const evidence = require('../models/evidence')
const ROL_ADMIN = process.env.ROL_ADMIN
//const ROL_REPONSIBLE = process.env.ROL_REPONSIBLE
const ROL_USER = process.env.ROL_USER

evidenveRouter.get('/',(req,res,next) => {
  Evidenve.find({})
    .then(evidenves => {
      res.json(evidenves)
    })
    .catch(error => next(error))
})

evidenveRouter.get('/:id',async(req,res,next) => {
  try {
    const id = req.params.id
    const evidence = await Evidenve.findById(id)
      .populate('author')
      .populate('characteristicID')
      .populate('subIndicatorID')
      .populate('commits')
    if(evidence){
      return res.status(200).json(evidence)
    }else{
      return res.status(404).end()
    }
  } catch (error) {
    next(error)
  }

})

evidenveRouter.delete('/:id',(req,res,next) => {
  const id = req.params.id
  Evidenve.findByIdAndDelete(id)
    .then(() => {
      res.status(204).end()
    })
    .catch(error => next(error))
})
evidenveRouter.post('/',async (req,res,next) => {
  try {
    const body = req.body
    //Authorizaction
    const token = getTokenFrom(req)
    const decodedToken = jwt.verify(token,process.env.SECRET)
    if(!token||!decodedToken){
      return res.status(401).json({ error: 'token missing or invalid' })
    }else{
      const rolID = decodedToken.rol
      const user = decodedToken.id
      const rol = await Rol.findById(rolID)
      if(!rol){
        return res.status(401).json({ error: 'rol missing or invalid' })
      }else if(rol.name===ROL_USER){
        return res.status(401).json({ error: 'unauthorized rol' })
      }
      //end-authorization
      if(body.name===undefined){
        res.status(400).json({ error:'name missing' })
      }
      const evidenve = new Evidenve({
        characteristicID:body.characteristicID,
        subIndicatorID:body.subIndicatorID,
        name:body.name,
        link:body.link,
        note:body.note,
        state:true,
        verified:body.verified || false,
        qualification:body.qualification||0,
        author: new mongoose.Types.ObjectId(user),
        commits:[]
      })
      const savedEvidence = await evidenve.save()//tenemos lal evidencia guardada
      const updatedSubindicator = await updateSubindicator(savedEvidence)//actualizamos el subindidicador
      console.log(updatedSubindicator)
      const savedAndFormattedevidenve = savedEvidence.toJSON()
      res.json(savedAndFormattedevidenve)
    }
  } catch (error) {
    next(error)
  }


})
evidenveRouter.put('/qualify/:id',async(req,res,next) => {
  try {
    //Authorizaction
    const token = getTokenFrom(req)
    const decodedToken = jwt.verify(token,process.env.SECRET)
    if(!token||!decodedToken){
      return res.status(401).json({ error: 'token missing or invalid' })
    }else{
      const rolID = decodedToken.rol
      const user = decodedToken.id
      const rol = await Rol.findById(rolID)
      if(!rol){
        return res.status(401).json({ error: 'rol missing or invalid' })
      }else if(rol.name!==ROL_ADMIN){
        return res.status(401).json({ error: 'unauthorized rol' })
      }
      //end-authorization

      const body = req.body
      const id = req.params.id
      if(!id && !body.qualification){
        return res.status(400).json({ error:'missing id or qualification' })
      }
      console.log('asdasd')

      let evidenve = {
        verified:true,
        qualification:body.qualification,
        qualificationBy:user,
        qualificationDate:new Date(),
      }
      console.log('asdasd')
      const evidenceCurrent = await Evidenve.findById(id)
      if(body.commit){
        const comit = new Commit({
          autor:user,
          body:body.commit,
          created:new Date(),
          lastUpdate:new Date()
        })
        const commitSave = await comit.save()
        const newCommit = evidenceCurrent.commits.concat(commitSave._id)
        console.log('comentario creado:',newCommit)
        evidence.commits=newCommit
      }
      console.log(evidence)
      const updateEvidence = await Evidenve.findByIdAndUpdate(id,evidenve,{ new:true })
      const updateSubindicator = await Subindicator.findByIdAndUpdate(updateEvidence.subIndicatorID,{ lastUpdate:new Date() },{ new:true })
      console.log(updateSubindicator)
      return res.json(updateEvidence)
    }
  } catch (error) {
    next(error)
  }

})
evidenveRouter.put('/:id',(req,res,next) => {
  const body = req.body
  const id = req.params.id
  const evidenve = {
    name:body.name,
    characteristicID:body.characteristicID,
    subIndicatorID:body.subIndicatorID,
    link:body.link,
    verified:body.verified || false,
    note:body.note,
    commits:[]
  }
  Evidenve.findByIdAndUpdate(id,evidenve,{ new:true })
    .then(updateEvidenve => {
      res.json(updateEvidenve)
    })
    .catch(error => next(error))
})
module.exports = evidenveRouter

const updateSubindicator = async(evidence) => {
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

  //red
  let existEvidence = []
  //yellow
  let existEvidenceCritic = []
  subindcatorBD.evidences = subindcatorBD.evidences.concat(evidence)
  const arrayEvidences = subindcatorBD.evidences
  arrayCharacteristics.forEach(characteristic => {
    const founded = arrayEvidences.filter(evidence => evidence.characteristicID.equals(characteristic._id))
    //console.log(founded)
    //comprobar si existe evidencia para c/u caracteristica
    if(founded.length>0){
      existEvidence.push(true)
    }else{
      existEvidence.push(false)
    }
    //comprobar si falta evidencia para una caracteristica critica
    if((characteristic.tier>1 && founded.length===0) ){
      existEvidenceCritic.push(false)
    }else{
      //si la caracteristica no es critica o no hay evidencia
      existEvidenceCritic.push(true)
    }
  })
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
  //Si existen todas las evidencias = verde
  if(!existEvidence.includes(false)){
    subindcatorBD.qualification=3
  //Si hay mas del 50% de evidencias = yellow
  }else if(count.trueCount>count.falseCount){
    subindcatorBD.qualification=2
    //Si falta una evidencia critica || hay mas del 10% de evidencias pero menos del 50% = rojo
  }else if(existEvidenceCritic.includes(false)|| (percent>0.1 && percent<=0.5)){
    subindcatorBD.qualification=1
  }else {
    subindcatorBD.qualification=0
  }
  subindcatorBD.lastUpdate = new Date()
  subindcatorBD.lastUpdateBy = evidence.author//el ultimo oque registro evidencia
  const subindicatorUpdate = await Subindicator.findByIdAndUpdate(subindcatorBD.id,subindcatorBD,{ new:true })//hemos actualizado y recalificado el suubindicador
  console.log('2',subindicatorUpdate)
  const indicatorUpdated = await updateIndicator(subindicatorUpdate)//ahora actualizamos el indicador
  return indicatorUpdated
}
const updateIndicator = async (subindicator) => {
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

  // Actualizar y retornar el indicador actualizado
  const indicatorUpdated = await IndicatorInstance.findByIdAndUpdate(
    indicadorID,
    { ...indicator,autoQualification:qualification },
    { new: true }
  )

  return indicatorUpdated
}

