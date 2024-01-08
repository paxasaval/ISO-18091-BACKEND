const userRouter = require('express').Router()
const { default: mongoose } = require('mongoose')
const User = require('../models/users')
const bcrypt = require('bcrypt')
const Rol = require('../models/rol')

userRouter.get('/', async (req, res) => {
  if (req.header('tenant')) {
    const tenantID = new mongoose.Types.ObjectId(req.header('tenant'))
    const users = await User.find({ gadID: tenantID }).populate('rol')

    if (users.length > 0) {
      res.status(200).json(users)
    } else {
      res.status(200).json({ message: 'no users in worskpace' })
    }
  } else {
    res.status(400).json({ message: 'tenant is nessesary' })
  }
})

userRouter.post('/', (req, res, next) => {
  const tenantID = new mongoose.Types.ObjectId(req.header('tenant'))
  const body = req.body
  if (body.name === undefined) {
    res.status(400).json({ error: 'name missing' })
  }
  const user = new User({
    name: body.name,
    mail: body.mail,
    password: body.password,
    rol: new mongoose.Types.ObjectId(body.rol),
    created: new Date(),
    lastUpdate: new Date(),
    state: true,
    gadID: tenantID,
  })
  user
    .save()
    .then((savedOds) => savedOds.toJSON())
    .then((savedAndFormattedOds) => res.json(savedAndFormattedOds))
    .catch((error) => next(error))
})

userRouter.post('/signUp', async (req, res, next) => {
  try {
    const body = req.body
    const saltRounds = 10
    const passwordHash = await bcrypt.hash(body.password, saltRounds)
    const tenantID = req.header('tenant')
    if (tenantID === undefined) {
      //console.log(tenantID)
      return res.status(400).json({ error: 'Need tenantID by workspace' })
    }
    const rol = await Rol.findById(body.rol)
    const user = new User({
      name: body.name,
      mail: body.mail,
      password: passwordHash,
      rol: rol._id,
      created: new Date(),
      lastUpdate: new Date(),
      state: true,
      gadID: tenantID,
    })
    const savedUser = await user.save()
    res.json(savedUser)
  } catch (error) {
    //console.log(error)
    next(error)
  }
})

//userRouter.post()

userRouter.post('/password', async (req, res, next) => {
  try {
    const body = req.body
    const user = await User.findOne({ mail: body.mail })
    const passwordCorrect =
      user === null
        ? false
        : await bcrypt.compare(body.password, user.password)
    if(passwordCorrect){
      return res.status(200).json({ key: true })
    }
  } catch (error) {
    next(error)
  }
})
userRouter.get('/:id', (req, res, next) => {
  const id = req.params.id
  User.findById(id)
    .populate('rol')
    .then((result) => {
      if (result) {
        res.json(result)
      } else {
        res.status(404).end()
      }
    })
    .catch((error) => next(error))
})

userRouter.delete('/:id', (req, res, next) => {
  const id = req.params.id
  //console.log('borrando1')
  User.findByIdAndDelete(id)
    .then(() => {
      res.status(204).end()
    })
    .catch((error) => next(error))
})

userRouter.put('/:id', async (req, res, next) => {
  try {
    const id = req.params.id
    const body = req.body
    const saltRounds = 10
    const passwordHash = await bcrypt.hash(body.password, saltRounds)
    const tenantID = req.header('tenant')
    if (tenantID === undefined) {
      //console.log(tenantID)
      return res.status(400).json({ error: 'Need tenantID by workspace' })
    }
    const user = {
      name: body.name,
      mail: body.mail,
      password: passwordHash,
      rol: new mongoose.Types.ObjectId(body.rol),
      lastUpdate: new Date(),
    }
    const updateUser = await User.findByIdAndUpdate(id, user, { new: true })

    res.json(updateUser)
  } catch (error) {
    next(error)
  }
})

module.exports = userRouter
