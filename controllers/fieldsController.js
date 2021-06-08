const Fields = require('../models/fieldsModel');
const collectionsController = require('../controllers/collectionsController');
const projectsController = require('../controllers/projectsController');
const factory = require('./handlerFactory');
const AppError = require('./../utils/appError');
const buildModels = require('./../utils/buildModels');
const dbbackup = require('./../utils/dbbackup');

// for post/patch requests
exports.setCollectionId = (req, res, next) => {
  if (!req.body.collections) req.body.collections = req.params.collectionID;
  next();
};

exports.getFieldsOfCollection = async collectionID => {
  return await Fields.find({ collectionID }).lean();
};

exports.getFieldsOfCollectionWithParentField = async collectionID => {
  let fieldData = await exports.getFieldsOfCollection(collectionID);
  return fieldData;
};

// Filter to get all fields based on selected collectionID
// {{URL}}/api/v1/collections/:collectionID/fields
exports.setFilter = (req, res, next) => {
  if (req.params.collectionID) res.locals.Filter = { collectionID: req.params.collectionID };
  next();
};

// asign commands to `res.locals.After` which will be executed after query is completed
exports.setAfter = async (req, res, next) => {
  let collectionID;
  try {
    // for createField
    if (req.body.collectionID) collectionID = req.body.collectionID;
    // for updateField and deleteField
    else if (req.params.id) {
      const field = await Fields.findById(req.params.id);
      if (field.collectionID) collectionID = field.collectionID;
    }
    if (collectionID) {
      res.locals.After = () => buildModels.updateModel(collectionID, null);
      return next();
    }
    return next(new AppError(`CollectionID or FieldID is not defined!`, 404));
  } catch {
    return next(new AppError(`Field is not found.`, 404));
  }
};

