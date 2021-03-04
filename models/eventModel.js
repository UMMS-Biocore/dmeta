const mongoose = require('mongoose');
const Project = require('../models/projectsModel');

const eventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A field must have a name'],
      validate: {
        validator: async function(v) {
          let projectID;
          if (this.projectID) {
            // for createNew
            projectID = this.projectID;
          } else if (this.r && this.r.projectID) {
            if (this.r.name == v) return true;
            // for findByIdAndUpdate
            projectID = this.r.projectID;
          }
          const docs = await mongoose.model('event').find({
            name: v,
            projectID: projectID
          });
          return docs.length === 0;
        },
        message: 'Event name already exists. It has to be unique in the project!'
      }
    },
    fields: { type: 'Mixed' },
    projectID: {
      type: mongoose.Schema.ObjectId,
      ref: 'Project',
      required: [true, 'A event must have a project'],
      validate: {
        validator: async function(v) {
          const docs = await Project.find({ _id: v });
          return docs.length > 0;
        },
        message: 'Project id is not exist!'
      }
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
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

eventSchema.pre(/^find/, function(next) {
  this.find({ active: { $ne: false } });
  next();
});

// for findByIdAndUpdate and findByIdAndDelete
eventSchema.pre(/^findOneAnd/, async function(next) {
  // When running update validators with the `context` option set to 'query',
  //`this` is query object. `this.r` is query document
  this.r = await this.findOne();
  next();
});

// eventSchema.pre('save', function(next) {
//   this.name = this.name.replace(/\s+/g, '_').toLowerCase();
//   next();
// });

const Event = mongoose.model('event', eventSchema, 'event');

module.exports = Event;
