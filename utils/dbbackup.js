const path = require('path');
const execSync = require('child_process').execSync;
// Concatenate root directory path with our backup folder.
const backupDirPath = path.join(__dirname, './../tmp/dbbackup/');

const dbOptions = {
  host: 'localhost',
  port: 27017,
  database: 'dmeta-skin',
  autoBackup: true,
  removeOldBackup: false,
  keepLastDaysBackup: 2,
  autoBackupPath: backupDirPath
};

// return stringDate as a date object.
exports.stringToDate = dateString => {
  return new Date(dateString);
};

// Check if variable is empty or not.
exports.empty = mixedVar => {
  let undef;
  let key;
  let i;
  let len;
  const emptyValues = [undef, null, false, 0, '', '0'];
  for (i = 0, len = emptyValues.length; i < len; i++) {
    if (mixedVar === emptyValues[i]) {
      return true;
    }
  }
  if (typeof mixedVar === 'object') {
    // eslint-disable-next-line guard-for-in
    for (key in mixedVar) {
      return false;
    }
    return true;
  }
  return false;
};

const getNewBackupDir = () => {
  let date_ob = new Date();
  // adjust 0 before single digit date
  let date = `0${date_ob.getDate()}`.slice(-2);
  let month = `0${date_ob.getMonth() + 1}`.slice(-2);
  let year = date_ob.getFullYear();
  let hours = date_ob.getHours();
  let minutes = date_ob.getMinutes();
  let seconds = date_ob.getSeconds();
  const timeStamp = `${year}${month}${date}-${hours}${minutes}${seconds}`;
  return `${timeStamp}`;
};

// Auto backup function
exports.dbAutoBackUp = () => {
  // check for auto backup is enabled or disabled
  if (dbOptions.autoBackup == true) {
    let newBackupDir = getNewBackupDir();
    let newBackupPath = `${dbOptions.autoBackupPath}mongodump-${newBackupDir}`;
    // Command for mongodb dump process
    let cmd = `mongodump --host ${dbOptions.host} --port ${dbOptions.port} --db ${dbOptions.database} --out ${newBackupPath}`;
    console.log(cmd);
    try {
      execSync(cmd);
      console.log('backup successful');
      return true;
    } catch (err) {
      console.log('backup failed: ', err);
      return false;
    }
  }
};
