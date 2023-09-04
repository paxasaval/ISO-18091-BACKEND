const gadRouter = require('express').Router()
const Gad = require('../models/gad')
const { getTokenFrom } = require('../utils/middleware')
const jwt = require('jsonwebtoken')
const Rol = require('../models/rol')
const Report = require('../models/report')
const { default: mongoose } = require('mongoose')

const ROL_USER = process.env.ROL_USER


gadRouter.get('/', async (req, res, next) => {
  try {
    const gad = await Gad.find({})
    res.status(200).json(gad)
  } catch (error) {
    next(error)
  }
})
gadRouter.get('/myWorkspace',async (req,res,next) => {
  try {
    const tenantID = req.header('tenant')
    const gad = await Gad.findById(tenantID)
    res.status(200).json(gad)
  } catch (error) {
    next(error)
  }
})
gadRouter.get('/reportDefault', async (req, res, next) => {
  try {
    const gadID = req.get('tenant')
    const gadBD = await Gad.findById(gadID).populate('reportDefault')
    res.status(200).json(gadBD.reportDefault)
  } catch (error) {
    next(error)
  }
})
gadRouter.get('/reports', async (req, res, next) => {
  try {
    const gadID = req.get('tenant')
    const gadBD = await Gad.findById(gadID).populate('report')
    res.status(200).json(gadBD.report)
  } catch (error) {
    next(error)
  }
})
gadRouter.get('/:id', async (req, res, next) => {
  try {
    const id = req.params.id
    const gad = Gad.findById(id)
    res.status(200).json(gad)
  } catch (error) {
    next(error)
  }
})


gadRouter.post('/', async (req, res, next) => {
  try {
    const body = req.body
    if (body.name === undefined) {
      res.status(400).json({ error: 'name missing' })
    }
    const gad = new Gad({
      name: body.name,
      code: body.code,
      city: body.city,
      country: body.country,
      size: Number(body.size),
      staff: [],
      users: [],
      state: true,
      publishAuto:true
    })
    const savedGad = await gad.save()
    const savedAndFormattGad = savedGad.toJSON()
    res.status(200).json(savedAndFormattGad)
  } catch (error) {
    next(error)
  }
})
gadRouter.put('/newReport', async (req, res, next) => {
  try {
    //Authorizaction
    const token = getTokenFrom(req)
    const decodedToken = jwt.verify(token, process.env.SECRET)
    if (!token || !decodedToken) {
      return res.status(401).json({ error: 'token missing or invalid' })
    } else {
      const rolID = decodedToken.rol
      const rol = await Rol.findById(rolID)
      if (!rol) {
        return res.status(401).json({ error: 'rol missing or invalid' })
      } else if (rol.name === ROL_USER) {
        return res.status(401).json({ error: 'unauthorized rol' })
      }
    }
    //end-authorization
    const body = req.body
    if(body.source === undefined){
      res.status(400).json({ error:'source missing' })
    }
    //const user = new mongoose.Types.ObjectId(decodedToken.id)
    const infoArray = body.info.map((info) => info)
    const report = new Report({
      source:body.source,
      period:body.period,
      info:infoArray
    })
    const savedReport = await report.save()
    const savedandFormattedReport = await savedReport.toJSON()
    const gadID = req.get('tenant')
    const gadBD = await Gad.findById(gadID)
    gadBD.report = gadBD.report.concat(savedandFormattedReport)
    const savedGad = await Gad.findByIdAndUpdate(gadID,gadBD,{ new:true })
    const savedandFormattedGad = await savedGad.toJSON()
    res.status(200).json(savedandFormattedGad)
  } catch (error) {
    next(error)
  }
})

gadRouter.put('/updateConfig',async (req,res,next) => {
  try {
    const gadID = req.get('tenant')
    const gadBD = await Gad.findById(gadID)
    const reportDefault = new mongoose.Types.ObjectId(req.body.reportDefault)
    gadBD.reportDefault = reportDefault
    gadBD.publishAuto = Boolean(req.body.publishAuto)
    const saveGad = await Gad.findByIdAndUpdate(gadID,gadBD,{ new:true })
    res.status(200).json(saveGad.toJSON())

  } catch (error) {
    next(error)
  }
})

gadRouter.put('/:id', async (req, res, next) => {
  try {
    const body = req.body
    const id = req.params.id
    const gad = {
      name: body.name,
      code: body.code,
      city: body.city,
      country: body.country,
      size: Number(body.size),
      staff: [],
      users: [],
      state: true,
    }
    const gadUpdate = await Gad.findByIdAndUpdate(id,gad,{ new:true })
    const savedAndFormattGad = gadUpdate.toJSON()
    res.status(200).json(savedAndFormattGad)

  } catch (error) {
    next(error)
  }
})
module.exports = gadRouter