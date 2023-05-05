const subIndicatorRouter = require('express').Router()
const { default: mongoose } = require('mongoose')
const SubIndicator = require('../models/subindicator')
const IndicatorInstance = require('../models/indicatorInstance')
subIndicatorRouter.get('/',(req,res,next) => {
  SubIndicator.find({})
    .populate({ path:'commits',model:'Commit' })
    .populate({ path:'evidences',model:'Evidence' })
    .populate('createdBy')
    .then(subIndicators => {
      res.json(subIndicators)
    })
    .catch(error => next(error))
})

subIndicatorRouter.get('/:id',(req,res,next) => {
  const id = req.params.id
  SubIndicator.findById(id)
    .populate('commits')
    .populate('evidences')
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
subIndicatorRouter.post('/',async(req,res,next) => {
  try {
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
      state:true,
      createdBy: new mongoose.Types.ObjectId(body.createdBy),
      commits:arrayCommits,
      evidences:arrayEvidences
    })
    const savedSubIndicator = await subIndicator.save()
    const savedAndFormattedSubIndicator = savedSubIndicator.toJSON()
    const indicator = await IndicatorInstance.findById(subIndicator.indicadorID)
    const indicatorID = indicator.id
    indicator.subindicators = indicator.subindicators.concat(savedSubIndicator.id)
    const indicatorUpdated = await IndicatorInstance.findByIdAndUpdate(indicatorID,indicator,{ new:true })
    console.log('asdsdas',indicatorUpdated)
    res.json(savedAndFormattedSubIndicator)
  } catch (error) {
    next(error)
  }
})
subIndicatorRouter.post('/newSubindicator',async(req,res,next) => {
  try {
    const body = req.body
    if(body.name===undefined){
      res.status(400).json({ error:'name missing' })
    }
    const arrayCommits = body.commits.map(commit => new mongoose.Types.ObjectId(commit))
    const arrayEvidences = body.evidences.map(evidence => new mongoose.Types.ObjectId(evidence))
    const subIndicator = new SubIndicator({
      indicadorID:new mongoose.Types.ObjectId(body.indicadorID),
      requireCover:body.requireCover || true,
      cover:body.cover,
      observationCover:body.observationCover,
      typeID: new mongoose.Types.ObjectId(body.typeID),
      name:body.name,
      responsible:body.responsible,
      qualification:body.qualification,
      created: new Date(),
      lastUpdate: new Date(),
      state:true,
      createdBy: new mongoose.Types.ObjectId(body.createdBy),
      commits:arrayCommits,
      evidences:arrayEvidences
    })
    const savedSubIndicator = await subIndicator.save()
    const savedAndFormattedSubIndicator = savedSubIndicator.toJSON()
    const indicator = await IndicatorInstance.findById(subIndicator.indicadorID)
    const indicatorID = indicator.id
    indicator.subindicators = indicator.subindicators.concat(savedSubIndicator.id)
    const indicatorUpdated = await IndicatorInstance.findByIdAndUpdate(indicatorID,indicator,{ new:true })
    console.log('fgg',indicatorUpdated)
    res.json(savedAndFormattedSubIndicator)
  } catch (error) {
    next(error)
  }

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