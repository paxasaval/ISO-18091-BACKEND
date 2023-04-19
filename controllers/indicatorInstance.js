const indicatorInstanceRouter = require('express').Router()
const { default: mongoose } = require('mongoose')
const IndicatorInstance = require('../models/indicatorInstance')
const Indicator = require('../models/indicator')
const Subindicator = require('../models/subindicator')
const Type = require('../models/type')

indicatorInstanceRouter.get('/',(req,res,next) => {
  if(Object.entries(req.query)===0){
    IndicatorInstance.find({})
      .populate('subindicators')
      .populate('')
      .populate({ path:'subindicators.',model:'' })
      .then(indicators => {
        res.json(indicators)
      })
      .catch(error => next(error))
  }else{
    const quadrant = Number(req.query.quadrant)
    console.log(req.query)
    IndicatorInstance.find({ quadrant:quadrant })
      .populate('subindicators')
      .sort('number')
      .then(indicators => {
        res.json(indicators)
      })
      .catch(error => next(error))
  }
})

indicatorInstanceRouter.get('/:id',(req,res,next) => {
  const id = req.params.id
  IndicatorInstance.findById(id)
    .populate('subindicators')
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

indicatorInstanceRouter.post('/newPeriod',async(req,res,next) => {
  try{
    const body = req.body
    if(body.period===undefined){
      res.status(400).json({ error:'period missing' })
    }
    const types = await Type.find({ mandatory:true })
    const indicators = await Indicator.find()
    const promises = indicators.map(async (indicator) => {
      const instance = new IndicatorInstance({
        indicatorID: new mongoose.Types.ObjectId(indicator.id),
        qualification:0,
        create: new Date(),
        period: body.period,
        createdBy: new mongoose.Types.ObjectId(body.createdBy),
        lastUpdate: new Date(),
        subindicators:[]
      })
      types.forEach( type => {
        const subindicator = new Subindicator({
          typeID: new mongoose.Types.ObjectId(type.id),
          indicadorID:instance._id,
          name:type.name,
          responsible:'Administracion',
          qualification:0,
          created: new Date(),
          lastUpdate:new Date(),
          createdBy:body.createdBy,
          commits:[],
          evidences:[]
        })
        instance.subindicators.push(subindicator._id)
      })
      const savedIndicator = await instance.save()
      const savedAndFormattedIndicator = savedIndicator.toJSON()
      return savedAndFormattedIndicator
    })
    const savedInstances = await Promise.all(promises)
    res.json(savedInstances)
  }catch(error){
    next(error)
  }
})

indicatorInstanceRouter.put('/:id',(req,res,next) => {
  const body = req.body
  const id = req.params.id
  const arraySubindicators = body.subindicators.map( subindicator => new mongoose.Types.ObjectId(subindicator))
  const indicator = {
    qualification:body.qualification,
    lastUpdate: new Date(),
    subindicators: arraySubindicators
  }
  IndicatorInstance.findByIdAndUpdate(id,indicator,{ new:true })
    .then(updateIndicator => {
      res.json(updateIndicator)
    })
    .catch(error => next(error))
})
module.exports = indicatorInstanceRouter