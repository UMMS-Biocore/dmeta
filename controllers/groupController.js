const factory = require('./handlerFactory');
const Group = require('../models/groupModel');
const UserGroup = require('../models/userGroupModel');
const AppError = require('./../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');

exports.setUserFilter = (req, res, next) => {
  const userId = res.locals.user.id;
  if (!userId) return next(new AppError(`Please login.`, 404));
  if (userId) res.locals.Filter = { user_id: userId };
  next();
};
exports.setGroupFilter = (req, res, next) => {
  if (req.params.id) res.locals.Filter = { group_id: req.params.id };
  next();
};
exports.setGroupLimiter = async (req, res, next) => {
  if (!res.locals.Perms) return next(new AppError(`Please define permission module.`, 404));
  if (req.body.group_id) {
    try {
      const permFilter = await res.locals.Perms('write');
      const groups = await Group.find(permFilter).exec();
      const permCheck = groups.filter(g => g._id == req.body.group_id);
      if (permCheck[0]) return next();
      return next(new AppError(`You don't have permission to write into this group.`, 404));
    } catch {
      return next(new AppError(`You don't have permission to write into this group.`, 404));
    }
  }
  return next(new AppError(`group_id not defined in body.`, 404));
};

// get list of group_ids belong to user -> return as an array
exports.getUserGroupIds = async userId => {
  let userGroups;
  try {
    const userGroupData = await UserGroup.find({ user_id: userId }).exec();
    userGroups = userGroupData.map(a => a.group_id.toString());
  } catch {
    userGroups = [];
  }
  return userGroups;
};

exports.getAllGroups = factory.getAll(Group);
exports.getGroup = factory.getOne(Group);
exports.createGroup = factory.createOne(Group);
exports.updateGroup = factory.updateOne(Group);
exports.deleteGroup = factory.deleteOne(Group);

exports.getGroupUsers = factory.getAll(UserGroup);
exports.createUserGroup = factory.createOne(UserGroup);
exports.updateUserGroup = factory.updateOne(UserGroup);
exports.deleteUserGroup = factory.deleteOne(UserGroup);

// exports.getUserGroups = factory.getAll(UserGroup);
exports.getUserGroups = async (req, res, next) => {
  const Model = UserGroup;
  let filter = {};
  if (res.locals.Filter) filter = res.locals.Filter;
  const query = Model.find(filter);
  if (res.locals.Perms) {
    const permFilter = await res.locals.Perms('read');
    query.find(permFilter);
  }
  const features = new APIFeatures(query, req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const jsonFilter = new APIFeatures(features.query, req.body).filter();

  let doc = await jsonFilter.query.lean();
  if (!doc || (Array.isArray(doc) && doc.length === 0)) {
    return next(new AppError(`No user group found!`, 404));
  }
  // populate group_name information
  for (let k = 0; k < doc.length; k++) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const groupData = await Group.find({ _id: doc[k].group_id }).exec();
      if (groupData && groupData[0] && groupData[0].name) {
        doc[k]['group_name'] = groupData[0].name;
      }
    } catch {
      console.log(`group name not found`);
    }
  }
  res.status(200).json({
    status: 'success',
    reqeustedAt: req.requestTime,
    results: doc.length,
    data: {
      data: doc
    }
  });
};
