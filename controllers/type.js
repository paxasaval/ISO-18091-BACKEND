const typeRouter = require('express').Router()
const { default: mongoose } = require('mongoose')
const Type = require('../models/type')

typeRouter.get('/',async(req,res,next) => {
  try{
    let mandatory = req.query.mandatory
    if(mandatory){
      const mandatoryB = mandatory==='true'?true:false
      //console.log(mandatory)
      const types = await Type.find({ mandatory:mandatoryB }).populate('characteristics')
      res.json(types)
    }else{
      const types = await Type.find({}).populate('characteristics')
      res.json(types)
    }
  }catch(error){
    next(error)
  }
})

typeRouter.get('/:id', (req, res, next) => {
  const id = req.params.id
  Type.findById(id)
    .populate('characteristics')
    .then((type) => {
      if (type) {
        res.json(type)
      } else {
        res.status(404).end()
      }
    })
    .catch((error) => next(error))
})

typeRouter.delete('/:id', (req, res, next) => {
  const id = req.params.id
  Type.findByIdAndDelete(id)
    .then(() => {
      res.status(204).end()
    })
    .catch((error) => next(error))
})
typeRouter.post('/', (req, res, next) => {
  const body = req.body
  if (body.name === undefined) {
    res.status(400).json({ error: 'name missing' })
  }
  const arrayCharacteristics = body.characteristics.map(
    (characteristic) => new mongoose.Types.ObjectId(characteristic)
  )
  const type = new Type({
    name: body.name,
    green: body.green,
    yellow: body.yellow,
    red: body.red,
    mandatory: body.mandatory,
    characteristics: arrayCharacteristics,
  })
  type
    .save()
    .then((savedType) => savedType.toJSON())
    .then((savedAndFormattedType) => res.json(savedAndFormattedType))
    .catch((error) => next(error))
})
typeRouter.post('/addExtraInfo',async(req,res,next) => {
  try {
    const body = req.body
    const id = req.query.id
    const extras = body.extras
    const characteristicUpload = await Type.findByIdAndUpdate(id,{ extraInfo:extras },{ new:true })
    res.json(characteristicUpload)
  } catch (error) {
    next(error)
  }
})
typeRouter.put('/:id', (req, res, next) => {
  const body = req.body
  const id = req.params.id
  const arrayCharacteristics = body.characteristics.map(
    (characteristic) => new mongoose.Types.ObjectId(characteristic)
  )
  const type = {
    name: body.name,
    green: body.green,
    yellow: body.yellow,
    red: body.red,
    mandatory: body.mandatory,
    characteristics: arrayCharacteristics,
  }
  Type.findByIdAndUpdate(id, type, { new: true })
    .then((updatetype) => {
      res.json(updatetype)
    })
    .catch((error) => next(error))
})
module.exports = typeRouter
