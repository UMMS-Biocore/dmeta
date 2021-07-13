/* eslint-disable no-sequences */
/* eslint-disable no-await-in-loop */
const _ = require('lodash');
const Projects = require('../models/projectsModel');
const Collections = require('../models/collectionsModel');
const Fields = require('../models/fieldsModel');
const buildModels = require('../utils/buildModels');
const { getPopulateObj } = require('../utils/misc');

const escapeRegExp = string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// return array of arrays
// each array is ordered list of collection relationships
const getEachBranch = (parent, Key, n, result) => {
  if (result === undefined) result = { final: [] };
  const children = parent.children;
  let returnFinal = false;
  if (Key === undefined) {
    Key = String(0);
    returnFinal = true;
  }
  let newKey = String(Key) + String(n);
  if (!result[Key]) {
    result[Key] = [];
    if (parent.id) result[Key].push(String(parent.id));
    newKey = Key;
  } else if (result[Key] && result[newKey]) {
    console.log('** Unrecognized data format:', newKey, parent.id);
  } else if (result[Key] && !result[newKey]) {
    result[newKey] = result[Key].slice();
    result[newKey].push(String(parent.id));
  }
  if (children.length === 0) {
    result.final.push(result[newKey].slice());
  }
  for (let k = 0; k < children.length; k++) {
    result = getEachBranch(children[k], newKey, k, result);
  }
  if (returnFinal) return result.final;
  return result;
};

//return array = [
//     { "id": "1", "parentids": ["0"], refFieldNames: [ 'run_id' ] },
//     { "id": "2", "parentids": ["1"], refFieldNames: [ 'biosamp_id' ] },
//     { "id": "3", "parentids": ["1"]. refFieldNames: [ 'run_id' ]  },
//     { "id": "4", "parentids": ["2", "3"], refFieldNames: [ 'run_id', 'biosamp_id' ]  },
//   ];
const getProjectTreeFlat = async projectId => {
  let treeData = [];

  try {
    const projectData = await Projects.findById({ _id: projectId });
    const projectName = projectData.name;
    const projectCollections = await Collections.find({ projectID: projectId });
    for (let i = 0; i < projectCollections.length; i++) {
      const collectionID = projectCollections[i]._id;
      let obj = { id: collectionID };
      const fields = await Fields.find({ collectionID: collectionID });
      const refFields = fields.filter(e => e.ref);
      const refCollectionIDs = [];
      //   const refCollectionLabels = [];
      const refFieldNames = [];
      for (let k = 0; k < refFields.length; k++) {
        let ref = refFields[k].ref;
        let refName = refFields[k].name;
        const PREFIX = `${projectName}_`;

        if (ref.indexOf(PREFIX) == 0) {
          const refCollectionName = ref.slice(PREFIX.length);
          const refColl = projectCollections.filter(e => e.name == refCollectionName);
          if (refColl && refColl[0]) {
            refCollectionIDs.push(String(refColl[0]._id));
            // refCollectionLabels.push(refColl[0].label);
            refFieldNames.push(refName);
          }
        }
      }
      obj['parentIds'] = refCollectionIDs;
      obj['refFieldNames'] = refFieldNames;
      treeData.push(obj);
    }
  } catch (err) {
    return err;
  }
  return treeData;
};

const unflattenTreeData = data => {
  // For each object in data, assign a children property.
  data.forEach(o => {
    o.children = [];
  });

  // For each object in data, assign a key/object pair using the id e.g
  // {
  //   culture: { "id": "culture", "parentIds": ["any"] }}
  //   ...
  // }
  // eslint-disable-next-line no-return-assign
  const map = data.reduce((a, o) => ((a[o.id] = o), a), {});

  // For each object in data, and for each parentid in that object,
  // push this object to the object where the given parentIds === ID
  data.forEach(o => o.parentIds.forEach(id => map[id] && map[id].children.push(o)));

  // Filter the data object to only root elements (where there are no parentIds)
  const output = data.filter(e => !e.parentIds.length);
  return output;
};

