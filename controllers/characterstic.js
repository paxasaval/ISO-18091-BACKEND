const characteristicRouter = require('express').Router()
const Characteristic = require('../models/characteristic')
const mongoose = require('mongoose')

characteristicRouter.get('/',(req,res,next) => {
  const query = req.query
  if(!query){
    Characteristic.find({})
      .then(result => {
        if(result.length>0){
          res.json(result)
        }
      })
      .catch(error => next(error))
  }else{
    const type = req.query.type
    Characteristic.find({ typeID:type })
      .then(characteristic => {
        res.json(characteristic)
      })
      .catch(error => next(error))
  }
})

characteristicRouter.post('/',(req,res,next) => {
  const body = req.body
  if(body.name===undefined){
    res.status(400).json({ error:'name missing' })
  }
  const valuation = body.valuation
  const valuationArray = valuation.map(str => new mongoose.Types.ObjectId(str))
  const characteristic = new Characteristic({
    name: body.name,
    group: body.group,
    groupName: body.groupName,
    score: body.score || 0,
    help:body.help||'',
    isRequired: body.isRequired || true,
    required: body.required || true,
    tier: body.tier,
    unique: body.unique || false,
    parts:body.parts || [],
    valuation:valuationArray,
    allowed_formats:body.allowed_formats
  })
  characteristic.save()
    .then(savedCharacteristic => savedCharacteristic.toJSON())
    .then(savedAndFormattedCharacteristic => res.json(savedAndFormattedCharacteristic))
    .catch(error => next(error))
})

characteristicRouter.post('/addValuationArray',async(req,res,next) => {
  try {
    const body = req.body
    const id = req.query.id
    const valuation = body.valuation
    const valuationArray = valuation.map(str => new mongoose.Types.ObjectId(str))
    const characteristicUpload = await Characteristic.findByIdAndUpdate(id,{ valuation:valuationArray },{ new:true })
    res.json(characteristicUpload)
  } catch (error) {
    next(error)
  }
})
characteristicRouter.post('/changeType',async(req,res,next) => {
  try {
    const body = req.body
    const id = req.query.id
    const type = body.type
    const characteristicUpload = await Characteristic.findByIdAndUpdate(id,{ type:type },{ new:true })
    res.json(characteristicUpload)
  } catch (error) {
    next(error)
  }
})
characteristicRouter.post('/changeFormat',async(req,res,next) => {
  try {
    const body = req.body
    const id = req.query.id
    const format = body.format
    const characteristicUpload = await Characteristic.findByIdAndUpdate(id,{ format:format },{ new:true })
    res.json(characteristicUpload)
  } catch (error) {
    next(error)
  }
})
characteristicRouter.post('/addExtra',async(req,res,next) => {
  try {
    const body = req.body
    const id = req.query.id
    const extras = body.extras
    const characteristicUpload = await Characteristic.findByIdAndUpdate(id,{ extras                                                       },{ new:true })
    res.json(characteristicUpload)
  } catch (error) { 
    next(error)
  }
})

characteristicRouter.get('/valuation', async (req,res,next) => {
  try {
    const id = req.query.id
    const characteristicBD = await Characteristic.findById(id).populate('valuation')
    res.json(characteristicBD)
  } catch (error) {
    next(error)
  }

})

characteristicRouter.get('/:id',(req,res,next) => {
  const id = req.params.id
  Characteristic.findById(id)
    .then(result => {
      if(result){
        res.json(result)
      }else{
        res.status(404).end()
      }
    })
    .catch(error => next(error))
})

characteristicRouter.delete('/:id',(req,res,next) => {
  const id = req.params.id
  Characteristic.findByIdAndDelete(id)
    .then(() => {
      res.status(204).end()
    })
    .catch(error => next(error))
})

characteristicRouter.put('/:id',(req,res,next) => {
  const id = req.params.id
  const body = req.body
  const characteristic = {
    name: body.name,
    group: body.group,
    groupName: body.groupName,
    required: body.required,
    score: body.score || 0,
    tier: body.tier,
    isRequired: body.isRequired,
    unique: body.unique
  }
  Characteristic.findByIdAndUpdate(id,characteristic,{ new:true })
    .then((updateCharacteristic) => {
      res.json(updateCharacteristic)
    })
    .catch(error => next(error))
})
module.exports = characteristicRouter