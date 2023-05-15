const mongoose = require('mongoose')

const characteristicSchema = new mongoose.Schema({
  name:{
    type:String,
    required:true
  },
  group:{
    type:String,
    required:true
  },
  groupName:{
    type:String,
    required:true
  },
  help:{
    type:String,
    required:false
  },
  isRequired:{
    type:Boolean,
    required:true
  },
  required:{
    type:Boolean,
    required:true
  },
  score:{
    type:Number,
    required:false
  },
  tier:{
    type:Number,
    required:true
  },
  unique:{
    type:Boolean,
    required:true
  },
  allowed_formats:[{
    type:String,
    required:true
  }]
})
characteristicSchema.set('toJSON',{
  transform:(doc,returnObj) => {
    if(returnObj._id){
      returnObj.id = returnObj._id.toString()
      delete returnObj._id
      delete returnObj.__v

    }
  }
})

module.exports = mongoose.model('Characteristic',characteristicSchema)