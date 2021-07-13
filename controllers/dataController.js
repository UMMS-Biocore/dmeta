const _ = require('lodash');
const mongoose = require('mongoose');
const factory = require('./handlerFactory');
const collectionsController = require('./collectionsController');
const fieldsController = require('./fieldsController');
const Fields = require('./../models/fieldsModel');
const ConfigApi = require('./../models/configApiModel');
const { modelObj } = require('./../utils/buildModels');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');
const { replaceAllDataIds } = require('./eventLogController');
const { getPopulateObj } = require('../utils/misc');

//if collectionName is set, then save that Model as a res.locals.Model
exports.setModel = (req, res, next) => {
  if (req.params.collectionName) {
    let modelName = req.params.collectionName;
    if (req.params.projectName) {
      modelName = `${req.params.projectName}_${req.params.collectionName}`;
    }
    res.locals.Model = modelObj[modelName];
    if (!modelObj[modelName]) {
      return next(new AppError(`collectionName '${modelName}' is not found!`, 404));
    }
    return next();
  }
  return next(new AppError(`collectionName is not defined!`, 404));
};

// set fields of collection that are not available for user (has no read permissions)
// {{URL}}/api/v1/projects/:projectName/data/:collectionName/:id
exports.setExcludeFields = async (req, res, next) => {
  const col = await collectionsController.getCollectionByName(
    req.params.collectionName,
    req.params.projectName
  );
  if (!col || !col._id) return next();
  const allFields = await Fields.find({ collectionID: col._id }).exec();
  const query = Fields.find({ collectionID: col._id });
  if (res.locals.Perms) {
    const permFilter = await res.locals.Perms('read');
    query.find(permFilter);
  } else {
    console.log('*** res.locals.Perms has not been set for setSelectFields.');
  }
  const validFields = await query.exec();
  const allFieldNames = allFields.map(f => f.name);
  const validFieldNames = validFields.map(f => f.name);
  let exclude = allFieldNames.filter(x => !validFieldNames.includes(x));
  exclude = exclude.map(i => `-${i}`);
  res.locals.ExcludeFields = exclude.join(' ');
  res.locals.AllFields = allFields;
  next();
};

exports.getAllData = factory.getAll();
exports.getData = factory.getOne();
exports.createData = factory.createOne();
exports.updateData = factory.updateOne();
exports.deleteData = factory.deleteOne();

const getDataFormatSchema = async (collectionName, projectName, format) => {
  try {
    let col = await collectionsController.getCollectionByName(collectionName, projectName, '');
    if (col && col._id) {
      const apiConf = await ConfigApi.find({ collectionID: col._id, route: format }).exec();
      if (apiConf[0] && apiConf[0].config) {
        let config = apiConf[0].config;
        console.log(config);
        config.collection = `${projectName}_${collectionName}`;
        return config;
      }
    }
  } catch (err) {
    return null;
  }
  return null;
};

