const mongoose = require('mongoose');

const userGroupSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
    validate: {
      validator: async function(v) {
        let group_id;
        if (this.group_id) {
          // for createNewField
          group_id = this.group_id;
        } else if (this.r && this.r.group_id) {
          // for findByIdAndUpdate
          group_id = this.r.group_id;
        }
        const docs = await mongoose.model('userGroup').find({
          user_id: v,
          group_id: group_id
        });
        return docs.length === 0;
      },
      message: 'User already exists in the group.'
    }
  },
  group_id: {
    type: mongoose.Schema.ObjectId,
    ref: 'Group',
    required: true
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

userGroupSchema.pre(/^find/, function(next) {
  this.find({ active: { $ne: false } });
  next();
});

userGroupSchema.pre(/^findOneAnd/, async function(next) {
  this.r = await this.findOne();
  next();
});

const UserGroup = mongoose.model('userGroup', userGroupSchema);

module.exports = UserGroup;
