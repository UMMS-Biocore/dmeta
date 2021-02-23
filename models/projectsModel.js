const mongoose = require('mongoose');
const slugify = require('slugify');

// restrictTo supports group, role and user list to limit the access
// e.g. {role:["admin"]} -> will only allow admin to create an doc in the collection
// e.g. {group:["f4c6.."], role:["project-admin"],user:["7e8g4.."]}

const projectsSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      required: [true, 'A project must have a name']
    },
    slug: String,
    label: {
      type: String,
      unique: true,
      required: [true, 'A project must have a label']
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
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

projectsSchema.index({ slug: 1 });

projectsSchema.pre(/^find/, function(next) {
  this.find({ active: { $ne: false } });
  next();
});

projectsSchema.pre('save', function(next) {
  this.name = this.name.replace(/\s+/g, '_').toLowerCase();
  this.slug = slugify(this.name, { lower: true });
  next();
});

projectsSchema.pre(/^findOneAnd/, async function(next) {
  this.r = await this.findOne();
  const update = this.getUpdate();
  if (update && update['$set'] && update['$set'].name) {
    update['$set'].name = update['$set'].name.replace(/\s+/g, '_').toLowerCase();
  }
  next();
});

const Project = mongoose.model('Project', projectsSchema);

module.exports = Project;
