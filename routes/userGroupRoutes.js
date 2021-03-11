const express = require('express');
const authController = require('../controllers/authController');
const groupController = require('../controllers/groupController');

const router = express.Router();

router.use(authController.isLoggedIn);
router.use(authController.requireLogin);

router
  .route('/')
  .post(
    authController.setDefPerms,
    groupController.setGroupLimiter,
    groupController.createUserGroup
  )
  .get(groupController.setUserFilter, groupController.getUserGroups); //all groups belong to user
router
  .route('/:id')
  .patch(
    authController.setDefPerms,
    groupController.setGroupLimiter,
    groupController.updateUserGroup
  )
  .delete(groupController.setUserFilter, groupController.deleteUserGroup);

module.exports = router;