const getDataSummarySchema = (collectionName, projectName, type) => {
  // * expected Schema for data summary
  // - collection: main target collecton
  // - populate: space separated fields to be merged my reference
  // - select: space separated selected fields
  // - rename: final name of the fields in the output
  //
  // e.g. const schema = {
  //    collection: 'samples',
  //    select:'dir experiments_id.exp experiments_id.projects_id.name experiments_id.test_id.name',
  //    rename: 'directory exp_name pro_name test_name',
  //    populate: 'experiments_id experiments_id.projects_id experiments_id.test_id'
  //   }
  // IMPORTANT NOTE: `_id` field is required for schemas (for events->insertRun function)
  // IMPORTANT NOTE: schemas.detailed.run expects populated server_id
  let schemas = { summary: {}, detailed: {}, populated: {} };
  schemas.summary.file = {
    collection: `${projectName}_file`,
    select: `_id 
      sample_id._id 
      name 
      file_env 
      file_used
      file_dir
      archive_dir
      s3_archive_dir
      gs_archive_dir
      collection_type
      file_type
      creationDate 
      sample_id.biosamp_id.exp_id.name 
      sample_id.biosamp_id.exp_id.exp_series_id.name`,
    rename: `_id 
      sample_id 
      name 
      file_env 
      files_used
      file_dir
      archive_dir
      s3_archive_dir
      gs_archive_dir
      collection_type
      file_type
      date_created 
      collection_name 
      project_name`,
    populate:
      'sample_id sample_id.biosamp_id sample_id.biosamp_id.exp_id sample_id.biosamp_id.exp_id.exp_series_id'
  };
  schemas.detailed.sample = {
    collection: `${projectName}_sample`,
    select: `_id
      creationDate
      biosamp_id.unique_id
      biosamp_id.exp_id.name
      biosamp_id.exp_id.exp_series_id.name
      biosamp_id.aliquot
      biosamp_id.bead_batch
      biosamp_id.blister_comments
      biosamp_id.blister_loc
      biosamp_id.blister_num
      biosamp_id.clin_pheno
      biosamp_id.col_date
      biosamp_id.ethnicity
      biosamp_id.gender
      biosamp_id.name
      biosamp_id.organism
      biosamp_id.patient
      biosamp_id.patient_note
      biosamp_id.perc_live_cells
      biosamp_id.skin
      biosamp_id.total_cells
      biosamp_id.type
      biosamp_id.visit_num
      biosamp_id.volume_bf
      cell_density_indrop
      cell_density_tc
      cells_umis_gt_500
      comment
      contract
      duplication_rate
      index_id
      index_seq
      library_tube_id
      mean_cell
      mean_umi
      name
      pool_id
      run_comments
      sc_lib_status
      seq_comments
      seq_details
      sequence_date
      status
      total_valid_reads
      owner.username`,
    rename: `_id
      date_created
      unique_id
      experiment
      experiment_series
      aliquot
      bead_batch
      blister_comments
      blister_loc
      blister_num
      clin_pheno
      col_date
      ethnicity
      gender
      biosample_name
      organism
      patient
      patient_note
      perc_live_cells
      skin
      total_cells
      biosample_type
      visit_num
      volume_bf
      cell_density_indrop
      cell_density_tc
      cells_umis_gt_500
      comment
      contract
      duplication_rate
      index_id
      index_seq
      library_tube_id
      mean_cell
      mean_umi
      name
      pool_id
      run_comments
      sc_lib_status
      seq_comments
      seq_details
      sequence_date
      status
      total_valid_reads
      owner`,
    populate: 'biosamp_id biosamp_id.exp_id biosamp_id.exp_id.exp_series_id owner'
  };
  if (schemas[type][collectionName]) return schemas[type][collectionName];
  return null;
};

const parseSummarySchema = async (collectionName, projectName, format, type) => {
  // e.g. const schema = {
  //    collection: 'sample',
  //    select:'dir experiments_id.exp experiments_id.projects_id.name experiments_id.test_id.name',
  //    rename: 'directory exp_name pro_name test_name',
  //    populate: 'experiments_id experiments_id.projects_id experiments_id.test_id'
  //   }
  // returns popObj:{
  //   path: 'experiments_id',
  //   populate: { path: 'projects_id test_id' }
  // }
  // returns `rename` Function: renames keys of query docs according to Schema
  let schema = '';
  if (format) {
    schema = await getDataFormatSchema(collectionName, projectName, format);
  } else {
    schema = getDataSummarySchema(collectionName, projectName, type);
  }
  if (!schema) {
    let modelName = collectionName;
    if (projectName) modelName = `${projectName}_${collectionName}`;
    let col = await collectionsController.getCollectionByName(collectionName, projectName);
    let popObj = '';
    if (col) {
      const fields = await fieldsController.getFieldsByCollectionId(col._id);
      let refFields = [];
      for (let i = 0; i < fields.length; i++) {
        if (fields[i].ref && mongoose.connection.models[fields[i].ref]) {
          refFields.push(fields[i].name);
        }
      }
      refFields.push(popObj);
      popObj = refFields.join(' ');
    }
    return { targetCollection: modelName, popObj: popObj, select: '-__v', rename: null };
  }
  const targetCollection = schema.collection;
  let select = schema.select;
  const names = select.split(/\s+/).map(el => el.split('.')[0]);
  let uniqueNames = names.filter(function(item, pos) {
    return names.indexOf(item) == pos;
  });
  select = uniqueNames.join(' ');
  const popArr = schema.populate.replace(/\s+/g, ' ').split(' ');
  // * prepare popObj
  const popObj = getPopulateObj(popArr);

  // * prepare `rename` function
  // e.g. project obj: {
  //   name: d.name,
  //   exp_email: d.experiments_id.email,
  // };
  const renameArr = schema.rename.replace(/\s+/g, ' ').split(' ');
  const selectArr = schema.select.replace(/\s+/g, ' ').split(' ');
  const rename = doc => {
    return doc.map(d => {
      const project = {};
      for (let i = 0; i < renameArr.length; i++) {
        // _.get used for getting multiple levels of object with dot notation
        // by using _.get -> undefined fields doesn't give error
        project[renameArr[i]] = _.get(d, selectArr[i]) === undefined ? '' : _.get(d, selectArr[i]);
      }
      return project;
    });
  };

  return { targetCollection, popObj, select, rename };
};

