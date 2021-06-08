const { get, post } = require('request');
const { promisify } = require('util');
const axios = require('axios');
const jwt = require('jsonwebtoken');
// const _ = require('lodash');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const accessTokens = require('./../controllers/accessTokenController');
const refreshTokens = require('./../controllers/refreshTokenController');
const groupController = require('./../controllers/groupController');
const collectionsController = require('./../controllers/collectionsController');
const projectsController = require('./../controllers/projectsController');
// const { modelObj } = require('./../utils/buildModels');

const [getAsync, postAsync] = [get, post].map(promisify);

const preparePermFilter = (type, filter, userId, userGroups) => {
  // permsFieldUser: defines the read/write permission of the item
  // permsFieldGroup: defines the read/write permission of the item
  const permsFieldUser = `perms.${type}.user`;
  const permsFieldGroup = `perms.${type}.group`;
  const ownerFilter = { owner: userId };
  const userFilter = {};
  const groupFilter = {};
  // filter['$or'] will check these filters: ownerFilter, userFilter, groupFilter
  // if one of them is verified, it will allow access to that item.
  // ownerFilter -> owner always allowed for read+write
  // userFilter  -> userId should be in the list of permsFieldUser of the item.
  //                Otherwise 'everyone' should be found for public access.
  // groupFilter -> If userGroups is empty don't add groupFilter to filter['$or']
  //                Otherwise check if one of the `userGroups` are found in permsFieldGroup //                of the item
  userFilter[permsFieldUser] = { $in: [userId, 'everyone'] };
  groupFilter[permsFieldGroup] = { $in: userGroups };
  if (!filter['$or']) filter['$or'] = [];
  filter['$or'].push(ownerFilter);
  filter['$or'].push(userFilter);
  if (userGroups.length > 0) filter['$or'].push(groupFilter);
  return filter;
};

