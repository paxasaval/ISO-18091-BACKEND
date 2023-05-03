//config
const config = require('./utils/config')
const express = require('express')
const app = express()
const cors = require('cors')
//controllers
const odsRouter = require('./controllers/ods')
const indicatorRouter = require('./controllers/indicator')
const indicatorInstanceRouter = require('./controllers/indicatorInstance')
const typeRouter = require('./controllers/type')
const characteristicRouter = require('./controllers/characterstic')
const subIndicatorRouter = require('./controllers/subindicator')
const evidenveRouter = require('./controllers/evidence')
const rolRouter = require('./controllers/rol')
const userRouter = require('./controllers/user')
const commitRouter = require('./controllers/commit')
const loginRouter = require('./controllers/login')

//Utils
const middleware = require('./utils/middleware')
const logger = require('./utils/logger')
const mongoose = require('mongoose')


logger.info('conecting to', config.MONGODB_URI)

mongoose.connect(config.MONGODB_URI)
  .then(() => {
    logger.info('connected to MongoDB')
  })
  .catch((error) => {
    logger.error('error conecting to MongoDB:', error.message)
  })

app.use(cors())
app.use(express.static('build'))
app.use(express.json())
app.use(middleware.requestLogger)

//app.use('api/notes',notesRouter)
app.use('/api/ods',odsRouter)
app.use('/api/indicators',indicatorRouter)
app.use('/api/users',userRouter)
app.use('/api/rols',rolRouter)
app.use('/api/type',typeRouter)
app.use('/api/characteristics',characteristicRouter)
app.use('/api/subIndicators',subIndicatorRouter)
app.use('/api/indicatorsInstance',indicatorInstanceRouter)
app.use('/api/evidences',evidenveRouter)
app.use('/api/commits',commitRouter)
app.use('/api/login',loginRouter)

//
app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)

module.exports = app