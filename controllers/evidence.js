const evidenveRouter = require('express').Router()
const Evidenve = require('../models/evidence')
//const { default: mongoose } = require('mongoose')
const Subindicator = require('../models/subindicator')

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
    const updatedSubindicator = await updateSubindicator(savedEvidence)
    console.log(updatedSubindicator)
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
  console.log(subindcator)
  const arrayEvidences = subindcator.evidences
  arrayEvidences.push(evidence)
  subindcator.evidences = arrayEvidences
  const subindicatorUpdate = await Subindicator.findByIdAndUpdate(subindcator.id,subindcator,{ new:true })
  console.log(subindicatorUpdate)
  return subindicatorUpdate
}