const gadRouter = require('express').Router()
const Gad = require('../models/gad')

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
gadRouter.put('/:id/newReport', async (req, res, next) => {
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