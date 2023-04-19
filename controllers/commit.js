const commitRouter = require('express').Router()
const Commit = require('../models/commit')

commitRouter.get('/',(req,res,next) => {
  Commit.find({})
    .then(commit => {
      res.json(commit)
    })
    .catch(error => next(error))
})

commitRouter.get('/:id',(req,res,next) => {
  const id = req.params.id
  Commit.findById(id)
    .then(commit => {
      if(commit){
        res.json(commit)
      }else{
        res.status(404).end()
      }
    })
    .catch(error => next(error))
})

commitRouter.delete('/:id',(req,res,next) => {
  const id = req.params.id
  Commit.findByIdAndDelete(id)
    .then(() => {
      res.status(204).end()
    })
    .catch(error => next(error))
})
commitRouter.post('/',(req,res,next) => {
  const body = req.body
  if(body.name===undefined){
    res.status(400).json({ error:'name missing' })
  }
  const commit = new Commit({
    body:body.body,
    autor:body.autor,
    created:new Date(),
    lastUpdate: new Date()
  })
  commit.save()
    .then(savedcommit => savedcommit.toJSON())
    .then(savedAndFormattcommit => res.json(savedAndFormattcommit))
    .catch(error => next(error))
})
commitRouter.put('/:id',(req,res,next) => {
  const body = req.body
  const id = req.params.id
  const commit = {
    body:body.body,
    lastUpdate: new Date()
  }
  Commit.findByIdAndUpdate(id,commit,{ new:true })
    .then(updateCommit => {
      res.json(updateCommit)
    })
    .catch(error => next(error))
})
module.exports = commitRouter