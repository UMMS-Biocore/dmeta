const _ = require('lodash');

// popArr =["experiments_id","experiments_id.projects_id", "experiments_id.test_id"]
// returns popObj:{
//   path: 'experiments_id',
//   populate: { path: 'projects_id test_id' }
// }

exports.getPopulateObj = popArr => {
  const popObj = {};
  // * prepare popObj
  for (let i = 0; i < popArr.length; i++) {
    if (!popArr[i].match(/\./)) {
      // parent fields without dots
      if (popObj.path) popObj.path += ` ${popArr[i]}`;
      if (!popObj.path) popObj.path = popArr[i];
    } else {
      const fields = popArr[i].split('.');
      const level = fields.length;
      const lastfield = fields[level - 1];
      const populates = `populate${'.populate'.repeat(level - 2)}`; // nested populates
      // lodash used for setting multiple levels of object with dot notation
      if (!_.get(popObj, `${populates}.path`)) {
        // set `path` value with `lastfield`
        _.set(popObj, `${populates}.path`, lastfield);
      } else {
        // get last `path` value and concat with `lastfield`
        const path = _.get(popObj, `${populates}`).path;
        _.set(popObj, `${populates}.path`, `${path} ${lastfield}`);
      }
    }
  }
  return popObj;
};
