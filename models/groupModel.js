const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide group name!']
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
  lastUpdateDate: {
    type: Date,
    default: Date.now
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

groupSchema.pre(/^find/, function(next) {
  // this points to the current query
  this.find({ active: { $ne: false } });
  next();
});

const Group = mongoose.model('Group', groupSchema);

module.exports = Group;
