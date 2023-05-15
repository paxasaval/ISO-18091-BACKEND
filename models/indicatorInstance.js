const mongoose = require('mongoose')

const indicadorInstanceSchema = new mongoose.Schema({
  gadID:{
    type: mongoose.Schema.Types.ObjectId,
    ref:'Gad',
    required: true,
  },
  indicatorID: {
    type: mongoose.Schema.Types.ObjectId,
    ref:'Indicator',
    required: true,
  },
  period:{
    type: mongoose.Schema.Types.ObjectId,
    ref:'Indicator',
    required: true,
  },
  year:{
    type:String,
    required:true
  },
  qualification: {
    type: Number,
    required: true,
  },
  create:{
    type:Date,
    required:true,
  },
  state:{
    type:Boolean,
    required:true
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
  createdBy:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'User'
  },
  subindicators:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:'SubIndicator'
  }]
})
indicadorInstanceSchema.set('toJSON', {
  transform: (doc, returnObj) => {
    returnObj.id = returnObj._id.toString()
    delete returnObj._id
    delete returnObj.__v
  },
})

module.exports = mongoose.model('IndicatorInstance', indicadorInstanceSchema)
