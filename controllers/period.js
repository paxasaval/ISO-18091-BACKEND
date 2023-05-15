const periodRouter = require('express').Router()
const Period = require('../models/period')
const  mongoose  = require('mongoose')

//auth
const jwt = require('jsonwebtoken')
const { getTokenFrom } = require('../utils/middleware')
const Rol = require('../models/rol')
const ROL_ADMIN = process.env.ROL_ADMIN


periodRouter.get('/', async (req, res, next) => {
  try {
    const period = await Period.find({})
    res.status(200).json(period)
  } catch (error) {
    next(error)
  }
})

periodRouter.get('/:id',async(req,res,next) => {
  try {
    const id = req.params.id
    const period = await Period.findById(id)
    res.status(200).json(period)
  } catch (error) {
    next(error)
  }
})
periodRouter.post('/',async(req,res,next) => {
  try{
    const body = req.body
    if(body.period===undefined){
      res.status(400).json({ error:'period is missing' })
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
      res.status(200).json(saveAndFormatPeriod)
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
      res.status(200).json({ message:'period delete!' })
    }
  }catch(error){
    next(error)
  }
})
module.exports =  periodRouter