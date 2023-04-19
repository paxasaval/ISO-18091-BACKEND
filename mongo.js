const config = require('./utils/config')
const mongoose = require('mongoose')
const logger = require('./utils/logger')
const fs = require('fs')
const rol = require('./models/rol')
const user = require ('./models/users')
const ods = require ('./models/ods')
const indicator = require ('./models/indicator')
mongoose
  .connect(config.MONGODB_URI)
  .then(() => {
    logger.info('connected to MongoDB')
    saveData()
  })
  .catch((error) => {
    logger.error('error conecting to MongoDB:', error.message)
  })
const saveData = () => {
  const rawData = fs.readFileSync('./prueba2.json')
  const jsonData = JSON.parse(rawData)

  //console.log(jsonData)
  let index = 0
  jsonData.map((data) => {
    const newData = new indicator({ ...data })
    //    console.log(newData)
    newData.save().then(() => {
      index += 1
      console.log('new data!', index)
    })
  })
}
