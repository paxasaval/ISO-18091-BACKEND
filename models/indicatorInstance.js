const mongoose = require('mongoose')

const indicadorInstanceSchema = new mongoose.Schema({
  indicatorID: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  qualification: {
    type: Number,
    required: true,
  },
  period:{
    type:String,
    required:true
  },
  create:{
    type:Date,
    required:true,
  },
  lastUpdate:{
    type:Date,
    required:true
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
