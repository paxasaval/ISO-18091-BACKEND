const indicatorRouter = require('express').Router()
const { default: mongoose } = require('mongoose')
const Indicator = require('../models/indicator')

indicatorRouter.get('/',(req,res,next) => {
  console.log(req.query)
  if(Object.entries(req.query).length === 0){
    Indicator.find({})
      .populate('ods')
      .then(indicators => {
        res.json(indicators)
      })
      .catch(error => next(error))
  }else{
    const quadrant = Number(req.query.quadrant)
    console.log(req.query)
    Indicator.find({ quadrant:quadrant })
      .populate('ods')
      .sort('number')
      .then(indicators => {
        res.json(indicators)
      })
      .catch(error => next(error))
  }
})

indicatorRouter.get('/:id',(req,res,next) => {
  const id = req.params.id
  Indicator.findById(id)
    .populate('ods')
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
  console.log('ods')
  console.log(body.ods)
  const arrayODS = body.ods.map( ods => {
    console.log(ods)
    return new mongoose.Types.ObjectId(ods)
  })
  const indicator = new Indicator({
    name:body.name,
    description:body.description,
    number:body.number,
    quadrant:body.quadrant,
    quadrantName:body.quadrantName,
    red:body.red,
    yellow:body.yellow,
    green:body.green,
    ods:arrayODS
  })
  indicator.save()
    .then(savedIndicator => savedIndicator.toJSON())
    .then(savedAndFormattedIndicator => res.json(savedAndFormattedIndicator))
    .catch(error => next(error))
})
indicatorRouter.put('/:id',(req,res,next) => {
  const body = req.body
  const id = req.params.id
  const arrayODS = body.ods.map( ods => mongoose.Types.ObjectId(ods))
  const indicator = {
    name:body.name,
    description:body.description,
    number:body.number,
    quadrant:body.quadrant,
    quadrantName:body.quadrantName,
    red:body.red,
    yellow:body.yellow,
    green:body.green,
    ods:arrayODS
  }
  Indicator.findByIdAndUpdate(id,indicator,{ new:true })
    .then(updateIndicator => {
      res.json(updateIndicator)
    })
    .catch(error => next(error))
})
module.exports = indicatorRouter