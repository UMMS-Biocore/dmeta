const mongoose = require('mongoose');
const slugify = require('slugify');

// restrictTo supports group, role and user list to limit the access
// e.g. {role:["admin"]} -> will only allow admin to create an doc in the collection
// e.g. {group:["f4c6.."], role:["project-admin"],user:["7e8g4.."]}

const collectionsSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A collection must have a name'],
      validate: {
        validator: async function(v) {
          v = v.replace(/\s+/g, '_').toLowerCase();
          let projectID;
          if (this.projectID) {
            // for createNewField
            projectID = this.projectID;
          } else if (this.r && this.r.projectID) {
            // for findByIdAndUpdate
            projectID = this.r.projectID;
          }

          const docs = await mongoose.model('Collection').find({
            name: v,
            projectID: projectID
          });
          return docs.length === 0;
        },
        message: 'Name exists in the project. It has to be unique in the project!'
      }
    },
    slug: String,
    label: {
      type: String,
      required: [true, 'A collection must have a label'],
      validate: {
        validator: async function(v) {
          let projectID;
          if (this.projectID) {
            // for createNewField
            projectID = this.projectID;
          } else if (this.r && this.r.projectID) {
            // for findByIdAndUpdate
            projectID = this.r.projectID;
          }
          const docs = await mongoose.model('Collection').find({
            label: v,
            projectID: projectID
          });
          return docs.length === 0;
        },
        message: 'Label exits in the project. It has to be unique in the project!'
      }
    },
    parentCollectionID: {
      type: mongoose.Schema.ObjectId,
      ref: 'Collection',
      default: null,
      validate: {
        validator: async function(v) {
          if (v === null) return true;
          const docs = await mongoose.model('Collection').find({ _id: v });
          return docs.length > 0;
        },
        message: 'Collection id is not exist!'
      }
    },
    version: {
      type: Number,
      required: [true, 'A collection must have a version'],
      default: '1'
    },
    active: { type: 'boolean', default: true },
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
    restrictTo: {
      type: 'Mixed'
    },
    owner: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    lastUpdatedUser: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    projectID: {
      type: mongoose.Schema.ObjectId,
      ref: 'Project',
      validate: {
        validator: async function(v) {
          if (v === null) return true;
          const docs = await mongoose.model('Project').find({ _id: v });
          return docs.length > 0;
        },
        message: 'Project id is not exist!'
      }
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

collectionsSchema.index({ slug: 1 });

collectionsSchema.virtual('fields', {
  ref: 'Fields',
  foreignField: 'collectionID',
  localField: '_id'
});

collectionsSchema.pre(/^find/, function(next) {
  this.find({ active: { $ne: false } });
  next();
});

collectionsSchema.pre('save', function(next) {
  this.name = this.name.replace(/\s+/g, '_').toLowerCase();
  if (!this.slug) this.slug = slugify(this.name, { lower: true });
  next();
});

collectionsSchema.pre(/^findOneAnd/, async function(next) {
  this.r = await this.findOne();
  const update = this.getUpdate();
  if (update && update['$set'] && update['$set'].name) {
    update['$set'].name = update['$set'].name.replace(/\s+/g, '_').toLowerCase();
  }
  next();
});

const Collection = mongoose.model('Collection', collectionsSchema);

module.exports = Collection;
