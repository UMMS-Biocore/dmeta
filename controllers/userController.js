const User = require('./../models/userModel');
const factory = require('./handlerFactory');
const AppError = require('./../utils/appError');

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

// .get('/useridwithemail/:userid', userController.getUserIDWithEmail)
// .get('/emailwithuserid/:email', userController.getEmailWithUserID);

exports.getUserIDWithEmail = async (req, res, next) => {
  let userID = '';
  const email = req.params.email;
  if (!email) return next(new AppError(`Email not found.`, 404));
  try {
    const userData = await User.find({ email: email }).exec();
    userID = userData[0].id;
  } catch {
    console.log(`Email (${email}) not found`);
  }
  if (!userID) return next(new AppError(`UserID not found.`, 404));
  res.status(201).json({
    status: 'success',
    data: {
      data: userID
    }
  });
};

exports.getEmailWithUserID = async (req, res, next) => {
  let email = '';
  const userid = req.params.userid;
  if (!userid) return next(new AppError(`UserID not found.`, 404));
  try {
    const userData = await User.find({ _id: userid }).exec();
    email = userData[0].email;
  } catch {
    console.log(`User (${userid}) not found`);
  }
  if (!email) return next(new AppError(`Email not found.`, 404));
  res.status(201).json({
    status: 'success',
    data: {
      data: email
    }
  });
};

exports.getUser = factory.getOne(User);
exports.getAllUsers = factory.getAll(User);
// Do NOT update passwords with this!
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
