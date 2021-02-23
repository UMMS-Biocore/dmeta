const { modelObj } = require('./../../utils/buildModels');
const { CounterModel } = require('../../models/counterModel');

// Insert Dolphin-ID's first time for all data collections
// Update counter data
Object.keys(modelObj).forEach(async modelName => {
  console.log('Dolphin-ID update. modelName:', modelName);
  let counter = 0;
  const Schema = modelObj[modelName];
  let updateIds = [];
  const updateData = await Schema.find({}).exec();
  if (updateData.length > 0) updateIds = updateData.map(el => el._id);
  for (let i = 0; i < updateIds.length; i++) {
    counter++;
    const id = updateIds[i];
    // eslint-disable-next-line no-loop-func
    Schema.findByIdAndUpdate(id, { DID: counter }, function(err) {
      if (err) console.log(err);
      CounterModel.findByIdAndUpdate(
        modelName,
        { seq: counter },
        { new: true, upsert: true },
        function(err2) {
          if (err2) console.log(err2);
        }
      );
    });
  }
});
