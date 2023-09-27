const mongoose = require('mongoose')

const valuationSchema = new mongoose.Schema({
  name:{
    type:String,
    required:true
  },
  category:{
    type:String,
    required:true
  },
  scale:{
    type:Number,
    required:true
  },
})
valuationSchema.set('toJSON',{
  transform:(doc,returnObj) => {
    returnObj.id = returnObj._id.toString()
    delete returnObj._id
    delete returnObj.__v
  }
})

module.exports = mongoose.model('Valuation',valuationSchema)
