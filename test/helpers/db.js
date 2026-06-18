// Harness de base de datos en memoria para los tests de caracterizacion v1.
// Arranca un MongoMemoryServer y conecta mongoose contra el. Como app.js ya
// no abre la conexion al importarse, los tests controlan el ciclo de vida.
const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')

let mongoServer = null

const connect = async () => {
  mongoServer = await MongoMemoryServer.create()
  const uri = mongoServer.getUri()
  await mongoose.connect(uri)
}

const clear = async () => {
  const collections = mongoose.connection.collections
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({})
  }
}

const disconnect = async () => {
  await mongoose.connection.dropDatabase()
  await mongoose.connection.close()
  if (mongoServer) {
    await mongoServer.stop()
    mongoServer = null
  }
}

module.exports = { connect, clear, disconnect }