exports.setDefPerms = catchAsync(async (req, res, next) => {
  // expected perms object:
  // perms: {
  //    read:{user:["2872..","3fb32..","everyone"], group:["d3ds..","46h5.."] },
  //    write:{user:["2fwr.."], group:["d3ds.."] }
  //  }
  res.locals.Perms = async function(type) {
    // format options: "match", "find"
    // (`match` used in aggregation queries, `find` used for find queries )
    // type options: "read", "write", "create"
    if (type === 'create') {
      if (!res.locals.user) return next(new AppError(`Please login to create document.`, 404));
      const userId = res.locals.user.id;
      const userRole = res.locals.user.role;
      // Creation Control of Data Models:(req.params.collectionName should be exist)
      // a) if parentCollectionID is set -> check parentCollectionID of collection
      // use parentCollectionID to learn parentDocument (`refId` in `parentColName`)
      // then check `perms` of the parentDocument
      // inherit the `perms` of the parentDocument for new document.
      // b) if parentCollectionID is null -> check restrictTo object of collection
      // expected restrictTo object:
      // restrictTo: {
      //    user:["2872..","3fb32..","everyone"],
      //    group:["d3ds..","46h5.."],
      //    role:["admin, "project-admin"]
      //  }

      // ** For insertion of Data routes:
      if (req.params.collectionName) {
        const col = await collectionsController.getCollectionByName(
          req.params.collectionName,
          req.params.projectName
        );
        // if parentCollectionID is found, check parentCollectionID for permissions
        // if (col.parentCollectionID) {
        //   // fieldName: reference field name in the collection
        //   // parentModelName: parent collection model name
        //   // refId: reference Id of the newly created document in `parentColName`
        //   const { fieldName, parentModelName } = await collectionsController.getParentRefField(
        //     col.parentCollectionID
        //   );
        //   if (parentModelName && fieldName) {
        //     if (req.body[fieldName]) {
        //       const refId = req.body[fieldName];
        //       // get refId from `modelName` collection
        //       const Model = modelObj[parentModelName];
        //       const query = Model.findById(refId);
        //       // check if parentColName's perms allows to write
        //       const permFilter = await res.locals.Perms('write');
        //       query.find(permFilter);
        //       const doc = await query.lean();
        //       if (!doc || (Array.isArray(doc) && doc.length === 0)) {
        //         return false;
        //       }
        //       // inherit parents permissions by updating req.body.perms
        //       if (!req.body.perms && doc[0].perms) req.body.perms = doc[0].perms;
        //       return true;
        //     }
        //     return next(new AppError(`'${fieldName}' must be specified to create document.`, 403));
        //   }
        // }
        // if parentCollectionID not found, then check collection.restrictTo for permissions
        if (col.restrictTo) {
          // user: defines allowed user_ids for creating item in the collection
          // group: defines allowed group_ids for creating item in the collection
          // role: defines allowed roles for creating item in the collection
          // returns (Boolean) true when access is permitted

          // inherit collection permissions by updating req.body.perms
          if (!req.body.perms && col.perms) req.body.perms = col.perms;
          const user = col.restrictTo.user;
          const group = col.restrictTo.group;
          const role = col.restrictTo.role;
          if (user && user.constructor === Array && user.includes(userId)) return true;
          if (role && role.constructor === Array && role.includes(userRole)) return true;
          if (group && group.constructor === Array) {
            // get list of group_ids belong to user as an array
            // if userGroups found in the collection group then return true
            const userGroups = await groupController.getUserGroupIds(userId);
            if (group.some(r => userGroups.includes(r))) return true;
          }
          // if parentCollectionID and restrictTo not found, then allow insertion
        } else if (!col.restrictTo) {
          // inherit collection permissions by updating req.body.perms
          if (!req.body.perms && col.perms) req.body.perms = col.perms;
          return true;
        }
        if (['admin'].includes(userRole)) return true;
        if (col.owner == userId) return true;
        // ** For creating collections
      } else if (req.body.projectID) {
        const project = await projectsController.getProjectById(req.body.projectID);
        if (!project) {
          return next(new AppError(`projectID (${req.body.projectID}) is not valid.`, 403));
        }
        if (!req.body.perms && project.perms) req.body.perms = project.perms;
        // field routes restrictedTo admin/project-admin
        return true;
        // ** For creating Fields
      } else if (req.body.collectionID) {
        const col = await collectionsController.getCollectionById(req.body.collectionID);
        if (!col) {
          return next(new AppError(`collectionID (${req.body.collectionID}) is not valid.`, 403));
        }
        if (!req.body.perms && col.perms) req.body.perms = col.perms;
        // field routes restrictedTo admin/project-admin
        return true;
      } else {
        // collection and field routes restrictedTo admin/project-admin
        // everybody can create his group/usergroup \
        // everybody can signup and login
        return true;
      }
      return false;
    }

    // permsFieldUser: defines the read/write permission of the item
    // filter -> returns mongoose filter creteria
    const permsFieldUser = `perms.${type}.user`;
    let filter = {};
    // if user not logged in - allow only public access
    if (!res.locals.user) {
      filter[permsFieldUser] = { $in: ['everyone'] };
      return filter;
    }
    // when user is logged in, res.locals.user will be available.
    if (res.locals.user) {
      const userId = res.locals.user.id;
      const userRole = res.locals.user.role;
      // allow access for admin and project-admin
      if (['admin'].includes(userRole)) return {};
      // get list of group_ids belong to user as an array
      const userGroups = await groupController.getUserGroupIds(userId);
      filter = preparePermFilter(type, filter, userId, userGroups);
      if (type == 'read') {
        // if user/group has write permission, then give read permission as well
        filter = preparePermFilter('write', filter, userId, userGroups);
      }
      return filter;
    }
  };
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin', 'project-admin']. role='user'
    if (!roles.includes(res.locals.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }

    next();
  };
};

// exports.setFindMethod = method => {
//   return (req, res, next) => {
//     res.locals.FindMethod = method;
//     next();
//   };
// };

const signToken = id => {
  const numDays = `${process.env.JWT_EXPIRES_IN}d`;
  const token = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: numDays
  });
  return token;
};

const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);

  res.cookie('jwt-dmeta', token, {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https'
  });

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

const sendTokenCookie = (token, req, res) => {
  res.cookie('jwt-dmeta', token, {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https'
  });
};

// use access&refresh tokens (which is delivered from SSO server) to get userINFO.
// use userINFO to update user data in the database.
// save tokens to database.
// on success: return updated user Object.
// on fail: return null
exports.saveAccessRefreshToken = async (accessToken, refreshToken, expiresIn) => {
  try {
    // GET USER INFO
    const userInfoObj = await getAsync({
      url: process.env.SSO_USER_INFO_URL,
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      rejectUnauthorized: false
    });
    if (userInfoObj.statusCode !== 200) {
      console.log(userInfoObj.body);
      console.log(userInfoObj.statusCode);
      return null;
    }
    const currentUser = JSON.parse(userInfoObj.body);
    console.log('currentUser', currentUser);
    const userId = currentUser._id;
    const { scope, email, username, name } = currentUser;

    if (!userId) {
      return null;
    }
    const filter = { email: email };
    const update = { $set: { sso_id: userId, name, scope, username } };
    const options = { upsert: true, new: true, setDefaultsOnInsert: true };
    const updatedUser = await User.findOneAndUpdate(filter, update, options);
    console.log('updatedUser', updatedUser);

    // SAVE ACCESS and REFRESH KEYS
    const expirationDate = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;
    await accessTokens.save(accessToken, expirationDate, userId, process.env.CLIENT_ID, scope);
    if (refreshToken != null) {
      await refreshTokens.save(refreshToken, userId, process.env.CLIENT_ID, scope);
    }
    return updatedUser;
  } catch (err) {
    console.log(err);
    return null;
  }
};

