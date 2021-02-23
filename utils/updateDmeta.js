/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
const fs = require('fs');
const UpdateDmeta = require('./../models/updateDmetaModel.js');

exports.update = async () => {
  try {
    let dbPatches = [];
    const updateData = await UpdateDmeta.find({}).exec();
    const patchFolder = './db/patch/';
    if (updateData.length > 0) dbPatches = updateData.map(el => el.name);

    fs.readdirSync(patchFolder).forEach(file => {
      if (!dbPatches.includes(file)) {
        // new path found
        console.log(`new patch (${file}) will be executed`);
        try {
          require(`./../db/patch/${file}`);
          console.log(`patch (${file}) successfully executed`);
          const updt = new UpdateDmeta({ name: file });
          updt.save(function() {
            console.log(`db (${file}) successfully updated`);
          });
        } catch (err) {
          console.error('Update failed.', err);
        }
      }
    });
  } catch (err) {
    console.error('Update failed.', err);
  }
};
