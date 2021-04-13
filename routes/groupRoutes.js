const express = require('express');
const authController = require('../controllers/authController');
const groupController = require('../controllers/groupController');

const router = express.Router();

router.use(authController.isLoggedIn);
router.use(authController.requireLogin);

// get all users belonging to a group
router.route('/:id/user').get(groupController.setUserGroupFilter, groupController.getGroupUsers);
// get all groups belonging to a user or member of the user
router.route('/related').get(groupController.getRelatedGroups);

router
  .route('/')
  .get(groupController.getAllGroups)
  .post(authController.setDefPerms, groupController.createGroup);

router
  .route('/:id')
  .get(groupController.getGroup)
  .patch(authController.setDefPerms, groupController.updateGroup)
  .delete(authController.setDefPerms, groupController.deleteGroup);

module.exports = router;