exports.getDataSummaryDoc = async (type, req, res, next) => {
  try {
    const { targetCollection, popObj, select, rename } = await parseSummarySchema(
      req.params.collectionName,
      req.params.projectName,
      req.params.format,
      type
    );
    if (!modelObj[targetCollection]) return null;
    const query = modelObj[targetCollection].find({});
    if (res.locals.Perms) {
      const permFilter = await res.locals.Perms('read');
      query.find(permFilter);
    }
    query.populate(popObj).select(select);
    const features = new APIFeatures(query, req.query).filter().sort();
    const jsonFilter = new APIFeatures(features.query, req.body).filter();
    let doc = await jsonFilter.query;
    if (doc && rename) doc = rename(doc);
    return doc;
  } catch (err) {
    console.log(err);
    return null;
  }
};

exports.getFormatData = catchAsync(async (req, res, next) => {
  const start = Date.now();
  const type = 'summary';
  const doc = await exports.getDataSummaryDoc(type, req, res, next);
  const duration = Date.now() - start;
  if (doc === null) return next(new AppError(`No collection found!`, 404));
  res.status(200).json({
    status: 'success',
    duration: duration,
    results: doc.length,
    data: {
      data: doc
    }
  });
});

exports.getDataSummary = catchAsync(async (req, res, next) => {
  const start = Date.now();
  const type = 'summary';
  const doc = await exports.getDataSummaryDoc(type, req, res, next);
  const duration = Date.now() - start;
  if (doc === null) return next(new AppError(`No collection found!`, 404));
  res.status(200).json({
    status: 'success',
    duration: duration,
    results: doc.length,
    data: {
      data: doc
    }
  });
});

exports.getDataDetailed = catchAsync(async (req, res, next) => {
  const start = Date.now();
  const type = 'detailed';
  let doc = await exports.getDataSummaryDoc(type, req, res, next);
  const duration = Date.now() - start;
  if (doc === null) return next(new AppError(`No collection found!`, 404));
  // replace in.reads.!file:["fileID1","fileID2"] with in.reads:[{fileObj1}, {fileObj2}]
  if (req.params.collectionName && req.params.collectionName == 'run') {
    let [docIds] = await replaceAllDataIds(false, doc, req, res, next);
    if (docIds) doc = docIds;
  }
  res.status(200).json({
    status: 'success',
    duration: duration,
    results: doc.length,
    data: {
      data: doc
    }
  });
});

exports.getDataPopulated = catchAsync(async (req, res, next) => {
  const start = Date.now();
  const type = 'populated';
  let doc = await exports.getDataSummaryDoc(type, req, res, next);
  const duration = Date.now() - start;
  if (doc === null) return next(new AppError(`No collection found!`, 404));
  res.status(200).json({
    status: 'success',
    duration: duration,
    results: doc.length,
    data: {
      data: doc
    }
  });
});
