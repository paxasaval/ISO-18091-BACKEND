const userRouter = require('express').Router()
const { default: mongoose } = require('mongoose')
const User = require('../models/users')

userRouter.get('/',(req,res,next) => {
  User.find({})
    .populate('rol')
    .then(result => {
      if(result.length>0){
        res.json(result)
      }
    })
    .catch(error => next(error))
})

userRouter.post('/',(req,res,next) => {
  const body = req.body
  if(body.name===undefined){
    res.status(400).json({ error:'name missing' })
  }
  const user = new User({
    name: body.name,
    mail:body.mail,
    password:body.password,
    rol: new mongoose.Types.ObjectId(body.rol),
    created:new Date(),
    lastUpdate: new Date(),
    state:true
  })
  user.save()
    .then(savedOds => savedOds.toJSON())
    .then(savedAndFormattedOds => res.json(savedAndFormattedOds))
    .catch(error => next(error))
})

userRouter.get('/:id',(req,res,next) => {
  const id = req.params.id
  User.findById(id)
    .populate('rol')
    .then(result => {
      if(result){
        res.json(result)
      }else{
        res.status(404).end()
      }
    })
    .catch(error => next(error))
})

userRouter.delete('/:id',(req,res,next) => {
  const id = req.params.id
  User.findByIdAndDelete(id)
    .then(() => {
      res.status(204).end()
    })
    .catch(error => next(error))
})

userRouter.put('/:id',(req,res,next) => {
  const id = req.params.id
  const body = req.body
  const user = {
    name: body.name,
    mail:body.mail,
    password:body.password,
    rol:new mongoose.Types.ObjectId(body.rol),
    lastUpdate: new Date()
  }
  User.findByIdAndUpdate(id,user,{ new:true })
    .then((updateUser) => {
      res.json(updateUser)
    })
    .catch(error => next(error))
})
module.exports = userRouter