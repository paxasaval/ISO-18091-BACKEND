const mongoose = require('mongoose')

const typeSchema = new mongoose.Schema({
  name:{
    type:String,
    required:true
  },
  red:{
    type:String,
    required:true
  },
  yellow:{
    type:String,
    required:true
  },
  green:{
    type:String,
    required:true
  },
  mandatory:{
    type:Boolean,
    required:true
  },
  characteristics:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Characteristic'
  }]
})
typeSchema.set('toJSON',{
  transform:(doc,returnObj) => {
    returnObj.id = returnObj._id.toString()
    delete returnObj._id
    delete returnObj.__v
  }
})

module.exports = mongoose.model('Type',typeSchema)