const getCollectionBranches = async projectID => {
  let branchData = [];
  let treeData = [];
  try {
    //1. get project flat treeData
    treeData = await getProjectTreeFlat(projectID);
    //2. unflatten treeData
    const unflattenedTreeData = unflattenTreeData(treeData);
    //3. extractEachBranch
    branchData = getEachBranch({ children: unflattenedTreeData });
  } catch (err) {
    console.log(err);
  }
  return { treeData, branchData };
};

const getPopulatedTargetVal = async (
  targetCollName,
  targetCollField,
  collectionID,
  collData,
  branchData,
  treeData,
  doc,
  varPat,
  countData
) => {
  let targetVal = '';
  try {
    // 2. select Branch that belong to both collectionID and targetCollId
    const targetColl = await Collections.find({
      name: targetCollName,
      projectID: collData.projectID
    }).lean();
    if (targetColl && targetColl[0] && targetColl[0]._id) {
      const targetCollId = String(targetColl[0]._id);
      let targetBranch = [];
      for (let t = 0; t < branchData.length; t++) {
        if (branchData[t].indexOf(targetCollId) > -1 && branchData[t].indexOf(collectionID) > -1) {
          // slice array based on selected collIDs
          targetBranch = branchData[t].slice(
            branchData[t].indexOf(targetCollId),
            branchData[t].indexOf(collectionID) + 1
          );
          break;
        }
      }

      // 3. populate according to child=parent relationships
      if (targetBranch.length) {
        // targetBranch =  [ '6033e7c551cbdcb227296be3', '603fb7331f903c05198e1378', '5f57fff635db5980ba020ff5'  ]
        // targetBranchNames =  [ 'patient', 'patient_visit', 'biosamp'  ]
        // targetBranchNames =  [ (target_coll), 'patient_visit', (collectionID)  ]

        // 3a. find parent refField for selected branch
        const modelName = await buildModels.getModelNameByColId(collectionID);
        const Model = buildModels.modelObj[modelName];
        // start populating data from last position of the targetBranch
        let query;
        let allRefFields = '';
        let popArr = [];
        for (let i = targetBranch.length - 1; i >= 0; i--) {
          //treeData: [{ "id": "1", "parentids": ["0"], refFieldNames: [ 'run_id' ] }]
          const lastTreeData = treeData.filter(obj => obj.id == targetBranch[i]);
          const parentID = targetBranch[i - 1];
          const parentIndex = lastTreeData[0].parentIds.indexOf(parentID);
          if (parentIndex > -1) {
            //.populate({
            //     path: 'experiments_id',
            //     populate: {
            //       path: 'projects_id',
            //     }
            const parentRefFieldName = lastTreeData[0].refFieldNames[parentIndex];
            if (i == targetBranch.length - 1) {
              let findObj = {};
              findObj[parentRefFieldName] = doc[parentRefFieldName];
              query = Model.find(findObj);
              popArr.push(parentRefFieldName);
              allRefFields = parentRefFieldName;
            } else {
              allRefFields = `${allRefFields} ${parentRefFieldName}`;
              const lastItem = popArr[popArr.length - 1];
              popArr.push(`${lastItem}.${parentRefFieldName}`);
            }
          }
        }

        // popArr =["experiments_id","experiments_id.projects_id", "experiments_id.test_id"]
        // returns popObj:{
        //   path: 'experiments_id',
        //   populate: { path: 'projects_id test_id' }
        // }
        let populateObj = getPopulateObj(popArr);
        query.populate(populateObj);

        let docPopulated = await query;
        const allFields = allRefFields.split(' ');
        let lastVal = docPopulated[0];
        if (!docPopulated[0]) {
          return new Error(`Parent data not found for ${targetCollField}(${varPat})`);
        }
        for (let t = 0; t < allFields.length; t++) {
          if (lastVal[allFields[t]] !== undefined) {
            lastVal = lastVal[allFields[t]];
          }
        }
        if (lastVal[targetCollField] !== undefined) {
          targetVal = lastVal[targetCollField];
        }

        if (countData) {
          const matchText = Array(targetBranch.length - 2)
            .fill('populate')
            .join('.');
          let findObj = {};
          // update populateObj to include finding _id:targetVal
          _.set(populateObj, `${matchText}.match._id`, String(targetVal));
          let newQuery = Model.find(findObj);
          newQuery.populate(populateObj);
          let populatedCountData = await newQuery;
          // filter only populated data (others returned null)
          const checkDataPath = allRefFields.replace(' ', '.');
          populatedCountData = populatedCountData.filter(function(d) {
            return _.get(d, checkDataPath);
          });
          return populatedCountData.length + 1;
        }
        return targetVal;
      }
    }
  } catch (err) {
    return err;
  }
};

