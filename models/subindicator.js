const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')

const subIndicadorSchema = new mongoose.Schema({
  typeID:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Type',
    required:true
  },
  indicadorID:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'IndicatorInstance',
    required:true
  },
  name:{
    type:String,
    required:true
  },
  requireCover:{
    type:Boolean,
    required:true
  },
  cover:{
    type:String,
    required:false
  },
  observationCover:{
    type:String,
    required:false
  },
  isPlanned:{
    type:Boolean,
    required:false
  },
  isDiagnosed:{
    type:Boolean,
    required:false
  },
  responsible:{
    type:String,
    required:true
  },
  qualification:{
    type:Number,
    default:0,
    required:false
  },
  score:{
    type:Number,
    default:0,
    required:false
  },
  totalScore:{
    type:Number,
    default:0,
    required:false
  },
  autoQualification:{
    type:Number,
    default:0,
    required:false
  },
  lastUpdate:{
    type:Date,
    required:false
  },
  lastUpdateBy:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'User',
    required:false
  },
  state:{
    type:Boolean,
    required:true
  },
  created:{
    type:Date,
    required:true
  },
  createdBy:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'User',
    required:true
  },
  commits:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Commit',
  }],
  evidences:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Evidence',
  }],
  extraInfo:{
    type:mongoose.Schema.Types.Mixed,
    required:false,
    default:{}
  }
})

subIndicadorSchema.plugin(mongoosePaginate)

subIndicadorSchema.set('toJSON',{
  transform:(doc,returnObj) => {
    //console.log('subindicator',returnObj)
    returnObj.id = returnObj._id.toString()
    delete returnObj._id
    delete returnObj.__v
  }
})

module.exports = mongoose.model('SubIndicator',subIndicadorSchema)