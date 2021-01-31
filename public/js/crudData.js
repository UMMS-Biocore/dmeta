/* eslint-disable */
import axios from 'axios';
import { createFormObj, convertFormObj } from './jsfuncs';

// GLOBAL SCOPE
let $s = { data: {}, collections: {}, fields: {} };

const project = 'vitiligo';

const ajaxCall = async (method, url) => {
  try {
    const res = await axios({
      method,
      url
    });
    console.log(res.data.data.data);
    return res.data.data.data;
  } catch (err) {
    console.log(err);
    return '';
  }
};

export const getCollectionFieldData = async () => {
  let [collections, fields] = await Promise.all([
    ajaxCall('GET', '/api/v1/collections'),
    ajaxCall('GET', '/api/v1/fields')
  ]);
  $s.collections = collections;
  $s.fields = fields;
};

const getDataDropdown = (id, el_class, el_name, data, def, required, fieldID) => {
  const idText = id ? `id="${id}"` : '';
  const fieldIDText = fieldID ? `fieldID="${fieldID}"` : '';
  let dropdown = `<select ${required} class="form-control ${el_class}" ${fieldIDText} ${idText} name="${el_name}">`;
  if (!required) dropdown += `<option value="" >--- Select ---</option>`;
  data.forEach(i => {
    const selected = def == i.name ? 'selected' : '';
    dropdown += `<option ${selected} value="${i._id}">${i.name}</option>`;
  });
  dropdown += `</select>`;
  return dropdown;
};

export const getFormRow = (element, label, settings) => {
  let required = '';
  let description = '';
  if (settings && settings.required) {
    required = '<span style="color:red";>*</span>';
  }
  if (settings && settings.hidden) return '';
  let ret = `
    <div class="form-group row">
        <label class="col-md-3 col-form-label text-right">${label}${required}</label>
        <div class="col-md-9">
            ${element}
        </div>
    </div>`;
  return ret;
};

const getRefFieldDropdown = async (ref, name, required, def) => {
  try {
    let refData;
    var re = new RegExp(project + '_(.*)');
    if (ref.match(re)) {
      const coll = ref.match(re)[1];
      console.log(coll);
      const projectPart = project ? `projects/${project}/` : '';
      refData = await ajaxCall('GET', `/api/v1/${projectPart}data/${coll}`);
    } else {
      refData = await ajaxCall('GET', `/api/v1/${ref}`);
    }
    const collDropdown = getDataDropdown(
      `ref-${ref}`,
      'ref-control',
      name,
      refData,
      def,
      required,
      ''
    );
    return collDropdown;
  } catch {
    return '';
  }
};

export const getFormElement = async field => {
  let ret = '';
  const type = field.type;
  const required = field.required ? 'required' : '';
  const dbType = type ? `dbType="${type}"` : '';
  const def = field.default ? field.default : '';
  const fieldID = field._id;
  if (type == 'String' || type == 'Number') {
    if (field.enum) {
      const options = field.enum.map(i => {
        return { _id: i, name: i };
      });
      ret = getDataDropdown('', '', field.name, options, def, required, fieldID);
    } else if (field.ontology) {
      ret = getDataDropdown('', 'ontology', field.name, [], def, required, fieldID);
    } else {
      ret = `<input ${dbType} class="form-control" type="text" name="${field.name}" ${required} value="${def}"></input>`;
    }
  } else if (type == 'Date') {
    ret = `<input ${dbType} class="form-control" type="date" name="${field.name}" ${required}></input>`;
  } else if (type == 'Mixed' || type == 'Array') {
    ret = `<input ${dbType} class="form-control" type="text" name="${field.name}" ${required} value="${def}"></input>`;
  } else if (type == 'mongoose.Schema.ObjectId') {
    if (field.ref) {
      ret = await getRefFieldDropdown(field.ref, field.name, required, def);
    }
  } else if (type == 'boolean') {
    const checked = def == true ? 'checked' : '';
    ret = `<input ${dbType} style="margin-left:0rem; margin-top:0.70rem;" type="checkbox" name="${field.name}" ${required} ${checked}></input>`;
  }

  return ret;
};

const getFieldsOfCollection = collectionID => {
  return $s.fields.filter(field => field.collectionID === collectionID);
};

