const axios = require('axios');
const EventLog = require('../models/eventLogModel');
const AdminEventLog = require('../models/adminEventLogModel');
const Collection = require('../models/collectionsModel');
const Project = require('../models/projectsModel');
const serverController = require('../controllers/serverController');
const collectionsController = require('../controllers/collectionsController');
const projectsController = require('../controllers/projectsController');
const factory = require('./handlerFactory');
const APIFeatures = require('./../utils/apiFeatures');

// create event tracker for data routes -> create/update/delete
exports.setEventLog = target => {
  return (req, res, next) => {
    // target: "data"
    // event type: "insert", "update", "delete"
    res.locals.EventLog = async function(type, doc) {
      let projectName;
      let collectionName;
      let collection_id;
      let project_id;
      if (req.params.projectName) projectName = req.params.projectName;
      if (req.params.collectionName) collectionName = req.params.collectionName;
      const col = await collectionsController.getCollectionByName(collectionName, projectName);
      const proj = await projectsController.getProjectByName(projectName);
      if (col && col._id) collection_id = col._id;
      if (proj && proj._id) project_id = proj._id;

      let docId;
      let docReq;
      let docRes;
      const perms = doc.perms;
      if (type == 'insert') {
        docId = doc.id;
        docReq = req.body;
        docRes = doc;
      } else if (type == 'update') {
        docId = req.params.id;
        docReq = req.body;
        docRes = doc;
      } else if (type == 'delete') {
        docId = req.params.id;
      }
      const eventDetails = {
        target,
        type,
        coll: collection_id,
        project: project_id,
        doc_id: docId,
        res: docRes,
        req: docReq,
        owner: res.locals.user.id,
        perms
      };
      try {
        await EventLog.create(eventDetails);
      } catch {
        return { status: 'error', message: 'Event log could not be created', error: eventDetails };
      }

      if (
        type == 'insert' &&
        (collectionName == 'run' || collectionName.match(/_run$/)) &&
        res.locals.token
      ) {
        return await exports.insertRun(doc, req, res, next);
      }
    };
    return next();
  };
};

const prepareDbLib = async (docAr, req, res) => {
  console.log('prepareDbLib');
  let dbLib = {};
  let refModels = [];
  try {
    for (let n = 0; n < docAr.length; n += 1) {
      if (docAr[n].in) {
        for (const k of Object.keys(docAr[n].in)) {
          const input = docAr[n].in[k];
          if (typeof input === 'object' && input !== null) {
            for (const i of Object.keys(input)) {
              // e.g. `i` -> "!sample_id"
              // check if keys are like "!sample_id"
              if (i.charAt(0) == '!' && i.slice(-3) == '_id') {
                const refModel = i.substring(1, i.length - 3);
                if (refModels.indexOf(refModel) === -1) refModels.push(refModel);
              }
            }
          }
        }
      }
    }
    console.log('refModels', refModels);
    for (let n = 0; n < refModels.length; n += 1) {
      const refModel = refModels[n];
      const projectName = req.params.projectName;
      const collectionPath = `${refModel}/summary`;
      // eslint-disable-next-line no-await-in-loop
      const docs = await exports.getDataByQueryParams('', collectionPath, projectName, res);
      dbLib[refModel] = docs;
    }
    return dbLib;
  } catch (err) {
    console.log('prepareDbLib err', err);
    return null;
  }
};

exports.replaceAllDataIds = async (warn, docAr, req, res, next) => {
  const dbLib = await prepareDbLib(docAr, req, res);

  if (!dbLib) return null;
  let fileIdObj = {};
  for (let i = 0; i < docAr.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    let [docIds, subFileIdObj] = await exports.replaceDataIds(dbLib, docAr[i], req, res, next);
    if (warn && !docIds) return [null, subFileIdObj];
    if (docIds) {
      docAr[i] = docIds;
      fileIdObj = subFileIdObj;
    }
  }
  return [docAr, fileIdObj];
};

