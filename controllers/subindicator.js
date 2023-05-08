const subIndicatorRouter = require('express').Router()
const { default: mongoose } = require('mongoose')
const SubIndicator = require('../models/subindicator')
const jwt = require('jsonwebtoken')
const IndicatorInstance = require('../models/indicatorInstance')
const { getTokenFrom } = require('../utils/middleware')
const Rol = require('../models/rol')
const ROL_USER = process.env.ROL_USER
const getPagination = (page, size) => {
  const limit = size ? +size : 3
  const offset = page ? page * limit : 0
  return { limit, offset }
}
subIndicatorRouter.get('/all',(req,res,next) => {
  SubIndicator.find({})
    .populate({ path:'commits',model:'Commit' })
    .populate({ path:'evidences',model:'Evidence' })
    .populate({
      path:'typeID',
      populate:{ path:'characteristics' }
    })
    .populate('createdBy')
    .then(subIndicators => {
      res.json(subIndicators)
    })
    .catch(error => next(error))
})
subIndicatorRouter.get('/',(req,res,next) => {
  const { page, size } = req.query
  const { limit, offset } = getPagination(page, size)
  SubIndicator.paginate({},{
    offset,
    limit,
    populate:[
      {
        path:'evidences',model:'Evidence'
      },
      { path:'evidences',model:'Evidence' },
      {
        path:'typeID',
        populate:{ path:'characteristics' }
      },
      { path:'createdBy' }]
  })
    .then(subIndicators => {
      res.json(subIndicators)
    })
    .catch(error => next(error))
})
subIndicatorRouter.get('/indicator/:id',async(req,res,next) => {
  try {
    const id = req.params.id
    const { page, size } = req.query
    const { limit, offset } = getPagination(page, size)

    const subIndicators = await SubIndicator.paginate({ indicadorID:id },{
      offset,
      limit,
      populate:[
        {
          path:'evidences',model:'Evidence'
        },
        { path:'evidences',model:'Evidence' },
        {
          path:'typeID',
          populate:{ path:'characteristics' }
        },
        { path:'createdBy' }]
    })
    res.json(subIndicators)

  } catch (error) {
    next(error)
  }
})
subIndicatorRouter.get('/indicator/:id/subindicatorsSpecific',async(req,res,next) => {
  try {
    const id = req.params.id
    const { page, size } = req.query
    const { limit, offset } = getPagination(page, size)
    const options = {
      select: { __v: 0, _id: 0 },
    }
    const data = await SubIndicator.aggregate([
      {
        $match: { indicadorID: new mongoose.Types.ObjectId(id) }
      },
      {
        $lookup: {
          from: 'evidences',
          localField: 'evidences',
          foreignField: '_id',
          as: 'evidences',
          pipeline:[
            { $project:options.select }
          ]
        }
      },
      {
        $lookup: {
          from: 'types',
          localField: 'typeID',
          foreignField: '_id',
          as: 'typeID',
          pipeline:[
            { $project:options.select }
          ]
        }
      },
      {
        $unwind: { path: '$typeID', preserveNullAndEmptyArrays: true }
      },
      {
        $lookup: {
          from: 'characteristics',
          localField: 'typeID.characteristics',
          foreignField: '_id',
          as: 'typeID.characteristics',
          pipeline:[
            { $project:options.select }
          ]
        }
      },
      {
        $match: { 'typeID.mandatory': false }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'createdBy',
          pipeline:[
            { $project:options.select }
          ]
        }
      },
      {
        $unwind: { path: '$createdBy', preserveNullAndEmptyArrays: true }
      },
      {
        $project:{
          id:'$_id',
          indicadorID:1,
          requireCover:1,
          cover:1,
          observationCover:1,
          typeID:1,
          name:1,
          responsible:1,
          qualification:1,
          created:1,
          lastUpdate:1,
          state:1,
          createdBy:1,
          commits:1,
          evidences:1,
          _id:0,
        }
      },

      {
        $facet: {
          totalCount: [{ $count: 'count' }],
          results: [
            {
              $skip: offset
            }, {
              $limit: limit
            }]
        }
      }
    ])
    const totalCount = data[0].totalCount[0].count
    const subindicators = data[0].results
    const JSONsubindicators= JSON.parse(JSON.stringify(subindicators, { virtuals: true }))
    const totalPages = Math.ceil(totalCount/size)
    const hasNextPage = Number(page) < totalPages-1
    const hasPrevPage = Number(page) > 0
    const pagination = {
      pag: Number(page),
      size:Number(size),
      totalPages:totalPages,
      nextPage: hasNextPage ? Number(page) + 1 : null,
      prevPage: hasPrevPage ? Number(page) - 1 : null,
      existNextPage: hasNextPage,
      existPrevpage: hasPrevPage,
      totalDocs:totalCount,
    }
    res.json({
      pagination,
      docs:JSONsubindicators
    })

  } catch (error) {
    next(error)
  }
})


