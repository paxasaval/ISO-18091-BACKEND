const mongoose = require('mongoose')

const evidenceSchema = new mongoose.Schema({
  characteristicID:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Characteristic',
    required:true
  },
  subIndicatorID:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'SubIndicator',
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
  state:{
    type:Boolean,
    required:false
  },
  verified:{
    type:Boolean,
    default:false
  },
  qualification:{
    type:Number,
    required:false
  },
  autoQualification:{
    type:Number,
    required:false
  },
  qualificationBy:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'User',
    required:false
  },
  qualificationDate:{
    type:Date,
    required:false
  },
  author:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'User',
    required:true
  },
  commits:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Commit',
    required:false
  }],
})
evidenceSchema.set('toJSON',{
  transform:(doc,returnObj) => {
    returnObj.id = returnObj._id.toString()
    delete returnObj._id
    delete returnObj.__v
  }
})

module.exports = mongoose.model('Evidence',evidenceSchema)