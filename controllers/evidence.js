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
        verified:body.verified || false,
        qualification:body.qualification||0,
        author: new mongoose.Types.ObjectId(user),
        commits:[]
      })
      const savedEvidence = await evidenve.save()
      const updatedSubindicator = await updateSubindicator(savedEvidence)
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
  const subindcator = await Subindicator.findById(subindicatorID)
    .populate({
      path:'evidences'
    })
    .populate({
      path:'typeID',
      populate:{
        path:'characteristics'
      }
    })
  const arrayCharacteristics = subindcator.typeID.characteristics

  //red
  let existEvidence = []
  //yellow
  let existEvidenceCritic = []
  subindcator.evidences = subindcator.evidences.concat(evidence)
  const arrayEvidences = subindcator.evidences
  arrayCharacteristics.forEach(characteristic => {
    const founded = arrayEvidences.filter(evidence => evidence.characteristicID.equals(characteristic._id))
    console.log(founded)
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
  console.log(existEvidence)
  //Si existen todas las evidencias = verde
  if(!existEvidence.includes(false)){
    subindcator.qualification=3
  //Si hay mas del 50% de evidencias = yellow
  }else if(count.trueCount>count.falseCount){
    subindcator.qualification=2
    //Si falta una evidencia critica || hay mas del 10% de evidencias pero menos del 50% = rojo
  }else if(existEvidenceCritic.includes(false)|| (percent>0.1 && percent<=0.5)){
    subindcator.qualification=1
  }else {
    subindcator.qualification=0
  }
  subindcator.lastUpdate = new Date()
  subindcator.lastUpdateBy = evidence.author
  const subindicatorUpdate = await Subindicator.findByIdAndUpdate(subindcator.id,subindcator,{ new:true })
  console.log('2',subindicatorUpdate)
  const indicatorUpdated = await updateIndicator(subindicatorUpdate)
  return indicatorUpdated
}
const updateIndicator = async(subindicator) => {
  const indicadorID = String(subindicator.indicadorID)
  const indicator = await IndicatorInstance.findById(indicadorID)
    .populate({
      path:'subindicators'
    })
  const arraySubindicators = indicator.subindicators
  const aux1=[]
  const aux2=[]
  const aux3=[]
  arraySubindicators.forEach(subindicator => {
    if(subindicator.qualification===1){
      aux1.push(true)
    }
    if(subindicator.qualification===2){
      aux2.push(true)
    }
    if(subindicator.qualification===3){
      aux3.push(true)
    }
  })
  const number_evaluated = aux1.length+aux2.length+aux3.length
  if(aux1.includes(true)){
    indicator.qualification=1
    console.log('3')
  }else if(aux2.includes(true) && number_evaluated>arraySubindicators.length/2){
    indicator.qualification=2
    console.log('2')
  }else if(aux3.length===arraySubindicators.length){
    indicator.qualification=3
    console.log('3')
  }else if(number_evaluated>0){
    indicator.qualification=1
    console.log('1')
    //console.log('check')
  }else{
    indicator.qualification=0
  }

  indicator.lastUpdate = new Date()
  indicator.lastUpdateBy = subindicator.last

  const indicatorUpdated = IndicatorInstance.findByIdAndUpdate(indicadorID,indicator,{ new:true })
  return indicatorUpdated
}
