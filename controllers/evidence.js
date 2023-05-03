const evidenveRouter = require('express').Router()
const Evidenve = require('../models/evidence')
//const { default: mongoose } = require('mongoose')
const Subindicator = require('../models/subindicator')
const jwt = require('jsonwebtoken')
const { getTokenFrom } = require('../utils/middleware')
const Rol = require('../models/rol')

//const ROL_ADMIN = process.env.ROL_ADMIN
//const ROL_REPONSIBLE = process.env.ROL_REPONSIBLE
const ROL_USER = process.env.ROL_USER


evidenveRouter.get('/',(req,res,next) => {
  Evidenve.find({})
    .then(evidenves => {
      res.json(evidenves)
    })
    .catch(error => next(error))
})

evidenveRouter.get('/:id',(req,res,next) => {
  const id = req.params.id
  Evidenve.findById(id)
    .then(evidenve => {
      if(evidenve){
        res.json(evidenve)
      }else{
        res.status(404).end()
      }
    })
    .catch(error => next(error))
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
      const rol = await Rol.findById(rolID)
      if(!rol){
        return res.status(401).json({ error: 'rol missing or invalid' })
      }else if(rol.name===ROL_USER){
        return res.status(401).json({ error: 'unauthorized rol' })
      }
    }
    //end-authorization
    if(body.name===undefined){
      res.status(400).json({ error:'name missing' })
    }
    const evidenve = new Evidenve({
      name:body.name,
      characteristicID:body.characteristicID,
      subIndicatorID:body.subIndicatorID,
      link:body.link,
      verified:body.verified || false,
      note:body.note,
    })
    const savedEvidence = await evidenve.save()
    await updateSubindicator(savedEvidence)
    //console.log(updatedSubindicator)
    const savedAndFormattedevidenve = savedEvidence.toJSON()
    res.json(savedAndFormattedevidenve)
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
  //console.log(subindcator)
  //const arrayEvidences = subindcator.evidences
  //arrayEvidences.push(evidence)
  subindcator.evidences = subindcator.evidences.concat(evidence)
  const subindicatorUpdate = await Subindicator.findByIdAndUpdate(subindcator.id,subindcator,{ new:true })
  //console.log(subindicatorUpdate)
  return subindicatorUpdate
}