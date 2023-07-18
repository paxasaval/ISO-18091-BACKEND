const mongoose = require('mongoose')

const sponsorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  gad: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gad',
    required: true,
  },
  image:{
    type: String,
    required: true,
  },
  state:{
    type: Boolean,
    required: true,
  }
})
sponsorSchema.set('toJSON',{
  transform:(doc,returnObj) => {
    returnObj.id = returnObj._id.toString()
    delete returnObj._id
    delete returnObj.__v
  }
})
module.exports = mongoose.model('Sponsor',sponsorSchema)
