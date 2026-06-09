const app = require('./app')
const http = require('http')
const config = require('./utils/config')
const logger = require('./utils/logger')

const server = http.createServer(app)

server.listen(config.PORT || 3001, '0.0.0.0', () => {
  logger.info(`Server is running on port ${config.PORT || 3001}`)
})



