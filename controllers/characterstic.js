const characteristicRouter = require('express').Router()
const Characteristic = require('../models/caracteristicas')

characteristicRouter.get('/',(req,res,next) => {
  Characteristic.find({})
    .then(result => {
      if(result.length>0){
        res.json(result)
      }
    })
    .catch(error => next(error))
})

characteristicRouter.post('/',(req,res,next) => {
  const body = req.body
  if(body.name===undefined){
    res.status(400).json({ error:'name missing' })
  }
  const characteristic = new Characteristic({
    name: body.name,
    group: body.group,
    groupName: body.groupName,
    required: body.required,
    tier: body.tier,
    typeID: body.typeID,
    unique: body.unique
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
    tier: body.tier,
    typeID: body.typeID,
    unique: body.unique
  }
  Characteristic.findByIdAndUpdate(id,characteristic,{ new:true })
    .then((updateCharacteristic) => {
      res.json(updateCharacteristic)
    })
    .catch(error => next(error))
})
module.exports = characteristicRouter