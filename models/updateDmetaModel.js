const mongoose = require('mongoose');

const updateDmetaSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide update name!']
  },
  creationDate: {
    type: Date,
    default: Date.now()
  },
  lastUpdateDate: {
    type: Date,
    default: Date.now()
  }
});

const UpdateDmeta = mongoose.model('updateDmeta', updateDmetaSchema, 'updateDmeta');

module.exports = UpdateDmeta;