exports.replaceDataIds = async (dbLib, doc, req, res, next) => {
  // replace doc inputs with getDataSummaryDoc function
  // searches objects that has key which match following pattern `!${collectionName}_id`
  // e.g. `input` -> { "!sample_id":["5f5a98...","5f5a99..."] }
  // replaces with [{_id:"5f5a98", name:"test"},{_id:"5f5a99", name:"test2"},]
  // e.g. `input` -> "single" (doesn't replace)

  // fileIdObj = {fileId1 :sampleID1, fileId2 :sampleID2}
  let fileIdObj = {};
  try {
    if (doc.in) {
      for (const k of Object.keys(doc.in)) {
        const input = doc.in[k];
        if (typeof input === 'object' && input !== null) {
          for (const i of Object.keys(input)) {
            // e.g. `i` -> "!sample_id"
            // check if keys are like "!sample_id"
            if (i.charAt(0) == '!' && i.slice(-3) == '_id') {
              const refModel = i.substring(1, i.length - 3);
              const refs = input[i];
              if (Array.isArray(refs)) {
                const promises = refs.map(async id => {
                  const filteredItem = dbLib[refModel].filter(d => d._id == id);
                  if (
                    refModel == 'file' &&
                    filteredItem &&
                    filteredItem[0] &&
                    filteredItem[0].sample_id
                  ) {
                    fileIdObj[id] = filteredItem[0].sample_id;
                  }
                  if (filteredItem && filteredItem[0]) {
                    return filteredItem[0];
                  }
                  return null;
                });
                // eslint-disable-next-line no-await-in-loop
                const populated = await Promise.all(promises);
                if (populated.includes(null)) {
                  return [null, `Run Failed. Document not found in the ${refModel} collection.`];
                }
                doc.in[k] = populated;
              }
            }
          }
        }
      }
    }
    return [doc, fileIdObj];
  } catch (err) {
    console.log('replaceDataIds err');
    return [null, `Run Failed.`];
  }
};

exports.insertOutputDocs = async (query, coll, projectName, req, res, next) => {
  try {
    let projectPath = '';
    if (projectName) projectPath = `projects/${projectName}/`;
    const auth = `Bearer ${res.locals.token}`;
    const { data } = await axios.post(
      `${process.env.BASE_URL}/api/v1/${projectPath}data/${coll}`,
      query,
      {
        headers: {
          Authorization: auth
        }
      }
    );
    if (data.data.data._id) return data.data.data._id;
    return null;
  } catch (err) {
    console.log('insertOutputDocs err');
    return null;
  }
};

exports.getDataByQueryParams = async (queryParams, collection, projectName, res) => {
  try {
    let projectPath = '';
    if (projectName) projectPath = `projects/${projectName}/`;
    const auth = `Bearer ${res.locals.token}`;
    const url = `${process.env.BASE_URL}/api/v1/${projectPath}data/${collection}${queryParams}`;
    const { data } = await axios.get(url, {
      headers: {
        Authorization: auth
      }
    });
    if (data.data.data) return data.data.data;
    return null;
  } catch (err) {
    return null;
  }
};

exports.updateDataByQueryParams = async (
  queryParams,
  collection,
  projectName,
  update,
  req,
  res,
  next
) => {
  try {
    let projectPath = '';
    if (projectName) projectPath = `projects/${projectName}/`;
    const auth = `Bearer ${res.locals.token}`;
    const { data } = await axios.patch(
      `${process.env.BASE_URL}/api/v1/${projectPath}data/${collection}${queryParams}`,
      update,
      {
        headers: {
          Authorization: auth
        }
      }
    );
    if (data.data.data._id) return data.data.data._id;
    return null;
  } catch (err) {
    console.log('updateDataByQueryParams err');
    return null;
  }
};

