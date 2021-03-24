const CronJob = require('cron').CronJob;
const Cron = require('./dbbackup');

console.log('Cronjob for dbbackup is active.');
const job = new CronJob(
  '00 00 00 * * *',
  function() {
    const d = new Date();
    Cron.dbAutoBackUp('async');
    console.log('DB BackUp Date:', d);
  },
  null,
  false,
  'America/New_York'
);
job.start();
