const subIndicatorRouter = require('express').Router()
const SubIndicator = require('../models/subindicador')

subIndicatorRouter.get('/',(req,res,next) => {
  SubIndicator.find({})
    .then(subIndicators => {
      res.json(subIndicators)
    })
    .catch(error => next(error))
})

subIndicatorRouter.get('/:id',(req,res,next) => {
  const id = req.params.id
  SubIndicator.findById(id)
    .then(subIndicator => {
      if(subIndicator){
        res.json(subIndicator)
      }else{
        res.status(404).end()
      }
    })
    .catch(error => next(error))
})

subIndicatorRouter.delete('/:id',(req,res,next) => {
  const id = req.params.id
  SubIndicator.findByIdAndDelete(id)
    .then(() => {
      res.status(204).end()
    })
    .catch(error => next(error))
})
subIndicatorRouter.post('/',(req,res,next) => {
  const body = req.body
  if(body.name===undefined){
    res.status(400).json({ error:'name missing' })
  }
  const subIndicator = new SubIndicator({
    name:body.name,
    indicadorID:body.indicadorID,
    responsible:body.responsible,
    typeID:body.typeID,
    qualification:body.qualification
  })
  subIndicator.save()
    .then(savedSubIndicator => savedSubIndicator.toJSON())
    .then(savedAndFormattedSubIndicator => res.json(savedAndFormattedSubIndicator))
    .catch(error => next(error))
})
subIndicatorRouter.put('/:id',(req,res,next) => {
  const body = req.body
  const id = req.params.id
  const subIndicator = {
    name:body.name,
    indicadorID:body.indicadorID,
    responsible:body.responsible,
    typeID:body.typeID,
    qualification:body.qualification
  }
  SubIndicator.findByIdAndUpdate(id,subIndicator,{ new:true })
    .then(updateSubIndicator => {
      res.json(updateSubIndicator)
    })
    .catch(error => next(error))
})
module.exports = subIndicatorRouter