/* eslint-disable no-eval */
// eslint-disable-next-line no-unused-vars
const validator = require('validator');
const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const Project = require('../models/projectsModel');
const Collection = require('../models/collectionsModel');
const collectionsController = require('../controllers/collectionsController');
const projectsController = require('../controllers/projectsController');
const Field = require('../models/fieldsModel');
const AppError = require('./appError');

const modelObj = {};
exports.modelObj = modelObj;

// create schema for given fields and collection(col)
// returns schema obj e.g. { name: { type: String } }
const createSchema = async (fields, col) => {
  //
  // function parseSchemaEntry:
  // input sett => should be string, array or boolean.
  //   a. string => it must be a valid function
  //   b. boolean => it will be used directly as field setting.
  //   c. array => first element should be string (valid function) or boolean
  //            => Second item is optional and an error message.
  // e.g. true
  // e.g. "(function(v) { return v.length >2 })"
  // e.g. "(function(v) { return validator.isEmail(v) })"
  // e.g. "(function(v) { if (v.length >2){return true} else {return false} })"
  // e.g. ["(function(v) { (return v.length >2) })", "Field must be longer than 2 characters"]
  // e.g. [true, "This field is required."]
  // returns mongodb settings in object format
  // eg. { boolean: true, function: function(v) { return v.length >2 }, message:"this field is required"
  //
  const parseSchemaEntry = function(sett) {
    const ret = {};
    let checkString;
    let message;
    let boolean;
    let func;
    if (typeof sett === 'string' || sett instanceof String) {
      checkString = sett;
    } else if (typeof sett === 'boolean') {
      boolean = sett;
    } else if (Array.isArray(sett)) {
      if (sett[0]) {
        if (typeof sett[0] === 'string' || sett[0] instanceof String) {
          checkString = sett[0];
        } else if (typeof sett[0] === 'boolean') {
          boolean = sett[0];
        }
      }
      if (sett[1]) {
        message = sett[1];
      }
    }
    // Warning in eval usage!
    if (checkString) {
      try {
        const testFunc = eval(checkString);
        if (typeof testFunc === 'function') {
          func = testFunc;
        }
      } catch {
        console.log('Not a valid function: ', checkString);
        func = () => true;
      }
    }

    if (func) ret.function = func;
    if (boolean) ret.boolean = boolean;
    if (message) ret.message = message;
    return ret;
  };

  // creates object for each schema entry:
  // returns: e.g. { type: String }
  const createSchemaEntry = function(field) {
    const entry = {};
    Object.keys(field.toJSON()).forEach(k => {
      const defParams = [
        'type',
        'active',
        'default',
        'ref',
        'unique',
        'enum',
        'min',
        'max',
        'lowercase',
        'uppercase',
        'trim',
        'minlength',
        'maxlength'
      ];

      if (defParams.includes(k)) {
        entry[k] = field[k];
        //exception for parent reference
        if (k == 'type' && field[k] == 'mongoose.Schema.ObjectId') {
          entry[k] = mongoose.Schema.ObjectId;
          // mongoose type="Array" converts arrays into arrays of arrays
          // instead use type=[] to set proper array fields
        } else if (k == 'type' && field[k] == 'Array') {
          entry[k] = [];
        }
      } else if (k == 'various') {
        if (typeof field[k] === 'object' && field[k] !== null) {
          Object.assign(entry, field[k]);
        }
      } else if (k == 'required') {
        const sett = parseSchemaEntry(field[k]);
        let ret = [];
        ret[1] = sett.message ? sett.message : 'This field is required';
        if (sett.boolean) ret[0] = sett.boolean;
        else if (sett.function) ret[0] = sett.function;
        else ret = false;
        entry[k] = ret;
      } else if (k == 'checkvalid') {
        const ret = {};
        const sett = parseSchemaEntry(field[k]);
        ret.message = sett.message ? sett.message : 'Validation error';
        ret.validator = sett.function ? sett.function : () => true;
        entry['validate'] = ret;
      }
    });
    return entry;
  };

  const schema = {};
  // set default reference fields based on parentCollectionID
  if (col.parentCollectionID) {
    // fieldName: reference field name in the collection
    // parentModelName: parent collection model name
    const { fieldName, parentModelName } = await collectionsController.getParentRefField(
      col.parentCollectionID
    );
    schema[fieldName] = { type: mongoose.Schema.ObjectId, ref: parentModelName, required: true };
  }
  for (let n = 0; n < fields.length; n++) {
    const name = fields[n].name;
    const entry = createSchemaEntry(fields[n]);
    schema[name] = entry;
  }
  // set default fields
  if (!schema.perms) schema.perms = { type: 'Mixed' };
  schema.owner = { type: mongoose.Schema.ObjectId, ref: 'User' };
  schema.lastUpdatedUser = { type: mongoose.Schema.ObjectId, ref: 'User' };
  schema.creationDate = { type: Date, default: Date.now() };
  schema.lastUpdateDate = { type: Date, default: Date.now() };
  return schema;
};

