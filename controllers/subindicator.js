const subIndicatorRouter = require('express').Router()
const { default: mongoose } = require('mongoose')
const SubIndicator = require('../models/subindicator')

subIndicatorRouter.get('/',(req,res,next) => {
  SubIndicator.find({})
    .populate({ path:'commits',model:'Commit' })
    .populate({ path:'evidences',model:'Evidence' })
    .populate({
      path:'typeID',
      populate:{ path:'characteristics' }
    })
    .populate('createdBy')
    .then(subIndicators => {
      res.json(subIndicators)
    })
    .catch(error => next(error))
})

subIndicatorRouter.get('/:id',(req,res,next) => {
  const id = req.params.id
  SubIndicator.findById(id)
    .populate({ path:'commits',model:'Commit' })
    .populate({ path:'evidences',model:'Evidence' })
    .populate({
      path:'typeID',
      populate:{ path:'characteristics' }
    })
    .populate('createdBy')
    .then(subIndicator => {
      if(subIndicator){
        res.json(subIndicator)
      }else{
        res.status(404).end()
      }
    })
    .catch(error => next(error))
})

subIndicatorRouter.delete('/:id',(req,res,next) => {
  const id = req.params.id
  SubIndicator.findByIdAndDelete(id)
    .then(() => {
      res.status(204).end()
    })
    .catch(error => next(error))
})
subIndicatorRouter.post('/',(req,res,next) => {
  const body = req.body
  if(body.name===undefined){
    res.status(400).json({ error:'name missing' })
  }
  const arrayCommits = body.commits.map(commit => new mongoose.Types.ObjectId(commit))
  const arrayEvidences = body.evidences.map(evidence => new mongoose.Types.ObjectId(evidence))
  const subIndicator = new SubIndicator({
    indicadorID:new mongoose.Types.ObjectId(body.indicadorID),
    typeID: new mongoose.Types.ObjectId(body.typeID),
    name:body.name,
    responsible:body.responsible,
    qualification:body.qualification,
    created: new Date(),
    lastUpdate: new Date(),
    createdBy: new mongoose.Types.ObjectId(body.createdBy),
    commits:arrayCommits,
    evidences:arrayEvidences
  })
  subIndicator.save()
    .then(savedSubIndicator => savedSubIndicator.toJSON())
    .then(savedAndFormattedSubIndicator => res.json(savedAndFormattedSubIndicator))
    .catch(error => next(error))
})
subIndicatorRouter.put('/:id',(req,res,next) => {
  const body = req.body
  const id = req.params.id
  const arrayCommits = body.commits.map(commit => new mongoose.Types.ObjectId(commit))
  const arrayEvidences = body.evidences.map(evidence => new mongoose.Types.ObjectId(evidence))
  const subIndicator = {
    name:body.name,
    responsible:body.responsible,
    typeID:body.typeID,
    qualification:body.qualification,
    lastUpdate:new Date(),
    commits:arrayCommits,
    evidences:arrayEvidences
  }
  SubIndicator.findByIdAndUpdate(id,subIndicator,{ new:true })
    .then(updateSubIndicator => {
      res.json(updateSubIndicator)
    })
    .catch(error => next(error))
})
module.exports = subIndicatorRouter