// API login for userRoutes (supports both SSO and Local Sign In)
exports.login = catchAsync(async (req, res, next) => {
  if (process.env.SSO_LOGIN === 'true') {
    // Get Client Credentials Grant at: https://tools.ietf.org/html/rfc6749#section-4.3
    // curl --insecure --user 'abc123:ssh-secret' 'https://localhost:3000/oauth/token/' --data 'grant_type=password&username=bob&password=secret'
    // returns: { "access_token" : "(some long token)", "expires_in" : 3600, "token_type" : "Bearer"}
    let { username, email, password } = req.body;
    if (!password || (!email && !username)) {
      return next(new AppError('Please provide email/username and password!', 400));
    }
    try {
      if (!username && email) username = email;

      const auth = `Basic ${Buffer.from(
        `${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`
      ).toString('base64')}`;
      const sendBody = {
        username,
        password,
        grant_type: 'password'
      };
      const { data, status } = await axios.post(
        `${process.env.SSO_URL}/api/v1/oauth/token`,
        sendBody,
        {
          headers: {
            Authorization: auth
          }
        }
      );
      const accessToken = data.access_token;
      const expiresIn = data.expires_in;
      if (status !== 200 || !accessToken) {
        res.status(status);
        res.send(data);
      }
      const user = await exports.saveAccessRefreshToken(accessToken, null, expiresIn);
      if (!user) return next(new AppError('User info not found. Login Failed', 403));
      // Send accesstoken as cookie and return accesstoken with response
      sendTokenCookie(accessToken, req, res);
      res.status(status).json({
        status: 'success',
        token: accessToken,
        data: {
          user
        }
      });
    } catch (err) {
      return next(new AppError('Login Failed', 403));
    }
  } else {
    // -- Local Login --
    let { username, email, password } = req.body;
    if (!password || (!email && !username)) {
      return next(new AppError('Please provide email/username and password!', 400));
    }
    const filter = email ? { email } : { username };
    // Check if user exists && password is correct
    const user = await User.findOne(filter).select('+password');
    if (!user || !(await user.correctPassword(password, user.password))) {
      return next(new AppError('Incorrect email or password', 401));
    }
    // 3) If everything ok, send token to client
    createSendToken(user, 200, req, res);
  }
});

exports.logout = async (req, res) => {
  res.cookie('jwt-dmeta', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  if (process.env.SSO_LOGIN === 'true') {
    res.redirect(`${process.env.SSO_URL}/api/v1/users/logout?redirect_uri=${process.env.BASE_URL}`);
  } else {
    res.redirect('/');
  }
};

// isLoggedIn or isLoggedInView should be executed before this middleware
exports.requireLogin = catchAsync(async (req, res, next) => {
  if (!res.locals.user)
    return next(new AppError('You are not logged in! Please log in to get access.', 401));
  next();
});

// Only for APIs, no error
exports.isLoggedIn = async (req, res, next) => {
  console.log('** isLoggedIn');
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies['jwt-dmeta']) {
    token = req.cookies['jwt-dmeta'];
  }
  if (!token) return next();
  let currentUser;
  if (process.env.SSO_LOGIN === 'true') {
    const tokenInfo = await accessTokens.find(token);
    if (tokenInfo != null && new Date() > tokenInfo.expirationDate) {
      await accessTokens.delete(token);
      return next();
    }
    if (tokenInfo == null) {
      try {
        const tokeninfoURL = `${process.env.SSO_URL}/api/v1/tokens/info?access_token=${token}`;
        const { data } = await axios.get(tokeninfoURL);
        const json = JSON.parse(JSON.stringify(data));
        const expiresIn = json.expires_in;
        currentUser = await exports.saveAccessRefreshToken(token, null, expiresIn);
      } catch {
        return next();
      }
    } else if (tokenInfo.userId) {
      currentUser = await User.findOne({ sso_id: tokenInfo.userId });
    }
  } else {
    try {
      const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
      currentUser = await User.findById(decoded.id);
    } catch {
      return next();
    }
  }

  if (!currentUser) {
    return next();
  }

  res.locals.token = token;
  req.user = currentUser; //alias for req.session.user
  res.locals.user = currentUser; // variables that used in the view while rendering (eg.pug)
  next();
};

// Only for rendered pages, no errors!
exports.isLoggedInView = async (req, res, next) => {
  console.log('** isLoggedInView');
  if (req.cookies['jwt-dmeta'] && req.cookies['jwt-dmeta'] != 'loggedout') {
    try {
      let currentUser;
      if (process.env.SSO_LOGIN === 'true') {
        const token = await accessTokens.find(req.cookies['jwt-dmeta']);
        if (token.userId) currentUser = await User.findOne({ sso_id: token.userId });
        res.locals.token = token;
      } else {
        const decoded = await promisify(jwt.verify)(
          req.cookies['jwt-dmeta'],
          process.env.JWT_SECRET
        );
        currentUser = await User.findById(decoded.id);
      }
      if (!currentUser) return next();

      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  } else if (process.env.SSO_LOGIN === 'true' && !req.session.loginCheck) {
    // check only if user is not logged in!
    // when user sign out, req.cookies['jwt-dmeta'] will be deleted
    // check if user authenticated on SSO server
    req.session.loginCheck = true;
    req.session.redirectURL = '/';
    const originalUrl = `${process.env.BASE_URL}${req.originalUrl}`;
    res.redirect(
      `${process.env.SSO_URL}/api/v1/oauth/check?redirect_original=${originalUrl}&redirect_uri=${process.env.SSO_REDIRECT_URL}&response_type=code&client_id=${process.env.CLIENT_ID}&scope=offline_access`
    );
  } else if (process.env.SSO_LOGIN === 'true' && req.session.loginCheck) {
    req.session.loginCheck = false;
    next();
  } else {
    next();
  }
};

// SSO Login for rendered pages (viewRoutes)
// exports.ensureSingleSignOn = async (req, res, next) => {
//   if (process.env.SSO_LOGIN === 'true') {
//     req.session.redirectURL = '/';
//     res.redirect(
//       `${process.env.SSO_AUTHORIZE_URL}?redirect_uri=${process.env.SSO_REDIRECT_URL}&response_type=code&client_id=${process.env.CLIENT_ID}&scope=offline_access`
//     );
//   } else {
//     next();
//   }
// };

/**
 * This is part of the single sign on using the OAuth2 Authorization Code grant type.  This is the
 * redirect from the authorization server.  If you send in a bad authorization code you will get the
 * response code of 400 and the message of
 * {
 *     "error": "invalid_grant",
 *     "error_description": "invalid code"
 * }
 * @param   {Object} req - The request which should have the parameter query of
 *                         ?code=(authorization code)
 * @param   {Object} res - We use this to redirect to the original URL that needed to
 *                         authenticate with the authorization server.
 * @returns {undefined}
 */
exports.ssoReceiveToken = async (req, res, next) => {
  // Get the token
  console.log('**ssoReceiveToken');
  try {
    const { statusCode, body } = await postAsync(`${process.env.SSO_URL}/api/v1/oauth/token`, {
      form: {
        code: req.query.code,
        redirect_uri: process.env.SSO_REDIRECT_URL,
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        grant_type: 'authorization_code'
      }
    });
    const msg = JSON.parse(body);
    console.log('msg', msg);
    console.log('statusCode', statusCode);
    const accessToken = msg.access_token;
    const refreshToken = msg.refresh_token;
    const expiresIn = msg.expires_in;
    // Error, someone is trying to put a bad authorization code in
    if (statusCode !== 200 || accessToken === null) {
      res.status(statusCode);
      res.send(body);
    }
    const updatedUser = await exports.saveAccessRefreshToken(accessToken, refreshToken, expiresIn);
    if (!updatedUser) {
      return next(new AppError('User info not found. Login Failed', 403));
    }

    res.locals.user = updatedUser;
    sendTokenCookie(accessToken, req, res);
    if (!req.session.loginCheck) {
      // login on pop up window
      res.redirect('/after-sso');
    } else {
      // sso login without click signin
      res.redirect(req.session.redirectURL);
    }
  } catch (e) {
    return next(new AppError('Login Failed', 403));
  }
};