// fills  "out": {"sample_summary" : {}},
//  with sampleName specific row id's
//  e.g.  "out": {"sample_summary" : {
//                    "control" : "5f622c67721d09b3670c4b66",
//                    "experiment": "3333267721d09b3670c4b66"}
//               }
exports.replaceRunOuts = async (doc, req, res, next) => {
  // add sample_id, file_id, run_id to output collections
  // in {reads: [{_id:"5f5a98", name:"test"},{_id:"5f5a99", name:"test2"}], mate:"pair"}
  // get all file names that are belong to collection = found in array
  const run_id = doc._id;
  const inputs = doc.in;
  const projectName = req.params.projectName;
  let fileNames = [];
  let fileIDs = [];
  let sampleIDs = [];
  for (const i of Object.keys(inputs)) {
    if (Array.isArray(inputs[i])) {
      fileNames = inputs[i].map(el => el.name);
      fileIDs = inputs[i].map(el => el._id);
      sampleIDs = inputs[i].map(el => el.sample_id);
    }
  }
  const out = doc.out;
  for (const collection of Object.keys(out)) {
    for (let i = 0; i < fileIDs.length; i += 1) {
      const file_id = fileIDs[i];
      const file_name = fileNames[i];
      const sample_id = sampleIDs[i];
      const queryParams = `?file_id=${file_id}&run_id=${run_id}`;
      // eslint-disable-next-line no-await-in-loop
      let outCollectionDoc = await exports.getDataByQueryParams(
        queryParams,
        collection,
        projectName,
        res
      );
      let outCollectionDocId = null;
      if (outCollectionDoc && outCollectionDoc._id) outCollectionDocId = outCollectionDoc._id;

      if (!outCollectionDocId) {
        const query = { sample_id, file_id, run_id, doc: null };
        console.log('query', query);
        console.log('collection', collection);
        // eslint-disable-next-line no-await-in-loop
        outCollectionDocId = await exports.insertOutputDocs(
          query,
          collection,
          projectName,
          req,
          res,
          next
        );
        console.log('outCollectionDocId', outCollectionDocId);
      }
      if (outCollectionDocId) {
        // save latest rowid in doc.out
        if (!doc.out[collection]) doc.out[collection] = {};
        doc.out[collection][file_name] = outCollectionDocId;
      }
    }
  }

  return doc;
};

exports.insertRun = async (docSaved, req, res, next) => {
  try {
    console.log('run event created');
    let [docIds, fileIdObj] = await exports.replaceAllDataIds(true, [docSaved], req, res, next);
    if (!docIds || !docIds[0]) return { status: 'error', message: fileIdObj, error: null };
    let doc = await exports.replaceRunOuts(docIds[0], req, res, next);
    let insertType = 'startRun';
    if (doc.run_url) insertType = 'existingRun';

    const projectName = req.params.projectName ? req.params.projectName : '';
    const run_id = doc._id;
    const server_id = doc.server_id;

    const info = {};
    info.dmetaServer = process.env.BASE_URL;
    info.project = projectName;
    console.log('doc', doc);
    console.log('server_id', server_id);
    console.log('populated_doc_reads', doc.in.reads);
    // send run information to selected server
    if (server_id) {
      const server = await serverController.getServerById(server_id);
      if (server && server.url_server && res.locals.token) {
        const auth = `Bearer ${res.locals.token}`;
        //localhost:8080/dolphinnext/api/service.php?run=startRun
        const { data, status } = await axios.post(
          `${server.url_server}/api/service.php?run=${insertType}`,
          { doc, info },
          {
            headers: {
              Authorization: auth
            }
          }
        );
        console.log(data, status);
        const runStatus = data.status ? data.status : 'error';
        const runLog = data.log ? data.log : data.toString();
        const runUrl = data.run_url ? data.run_url : '';
        console.log('runStatus:', runStatus);
        console.log('runLog:', runLog);
        console.log('runUrl:', runUrl);
        // update run: runUrl, file_ids and out of run document
        let fileIds = Object.keys(fileIdObj);
        await exports.updateDataByQueryParams(
          `/${run_id}`,
          'run',
          projectName,
          { run_url: runUrl, file_ids: fileIds, out: doc.out },
          req,
          res,
          next
        );
        // stop here if run_url is entered in the doc
        if (insertType == 'existingRun') return { status: runStatus, message: runLog, error: null };

        if (runStatus == 'initiated') {
          //update sample status
          // first get unique sample Id array from fileIdObj
          let sampleIds = Object.values(fileIdObj);
          sampleIds = sampleIds.filter((v, i, a) => a.indexOf(v) === i);
          for (let n = 0; n < sampleIds.length; n++) {
            // use sampleID to update status field in sample collection
            // eslint-disable-next-line no-await-in-loop
            await exports.updateDataByQueryParams(
              `/${sampleIds[n]}`,
              'sample',
              projectName,
              { status: 'Processing' },
              req,
              res,
              next
            );
          }
          return { status: runStatus, message: 'Run initiated', error: null };
          // **** update run status
        }
        return { status: runStatus, message: 'Run could not be started', error: runLog };
        // **** update run status
      }
    }
    return {
      status: 'error',
      message: 'Run could not be started, Target server could not found.',
      error: null
    };
  } catch (err) {
    console.log('Run could not be started', err);
    return { status: 'error', message: 'Run could not be started', error: err };
  }
};

