const ConfigApi = require('../models/configApiModel');
const factory = require('./handlerFactory');

exports.getAllConfigApis = factory.getAll(ConfigApi);
exports.getConfigApi = factory.getOne(ConfigApi);
exports.createConfigApi = factory.createOne(ConfigApi);
exports.updateConfigApi = factory.updateOne(ConfigApi);
exports.deleteConfigApi = factory.deleteOne(ConfigApi);
