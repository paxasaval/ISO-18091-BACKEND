const notifyRouter = require('express').Router()
const { default: mongoose } = require('mongoose')
const Notify = require('../models/notifications')

notifyRouter.get('/',(req,res,next) => {
  Notify.find({})
    .then(result => {
      if(result.length>0){
        res.json(result)
      }
    })
    .catch(error => next(error))
})

notifyRouter.get('/allMyNotify',async(req,res,next) => {
  try {
    const { userID } = req.query
    const user = new mongoose.Types.ObjectId(userID)
    console.log(user    )
    const notifications = await Notify.find({ sendTo:user }).sort({ date:-1 })
    res.json(notifications)
  } catch (error) {
    next(error)
  }
})

notifyRouter.post('/',(req,res,next) => {
  const body = req.body
  if(body.name===undefined){
    res.status(400).json({ error:'name missing' })
  }
  const notify = new Notify({
    name: body.name,
    number:body.number,
    img:body.img
  })
  notify.save()
    .then(savedNotify => savedNotify.toJSON())
    .then(savedAndFormattedNotify => res.json(savedAndFormattedNotify))
    .catch(error => next(error))
})

notifyRouter.get('/:id',(req,res,next) => {
  const id = req.params.id
  Notify.findById(id)
    .then(result => {
      if(result){
        res.json(result)
      }else{
        res.status(404).end()
      }
    })
    .catch(error => next(error))
})

notifyRouter.delete('/:id',(req,res,next) => {
  const id = req.params.id
  Notify.findByIdAndDelete(id )
    .then(() => {
      res.status(204).end()
    })
    .catch(error => next(error))
})

notifyRouter.put('/:id',(req,res,next) => {
  const id = req.params.id
  const body = req.body
  const notify = {
    name: body.name,
    number:body.number,
    img:body.img
  }
  Notify.findByIdAndUpdate(id,notify,{ new:true })
    .then((updateNotify) => {
      res.json(updateNotify)
    })
    .catch(error => next(error))
})
module.exports = notifyRouter