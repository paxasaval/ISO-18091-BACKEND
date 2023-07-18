const mongoose = require('mongoose')

const newsSchema = new mongoose.Schema({
  image: {
    type: String,
    requred: true,
  },
  title:{
    type: String,
    requred: true,
  },
  description:{
    type: String,
    requred: true,
  },
  tag:[{
    type: String,
    requred: true,
  }],
  author:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'User',
    required:true
  },
  gad:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Gad',
    required:true
  }
})
newsSchema.set('toJSON',{
  transform:(doc,returnObj) => {
    returnObj.id = returnObj._id.toString()
    delete returnObj._id
    delete returnObj.__v
  }
})
module.exports = mongoose.model('New',newsSchema)