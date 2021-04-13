const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  sso_id: { type: String },
  username: {
    type: String,
    required: [true, 'Please provide your username'],
    unique: true,
    validate: {
      validator: function(v) {
        return validator.matches(v, '^[a-zA-Z0-9_.-]*$');
      },
      message: 'Please provide a valid username!'
    }
  },
  name: {
    type: String,
    required: [true, 'Please tell us your name!']
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  photo: {
    type: String,
    default: 'default.jpg'
  },
  role: {
    type: String,
    enum: ['user', 'submitter', 'project-admin', 'admin'],
    default: 'user'
  },
  scope: {
    type: String
  },
  active: {
    type: Boolean,
    default: true,
    select: true
  },
  password: {
    type: String,
    minlength: 8,
    select: false
  },
  passwordConfirm: {
    type: String,
    validate: {
      // This only works on CREATE and SAVE!!!
      validator: function(el) {
        return el === this.password;
      },
      message: 'Passwords are not the same!'
    }
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date
});

userSchema.pre(/^find/, function(next) {
  // this points to the current query
  this.find({ active: { $ne: false } });
  next();
});

// userSchema.statics.FindWithDeleted = function() {
//   return this.where({ active: { $ne: true } });
// };

// Local Login Strategy
if (process.env.SSO_LOGIN !== 'true') {
  userSchema.pre('save', async function(next) {
    // Only run this function if password was actually modified
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    this.passwordConfirm = undefined;
    next();
  });

  userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
  };
}

const User = mongoose.model('User', userSchema);

module.exports = User;
