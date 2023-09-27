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
  const valuationArray = valuation.map(str => mongoose.Types.ObjectId(str))
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