subIndicatorRouter.get('/:id',(req,res,next) => {
  const id = req.params.id
  SubIndicator.findById(id)
    .populate({
      path:'indicadorID',
      populate:{ path:'indicatorID' }
    })
    .populate({ path:'commits',model:'Commit' })
    .populate({ path:'evidences',model:'Evidence' })
    .populate({
      path:'typeID',
      populate:{ path:'characteristics' }
    })
    .populate('createdBy')
    .then(subIndicator => {
      if(subIndicator){
        res.json(subIndicator)
      }else{
        res.status(404).end()
      }
    })
    .catch(error => next(error))
})

subIndicatorRouter.delete('/:id',(req,res,next) => {
  const id = req.params.id
  SubIndicator.findByIdAndDelete(id)
    .then(() => {
      res.status(204).end()
    })
    .catch(error => next(error))
})
subIndicatorRouter.post('/',async(req,res,next) => {
  try {
    const body = req.body
    if(body.name===undefined){
      res.status(400).json({ error:'name missing' })
    }
    const arrayCommits = body.commits.map(commit => new mongoose.Types.ObjectId(commit))
    const arrayEvidences = body.evidences.map(evidence => new mongoose.Types.ObjectId(evidence))
    const subIndicator = new SubIndicator({
      indicadorID:new mongoose.Types.ObjectId(body.indicadorID),
      typeID: new mongoose.Types.ObjectId(body.typeID),
      name:body.name,
      responsible:body.responsible,
      qualification:body.qualification,
      created: new Date(),
      lastUpdate: new Date(),
      state:true,
      createdBy: new mongoose.Types.ObjectId(body.createdBy),
      commits:arrayCommits,
      evidences:arrayEvidences
    })
    const savedSubIndicator = await subIndicator.save()
    const savedAndFormattedSubIndicator = savedSubIndicator.toJSON()
    const indicator = await IndicatorInstance.findById(subIndicator.indicadorID)
    const indicatorID = indicator.id
    indicator.subindicators = indicator.subindicators.concat(savedSubIndicator.id)
    const indicatorUpdated = await IndicatorInstance.findByIdAndUpdate(indicatorID,indicator,{ new:true })
    console.log('asdsdas',indicatorUpdated)
    res.json(savedAndFormattedSubIndicator)
  } catch (error) {
    next(error)
  }
})
subIndicatorRouter.post('/newSubindicator',async(req,res,next) => {
  try {
    //Authorizaction
    const token = getTokenFrom(req)
    const decodedToken = jwt.verify(token,process.env.SECRET)
    if(!token||!decodedToken){
      return res.status(401).json({ error: 'token missing or invalid' })
    }else{
      const rolID = decodedToken.rol
      const rol = await Rol.findById(rolID)
      if(!rol){
        return res.status(401).json({ error: 'rol missing or invalid' })
      }else if(rol.name===ROL_USER){
        return res.status(401).json({ error: 'unauthorized rol' })
      }
    }
    //end-authorization
    const body = req.body
    if(body.name===undefined){
      res.status(400).json({ error:'name missing' })
    }
    const arrayCommits = body.commits.map(commit => new mongoose.Types.ObjectId(commit))
    const arrayEvidences = body.evidences.map(evidence => new mongoose.Types.ObjectId(evidence))
    const subIndicator = new SubIndicator({
      indicadorID:new mongoose.Types.ObjectId(body.indicadorID),
      requireCover:body.requireCover || true,
      cover:body.cover,
      observationCover:body.observationCover,
      typeID: new mongoose.Types.ObjectId(body.typeID),
      name:body.name,
      responsible:body.responsible,
      qualification:body.qualification,
      created: new Date(),
      lastUpdate: new Date(),
      state:true,
      createdBy: new mongoose.Types.ObjectId(body.createdBy),
      commits:arrayCommits,
      evidences:arrayEvidences
    })
    const savedSubIndicator = await subIndicator.save()
    const savedAndFormattedSubIndicator = savedSubIndicator.toJSON()
    const indicator = await IndicatorInstance.findById(subIndicator.indicadorID)
    const indicatorID = indicator.id
    indicator.subindicators = indicator.subindicators.concat(savedSubIndicator.id)
    const indicatorUpdated = await IndicatorInstance.findByIdAndUpdate(indicatorID,indicator,{ new:true })
    console.log('fgg',indicatorUpdated)
    res.json(savedAndFormattedSubIndicator)
  } catch (error) {
    next(error)
  }

})
subIndicatorRouter.put('/:id',(req,res,next) => {
  const body = req.body
  const id = req.params.id
  const arrayCommits = body.commits.map(commit => new mongoose.Types.ObjectId(commit))
  const arrayEvidences = body.evidences.map(evidence => new mongoose.Types.ObjectId(evidence))
  const subIndicator = {
    name:body.name,
    responsible:body.responsible,
    typeID:body.typeID,
    qualification:body.qualification,
    lastUpdate:new Date(),
    commits:arrayCommits,
    evidences:arrayEvidences
  }
  SubIndicator.findByIdAndUpdate(id,subIndicator,{ new:true })
    .then(updateSubIndicator => {
      res.json(updateSubIndicator)
    })
    .catch(error => next(error))
})
module.exports = subIndicatorRouter