exports.getEventLog = factory.getOne(EventLog);
exports.getAllEventLogs = async (req, res, next) => {
  const query = EventLog.find({});
  if (res.locals.Perms) {
    const permFilter = await res.locals.Perms('read');
    query.find(permFilter);
  }
  query.populate({ path: 'coll', select: 'name' });
  query.populate({ path: 'project', select: 'name' });
  query.populate({ path: 'owner', select: 'username' });
  const features = new APIFeatures(query, req.query).filter().sort();
  const jsonFilter = new APIFeatures(features.query, req.body).filter();
  let doc = await jsonFilter.query;
  res.status(200).json({
    status: 'success',
    reqeustedAt: req.requestTime,
    results: doc.length,
    data: {
      data: doc
    }
  });
};

exports.getAdminEventLog = factory.getOne(AdminEventLog);
exports.getAllAdminEventLogs = async (req, res, next) => {
  const query = AdminEventLog.find({});
  if (res.locals.Perms) {
    const permFilter = await res.locals.Perms('read');
    query.find(permFilter);
  }
  query.populate({ path: 'field', select: 'name' });
  // query.populate({ path: 'coll', select: 'name' });
  // query.populate({ path: 'project', select: 'name' });
  query.populate({ path: 'owner', select: 'username' });
  const features = new APIFeatures(query, req.query).filter().sort();
  const jsonFilter = new APIFeatures(features.query, req.body).filter();
  let doc = await jsonFilter.query;
  console.log(doc);
  res.status(200).json({
    status: 'success',
    reqeustedAt: req.requestTime,
    results: doc.length,
    data: {
      data: doc
    }
  });
};

// event tracker for project collection and field routes -> create/update/delete
exports.setAdminEventLog = target => {
  return (req, res, next) => {
    // target: "project", "collection", "field"
    // event type: "insert", "update", "delete"
    // doc: operation performed on this document
    res.locals.EventLog = async function(type, doc) {
      let field_id;
      let col;
      let proj;
      let collection_id;
      let project_id;

      if (target == 'field') {
        if (doc && doc._id) field_id = doc._id;
        if (doc.collectionID) collection_id = doc.collectionID;
        try {
          col = await Collection.findOne({ _id: collection_id })
            .select('name projectID')
            .lean();
          console.log('col', col);
          if (col && col.projectID) project_id = col.projectID;
          proj = await Project.findOne({ _id: project_id })
            .select('name')
            .lean();
        } catch (err) {
          console.log(err);
        }
      } else if (target == 'collection') {
        if (doc && doc._id) {
          collection_id = doc._id;
          col = doc;
        } else if (doc && doc[0]._id && doc[0]._id) {
          collection_id = doc[0]._id;
          col = doc[0];
        }
        try {
          if (col && col.projectID) project_id = col.projectID;
          proj = await Project.findOne({ _id: project_id })
            .select('name')
            .lean();
        } catch (err) {
          console.log(err);
        }
      } else if (target == 'project') {
        if (doc && doc._id) {
          project_id = doc._id;
          proj = doc;
        } else if (doc && doc[0]._id && doc[0]._id) {
          project_id = doc[0]._id;
          proj = doc[0];
        }
      }
      let docId;
      let docReq;
      let docRes;
      const perms = doc.perms;
      if (type == 'insert') {
        docId = doc.id;
        docReq = req.body;
        docRes = doc;
      } else if (type == 'update') {
        docId = req.params.id;
        docReq = req.body;
        docRes = doc;
      } else if (type == 'delete') {
        docId = req.params.id;
      }
      const eventDetails = {
        target,
        type,
        field: field_id,
        coll: col,
        project: proj,
        doc_id: docId,
        res: docRes,
        req: docReq,
        owner: res.locals.user.id,
        perms
      };
      try {
        await AdminEventLog.create(eventDetails);
      } catch (err) {
        return {
          status: 'error',
          message: 'Admin Event log could not be created',
          error: err
        };
      }
    };
    return next();
  };
};
