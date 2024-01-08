const valuationRouter = require('express').Router()
const Valuation = require('../models/valuation')

valuationRouter.get('/',async (req,res,next) => {
  try {
    const valuationBD = await Valuation.find({})
    res.status(200).json(valuationBD)
  } catch (error) {
    next(error)
  }

})

valuationRouter.post('/',async (req,res,next) => {
  try {
    const body = req.body
    if(body.maxValue === undefined){
      res.status(400).json({ error:'max value missing' })
    }
    const newValuation = new Valuation({
      name:body.name,
      category:body.category,
      maxValue:body.maxValue
    })
    const savedValuation = await newValuation.save()
    const savedAndFormattValuation = savedValuation.toJSON()
    res.status(200).json(savedAndFormattValuation)
  } catch (error) {
    next(error)
  }
})

module.exports = valuationRouter