const mongoose = require('mongoose')

const infoSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true
  },
  data: {
    type: String,
    required: true
  }
})

const reportSchema = new mongoose.Schema({
  info: [{
    type: infoSchema,
    required: true
  }],
  source: {
    type: String,
    required: true
  },
  period: {
    type: String,
    required: true
  }
})

module.exports = mongoose.model('Report', reportSchema)