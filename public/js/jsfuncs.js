/* eslint-disable */
import axios from 'axios';
const JSON5 = require('json5');
import { getDynamicFieldsData } from './formModules/dynamicFields';

export const ajaxCall = async (method, url) => {
  try {
    const res = await axios({
      method,
      url
    });
    return res.data.data.data;
  } catch (err) {
    console.log(err);
    return '';
  }
};

export const globalEventBinders = () => {
  /* modal show form values on multiple values */
  //show field
  $(document).on('click', `.multi-value`, function(e) {
    $(this).css('display', 'none');
    const field = $(this).next();
    const isCustomized = field.hasClass('customized');
    const isSelectized = field.hasClass('selectized');
    const isDataPerms = field.hasClass('data-perms');
    const isDataRestrictTo = field.hasClass('data-restrictTo');
    if (isSelectized || isDataPerms || isDataRestrictTo || isCustomized) {
      field.css('display', 'none');
      field.next().css('display', 'block');
    } else {
      field.css('display', 'block');
    }
    $(this)
      .siblings('.multi-restore')
      .css('display', 'block');
  });
  //hide field
  $(document).on('click', `.multi-restore`, function(e) {
    $(this).css('display', 'none');
    const field = $(this)
      .siblings('.multi-value')
      .next();
    const isSelectized = field.hasClass('selectized');
    const isDataPerms = field.hasClass('data-perms');
    const isCustomized = field.hasClass('customized');
    const isDataRestrictTo = field.hasClass('data-restrictTo');
    $(this)
      .siblings('.multi-value')
      .css('display', 'block');
    field.css('display', 'none');
    if (isSelectized || isDataPerms || isDataRestrictTo || isCustomized)
      field.next().css('display', 'none');
  });
};

