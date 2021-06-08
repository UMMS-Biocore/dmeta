const mongoose = require('mongoose');

const eventLogSchema = new mongoose.Schema({
  type: {
    type: String,
    required: [true, 'Please provide event type.'],
    enum: ['insert', 'delete', 'update']
  },
  target: {
    type: String,
    required: [true, 'Please provide event type.'],
    enum: ['collections', 'fields', 'projects', 'data']
  },
  coll: {
    type: mongoose.Schema.ObjectId,
    ref: 'Collection',
    required: [true, 'Please provide collection id.']
  },
  project: {
    type: mongoose.Schema.ObjectId,
    ref: 'Project',
    required: [true, 'Please provide project id.']
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
    default: Date.now
  },
  perms: {
    type: 'Mixed'
  },
  owner: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }
});

const EventLog = mongoose.model('eventlog', eventLogSchema, 'eventlog');

module.exports = EventLog;
