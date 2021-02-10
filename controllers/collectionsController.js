const Collection = require('../models/collectionsModel');
const factory = require('./handlerFactory');
const AppError = require('./../utils/appError');
const buildModels = require('./../utils/buildModels');

exports.getCollectionByName = async name => {
  return await Collection.findOne({ name }).lean();
};
exports.getCollectionById = async id => {
  return await Collection.findById(id).lean();
};

// for post,patch requests
exports.setProjectId = (req, res, next) => {
  if (!req.body.projectID) req.body.projectID = req.params.projectID;
  next();
};

// Filter to get collections based on selected project
// {{URL}}/api/v1/projects/:projectID/collections
exports.setFilter = (req, res, next) => {
  if (req.params.projectID) res.locals.Filter = { projectID: req.params.projectID };
  next();
};

// expects parentCollectionID.
// returns { fieldName: ref. field name in the collection,
//           parentColName: parent collection name
//         }
exports.getParentRefField = async parentCollectionID => {
  let fieldName;
  const parentModelName = await buildModels.getModelNameByColId(parentCollectionID);
  const parentCol = await exports.getCollectionById(parentCollectionID);
  const parentColName = parentCol.name;
  if (parentColName) {
    fieldName = parentColName.replace(/\s+/g, '_').toLowerCase();
    fieldName = `${fieldName}_id`;
  }
  return { fieldName, parentModelName };
};

// set commands after query is completed
exports.setAfter = async (req, res, next) => {
  // for createCollection
  if (!req.params.id && req.body.name) {
    res.locals.After = async function() {
      try {
        const colName = req.body.name.replace(/\s+/g, '_').toLowerCase();
        const col = await exports.getCollectionByName(colName);
        buildModels.updateModel(col._id, null);
      } catch {
        return next(new AppError(`Collection Model couldn't be updated.`, 404));
      }
    };
    return next();
  }
  // for updateCollection and deleteCollection
  if (req.params.id) {
    res.locals.After = function() {
      const beforeQuery = res.locals.BeforeQuery;
      buildModels.updateModel(req.params.id, beforeQuery);
    };
    return next();
  }
  return next(new AppError(`Collection couldn't created!`, 404));
};

// set commands before update/delete query is completed
exports.setBefore = async (req, res, next) => {
  // for updateCollection and deleteCollection
  if (req.params.id) {
    res.locals.Before = async function() {
      const col = await exports.getCollectionById(req.params.id);
      res.locals.BeforeQuery = col;
    };
    return next();
  }
  return next(new AppError(`Collection id not found!`, 404));
};

exports.getAllCollections = factory.getAll(Collection);
exports.getCollection = factory.getOne(Collection);
exports.createCollection = factory.createOne(Collection);
exports.updateCollection = factory.updateOne(Collection);
exports.deleteCollection = factory.deleteOne(Collection);