exports.setNamingPattern = async function(fields, doc, next) {
  const namingPatterns = fields.filter(f => f.namingPattern);
  for (let n = 0; n < namingPatterns.length; n++) {
    //${patient.name}_${visit.visit_num}_${AUTOINCREMENT}
    let patt = namingPatterns[n].namingPattern;
    const fieldName = namingPatterns[n].name;
    const fieldId = namingPatterns[n]._id;
    const collectionID = String(namingPatterns[n].collectionID);
    let allVarArr = [];
    let replaceWith = [];
    const allVars = patt.match(/\${(.*?)}/g);

    let treeData;
    let branchData;
    let collData;
    // 1. get collection relationship array if populate required
    for (let k = 0; k < allVars.length; k++) {
      const varPat = allVars[k].match(/\${(.*?)}/)[1];
      if (varPat.match(/(.*)\.(.*)/) || varPat.match(/AUTOINCREMENT\.(.*)/)) {
        collData = await Collections.findById(collectionID).lean();
        if (collData && collData.projectID) {
          const branches = await getCollectionBranches(collData.projectID);
          treeData = branches.treeData;
          branchData = branches.branchData;
          break;
        }
      }
    }

    for (let k = 0; k < allVars.length; k++) {
      const varPat = allVars[k].match(/\${(.*?)}/)[1];
      allVarArr.push(varPat);
      // ${AUTOINCREMENT} -> global (use DID)
      // ${AUTOINCREMENT>50} -> start incrementing after 50. create new counter for this field
      // ${biosample.sample}_${AUTOINCREMENT.sample} -> get amount of siblings by checking selected parent collection
      // ${biosample.sample} -> get part of the name from parent field
      if (varPat == 'AUTOINCREMENT') {
        replaceWith.push(doc.DID);
      } else if (varPat.match(/AUTOINCREMENT>(.*)/)) {
        try {
          const oldVal = varPat.match(/AUTOINCREMENT>(.*)/)[1];
          const finalVal = parseInt(oldVal, 10) + 1;
          const newPattern = patt.replace(
            new RegExp(`\\\${${varPat}}`, 'gi'),
            `\${AUTOINCREMENT>${finalVal}}`
          );
          await Fields.findByIdAndUpdate(fieldId, {
            namingPattern: newPattern
          });
          await buildModels.updateModel(collectionID, null);
          replaceWith.push(finalVal);
        } catch (err) {
          return next(err);
        }
      } else if (varPat.match(/AUTOINCREMENT\.(.*)/)) {
        const targetCollName = varPat.match(/AUTOINCREMENT\.(.*)/)[1];
        const targetCollField = '_id';
        const targetVal = await getPopulatedTargetVal(
          targetCollName,
          targetCollField,
          collectionID,
          collData,
          branchData,
          treeData,
          doc,
          varPat,
          true
        );
        if (targetVal && targetVal.message) return next(new Error(targetVal.message));
        replaceWith.push(targetVal);
      } else if (varPat.match(/(.*)\.(.*)/)) {
        const targetCollName = varPat.match(/(.*)\.(.*)/)[1];
        const targetCollField = varPat.match(/(.*)\.(.*)/)[2];
        const targetVal = await getPopulatedTargetVal(
          targetCollName,
          targetCollField,
          collectionID,
          collData,
          branchData,
          treeData,
          doc,
          varPat,
          false
        );
        if (targetVal && targetVal.message) return next(new Error(targetVal.message));
        replaceWith.push(targetVal);
      } else {
        return next(new Error(`Unrecognized naming pattern for ${fieldName}(${varPat})`));
      }
    }
    // replace with delivered values
    for (let i = 0; i < allVarArr.length; i++) {
      const varEsc = escapeRegExp(allVarArr[i]);
      patt = patt.replace(new RegExp(`\\\${${varEsc}}`, 'gi'), replaceWith[i]);
    }
    doc[fieldName] = patt;
  }
  return doc;
};
