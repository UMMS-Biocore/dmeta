const mongoose = require('mongoose');

const eventLogSchema = new mongoose.Schema({
  type: {
    type: String,
    required: [true, 'Please provide event type.'],
    enum: ['insert', 'delete', 'update']
  },
  coll: {
    type: String,
    required: [true, 'Please provide model name.']
  },
  doc_id: {
    type: String,
    required: [true, 'Please provide document id.']
  },
  req: {
    type: 'Mixed'
  },
  res: {
    type: 'Mixed'
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
    type: 'Mixed'
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

const EventLog = mongoose.model('eventlog', eventLogSchema, 'eventlog');

module.exports = EventLog;