// If collection belong to a project then modelName will be `${project_name}_${collection_name}
// otherwise modelName = collection_name
exports.getModelName = (collection, project) => {
  const colName = collection.name;
  const projectID = collection.projectID;
  let modelName = colName;
  if (projectID) {
    if (project[0] && project[0].name) modelName = `${project[0].name}_${colName}`;
  }
  return modelName;
};

// If collection belong to a project then modelName will be `${project_name}_${collection_name}
// otherwise modelName = collection_name
exports.getModelNameByColId = async collectionId => {
  const collection = await Collection.findById(collectionId);
  const colName = collection.name;
  const projectID = collection.projectID;
  let modelName = colName;
  console.log(projectID);
  if (projectID) {
    const project = await projectsController.getProjectById(projectID);
    console.log(project);
    if (project && project.name) modelName = `${project.name}_${colName}`;
  }
  return modelName;
};

// Update mongoose models when collection or field changes
exports.updateModel = async collectionId => {
  try {
    console.log('* Update Collection Model ID:', collectionId);
    const col = await Collection.findById(collectionId);
    if (!col) return 'done'; // collection deleted or deactivated
    const fields = await Field.find({ collectionID: collectionId });
    const projectID = col.projectID;
    let project = null;
    if (projectID) project = await projectsController.getProjectById(projectID);
    console.log('project', project);
    const modelName = exports.getModelName(col, [project]);

    // check if model created before => delete model to prevent OverwriteModelError
    if (col && mongoose.connection.models[modelName]) {
      delete mongoose.connection.models[modelName];
    }
    const schema = await createSchema(fields, col);
    // { minimize: false } => allows saving empty objects
    const Schema = new mongoose.Schema(schema, { minimize: false, strict: 'throw' });
    Schema.plugin(uniqueValidator);
    const Model = mongoose.model(modelName, Schema, modelName);
    modelObj[modelName] = Model;
    console.log(modelName, schema);
    return 'done';
  } catch (err) {
    return new AppError(`modelObj could not be updated: ${err}!`, 404);
  }
};

// On startup, get allCollections and allFields then prepare all mongoose models
// Save those models into modelObj
// If collection belong to a project then collection name will be `${project_name}_${collection_name}`
// modelObj: { experiments: Model { experiments }, projects: Model { projects } }
exports.buildModels = async () => {
  try {
    const allProjects = await Project.find({});
    const allCollections = await Collection.find({});
    const allFields = await Field.find({});
    for (let n = 0; n < allCollections.length; n++) {
      const colId = allCollections[n].id;
      const projectID = allCollections[n].projectID;
      let project = null;
      if (projectID) project = allProjects.filter(f => f.id == projectID);
      const modelName = exports.getModelName(allCollections[n], project);
      const fields = allFields.filter(f => f.collectionID == colId);
      // eslint-disable-next-line no-await-in-loop
      const schema = await createSchema(fields, allCollections[n]);
      console.log(modelName, schema);
      if (!modelObj[modelName]) {
        // { minimize: false } => allows saving empty objects
        const Schema = new mongoose.Schema(schema, { minimize: false, strict: 'throw' });
        Schema.plugin(uniqueValidator);
        const Model = mongoose.model(modelName, Schema, modelName);
        modelObj[modelName] = Model;
      }
    }
  } catch (err) {
    console.log('modelObj could not created', err);
  }
};
exports.buildModels();