export const getCleanDivId = n => {
  if (n) {
    n = n
      .replace(/ /g, '_')
      .replace(/-/g, '_')
      .replace(/:/g, '_')
      .replace(/,/g, '_')
      .replace(/\$/g, '_')
      .replace(/\!/g, '_')
      .replace(/\</g, '_')
      .replace(/\>/g, '_')
      .replace(/\?/g, '_')
      .replace(/\(/g, '_')
      .replace(/\)/g, '_')
      .replace(/\"/g, '_')
      .replace(/\'/g, '_')
      .replace(/\./g, '_')
      .replace(/\//g, '_')
      .replace(/\\/g, '_')
      .replace(/@/g, '_');
  }
  return n;
};

// creates object of the form fields and change color of requiredFields
// if warn set to true, 'Please provide a valid information.' information will be added to field
// if visible set to true => display of field shouldn't be none;
// if visible set to "undefined" => hidden fields set to "undefined" to remove from db.
export const createFormObj = (formValues, requiredFields, warn, visible) => {
  var formObj = {};
  var stop = false;
  for (var i = 0; i < formValues.length; i++) {
    var name = $(formValues[i]).attr('name');
    var type = $(formValues[i]).attr('type');
    const isCustomized = $(formValues[i]).hasClass('customized');
    const isSelectized = $(formValues[i]).hasClass('selectized');
    const isDataPerms = $(formValues[i]).hasClass('data-perms');
    const isDataRestrictTo = $(formValues[i]).hasClass('data-restrictTo');
    const isDynamicFields = $(formValues[i]).hasClass('dynamicFields');
    if (isDynamicFields) continue;

    const isSetExist = $(formValues[i]).siblings('.multi-value').length;
    const isSet =
      $(formValues[i]).siblings('.multi-value').length &&
      $(formValues[i])
        .siblings('.multi-value')
        .css('display') === 'none';

    var val = '';
    if (type == 'radio') {
      for (var k = 0; k < formValues.length; k++) {
        if ($(formValues[k]).attr('name')) {
          if ($(formValues[k]).attr('name') == name && $(formValues[k]).is(':checked')) {
            val = $(formValues[k]).val();
            break;
          }
        }
      }
    } else if (type == 'checkbox') {
      if ($(formValues[i]).is(':checked')) {
        val = true;
      } else {
        val = false;
      }
    } else if ($(formValues[i]).is('select')) {
      if ($(formValues[i]).val() === '') {
        val = '';
      } else {
        val = $(formValues[i]).val();
      }
    } else {
      val = $(formValues[i]).val();
    }
    if (requiredFields.includes(name)) {
      if (val != '' && val !== null) {
        $(formValues[i]).removeClass('is-invalid');
        if (warn && $(formValues[i]).next('div.invalid-feedback').length == 1) {
          $(formValues[i])
            .next('div.invalid-feedback')
            .remove();
        }
      } else {
        $(formValues[i]).addClass('is-invalid');
        if (warn && $(formValues[i]).next('div.invalid-feedback').length == 0) {
          $(formValues[i]).after(
            '<div class="invalid-feedback text-left">Please provide a valid information.</div>'
          );
        }
        stop = true;
      }
    }

    if (
      isCustomized &&
      $(formValues[i])
        .next()
        .hasClass('dynamicFields')
    ) {
      val = getDynamicFieldsData($(formValues[i]).next());
    }

    if (isDataPerms || isDataRestrictTo) {
      const table = $(formValues[i])
        .next()
        .find('table');
      const rowData = table
        .DataTable()
        .rows()
        .data();
      val = {};
      for (var k = 0; k < rowData.length; k++) {
        const perm = rowData[k].perm;
        const type = rowData[k].type;
        const id = rowData[k].id;
        if (isDataPerms && perm && type && id) {
          if (!(perm in val)) val[perm] = {};
          if (!(type in val[perm])) val[perm][type] = [];
          if (!val[perm][type].includes(id)) val[perm][type].push(id);
        } else if (isDataRestrictTo && type && id) {
          if (!(type in val)) val[type] = [];
          if (!val[type].includes(id)) val[type].push(id);
        }
      }
    }

    if ((isSelectized || isDataPerms || isDataRestrictTo) && visible && !isSet && isSetExist) {
      if (visible == 'undefined') {
        val = 'undefined';
      } else {
        continue;
      }
    }

    if (
      isSetExist &&
      !isDataPerms &&
      !isSelectized &&
      !isDataRestrictTo &&
      visible &&
      ($(formValues[i]).css('display') == 'none' ||
        $(formValues[i])
          .closest('.row')
          .css('display') == 'none')
    ) {
      if (visible == 'undefined') {
        val = 'undefined';
      } else {
        continue;
      }
    }
    // for event form update
    // if (!isSetExist && visible == 'undefined') val = $(formValues[i]).val();
    if (name) formObj[name] = val;
  }
  return [formObj, stop];
};

export const getSimpleDropdown = (options, settings) => {
  let idAttr = '';
  let nameAttr = '';
  let classAttr = '';
  if (settings.id) idAttr = `id="${settings.id}"`;
  if (settings.name) nameAttr = settings.name;
  if (settings.class) classAttr = settings.class;
  let dropdown = `<select class="form-control ${classAttr}" name="${nameAttr}" ${idAttr}>`;
  if (settings.placeholder) {
    dropdown += `<option value="" >${settings.placeholder}</option>`;
  }
  options.forEach(i => {
    dropdown += `<option  value="${i._id}">${i.name}</option>`;
  });
  dropdown += `</select>`;
  return dropdown;
};

// convert string fields to array/object
export const convertFormObj = formObj => {
  Object.keys(formObj).forEach(key => {
    try {
      if (
        formObj[key] &&
        typeof formObj[key] === 'string' &&
        (formObj[key].charAt(0) == '{' ||
          formObj[key].charAt(0) == '[' ||
          formObj[key] === 'false' ||
          formObj[key] === 'true')
      ) {
        let val = JSON5.parse(formObj[key]);
        formObj[key] = val;
      }
    } catch (err) {
      console.log('format error', err);
    }
  });
  return formObj;
};

export const getUpdatedFields = (beforeUpdate, formObj) => {
  Object.keys(formObj).forEach(key => {
    if (beforeUpdate[key]) {
      if (JSON.stringify(beforeUpdate[key]) == JSON.stringify(formObj[key])) {
        delete formObj[key];
      }
    }
    // if (!beforeUpdate[key] && formObj[key] === '') {
    //   delete formObj[key];
    // }
  });
  return formObj;
};

export const hideFormError = formValues => {
  for (var i = 0; i < formValues.length; i++) {
    $(formValues[i]).removeClass('is-invalid');
    if ($(formValues[i]).next('div.invalid-feedback').length > 0) {
      $(formValues[i])
        .next('div.invalid-feedback')
        .remove();
    }
  }
};

export const getDropdownFields = (data, fieldsOfCollection) => {
  let header = [];
  if (fieldsOfCollection) {
    const headerFields = fieldsOfCollection.filter(f => f.identifier === true);
    if (headerFields) {
      header = headerFields.map(field => field.name);
    }
  }
  const allFields = Object.keys(data);
  const excludeFields = [
    'DID',
    'perms',
    '_id',
    'DID',
    'creationDate',
    'lastUpdateDate',
    'lastUpdatedUser',
    'owner'
  ];
  let showFields = allFields.filter(
    el =>
      !(
        excludeFields.includes(el) ||
        !data[el] ||
        data[el] === null ||
        typeof data[el] === 'object' ||
        typeof data[el] === 'boolean'
      )
  );
  if (header[0] && showFields.includes(header[0])) {
    showFields = showFields.filter(item => item !== header[0]);
    showFields.unshift(header[0]);
  } else if (showFields.includes('name')) {
    showFields = showFields.filter(item => item !== 'name');
    showFields.unshift('name');
  }
  return showFields;
};

export const showFormError = (formValues, errorFields, warn) => {
  let showSuccess = false;
  if (errorFields) {
    for (var i = 0; i < formValues.length; i++) {
      var name = $(formValues[i]).attr('name');
      if (name in errorFields) {
        showSuccess = true;
        $(formValues[i]).addClass('is-invalid');
        if (errorFields[name]['message'] && warn) {
          const errorText = errorFields[name]['message'];
          if ($(formValues[i]).next('div.invalid-feedback').length == 0) {
            $(formValues[i]).after(`<div class="invalid-feedback text-left">${errorText}</div>`);
          } else {
            $(formValues[i])
              .next('div.invalid-feedback')
              .remove()
              .after(`<div class="invalid-feedback text-left">${errorText}</div>`);
          }
        }
      }
    }
  }
  return showSuccess;
};

export const showInfoModal = text => {
  const modalId = '#infoModal';
  const textID = '#infoModalText';
  //true if modal is open
  if ($(textID).html().length) {
    const oldText = $(textID).html();
    const newText = oldText + '<br/><br/>' + text;
    $(textID).html(newText);
  } else {
    $(modalId).off();
    $(modalId).on('show.coreui.modal', function(event) {
      $(textID).html(text);
    });
    $(modalId).on('hide.coreui.modal', function(event) {
      $(textID).html('');
    });
    $(modalId).modal('show');
  }
};

export const prepareMultiUpdateModal = (formId, formBodyId, find) => {
  const formValues = $(formId).find(find);
  $(formBodyId).prepend(
    '<p> Each field contains different values for that input. To edit and set all items to the same value, click on the field, otherwise they will retain their individual values.</p>'
  );
  for (var k = 0; k < formValues.length; k++) {
    const isSelectized = $(formValues[k]).hasClass('selectized');
    const isDataPerms = $(formValues[k]).hasClass('data-perms');
    const isDataRestrictTo = $(formValues[k]).hasClass('data-restrictTo');
    const isCustomized = $(formValues[k]).hasClass('customized');

    const nameAttr = $(formValues[k]).attr('name');
    if (nameAttr) {
      $(formValues[k]).before(`<div class="multi-value" > Multiple Values</div>`);
      $(formValues[k]).css('display', 'none');
      if (isSelectized || isDataPerms || isDataRestrictTo || isCustomized) {
        $(formValues[k])
          .next()
          .css('display', 'none');
        $(formValues[k])
          .next()
          .after(`<div class="multi-restore" style="display:none;"> Undo changes</div>`);
      } else {
        $(formValues[k]).after(
          `<div class="multi-restore" style="display:none;"> Undo changes</div>`
        );
      }
    }
  }
};

export const prepareClickToActivateModal = (formId, formBodyId, find, data) => {
  const formValues = $(formId).find(find);
  if (formBodyId) {
    $(formBodyId).prepend('<p> Please click to boxes below to set fields.</p>');
  }
  for (var k = 0; k < formValues.length; k++) {
    const isRequired = $(formValues[k]).attr('required');
    const nameAttr = $(formValues[k]).attr('name');
    const isSelectized = $(formValues[k]).hasClass('selectized');
    const isCustomized = $(formValues[k]).hasClass('customized');
    const isNoHide = $(formValues[k]).hasClass('no-hide');
    const isDataPerms = $(formValues[k]).hasClass('data-perms');
    const isDataRestrictTo = $(formValues[k]).hasClass('data-restrictTo');

    if (!isRequired && nameAttr && !isNoHide) {
      // value not filled
      if (!(nameAttr in data) || data[nameAttr] === null) {
        $(formValues[k]).before(`<div class="multi-value" > Click to Set Field </div>`);
        if (isSelectized || isDataPerms || isDataRestrictTo || isCustomized) {
          $(formValues[k])
            .next()
            .after(`<div class="multi-restore" style="display:none;"> Unset Field</div>`);
          $(formValues[k])
            .css('display', 'none')
            .next()
            .css('display', 'none');
        } else {
          $(formValues[k]).after(
            `<div class="multi-restore" style="display:none;"> Unset Field</div>`
          );
          $(formValues[k]).css('display', 'none');
        }
      } else {
        // value filled
        $(formValues[k]).before(
          `<div class="multi-value" style="display:none;"> Click to Set Field </div>`
        );
        if (isSelectized || isDataPerms || isDataRestrictTo || isCustomized) {
          $(formValues[k])
            .next()
            .after(`<div class="multi-restore" > Unset Field</div>`);
        } else {
          $(formValues[k]).after(`<div class="multi-restore" > Unset Field</div>`);
        }
      }
    }
  }
};

//use name attr to fill form
export const fillFormByName = (formId, find, data, reset) => {
  if (reset && $(formId)[0] && $(formId)[0].reset) $(formId)[0].reset();
  const formValues = $(formId).find(find);
  for (var k = 0; k < formValues.length; k++) {
    const nameAttr = $(formValues[k]).attr('name');
    const radioCheck = $(formValues[k]).is(':radio');
    const checkboxCheck = $(formValues[k]).is(':checkbox');
    // if select-text-opt class is found, select dropdown options based on text of the options
    const isSelectTextOpt = $(formValues[k]).hasClass('select-text-opt');
    // if selectized
    const isSelectized = $(formValues[k]).hasClass('selectized');
    // console.log('isSelectized', isSelectized, $(formValues[k]));
    // console.log('isSelectTextOpt', isSelectTextOpt, $(formValues[k]));
    if (data[nameAttr]) {
      if (radioCheck) {
        if (data[nameAttr] == $(formValues[k]).val()) {
          $(formValues[k]).attr('checked', true);
        }
      } else if (checkboxCheck) {
        if (
          data[nameAttr] == $(formValues[k]).val() ||
          data[nameAttr] === true ||
          data[nameAttr] === 'true'
        ) {
          $(formValues[k]).attr('checked', true);
        } else {
          $(formValues[k]).attr('checked', false);
        }
      } else {
        if (data[nameAttr] === 'on') {
          $(formValues[k]).attr('checked', true);
        } else {
          if (isSelectTextOpt && isSelectized) {
            const options = $(formValues[k])[0].selectize.options;
            let item = '';
            Object.keys(options).forEach((k, i) => {
              if (options[k].text == data[nameAttr]) item = k;
            });
            if (item) $(formValues[k])[0].selectize.setValue(item, false);
          } else if (isSelectTextOpt) {
            const item = $(formValues[k])
              .find('option')
              .filter(function() {
                return $(this).html() == data[nameAttr];
              })
              .val();
            if (item) $(formValues[k]).val(item);
          } else if (isSelectized) {
            $(formValues[k])[0].selectize.setValue(data[nameAttr], false);
          } else {
            $(formValues[k]).val(data[nameAttr]);
          }
        }
      }
    }
  }
};

export const showInfoInDiv = (textID, text) => {
  //true if modal is open
  const oldText = $(textID).html();
  let newText = '';
  if (oldText.length) {
    newText = oldText + '<br/>' + text;
  } else {
    newText = text;
  }
  $(textID).html(newText);
};

//e.g. const groupByYear = groupArrayOfObj("year"); groupByyear(albums);
// returns function that groups based on selected key.
export const groupArrayOfObj = key => {
  return function group(array) {
    return array.reduce((acc, obj) => {
      const property = obj[key];
      acc[property] = acc[property] || [];
      acc[property].push(obj);
      return acc;
    }, {});
  };
};

export const IsJsonString = str => {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
};
export const IsJson5String = str => {
  try {
    JSON5.parse(str);
  } catch (e) {
    return false;
  }
  return true;
};