export const getParentCollection = collectionID => {
  let parentCollID = '';
  let parentCollLabel = '';
  let parentCollName = '';
  const col = $s.collections.filter(col => col.id === collectionID);
  if (col[0] && col[0].parentCollectionID) {
    parentCollID = col[0].parentCollectionID;
    const parentColl = $s.collections.filter(col => col.id === parentCollID);
    if (parentColl[0] && parentColl[0].name) parentCollName = parentColl[0].name;
    parentCollLabel = parentColl[0] && parentColl[0].label ? parentColl[0].label : parentCollName;
  }
  return { parentCollLabel, parentCollName };
};

export const prepOntologyDropdown = async (formId, data) => {
  const formValues = $(formId).find('select.ontology');
  for (var k = 0; k < formValues.length; k++) {
    const fieldID = $(formValues[k]).attr('fieldID');
    const nameAttr = $(formValues[k]).attr('name');
    const ontologyField = $s.fields.filter(field => field._id === fieldID);
    const settings = ontologyField[0] && ontologyField[0].ontology ? ontologyField[0].ontology : '';
    console.log('settings', settings);
    if (!settings) continue;
    let url;
    let authorization = '';
    let include = [];
    let exclude = [];
    let filter = '';
    let create;
    // --- NCBO bioportal Example ---
    // { "url":"http://data.bioontology.org/search/?q=",
    //  "filter":"&ontologies=EFO&suggest=true"
    //  "authorization":"apikey token=39a74770-b709-4c1c-a69d-45d8e117e87a",
    //  "include":["Test1-Seq","Test2-Seq"],
    //  "exclude":["RNA-Seq"],
    //  "field":"collection.prefLabel",
    //  "create":true
    // }
    //
    // ontologies: https://bioportal.bioontology.org/ontologies
    // EFO:Experimental Factor Ontology
    // BAO:BioAssay Ontology
    // e.g. filter = '&ontologies=EFO&suggest=true';
    // e.g. filter = '&roots_only=true&ontologies=BAO&suggest=true';

    // --- GITHUB API Example ---
    // { "url":"https://api.github.com/legacy/repos/search/", "field":"repositories.name" }

    // e.g. for collection.prefLabel => valueField:prefLabel, treeField:collection
    let valueField = '';
    let treeField = '';
    if (typeof settings === 'string') {
      url = settings;
    } else {
      url = settings.url ? settings.url : '';
      authorization = settings.authorization ? settings.authorization : '';
      create = settings.create ? settings.create : false;
      filter = settings.filter ? settings.filter : '';
      exclude = settings.exclude ? settings.exclude : [];
      include = settings.include ? settings.include : [];
      if (settings.field) {
        if (settings.field.match(/\./)) {
          valueField = settings.field.substr(settings.field.lastIndexOf('.') + 1);
          treeField = settings.field.substr(0, settings.field.lastIndexOf('.'));
        } else {
          valueField = settings.field;
          treeField = '';
        }
      }
    }
    console.log('valueField', valueField);
    console.log('treeField', treeField);
    if (!url) continue;
    const options = {
      valueField: valueField,
      labelField: valueField,
      searchField: valueField,
      preload: true,
      create: create,
      load: function(query, callback) {
        if (!query.length) return callback();
        try {
          axios
            .post('/api/v1/misc/remoteData', {
              url: url + encodeURIComponent(query) + filter,
              authorization: authorization
            })
            .then(res => {
              console.log(res);
              let prepedData = [];
              let selData = [];
              if (treeField && res.data.data[treeField]) {
                selData = res.data.data[treeField];
              } else {
                selData = res.data.data;
              }
              for (var n = 0; n < selData.length; n++) {
                if (selData[n][valueField] && !exclude.includes(selData[n][valueField])) {
                  let obj = {};
                  obj[valueField] = selData[n][valueField];
                  prepedData.push(obj);
                }
              }
              console.log(prepedData);
              if (prepedData.length) {
                callback(prepedData);
              } else {
                callback();
              }
            });
        } catch (err) {
          console.log(err);
          callback();
        }
      },
      onInitialize: function() {
        var selectize = this;
        // include extra options on start
        if (include && include.length) {
          for (var t = 0; t < include.length; t++) {
            let opt = {};
            opt[valueField] = include[t];
            selectize.addOption([opt]);
          }
        }
        if (data[nameAttr]) {
          let opt = {};
          opt[valueField] = data[nameAttr];
          selectize.addOption([opt]);
          selectize.setValue([data[nameAttr]]);
        }
      }
    };
    $(formValues[k]).selectize(options);
  }
};

