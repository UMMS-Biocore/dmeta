const Event = require('../models/eventModel');
const factory = require('./handlerFactory');
// const AppError = require('./../utils/appError');

// Filter to get all fields based on selected collectionID
// {{URL}}/api/v1/collections/:collectionID/fields
// exports.setFilter = (req, res, next) => {
//   if (req.params.collectionID) res.locals.Filter = { collectionID: req.params.collectionID };
//   next();
// };

// exports.getFieldsByCollectionId = async collectionID => {
//   return await Event.find({ collectionID: collectionID }).lean();
// };

exports.getAllEvents = factory.getAll(Event);
exports.getEvent = factory.getOne(Event);
exports.createEvent = factory.createOne(Event);
exports.updateEvent = factory.updateOne(Event);
exports.deleteEvent = factory.deleteOne(Event);
