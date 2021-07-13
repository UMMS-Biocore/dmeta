const FieldsModel = require('../../models/fieldsModel');

// header field renamed as identifier for fields
//
(async () => {
  try {
    await FieldsModel.updateMany({}, { $rename: { header: 'identifier' } }, { multi: true });
  } catch (err) {
    console.log(err);
  }
})();
