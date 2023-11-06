const mongoose = require('mongoose')

const contentSchema = new mongoose.Schema({
  part: {
    type: String,
    required: true
  },
  key: {
    type: Boolean,
    required: true
  }
})
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
  content:[{
    type:contentSchema,
    required:false
  }],
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
  rubric:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Rubric',
    required:false
  },
  totalRubric:{
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
  extras:{
    type:mongoose.Schema.Types.Mixed,
    required:false,
    default:{}
  },
})
evidenceSchema.set('toJSON',{
  transform:(doc,returnObj) => {
    //console.log('evidence',returnObj)
    returnObj.id = returnObj._id.toString()
    delete returnObj._id
    delete returnObj.__v
  }
})

module.exports = mongoose.model('Evidence',evidenceSchema)