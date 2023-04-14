const rolRouter = require('express').Router()
const Rol = require('../models/rol')

rolRouter.get('/',(req,res,next) => {
  Rol.find({})
    .then(result => {
      if(result.length>0){
        res.json(result)
      }
    })
    .catch(error => next(error))
})

rolRouter.post('/',(req,res,next) => {
  const body = req.body
  if(body.name===undefined){
    res.status(400).json({ error:'name missing' })
  }
  const rol = new Rol({
    name: body.name,
    description:body.description,
  })
  rol.save()
    .then(savedOds => savedOds.toJSON())
    .then(savedAndFormattedOds => res.json(savedAndFormattedOds))
    .catch(error => next(error))
})

rolRouter.get('/:id',(req,res,next) => {
  const id = req.params.id
  Rol.findById(id)
    .then(result => {
      if(result){
        res.json(result)
      }else{
        res.status(404).end()
      }
    })
    .catch(error => next(error))
})

rolRouter.delete('/:id',(req,res,next) => {
  const id = req.params.id
  Rol.findByIdAndDelete(id)
    .then(() => {
      res.status(204).end()
    })
    .catch(error => next(error))
})

rolRouter.put('/:id',(req,res,next) => {
  const id = req.params.id
  const body = req.body
  const rol = {
    name: body.name,
    description:body.description,
  }
  Rol.findByIdAndUpdate(id,rol,{ new:true })
    .then((updateRol) => {
      res.json(updateRol)
    })
    .catch(error => next(error))
})
module.exports = rolRouter