// transfer data of fields to targetCollection
exports.transfer = async (req, res, next) => {
  const { targetCollection, sourceCollection, type, sourceFields } = req.body;
  if (!targetCollection) return next(new AppError('Target Collecion is not defined', 404));
  if (!sourceCollection) return next(new AppError('Source Collecion is not defined', 404));
  if (!type) return next(new AppError('Type is not defined', 404));
  if (!sourceFields) return next(new AppError('SourceFields is not defined', 404));

  try {
    // 0. Stop server
    // 1. Backup database
    const backupSuccess = dbbackup.dbAutoBackUp('sync');
    if (!backupSuccess) return next(new AppError('Backup Failed.', 404));
    // 2. Check if two collection is connected with field
    let connectedField = false;
    // 2a. Check if target parentCollectionID is source collectionID.
    const targetCollData = await collectionsController.getCollectionById(targetCollection);
    const sourceCollData = await collectionsController.getCollectionById(sourceCollection);
    const targetCollectionName = targetCollData.name;
    const sourceCollectionName = sourceCollData.name;
    const projectID = targetCollData.projectID;
    const projectData = await projectsController.getProjectById(projectID);
    const projectName = projectData ? projectData.name : '';

    if (targetCollData && targetCollData.parentCollectionID == sourceCollection) {
      connectedField = `${sourceCollectionName}_id`;
    }
    // 2b. Check source fields to find ref="Project_targetCollectionName"
    const sourceFieldData = await exports.getFieldsOfCollectionWithParentField(sourceCollection);
    const targetFieldData = await exports.getFieldsOfCollectionWithParentField(targetCollection);
    const refSourceFields = sourceFieldData.filter(
      field => field.ref === `${projectName}_${targetCollectionName}`
    );
    if (refSourceFields[0]) {
      connectedField = refSourceFields[0].name;
    }
    console.log('connectedField', connectedField);

    // 3. if type== "move-ref" create ref-field in source collection
    const sourceRefField = `${targetCollectionName}_id`;

    if (type == 'move-ref') {
      let sourceRefFieldCheck = false;
      let sourceRefFieldData = sourceFieldData.filter(field => field.name == sourceRefField);
      if (sourceRefFieldData[0]) sourceRefFieldCheck = true;
      if (!sourceRefFieldCheck) {
        console.log('sourceFieldData', sourceFieldData);
        const sourceRefFieldObj = {
          ref: `${projectName}_${targetCollectionName}`,
          name: sourceRefField,
          label: sourceRefField,
          type: 'mongoose.Schema.ObjectId',
          required: true,
          collectionID: sourceCollection,
          perms: sourceCollData.perms
        };
        await Fields.create(sourceRefFieldObj);
        await buildModels.updateModel(sourceCollection, null);
      }
    }
    // 4. Create Target Fields
    let targetFieldNames = [];
    for (let i = 0; i < sourceFields.length; i++) {
      let sourceField = sourceFieldData.filter(field => field._id == sourceFields[i]);
      if (sourceField[0]) {
        sourceField = sourceField[0];
        targetFieldNames.push(sourceField.name);
        const defaultExcludedFields = [
          'owner',
          'creationDate',
          'lastUpdateDate',
          'lastUpdatedUser',
          '_id'
        ];

        defaultExcludedFields.forEach(function(key) {
          if (key) delete sourceField[key];
        });
        sourceField.collectionID = targetCollection;
        console.log('sourceField', sourceField);
        const sourceFieldName = sourceField.name;
        const targetField = targetFieldData.filter(field => field.name === sourceFieldName);
        if (!targetField[0]) {
          // insert new field
          // eslint-disable-next-line no-await-in-loop
          await Fields.create(sourceField);
          // eslint-disable-next-line no-await-in-loop
          await buildModels.updateModel(targetCollection, null);
        }
      }
    }
    // 5. Get all source collections data
    let srcModelName = sourceCollectionName;
    let targetModelName = targetCollectionName;
    if (projectName) {
      srcModelName = `${projectName}_${sourceCollectionName}`;
      targetModelName = `${projectName}_${targetCollectionName}`;
    }
    const SourceModel = buildModels.modelObj[srcModelName];
    const TargetModel = buildModels.modelObj[targetModelName];
    let select = { _id: 0 };
    if (connectedField) select[connectedField] = 1;
    for (let i = 0; i < targetFieldNames.length; i++) select[targetFieldNames[i]] = 1;

    console.log('srcModelName', srcModelName);
    let sourceDataRaw = await SourceModel.find({})
      .select(select)
      .lean();
    console.log('sourceData_first_length', sourceDataRaw.length);
    // remove objects that are all empty fields
    let sourceData = [];
    for (let i = 0; i < sourceDataRaw.length; i++) {
      const isEmpty = Object.values(sourceDataRaw[i]).every(x => x === null || x === '');
      if (!isEmpty) {
        sourceData.push(sourceDataRaw[i]);
      } else {
        console.log('isEmpty', sourceDataRaw[i]);
      }
    }

    // 6. if type=="move-ref" group the data to insert once.
    if (type == 'move-ref') {
      sourceData = sourceData.filter(
        (v, i, a) => a.findIndex(t => JSON.stringify(t) === JSON.stringify(v)) === i
      );
      console.log('sourceData_clean_length', sourceData.length);
      console.log('sourceData_clean', sourceData);
    }

    // 7. if isConnected === false then insert new data. if isConnected === true then update new data.
    for (let i = 0; i < sourceData.length; i++) {
      let success = false;
      let srcData = sourceData[i];
      console.log('srcData', srcData);
      if (connectedField && srcData[connectedField]) {
        const targetDataId = srcData[connectedField];
        delete srcData[connectedField];

        let findObj = {};
        findObj['_id'] = targetDataId;
        // eslint-disable-next-line no-await-in-loop
        let targetData = await TargetModel.find(findObj).lean();
        if (targetData[0]) {
          console.log('targetDataId', targetDataId);
          console.log('srcData', srcData);
          // eslint-disable-next-line no-await-in-loop
          await TargetModel.findByIdAndUpdate(
            targetDataId,
            { $set: srcData },
            {
              new: true,
              runValidators: true,
              context: 'query'
            }
          );
          success = true;
        }
      }
      if (!success) {
        // eslint-disable-next-line no-await-in-loop
        let sourceDataPerms = await SourceModel.find(srcData).lean();
        if (sourceDataPerms[0]) {
          srcData.perms = sourceDataPerms[0].perms;
        }
        // eslint-disable-next-line no-await-in-loop
        const doc = await TargetModel.create(srcData);
        delete srcData.perms;
        console.log('doc', doc);
        if (doc) {
          let sourceUpd = {};
          sourceUpd[sourceRefField] = doc._id;
          console.log('sourceUpd', sourceUpd);
          // eslint-disable-next-line no-await-in-loop
          await SourceModel.updateMany(
            srcData,
            { $set: sourceUpd },
            {
              new: true,
              runValidators: true,
              context: 'query'
            }
          );
        }
      }
    }
  } catch (err) {
    return next(new AppError(err, 404));
  }
  res.status(200).json({
    status: 'success'
  });
};

exports.getFieldsByCollectionId = async collectionID => {
  return await Fields.find({ collectionID: collectionID }).lean();
};
exports.getAllFields = factory.getAll(Fields);
exports.getField = factory.getOne(Fields);
exports.createField = factory.createOne(Fields);
exports.updateField = factory.updateOne(Fields);
exports.deleteField = factory.deleteOne(Fields);
