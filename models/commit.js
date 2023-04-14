const mongoose = require('mongoose')

const commitSchema = new mongoose.Schema({
  autor:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'User',
    required:true
  },
  body:{
    type:String,
    required:true
  },
  created:{
    type:Date,
    required:true
  },
  lastUpdate:{
    type:Date,
    required:false
  }
})
commitSchema.set('toJSON',{
  transform:(doc,returnObj) => {
    returnObj.id = returnObj._id.toString()
    delete returnObj._id
    delete returnObj.__v
  }
})

module.exports = mongoose.model('Commit',commitSchema)