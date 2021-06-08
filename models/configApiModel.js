const mongoose = require('mongoose');
const Project = require('../models/projectsModel');

const configApiSchema = new mongoose.Schema(
  {
    collectionID: {
      type: String,
      required: [true, 'A collectionID must be defined.']
    },
    config: { type: 'Mixed' },
    route: { type: 'String', required: [true, 'A route must be defined.'] },
    projectID: {
      type: mongoose.Schema.ObjectId,
      ref: 'Project',
      required: [true, 'An API config must have a project'],
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
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    minimize: false
  }
);

configApiSchema.pre(/^find/, function(next) {
  this.find({ active: { $ne: false } });
  next();
});

// for findByIdAndUpdate and findByIdAndDelete
configApiSchema.pre(/^findOneAnd/, async function(next) {
  // When running update validators with the `context` option set to 'query',
  //`this` is query object. `this.r` is query document
  this.r = await this.findOne();
  next();
});

const ConfigApi = mongoose.model('config_api', configApiSchema, 'config_api');

module.exports = ConfigApi;
