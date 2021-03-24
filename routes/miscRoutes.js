const express = require('express');
const multer = require('multer');
const miscController = require('../controllers/miscController');
const authController = require('../controllers/authController');

const upload = multer({ dest: 'tmp/uploads/' });
const router = express.Router();

router.route('/changelog').get(miscController.getChangeLog);
router.route('/remoteData').post(miscController.getRemoteData);
router.route('/getGoogleSheet/:id/:sheet').get(miscController.getGoogleSheet);

router.use(authController.isLoggedIn);
router.use(authController.requireLogin);

router.route('/fileUpload').post(upload.single('file'), miscController.fileUpload);
router.route('/readExcelUpload').post(miscController.readExcelUpload);
router.route('/getDnextData').post(miscController.getDnextData);

module.exports = router;
