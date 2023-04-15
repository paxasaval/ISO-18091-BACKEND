const evidenveRouter = require('express').Router()
const Evidenve = require('../models/evidence')

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
evidenveRouter.post('/',(req,res,next) => {
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
  evidenve.save()
    .then(savedevidenve => savedevidenve.toJSON())
    .then(savedAndFormattedevidenve => res.json(savedAndFormattedevidenve))
    .catch(error => next(error))
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