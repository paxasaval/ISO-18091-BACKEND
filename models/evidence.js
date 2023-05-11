const mongoose = require('mongoose')

const evidenceSchema = new mongoose.Schema({
  characteristicID:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Characteristic',
    required:true
  },
  subIndicatorID:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Subindicator',
    required:false
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
evidenceSchema.set('toJSON',{
  transform:(doc,returnObj) => {
    returnObj.id = returnObj._id.toString()
    delete returnObj._id
    delete returnObj.__v
  }
})

module.exports = mongoose.model('Evidence',evidenceSchema)