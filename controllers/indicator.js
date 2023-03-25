const indicatorRouter = require('express').Router()
const Indicator = require('../models/indicador')

indicatorRouter.get('/',(req,res,next) => {
  Indicator.find({})
    .then(indicators => {
      res.json(indicators)
    })
    .catch(error => next(error))
})

indicatorRouter.get('/:id',(req,res,next) => {
  const id = req.params.id
  Indicator.findById(id)
    .then(indicator => {
      if(indicator){
        res.json(indicator)
      }else{
        res.status(404).end()
      }
    })
    .catch(error => next(error))
})

indicatorRouter.delete('/:id',(req,res,next) => {
  const id = req.params.id
  Indicator.findByIdAndDelete(id)
    .then(() => {
      res.status(204).end()
    })
    .catch(error => next(error))
})
indicatorRouter.post('/',(req,res,next) => {
  const body = req.body
  if(body.name===undefined){
    res.status(400).json({ error:'name missing' })
  }
  const indicator = new Indicator({
    name:body.name,
    description:body.description,
    number:body.number,
    quadrant:body.quadrant,
    quadrantName:body.quadrantName,
    red:body.red,
    yellow:body.yellow,
    green:body.green,
    qualification: body.qualification || 0,
    ods:body.ods
  })
  indicator.save()
    .then(savedIndicator => savedIndicator.toJSON())
    .then(savedAndFormattedIndicator => res.json(savedAndFormattedIndicator))
    .catch(error => next(error))
})
indicatorRouter.put('/:id',(req,res,next) => {
  const body = req.body
  const id = req.params.id
  const indicator = {
    name:body.name,
    description:body.description,
    number:body.number,
    quadrant:body.quadrant,
    quadrantName:body.quadrantName,
    red:body.red,
    yellow:body.yellow,
    green:body.green,
    qualification: body.qualification || 0,
    ods:body.ods
  }
  Indicator.findByIdAndUpdate(id,indicator,{ new:true })
    .then(updateIndicator => {
      res.json(updateIndicator)
    })
    .catch(error => next(error))
})
module.exports = indicatorRouter