// get all form fields of selected data collection
export const getFieldsDiv = async collectionID => {
  await getCollectionFieldData();
  let ret = '';
  // 1. if parent collection id is defined, insert as a new field
  const { parentCollLabel, parentCollName } = getParentCollection(collectionID);
  if (parentCollLabel && parentCollName) {
    const ref = project ? `${project}_${parentCollName}` : parentCollName;
    const parentField = {
      ref: ref,
      name: `${parentCollName}_id`,
      type: 'mongoose.Schema.ObjectId',
      required: true
    };
    const element = await getFormElement(parentField);
    ret += getFormRow(element, parentCollLabel, parentField);
  }
  // 2. get all fields of collection
  const fields = getFieldsOfCollection(collectionID);
  for (var k = 0; k < fields.length; k++) {
    const label = fields[k].label;
    const element = await getFormElement(fields[k]);
    ret += getFormRow(element, label, fields[k]);
  }
  return ret;
};

const bindEventHandlers = () => {
  // update form fields based on selected data collection
  $(document).on('change', `select.collection-control`, async function(e) {
    const collectionID = $(this).val();
    const fieldsDiv = await getFieldsDiv(collectionID);
    $('#fieldsOfColl').empty();
    $('#fieldsOfColl').append(fieldsDiv);
    // clean log section
    $('#insert-data-coll-body')
      .parent()
      .css('display', 'none');
    $('#insert-data-coll-log').html('');
  });

  $(document).on('click', `.insert-data-coll`, async function(e) {
    e.preventDefault();
    const formValues = $(this)
      .closest('form')
      .find('input,select');
    const requiredFields = [];
    let [formObj, stop] = createFormObj(formValues, requiredFields, true);
    console.log(formObj);
    const collectionName = $('#allcollections option:selected').text();

    let body = '';
    body += '<h4 style="text-align: center; margin-bottom:10px;">Request</h4>';
    body += '<table class="table" style="width:100%"><tbody>';
    Object.keys(formObj).forEach(key => {
      body += `<tr><td>${key}</td><td>${formObj[key]}</td></tr>`;
    });
    formObj = convertFormObj(formObj);
    console.log(formObj);

    body += '</tbody></table>';
    $('#insert-data-coll-body')
      .parent()
      .css('display', 'block');
    $('#insert-data-coll-body').empty();
    $('#insert-data-coll-body').append(body);

    if (stop === false && collectionName) {
      const projectPart = project ? `projects/${project}/` : '';
      try {
        const res = await axios({
          method: 'POST',
          url: `/api/v1/${projectPart}data/${collectionName}`,
          data: formObj
        });
        console.log(res);
        if (res && res.data && res.data.status === 'success') {
          console.log('success');
          $('#insert-data-coll-log').html('success');
        }
      } catch (e) {
        let err = '';
        if (e.response && e.response.data) {
          if (e.response.data.error) err += JSON.stringify(e.response.data.error);
          if (e.response.data.message) err += JSON.stringify(e.response.data.message);
        }
        if (!err) err = JSON.stringify(e);
        $('#insert-data-coll-log').html(err);
      }
    }
  });
};

// prepare all form fields for selected collection
export const getInsertDataDiv = async () => {
  bindEventHandlers();
  await getCollectionFieldData();
  const collDropdown = getDataDropdown(
    'allcollections',
    'collection-control',
    'collection',
    $s.collections,
    '',
    ''
  );
  const collDropdownDiv = getFormRow(collDropdown, 'Collection', '');
  let ret = `
    <div class="col-sm-6" style="margin-top: 20px;">
        ${collDropdownDiv}
    </div>
  <form class="form-horizontal" >
    <div class="col-sm-6">
        <div id="fieldsOfColl">
        </div>
        <div class="form-group row">
            <div class="col-sm-12">
                <button class="btn insert-data-coll btn-primary float-right" type="button" >Insert Data</button>
            </div>
        </div>
        <div class="form-group row">
            <div class="col-sm-12">
                <div class="card" style="display:none;">
                  <div id="insert-data-coll-body" class="card-body summary_card" style="overflow:auto; ">
                  </div>
                </div>
                <p id="insert-data-coll-log"></p>
            </div>
        </div>
    </div>
  </form>`;
  return ret;
};
