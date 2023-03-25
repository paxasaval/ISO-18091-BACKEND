const odsRouter = require('express').Router()
const Ods = require('../models/ods')

odsRouter.get('/',(req,res,next) => {
  Ods.find({})
    .then(result => {
      if(result.length>0){
        res.json(result)
      }
    })
    .catch(error => next(error))
})

odsRouter.post('/',(req,res,next) => {
  const body = req.body
  if(body.name===undefined){
    res.status(400).json({ error:'name missing' })
  }
  const ods = new Ods({
    name: body.name,
    number:body.number,
    img:body.img
  })
  ods.save()
    .then(savedOds => savedOds.toJSON())
    .then(savedAndFormattedOds => res.json(savedAndFormattedOds))
    .catch(error => next(error))
})

odsRouter.get('/:id',(req,res,next) => {
  const id = req.params.id
  Ods.findById(id)
    .then(result => {
      if(result){
        res.json(result)
      }else{
        res.status(404).end()
      }
    })
    .catch(error => next(error))
})

odsRouter.delete('/:id',(req,res,next) => {
  const id = req.params.id
  Ods.findByIdAndDelete(id)
    .then(() => {
      res.status(204).end()
    })
    .catch(error => next(error))
})

odsRouter.put('/:id',(req,res,next) => {
  const id = req.params.id
  const body = req.body
  const ods = {
    name: body.name,
    number:body.number,
    img:body.img
  }
  Ods.findByIdAndUpdate(id,ods,{ new:true })
    .then((updateOds) => {
      res.json(updateOds)
    })
    .catch(error => next(error))
})
module.exports = odsRouter