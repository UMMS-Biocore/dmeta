const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});

counterSchema.index({ _id: 1, seq: 1 }, { unique: true });
exports.CounterModel = mongoose.model('counter', counterSchema);

exports.autoIncrementModelDID = function(modelID, doc, next) {
  exports.CounterModel.findByIdAndUpdate(
    modelID,
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
    function(error, counter) {
      if (error) return next(error);
      doc.DID = counter.seq;
      next();
    }
  );
};
