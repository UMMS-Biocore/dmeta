const mongoose = require('mongoose');

const adminEventLogSchema = new mongoose.Schema({
  type: {
    type: String,
    required: [true, 'Please provide event type.'],
    enum: ['insert', 'delete', 'update']
  },
  target: {
    type: String,
    required: [true, 'Please provide event target.'],
    enum: ['collection', 'field', 'project']
  },
  field: {
    type: mongoose.Schema.ObjectId,
    ref: 'Fields'
  },
  coll: {
    type: mongoose.Schema.Types.Mixed
  },
  project: {
    type: mongoose.Schema.Types.Mixed
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

const AdminEventLog = mongoose.model('eventlogadmin', adminEventLogSchema, 'eventlogadmin');

module.exports = AdminEventLog;
