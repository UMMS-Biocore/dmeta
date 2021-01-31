const fs = require('fs');
const path = require('path');
const axios = require('axios');
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

exports.getRemoteData = catchAsync(async (req, res, next) => {
  console.log(req.body);
  console.log(req.body.url);
  console.log(req.body.authorization);
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
