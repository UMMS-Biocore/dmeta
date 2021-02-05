const express = require('express');
const authController = require('../controllers/authController');
const groupController = require('../controllers/groupController');

const router = express.Router();

router.use(authController.isLoggedIn);
router.use(authController.requireLogin);
router.use(authController.setDefPerms);

router.route('/').post(groupController.createUserGroup);
router
  .route('/')
  .get(groupController.setUserFilter, groupController.getUserGroups) //all groups belong to user
  .patch(groupController.updateUserGroup)
  .delete(groupController.deleteUserGroup);

module.exports = router;
