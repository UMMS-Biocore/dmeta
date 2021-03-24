const fs = require('fs');
const path = require('path');
const axios = require('axios');
const XLSX = require('xlsx');
const GSheetReader = require('g-sheets-api');
const AppError = require('./../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getChangeLog = catchAsync(async (req, res, next) => {
  const doc = fs.readFileSync(path.join(__dirname, './../NEWS'), 'utf8');
  res.status(200).json({
    status: 'success',
    data: JSON.stringify(doc)
  });
});

exports.readExcelUpload = catchAsync(async (req, res, next) => {
  const userId = res.locals.user.id;
  if (!req.body.filename) return next(new AppError(`filename not defined`, 404));
  const filename = req.body.filename;
  const filePath = `tmp/uploads/${userId}/${filename}`;
  const workbook = XLSX.readFile(filePath);
  // SheetNames is an ordered list of the sheets in the workbook
  const sheet_name_list = workbook.SheetNames;
  let docs = {};
  for (let i = 0; i < sheet_name_list.length; i++) {
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[i]], { header: 1 });
    docs[sheet_name_list[i]] = data;
  }
  res.status(200).json({
    status: 'success',
    data: docs
  });
});
exports.fileUpload = catchAsync(async (req, res, next) => {
  const userId = res.locals.user.id;
  console.log(userId);
  console.log(req.file);
  //   { fieldname: 'file',
  //     originalname: 'Experiments (10).xlsx',
  //     encoding: '7bit',
  //     mimetype:
  //     'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  //     destination: 'tmp/uploads/',
  //     filename: 'efac533ef37980e71bccfb994fcd4ae3',
  //     path: 'tmp/uploads/efac533ef37980e71bccfb994fcd4ae3',
  //     size: 16928 }
  const oldPath = req.file.path;
  const newPath = `tmp/uploads/${userId}/${req.file.originalname}`;
  const newDir = `tmp/uploads/${userId}`;
  if (!fs.existsSync(newDir)) {
    fs.mkdirSync(newDir);
  }
  if (!oldPath || !req.file.originalname) return next(new AppError(`file not found`, 404));
  fs.rename(oldPath, newPath, function(err) {
    if (err) return next(new AppError(err, 404));
    res.status(200).send(req.file);
  });
});

exports.getDnextData = catchAsync(async (req, res, next) => {
  try {
    let accessToken = '';
    let url = '';
    let method = '';
    let body = {};
    if (req.cookies['jwt-dmeta']) accessToken = req.cookies['jwt-dmeta'];
    console.log(body);

    if (req.body.url) url = req.body.url;
    if (req.body.body) body = req.body.body;
    if (req.body.method) method = req.body.method;
    let received = '';
    if (method == 'GET') {
      console.log(url);
      console.log(body);
      let { data } = await axios.get(`${url}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        data: body
      });
      received = data;
    }

    if (!received) return next(new AppError(`No document found!`, 404));
    const doc = received.data.data;

    res.status(200).json({
      status: 'success',
      reqeustedAt: req.requestTime,
      data: {
        data: doc
      }
    });
  } catch (err) {
    next(new AppError(`Error occured!`, 404));
  }
});

exports.getRemoteData = catchAsync(async (req, res, next) => {
  let headers = {};
  if (req.body.authorization) {
    headers = {
      headers: {
        Authorization: req.body.authorization
      }
    };
  }
  if (!req.body.url) return next(new AppError(`URL not found`, 404));
  const { data } = await axios.get(req.body.url, headers);
  res.status(200).json({
    status: 'success',
    data: data
  });
});

exports.getGoogleSheet = catchAsync(async (req, res, next) => {
  const sheetId = req.params.id;
  const sheetNumber = req.params.sheet;
  //console.log(sheetNumber);
  //console.log(sheetId);
  const options = {
    sheetId: sheetId,
    sheetNumber: sheetNumber,
    returnAllResults: true
  };
  //console.log(options);
  GSheetReader(
    options,
    results => {
      // do something with the results here
      res.status(200).json({
        status: 'success',
        data: JSON.stringify(results)
      });
    },
    error => {
      // OPTIONAL: handle errors here
      return next(new AppError(error, 404));
    }
  );
});
