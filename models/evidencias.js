const mongoose = require('mongoose')

const evidencias = new mongoose.Schema({
  characteristicID:{
    type:String,
    required:true
  },
  subIndicatorID:{
    type:String,
    required:true
  },
  name:{
    type:String,
    required:true
  },
  link:{
    type:String,
    required:true
  },
  note:{
    type:String,
    required:false
  },
  verified:{
    type:Boolean,
    default:false
  }
})
evidencias.set('toJSON',{
  transform:(doc,returnObj) => {
    returnObj.id = returnObj._id.toString()
    delete returnObj._id
    delete returnObj.__v
  }
})

module.exports = mongoose.model('Note',evidencias)