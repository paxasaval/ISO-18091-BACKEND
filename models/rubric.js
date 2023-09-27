const mongoose = require('mongoose')

const rubricSchema = new mongoose.Schema({
  valuation:{
    type:mongoose.Schema.Types.ObjectId,
    required:true
  },
  qualification:{
    type:Number,
    required:true
  }
})

rubricSchema.set('toJSON',{
  transform:(doc,returnObj) => {
    if(returnObj._id){
      returnObj.id = returnObj._id.toString()
      delete returnObj._id
      delete returnObj.__v

    }
  }
})
module.exports = mongoose.model('Rubric',rubricSchema)
