const indicatorInstanceRouter = require('express').Router()
const { default: mongoose } = require('mongoose')
const IndicatorInstance = require('../models/indicatorInstance')
const Indicator = require('../models/indicator')
const Subindicator = require('../models/subindicator')
const Type = require('../models/type')



indicatorInstanceRouter.get('/',(req,res,next) => {
  if(!req.query){
    IndicatorInstance.find({})
      .then(indicators => {
        res.json(indicators)
      })
      .catch(error => next(error))
  }else{
    const quadrant = Number(req.query.quadrant)
    console.log(req.query)
    IndicatorInstance.find({ quadrant:quadrant }).sort('number')
      .then(indicators => {
        res.json(indicators)
      })
      .catch(error => next(error))
  }
})

indicatorInstanceRouter.get('/:id',(req,res,next) => {
  const id = req.params.id
  IndicatorInstance.findById(id)
    .then(indicator => {
      if(indicator){
        res.json(indicator)
      }else{
        res.status(404).end()
      }
    })
    .catch(error => next(error))
})

indicatorInstanceRouter.delete('/:id',(req,res,next) => {
  const id = req.params.id
  IndicatorInstance.findByIdAndDelete(id)
    .then(() => {
      res.status(204).end()
    })
    .catch(error => next(error))
})
indicatorInstanceRouter.post('/',(req,res,next) => {
  const body = req.body
  if(body.name===undefined){
    res.status(400).json({ error:'name missing' })
  }
  const arraySubindicators = body.subindicators.map(subindicator => mongoose.Types.ObjectId(subindicator))
  const indicator = new IndicatorInstance({
    indicatorID:mongoose.Types.ObjectId(body.indicatorID),
    qualification:body.qualification,
    create: Date.now(),
    period: body.period,
    createdBy: mongoose.Types.ObjectId(body.createdBy),
    lastUpdate: Date.now(),
    subindicators: arraySubindicators
  })
  indicator.save()
    .then(savedIndicator => savedIndicator.toJSON())
    .then(savedAndFormattedIndicator => res.json(savedAndFormattedIndicator))
    .catch(error => next(error))
})
indicatorInstanceRouter.post('/newPeriod',(req,res,next) => {
  const body = req.body
  if(body.period===undefined){
    res.status(400).json({ error:'period missing' })
  }
  Type.find({ mandatory:true })
    .then(types => {
      let arraySubindicator = types.map(type => {
        let newSubindicator = new Subindicator({
          typeID:type.id,
          name:type.name,
          responsible:'Administracion General',
          qualification:0,
          created:Date.now(),
          createdBy:mongoose.Types.ObjectId(body.createdBy),
          lastUpdate:Date.now(),
          commits: [],
          evidences:[]
        })
        return newSubindicator
      })
      Indicator.find({})
        .then(indicators => {
          indicators.map(indicator => {
            let newIndicadorInstance = new IndicatorInstance({
              indicatorID:mongoose.Types.ObjectId(indicator.id),
              qualification:0,
              create: Date.now(),
              period: body.period,
              createdBy: mongoose.Types.ObjectId(body.createdBy),
              lastUpdate: Date.now(),
              subindicators: arraySubindicator
            })
            newIndicadorInstance.save()
              .then(savedIndicator => savedIndicator.toJSON())
              .then(savedAndFormattedIndicator => res.json(savedAndFormattedIndicator))
              .catch(error => next(error))
          })
        })
    })

})
indicatorInstanceRouter.put('/:id',(req,res,next) => {
  const body = req.body
  const id = req.params.id
  const arraySubindicators = body.subindicators.map( subindicator => mongoose.Types.ObjectId(subindicator))
  const indicator = {
    qualification:body.qualification,
    lastUpdate: Date.now(),
    subindicators: arraySubindicators
  }
  IndicatorInstance.findByIdAndUpdate(id,indicator,{ new:true })
    .then(updateIndicator => {
      res.json(updateIndicator)
    })
    .catch(error => next(error))
})
module.exports = indicatorInstanceRouter