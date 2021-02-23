const mongoose = require('mongoose');

const serverSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide server name.']
  },
  type: {
    type: String,
    required: [true, 'Please provide server type.']
  },
  url_server: {
    type: String,
    required: [true, 'Please provide server url.']
  },
  url_client: {
    type: String,
    required: [true, 'Please provide url for client side.']
  },
  active: {
    type: Boolean,
    default: true,
    select: false
  },
  creationDate: {
    type: Date,
    default: Date.now()
  },
  lastUpdateDate: {
    type: Date,
    default: Date.now()
  },
  perms: {
    type: 'Mixed',
    default: { read: { user: ['everyone'] } }
  },
  owner: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  lastUpdatedUser: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }
});

const Server = mongoose.model('server', serverSchema, 'server');

module.exports = Server;
