const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const APIFeatures = require('./../utils/apiFeatures');

//* -------------- Global Variables for handlerFactory ----------------------
// 1. res.locals.Model => use as a Model (for dataRoutes)
//    e.g. if (res.locals.Model) Model = res.locals.Model;
// 2. res.locals.After => commands will be executed after query is completed
//    e.g. if (res.locals.After) res.locals.After();
// 3. res.locals.user set with `isLoggedIn` or `isLoggedInView` middleware
// 4. res.locals.Perms returns filtration creteria regarding permission
//    e.g. permission methods: authController.setDefPerms
//    usage e.g. const permFilter = await res.locals.Perms("read");
//         query.find(permFilter);

exports.deleteOne = Model =>
  catchAsync(async (req, res, next) => {
    let doc;
    if (res.locals.Model) Model = res.locals.Model;
    let query = Model.findById(req.params.id);

    let filter = {};
    if (res.locals.Filter) {
      filter = res.locals.Filter;
      query.find(filter);
    }

    // Check if deletion is allowed
    if (res.locals.Perms) {
      const permFilter = await res.locals.Perms('write');
      query.find(permFilter);
    }
    doc = await query;
    if (!doc || (Array.isArray(doc) && doc.length === 0)) {
      return next(new AppError(`No document found with ${req.params.id}!`, 404));
    }
    if (res.locals.Before) res.locals.Before();
    const delDoc = await Model.findByIdAndDelete(req.params.id);
    if (!delDoc || (Array.isArray(delDoc) && delDoc.length === 0)) {
      return next(new AppError(`No document found with ${req.params.id}!`, 404));
    }
    if (res.locals.After) res.locals.After();
    if (res.locals.EventLog) res.locals.EventLog('delete', Model.collection.collectionName, doc);

    res.status(200).json({
      status: 'success',
      data: {
        doc: 'Deleted!'
      }
    });
  });

exports.updateOne = Model =>
  catchAsync(async (req, res, next) => {
    if (res.locals.Model) Model = res.locals.Model;
    req.body.lastUpdatedUser = req.user.id;

    let excludeFields = '';
    let select = '';
    if (res.locals.ExcludeFields) excludeFields = res.locals.ExcludeFields;
    const excludeFieldsArr = excludeFields.split(' ').map(v => v.slice(1));
    const defaultExcludedFields = ['owner', 'creationDate', 'lastUpdateDate', 'lastUpdatedUser'];
    const allExcludeArr = excludeFieldsArr.concat(defaultExcludedFields);
    // don't allow to change internal parameters such as owner, creationDate etc.
    allExcludeArr.forEach(function(key) {
      if (key) delete req.body[key];
    });
    if (excludeFields) select = excludeFields;

    // find undefined fields to remove from document
    // prepare: { $set: setObj, $unset: unsetObj }
    let unsetObj = {};
    let setObj = {};
    Object.keys(req.body).forEach(k => {
      if (req.body[k] == 'undefined') {
        unsetObj[k] = 1;
      } else {
        setObj[k] = req.body[k];
      }
    });

    // Check if update is allowed
    if (res.locals.Perms) {
      let query = Model.findById(req.params.id);
      const permFilter = await res.locals.Perms('write');
      query.find(permFilter);
      const doc = await query;
      if (!doc || (Array.isArray(doc) && doc.length === 0)) {
        return next(new AppError(`No permission to update document id:${req.params.id}!`, 404));
      }
    }
    if (res.locals.Before) res.locals.Before();

    const doc = await Model.findByIdAndUpdate(
      req.params.id,
      { $set: setObj, $unset: unsetObj },
      {
        new: true,
        runValidators: true,
        context: 'query', //lets you set `this` as a query object in model validators
        select: select // exclude list of fields that are not allowed to read
      }
    );
    if (!doc) {
      return next(new AppError(`No document found with ${req.params.id}!`, 404));
    }
    if (res.locals.After) res.locals.After();
    if (res.locals.EventLog) res.locals.EventLog('update', Model.collection.collectionName, doc);

    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

exports.createOne = Model =>
  catchAsync(async (req, res, next) => {
    if (res.locals.Model) Model = res.locals.Model;
    req.body.lastUpdatedUser = req.user.id;
    req.body.owner = req.user.id;
    if (res.locals.Perms) {
      const permCreate = await res.locals.Perms('create');
      if (!permCreate) {
        return next(new AppError(`Permission denied: no write permission`, 404));
      }
    }
    // remove fields that has value undefined
    // Object.keys(req.body).forEach(k => {
    //   if (req.body[k] == 'undefined') {
    //     delete req.body[k];
    //   }
    // });

    const doc = await Model.create(req.body);
    if (res.locals.After) res.locals.After();
    if (res.locals.EventLog) {
      const eventRet = await res.locals.EventLog('insert', Model.collection.collectionName, doc);
      if (eventRet && eventRet.status == 'error') {
        return next(new AppError(`${eventRet.message} ${eventRet.error}`, 404));
      }
    }

    res.status(201).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let excludeFields;
    if (res.locals.ExcludeFields) excludeFields = res.locals.ExcludeFields;

    if (res.locals.Model) Model = res.locals.Model;
    let query = Model.findById(req.params.id);
    if (excludeFields) query.select(excludeFields);
    if (res.locals.Perms) {
      const permFilter = await res.locals.Perms('read');
      query.find(permFilter);
    }
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;
    if (!doc || (Array.isArray(doc) && doc.length === 0)) {
      return next(new AppError(`No document found with ${req.params.id}!`, 404));
    }

    res.status(200).json({
      status: 'success',
      reqeustedAt: req.requestTime,
      data: {
        data: doc
      }
    });
  });

exports.getAll = Model =>
  catchAsync(async (req, res, next) => {
    if (res.locals.Model) Model = res.locals.Model;
    let filter = {};
    let excludeFields;
    if (res.locals.Filter) filter = res.locals.Filter;
    if (res.locals.ExcludeFields) excludeFields = res.locals.ExcludeFields;
    const query = Model.find(filter);
    if (excludeFields) query.select(excludeFields);
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

    //const doc = await features.query.explain();
    const doc = await jsonFilter.query;
    if (!doc || (Array.isArray(doc) && doc.length === 0)) {
      return next(new AppError(`No document found!`, 404));
    }
    res.status(200).json({
      status: 'success',
      reqeustedAt: req.requestTime,
      results: doc.length,
      data: {
        data: doc
      }
    });
  });
