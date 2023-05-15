const indicatorInstanceRouter = require('express').Router()
const  mongoose  = require('mongoose')
const IndicatorInstance = require('../models/indicatorInstance')
const Indicator = require('../models/indicator')
const Subindicator = require('../models/subindicator')
const Type = require('../models/type')
const Period = require('../models/period')
//auth
const jwt = require('jsonwebtoken')
const { getTokenFrom } = require('../utils/middleware')
const Rol = require('../models/rol')
const ROL_ADMIN = process.env.ROL_ADMIN



indicatorInstanceRouter.get('/',(req,res,next) => {
  const tenantID = new mongoose.Types.ObjectId(req.header('tenant'))
  if(Object.entries(req.query)===0){
    IndicatorInstance.find({})
      .populate({ path: 'gadID' })
      .populate({ path: 'indicatorID' })
      .populate({ path:'subindicators',model:'SubIndicator' })
      .populate({ path:'subindicators.createdBy',model:'User' })
      .populate({ path:'createdby' })
      .then(indicators => {
        res.json(indicators)
      })
      .catch(error => next(error))
  }else{
    const period = req.query.period
    const quadrant = Number(req.query.quadrant)
    //console.log(quadrant)
    IndicatorInstance.find({ year:period,gadID:tenantID })
      .populate({
        path:'indicatorID',
        populate: { path:'ods' }
      })
      .populate({
        path:'subindicators',
        model:'SubIndicator',
        populate: { path:'createdBy' }
      })
      .then(indicators => {
        res.json(indicators.filter(indicator => indicator.indicatorID.quadrant === quadrant).sort((a,b) => a.indicatorID.number - b.indicatorID.number ))
      })
      .catch(error => next(error))
  }
})

indicatorInstanceRouter.get('/byIndicatorIDAndPeriod',async (req,res,next) => {
  try {
    const indicatorID = new mongoose.Types.ObjectId(req.query.indicatorID)
    const period = req.query.period
    const tenantID = new mongoose.Types.ObjectId(req.header('tenant'))

    const indicatorInstance = await IndicatorInstance
      .findOne({
        indicatorID:indicatorID,
        period:period,
        gadID:tenantID
      })
      .populate({
        path:'indicatorID',
        populate: { path:'ods' }
      })
      .populate({
        path:'subindicators',
        model:'SubIndicator',
        populate: [
          { path:'createdBy' },
          { path:'evidences' }
        ]
      })
    res.status(200).json(indicatorInstance)
  } catch (error) {
    next(error)
  }
})

indicatorInstanceRouter.get('/:id',(req,res,next) => {
  const id = req.params.id
  IndicatorInstance.findById(id)
    .populate({
      path:'indicatorID',
      populate: { path:'ods' }
    })
    .populate({
      path:'subindicators',
      model:'SubIndicator',
      populate: [
        { path:'createdBy' },
        { path:'evidences' }
      ]
    })
    .then(indicator => {
      if(indicator){
        res.json(indicator)
      }else{
        res.status(404).end()
      }
    })
    .catch(error => next(error))
})

indicatorInstanceRouter.delete('/:id',(req,res,next) => {
  const id = req.params.id
  IndicatorInstance.findByIdAndDelete(id)
    .then(() => {
      res.status(204).end()
    })
    .catch(error => next(error))
})

indicatorInstanceRouter.post('/newPeriod',async(req,res,next) => {
  try{
    const body = req.body
    const tenantID = new mongoose.Types.ObjectId(req.header('tenant'))


    //Authorizaction
    const token = getTokenFrom(req)
    const decodedToken = jwt.verify(token,process.env.SECRET)
    if(!token||!decodedToken){
      return res.status(401).json({ error: 'token missing or invalid' })
    }else{
      const rolID = decodedToken.rol
      const user = new mongoose.Types.ObjectId(decodedToken.id)
      const rol = await Rol.findById(rolID)
      if(!rol){
        return res.status(401).json({ error: 'rol missing or invalid' })
      }else if(rol.name!==ROL_ADMIN){
        return res.status(401).json({ error: 'unauthorized rol' })
      }
      //end-authorization

      if(body.period===undefined){
        res.status(400).json({ error:'period missing' })
      }
      //Empieza la creacion del nuevo periodo y todo lo que conlleva
      const newPeriod = new Period({
        createdBy:user,
        gad:tenantID,
        year:body.period
      })
      const newPeriodSave = await newPeriod.save()

      const types = await Type.find({ mandatory:true })
      const indicators = await Indicator.find()
      const promises = indicators.map(async (indicator) => {
        const instance = new IndicatorInstance({
          indicatorID: new mongoose.Types.ObjectId(indicator.id),
          gadID:tenantID,
          qualification:0,
          create: new Date(),
          state:false,
          period:newPeriodSave._id,
          year: body.period,
          createdBy: user,
          lastUpdate: new Date(),
          subindicators:[]
        })
        types.forEach(type => {
          const subindicator = new Subindicator({
            indicadorID:instance._id,
            requireCover:false,
            typeID: new mongoose.Types.ObjectId(type.id),
            name:type.name,
            responsible:'Administracion',
            qualification:0,
            created: new Date(),
            state:false,
            lastUpdate:new Date(),
            createdBy:user,
            commits:[],
            evidences:[]
          })
          subindicator.save()
          instance.subindicators.push(subindicator._id)
        })
        const savedIndicator = await instance.save()
        const savedAndFormattedIndicator = savedIndicator.toJSON()
        return savedAndFormattedIndicator
      })
      const savedInstances = await Promise.all(promises)
      res.json(savedInstances)
    }
  }catch(error){
    next(error)
  }
})

indicatorInstanceRouter.put('/:id',async (req,res,next) => {
  try {
    const body = req.body
    const id = req.params.id
    const arraySubindicators = body.subindicators.map( subindicator => new mongoose.Types.ObjectId(subindicator))
    //Authorizaction
    const token = getTokenFrom(req)
    const decodedToken = jwt.verify(token,process.env.SECRET)
    if(!token||!decodedToken){
      return res.status(401).json({ error: 'token missing or invalid' })
    }else{
      const rolID = decodedToken.rol
      const user = new mongoose.Types.ObjectId(decodedToken.id)
      const rol = await Rol.findById(rolID)
      if(!rol){
        return res.status(401).json({ error: 'rol missing or invalid' })
      }else if(rol.name!==ROL_ADMIN){
        return res.status(401).json({ error: 'unauthorized rol' })
      }
      //end-authorization
      const indicator = {
        qualification:body.qualification,
        lastUpdate: new Date(),
        lastUpdateBy:user,
        subindicators: arraySubindicators
      }
      const updateIndicator = await IndicatorInstance.findByIdAndUpdate(id,indicator,{ new:true })
      res.status(200).json(updateIndicator)
    }
  } catch (error) {
    next(error)
  }
})
module.exports = indicatorInstanceRouter