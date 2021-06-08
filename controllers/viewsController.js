const catchAsync = require('../utils/catchAsync');

exports.getOverview = catchAsync(async (req, res, next) => {
  res.status(200).render('overview', {
    title: 'Dashboard'
  });
});

exports.getAdminOverview = catchAsync(async (req, res, next) => {
  res.status(200).render('admin-overview', {
    title: 'Admin Dashboard'
  });
});

exports.getImportPage = catchAsync(async (req, res, next) => {
  res.status(200).render('import-page', {
    title: 'Import page'
  });
});

exports.getProfile = catchAsync(async (req, res, next) => {
  res.status(200).render('profile', {
    title: 'Profile'
  });
});

exports.getEvent = catchAsync(async (req, res, next) => {
  res.status(200).render('event', {
    title: 'Event History'
  });
});

exports.afterSSO = (req, res) => {
  res.status(200).render('after-sso');
};

exports.getLoginForm = (req, res, next) => {
  if (process.env.SSO_LOGIN !== 'true') {
    res.status(200).render('login', {
      title: 'Log into your account'
    });
  } else {
    next();
  }
};
