const typeRouter = require('express').Router()
const Type = require('../models/tipo')

typeRouter.get('/',(req,res,next) => {
  Type.find({})
    .then(types => {
      res.json(types)
    })
    .catch(error => next(error))
})

typeRouter.get('/:id',(req,res,next) => {
  const id = req.params.id
  Type.findById(id)
    .then(type => {
      if(type){
        res.json(type)
      }else{
        res.status(404).end()
      }
    })
    .catch(error => next(error))
})

typeRouter.delete('/:id',(req,res,next) => {
  const id = req.params.id
  Type.findByIdAndDelete(id)
    .then(() => {
      res.status(204).end()
    })
    .catch(error => next(error))
})
typeRouter.post('/',(req,res,next) => {
  const body = req.body
  if(body.name===undefined){
    res.status(400).json({ error:'name missing' })
  }
  const type = new Type({
    name:body.name,
    green:body.green,
    yellow:body.yellow,
    red:body.red,
    qualification:body.qualification
  })
  type.save()
    .then(savedType => savedType.toJSON())
    .then(savedAndFormattedType => res.json(savedAndFormattedType))
    .catch(error => next(error))
})
typeRouter.put('/:id',(req,res,next) => {
  const body = req.body
  const id = req.params.id
  const type = {
    name:body.name,
    green:body.green,
    yellow:body.yellow,
    red:body.red,
    qualification:body.qualification
  }
  Type.findByIdAndUpdate(id,type,{ new:true })
    .then(updatetype => {
      res.json(updatetype)
    })
    .catch(error => next(error))
})
module.exports = typeRouter