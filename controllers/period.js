const periodRouter = require('express').Router()
const Period = require('../models/period')
const  mongoose  = require('mongoose')

//auth
const jwt = require('jsonwebtoken')
const { getTokenFrom } = require('../utils/middleware')
const Rol = require('../models/rol')
const ROL_ADMIN = process.env.ROL_ADMIN
//newPeriod
const IndicatorInstance = require('../models/indicatorInstance')
const Indicator = require('../models/indicator')
const Subindicator = require('../models/subindicator')
const Type = require('../models/type')

periodRouter.get('/', async (req, res, next) => {
  try {
    const tenant = req.header('tenant')
    if(!tenant){
      return res.status(400).json({ erro:'tenat is nesesary' })
    }
    const period = await Period.find({})
    return res.status(200).json(period)
  } catch (error) {
    next(error)
  }
})

periodRouter.get('/:id',async(req,res,next) => {
  try {
    const id = req.params.id
    const period = await Period.findById(id)
    return res.status(200).json(period)
  } catch (error) {
    next(error)
  }
})
periodRouter.post('/',async(req,res,next) => {
  try{
    const body = req.body
    if(body.period===undefined){
      return res.status(400).json({ error:'period is missing' })
    }
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
      }else if(rol.name===ROL_ADMIN){
        return res.status(401).json({ error: 'unauthorized rol' })
      }
      //end-authorization
      const tenantID = req.header('tenant')
      const period = new Period({
        year:body.period,
        gad:tenantID,
        createdBy:user
      })
      const savePeriod = await period.save()
      const saveAndFormatPeriod = savePeriod.toJSON()
      return res.status(200).json(saveAndFormatPeriod)
    }
  }catch(error){
    next(error)
  }
})
periodRouter.post('/new',async(req,res,next) => {
  try{
    const body = req.body
    if(req.header('tenant')===undefined){
      return res.status(400).json({ error:'tenant is nescesary' })
    }
    const tenantID = new mongoose.Types.ObjectId(req.header('tenant'))//tenantID
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
      //Requistos:body.period;header.tenant,header.token
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
      return res.json(savedInstances)
    }
  }catch(error){
    next(error)
  }
})
periodRouter.delete('/:id',async(req,res,next) => {
  try{
    const id = req.params.id
    //Authorizaction
    const token = getTokenFrom(req)
    const decodedToken = jwt.verify(token,process.env.SECRET)
    if(!token||!decodedToken){
      return res.status(401).json({ error: 'token missing or invalid' })
    }else{
      const rolID = decodedToken.rol
      const rol = await Rol.findById(rolID)
      if(!rol){
        return res.status(401).json({ error: 'rol missing or invalid' })
      }else if(rol.name===ROL_ADMIN){
        return res.status(401).json({ error: 'unauthorized rol' })
      }
      //end-authorization
      await Period.findByIdAndDelete(id)
      return res.status(200).json({ message:'period delete!' })
    }
  }catch(error){
    next(error)
  }
})







module.exports =  periodRouter