const app = require('./app')
const http = require('http')
const config = require('./utils/config')
const logger = require('./utils/logger')
const mongoose = require('mongoose')

const server = http.createServer(app)

logger.info('conecting to', config.MONGODB_URI)

mongoose
  .connect(config.MONGODB_URI)
  .then(() => {
    logger.info('connected to MongoDB')
  })
  .catch((error) => {
    logger.error('error conecting to MongoDB:', error.message)
  })

server.listen(config.PORT || 3001, '0.0.0.0', () => {
  logger.info(`Server is running on port ${config.PORT || 3001}`)
})
