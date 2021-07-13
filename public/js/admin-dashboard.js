/* eslint-disable */
import axios from 'axios';
import {
  getCleanDivId,
  createFormObj,
  showInfoModal,
  convertFormObj,
  fillFormByName,
  getUpdatedFields,
  prepareMultiUpdateModal,
  prepareClickToActivateModal,
  getSimpleDropdown,
  IsJson5String
} from './jsfuncs';
import Sortable from 'sortablejs';
import { getCrudButtons, crudAjaxRequest } from './dashboard';
import { getFormElement, getFormRow } from './formModules/crudData';
import { prepDataPerms } from './formModules/dataPerms';
import { prepDataRestrictTo } from './formModules/dataRestrictTo';
import { refreshTreeView } from './treeView';
const JSON5 = require('json5');

// GLOBAL SCOPE
let $s = { data: {}, collectionCounter: 0 };
$s.AdminCollectionFields = [
  'name',
  'label',
  'type',
  'required',
  'unique',
  'hidden',
  'default',
  'identifier',
  'namingPattern',
  'enum',
  'ontology',
  'checkvalid',
  'min',
  'max',
  'lowercase',
  'uppercase',
  'minlength',
  'maxlength',
  'trim',
  'ref',
  'perms',
  'collectionID',
  'id',
  'creationDate',
  'lastUpdateDate'
];

$s.AdminAllCollectionFields = [
  'name',
  'label',
  'version',
  'projectID',
  'id',
  'restrictTo',
  'perms',
  'owner',
  'creationDate',
  'lastUpdateDate'
];

$s.AdminAllProjectFields = [
  'name',
  'label',
  'id',
  'restrictTo',
  'perms',
  'owner',
  'creationDate',
  'lastUpdateDate'
];

const fieldsOfProjectModel = {
  name: {
    name: 'name',
    label: 'Name',
    type: 'String',
    required: true
  },
  label: {
    name: 'label',
    label: 'Label',
    type: 'String',
    required: true
  },
  restrictTo: {
    name: 'restrictTo',
    label: 'RestrictTo',
    type: 'Mixed'
  },
  perms: {
    name: 'perms',
    label: 'Permissions',
    type: 'Mixed'
  }
};

const fieldsOfCollectionsModel = {
  name: {
    name: 'name',
    label: 'Name',
    type: 'String',
    required: true
  },
  label: {
    name: 'label',
    label: 'Label',
    type: 'String',
    required: true
  },
  projectID: {
    name: 'projectID',
    label: 'Project',
    type: 'mongoose.Schema.ObjectId',
    ref: 'projects',
    required: true
  },
  version: {
    name: 'version',
    label: 'Version',
    type: 'Number',
    required: true,
    default: '1'
  },
  restrictTo: {
    name: 'restrictTo',
    label: 'RestrictTo',
    type: 'Mixed'
  },
  perms: {
    name: 'perms',
    label: 'Permissions',
    type: 'Mixed'
  }
};
const fieldsOfFieldsModel = {
  name: {
    name: 'name',
    label: 'Name',
    type: 'String',
    required: true
  },
  label: {
    name: 'label',
    label: 'Label',
    type: 'String',
    required: true
  },
  type: {
    name: 'type',
    label: 'Type',
    type: 'String',
    required: true,
    default: 'String',
    enum: ['String', 'Number', 'Boolean', 'Array', 'Date', 'Mixed', 'mongoose.Schema.ObjectId']
  },
  collectionID: {
    name: 'collectionID',
    label: 'Collection',
    type: 'mongoose.Schema.ObjectId',
    ref: 'collections',
    required: true
  },
  description: {
    name: 'description',
    label: 'Description',
    type: 'String'
  },
  unique: {
    name: 'unique',
    label: 'Unique',
    type: 'boolean'
  },
  identifier: {
    name: 'identifier',
    label: 'Identifier',
    type: 'boolean'
  },
  namingPattern: {
    name: 'namingPattern',
    label: 'Naming Pattern',
    type: 'String'
  },
  hidden: {
    name: 'hidden',
    label: 'Hidden',
    type: 'boolean'
  },
  required: {
    name: 'required',
    label: 'Required',
    type: 'Mixed',
    default: false
  },

  ontology: {
    name: 'ontology',
    label: 'Ontology',
    type: 'Mixed'
  },
  checkvalid: {
    name: 'checkvalid',
    label: 'CheckValid',
    type: 'Mixed'
  },
  default: {
    name: 'default',
    label: 'Default',
    type: 'String'
  },
  ref: {
    name: 'ref',
    label: 'Ref',
    type: 'String'
  },
  enum: {
    name: 'enum',
    label: 'Enum',
    type: 'Mixed'
  },

  min: {
    name: 'min',
    label: 'Min',
    type: 'Mixed'
  },
  max: {
    name: 'max',
    label: 'Max',
    type: 'Mixed'
  },
  lowercase: {
    name: 'lowercase',
    label: 'Lowercase',
    type: 'boolean'
  },
  uppercase: {
    name: 'uppercase',
    label: 'Uppercase',
    type: 'boolean'
  },
  trim: {
    name: 'trim',
    label: 'Trim',
    type: 'boolean'
  },

  minlength: {
    name: 'minlength',
    label: 'Minlength',
    type: 'Number'
  },
  maxlength: {
    name: 'maxlength',
    label: 'Maxlength',
    type: 'Number'
  },
  perms: {
    name: 'perms',
    label: 'Permissions',
    type: 'Mixed'
  }
};

const ajaxCall = async (method, url) => {
  console.log(method, url);
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

const getTableHeaders = (collID, projectId) => {
  let ret = '';
  ret += `<th></th>`; // for checkboxes
  // ret += `<th>Order</th>`; // for order

  let headerList;
  if (collID == `all_collections_${projectId}`) {
    headerList = $s.AdminAllCollectionFields;
  } else if (collID == 'all_projects') {
    headerList = $s.AdminAllProjectFields;
  } else {
    headerList = $s.AdminCollectionFields;
  }
  for (var k = 0; k < headerList.length; k++) {
    const label = headerList[k].charAt(0).toUpperCase() + headerList[k].slice(1);
    ret += `<th>${label}</th>`;
  }
  return ret;
};

const getCollectionTable = (collID, projectID) => {
  const headers = getTableHeaders(collID, projectID);
  const ret = `
  <div id="warning-${collID}" style="margin-top:10px;"></div>
  <div class="table-responsive" style="overflow-x:auto; width:100%; ">
    <table id="${collID}" class="table table-striped" style="white-space:nowrap;  width:100%;" cellspacing="0" cellpadding="0" border="0">
        <thead>
            <tr>
            ${headers}
            </tr>
        <tbody>
        </tbody>
    </thead>
    </table>
  </div>`;
  return ret;
};

const getFieldsOfCollection = collectionID => {
  if (!$s.fields.length) return [];
  return $s.fields.filter(field => field.collectionID === collectionID);
};
const getCollectionsOfProject = projectID => {
  if (!$s.collections.length) return [];
  return $s.collections.filter(field => field.projectID === projectID);
};

const prepareDataForSingleColumn = async (tableID, projectID) => {
  let data;
  let ret = [];
  if (tableID == `all_collections_${projectID}`) {
    // Use "$s.collections" prepare all_collections table
    data = getCollectionsOfProject(projectID);
  } else if (tableID == 'all_projects') {
    // Use "$s.projects" prepare all_projects table
    data = $s.projects;
  } else {
    // Use $s.fields to prepare data
    data = getFieldsOfCollection(tableID);
  }
  const dataCopy = data.slice();
  if (dataCopy) {
    ret = dataCopy.map((el, index) => {
      let newObj = {};
      $.each(el, function(k) {
        // custom view for all_collections tab -> projectID field (show name of the project)
        if (tableID == `all_collections_${projectID}` && k === `projectID` && el[k]) {
          const projectData = $s.projects.filter(p => p._id == el[k]);
          if (projectData[0] && projectData[0].name) {
            newObj[k] = projectData[0].name;
          } else {
            newObj[k] = el[k];
          }
        } else if (
          (typeof el[k] === 'object' && el[k] !== null) ||
          Array.isArray(el[k]) ||
          typeof el[k] === 'boolean'
        ) {
          newObj[k] = JSON.stringify(el[k]);
        } else {
          newObj[k] = el[k];
        }
      });
      // newObj['order'] = index;
      return newObj;
    });
  }
  return ret;
};

const refreshDataTables = async (TableID, projectID) => {
  if (!$.fn.DataTable.isDataTable(`#${TableID}`)) {
    const data = await prepareDataForSingleColumn(TableID, projectID);
    console.log(TableID, data);
    let columns = [];
    let fieldList;
    if (TableID == `all_collections_${projectID}`) {
      fieldList = $s.AdminAllCollectionFields;
    } else if (TableID == 'all_projects') {
      fieldList = $s.AdminAllProjectFields;
    } else {
      fieldList = $s.AdminCollectionFields;
    }
    columns.push({ data: '_id' }); // for checkboxes
    // columns.push({ data: 'order' }); // for order
    for (var i = 0; i < fieldList.length; i++) {
      columns.push({ data: fieldList[i] });
    }
    var dataTableObj = {
      columns: columns,
      columnDefs: [
        { defaultContent: '', targets: '_all' }, //hides undefined error,
        {
          targets: 0,
          checkboxes: {
            selectRow: true
          }
        }
      ],
      lengthMenu: [
        [10, 25, 50, -1],
        [10, 25, 50, 'All']
      ],
      select: {
        style: 'multiple'
      }
      // order: [[1, 'asc']]
    };
    // if (TableID !== `all_collections_${projectID}` && TableID !== 'all_projects') {
    //   dataTableObj.rowReorder = { selector: 'tr', dataSrc: 'order' };
    // }

    dataTableObj.dom = '<"pull-left"f>lrt<"pull-left"i><"bottom"p><"clear">';
    dataTableObj.destroy = true;
    dataTableObj.pageLength = 25;
    dataTableObj.data = data;
    dataTableObj.hover = true;
    // speed up the table loading
    dataTableObj.deferRender = true;
    dataTableObj.scroller = true;
    dataTableObj.colReorder = true;
    dataTableObj.scrollX = '500';
    $s.TableID = $(`#${TableID}`).DataTable(dataTableObj);
    // $s.TableID.on('row-reorder', function(e, diff, edit) {
    //   let result = 'Reorder started on row: ' + edit.triggerRow.data()[1] + '<br>';
    //   console.log(edit);
    //   console.log(result);
    //   console.log(diff);

    //   for (let i = 0, ien = diff.length; i < ien; i++) {
    //     // let rowData = $s.TableID.row(diff[i].node).data();
    //     result +=
    //       ' updated to be in position ' + diff[i].newData + ' (was ' + diff[i].oldData + ')<br>';
    //   }

    //   console.log('Event result:<br>' + result);
    // });
  } else {
    $s.collections = await ajaxCall('GET', '/api/v1/collections');
    $s.fields = await ajaxCall('GET', '/api/v1/fields');
    $s.projects = await ajaxCall('GET', '/api/v1/projects');
    const data = await prepareDataForSingleColumn(TableID, projectID);

    $(`#${TableID}`)
      .DataTable()
      .clear()
      .rows.add(data)
      .draw();
  }
  if (TableID != `all_collections_${projectID}` && TableID != 'all_projects') {
    checkIdentifierField(TableID);
  }
};

const checkIdentifierField = collID => {
  const identifierField = $s.fields.filter(f => f.identifier && f.collectionID == collID);
  let text = '';
  if (identifierField.length < 1) {
    text = 'Please define an identifier field for this collection.';
  } else if (identifierField.length > 1) {
    text =
      'More than one identifier field has been defined for this collection. Only one identifier field is allowed for a collection. Please remove the excess field(s).';
  }
  if (text) {
    $(`#warning-${collID}`).html(`<div class="alert alert-danger" role="alert">${text}</div>`);
  } else {
    $(`#warning-${collID}`).html('');
  }
};

const showTableTabs = () => {
  $(document).on('show.coreui.tab', 'a.collection[data-toggle="tab"]', function(e) {
    const tableID = $(e.target).attr('tableID');
    const projectID = $(e.target).attr('projectID');
    refreshDataTables(tableID, projectID);
    if (tableID == `tree_view_${projectID}`) {
      refreshTreeView(projectID, $s, false);
    }
    $('[data-toggle="tooltip"]').tooltip();
  });
  $(document).on('shown.coreui.tab', 'a.collection[data-toggle="tab"]', function(e) {
    $($.fn.dataTable.tables(true))
      .DataTable()
      .columns.adjust();
  });
};
const getErrorDiv = () => {
  return '<p style="background-color:#e211112b;" id="crudModalError"></p>';
};

const updateNavbarTables = async (collID, projectID) => {
  if (collID == 'all_projects') {
    await refreshAdminProjectNavbar();
  } else if (collID == `all_collections_${projectID}`) {
    await refreshCollectionNavbar(projectID, 'refresh');
  } else {
    refreshDataTables(collID, projectID);
  }
};

const refreshAPIWorkflow = async (projectID, apiID, type) => {
  const workflow = await getAPIWorkflow(projectID, type);
  $(`#api-workflow-${projectID}`).empty();
  $(`#api-workflow-${projectID}`).append(workflow);
  if (apiID && $s.apis) {
    const api = $s.apis.filter(e => e._id == apiID);
    if (typeof api[0].config === 'object' && api[0].config !== null) {
      api[0].config = JSON.stringify(api[0].config);
    }
    fillFormByName(`#api-workflow-${projectID}`, 'input, select, textarea', api[0], true);
  } else {
    await prepDataPerms(`#api-workflow-${projectID}`, {});
  }
};

const getAPIWorkflow = async (projectID, type) => {
  let disabled = '';
  if (type == 'disabled') {
    disabled = 'disabled';
  }
  const permsField = { name: 'perms', label: 'Permissions', type: 'Mixed' };
  const element = await getFormElement(permsField, getProjectData(projectID), $s);
  const permsDiv = getFormRow(element, permsField.label, permsField);
  const collDropdown = getCollectionDropdown(projectID, 'collectionID', [], disabled);
  const ret = `
  <div class="col-sm-10">
    <form class="form-horizontal" id="api-workflow-${projectID}" style="margin-top:40px;">
      <div class="form-group row">
        <label class="col-md-2 col-form-label text-right">Target Collection</label>
        <div class="col-md-10">
          ${collDropdown}
        </div>
      </div>
      <div class="form-group row">
        <label class="col-md-2 col-form-label text-right">Route Description</label>
        <div class="col-md-10">
          <input ${disabled} name="route" class="form-control" type="text" value=""></input>
        </div>
      </div>
      <div class="form-group row">
        <label class="col-md-2 col-form-label text-right">Config</label>
        <div class="col-md-10">
          <textarea ${disabled} name="config" class="form-control"  value="" rows="10"></textarea>
        </div>
      </div>
    </form>
  </div>
  `;
  return ret;
};

const getEventWorkflow = async (projectID, type) => {
  let disabled = '';
  let hide = '';
  if (type == 'disabled') {
    disabled = 'disabled';
    hide = `style="display:none;"`;
  }
  const permsField = { name: 'perms', label: 'Permissions', type: 'Mixed' };
  const element = await getFormElement(permsField, getProjectData(projectID), $s);
  const permsDiv = getFormRow(element, permsField.label, permsField);

  const ret = `
  <div class="col-sm-10">
    <div class="form-group row">
      <label class="col-md-2 col-form-label text-right">Event Name</label>
      <div class="col-md-10">
        <input ${disabled} id="event-name-${projectID}" class="form-control" type="text" value=""></input>
      </div>
    </div>
  </div>
  <div class="col-sm-2"></div>
  <div class="col-sm-10">
    <label class="col-md-2 col-form-label" >Event Form</label>
  </div>
  <div class="col-sm-2"></div>
  <div class="col-sm-10" id="event-schema-${projectID}"></div>
  <div class="col-sm-2">
    <button ${hide} class="btn btn-primary insert-event-row" type="button" projectid="${projectID}"> Insert Group </button>
  </div>
  <div class="col-sm-10">
    <form class="form-horizontal" id="event-perms-${projectID}" style="margin-top:40px;">
      ${permsDiv}
    </div>
  </div>
  <div class="col-sm-2"></div>
  `;
  return ret;
};

// insert empty event workflow
// if eventID is set, then fill the row
const refreshEventWorkflow = async (projectID, eventID, type) => {
  const workflow = await getEventWorkflow(projectID, type);
  $(`#event-workflow-${projectID}`).empty();
  $(`#event-workflow-${projectID}`).append(workflow);
  if (eventID && $s.events) {
    const events = $s.events.filter(e => e._id == eventID);
    if (events[0].name) $(`#event-name-${projectID}`).val(events[0].name);
    if (events[0].fields) {
      const data = events[0].fields;
      const perms = JSON.stringify(events[0].perms);
      let prevCollID = '';
      let lastRow = '';
      console.log('data', data);
      await prepDataPerms(`#event-perms-${projectID}`, { perms: perms });
      for (let i = 0; i < data.length; i++) {
        const collID = data[i].collectionID;
        const field = data[i].field;
        const insert = data[i].insert;
        const update = data[i].update;
        const multiple = data[i].multiple;
        if (!prevCollID || (prevCollID && prevCollID != collID)) {
          lastRow = insertNewEventRow(projectID, type, field);
          if (collID) {
            lastRow
              .find('.select-collection')
              .val(collID)
              .trigger('change');
          }
          if (insert) lastRow.find('.insert-check').attr('checked', true);
          if (!insert) lastRow.find('.insert-check').attr('checked', false);
          if (update) lastRow.find('.update-check').attr('checked', true);
          if (!update) lastRow.find('.update-check').attr('checked', false);
          if (multiple) lastRow.find('.multiple-check').attr('checked', true);
          if (!multiple) lastRow.find('.multiple-check').attr('checked', false);
        } else {
          //insert new field
          lastRow.find('.insert-event-field').trigger('click');
        }
        if (field) {
          const allFieldSelects = lastRow.find('.select-field');
          $(allFieldSelects[allFieldSelects.length - 1]).val(field);
        }
        prevCollID = collID;
      }
    }
  } else {
    insertNewEventRow(projectID, type, true);
    await prepDataPerms(`#event-perms-${projectID}`, {});
  }
};

const createSortable = (el, projectID, type, group) => {
  let disabled = false;
  if (type == 'disabled') disabled = true;
  new Sortable(el, {
    animation: 150,
    disabled: disabled,
    // handle: '.handle',
    filter: '.js-remove',
    group: `${group}-${projectID}`,
    onFilter: function(evt) {
      var item = evt.item;
      var ctrl = evt.target;
      if (Sortable.utils.is(ctrl, '.js-remove')) {
        // Click on remove button
        item.parentNode.removeChild(item);
      }
    }
  });
};

const getCollDropdown = (projectID, type, counter) => {
  let projectCollections;
  if ($s.collections) {
    projectCollections = $s.collections.filter(c => c.projectID == projectID);
  }
  let disabled = '';
  if (type == 'disabled') disabled = 'disabled';
  let dropdown = `<select ${disabled} counter="${counter}" class="form-control select-collection">`;
  dropdown += `<option value="" >--- Select Collection ---</option>`;
  if (projectCollections) {
    projectCollections.forEach(i => {
      dropdown += `<option  value="${i._id}">${i.label}</option>`;
    });
  }
  dropdown += `</select>`;
  return dropdown;
};

const insertNewField = (projectID, divToAppend, type, counter) => {
  let hide = '';
  let disabled = '';
  if (type == 'disabled') {
    hide = `style="display:none;"`;
    disabled = `disabled`;
  }
  const fieldDropdown = `<select ${disabled} class="form-control select-field"></select>`;
  const newFieldRow = $(`<div class="list-group"  style="padding-right:0px;">
  <div class="list-group-item" style="display:flex;">
    <div class="col-sm-1" style="padding-top:7px;">
      <i class="cil-apps handle-field"></i>
    </div>
    <div class="col-sm-10" style="display:flex;">
       <span style="padding-top:7px; padding-right:10px;">Field</span>
      ${fieldDropdown}
    </div>
    <div class="col-sm-1" style="padding-top:7px;">
    <a ${hide} href="#"><i class="cil-trash js-remove float-right" data-toggle="tooltip" data-placement="bottom" title="Remove Field"></i></a>
    </div>  
  </div>  
</div>`);
  divToAppend.append(newFieldRow);
  createSortable(newFieldRow[0], projectID, type, `field-${counter}`);

  // fill fields dropdown based on selected collection
  const selectedCollID = divToAppend
    .closest('.list-group-item')
    .find('.select-collection')
    .val();
  const selectField = newFieldRow.find('.select-field');
  fillCollectionFields(selectField, selectedCollID);
};

const insertNewEventRow = (projectID, type, newField) => {
  let hide = '';
  let disabled = '';
  if (type == 'disabled') {
    hide = `style="display:none;"`;
    disabled = `disabled`;
  }
  const counter = $s.collectionCounter;
  $s.collectionCounter++;
  const collectionDropdown = getCollDropdown(projectID, type, counter);

  const newRow = $(`
    <div class="list-group collection"  style="padding-right:0px;">
      <div class="list-group-item collection" style="padding-right:7px; padding-left:7px; padding-bottom:25px; padding-top:25px;">
        <div class="container" style="margin-bottom:15px; margin-right:5px; margin-left:5px; max-width:7000px;">
          <div class="row">
            <div class="col-auto" style="padding-top:7px;">
              <i class="cil-apps handle"></i>
            </div>
            <div class="col" style="display:flex;">
            <span style="padding-top:7px; padding-right:10px;">Collection</span> 
            ${collectionDropdown} </div>
            <div class="col-auto" style="font-size: 0.7rem;">
              <label class="text-center">I<span class="d-none d-lg-inline">nsert</span>
                <input ${disabled} class="insert-check" type="checkbox" style="width:100%;">
              </label>
            </div>
            <div class="col-auto" style="font-size: 0.7rem;">
              <label class="text-center">U<span class="d-none d-lg-inline">pdate</span>
                <input ${disabled} class="update-check" type="checkbox" style="width:100%;">
              </label>
            </div>
            <div class="col-auto" style="font-size: 0.7rem;">
              <label class="text-center">M<span class="d-none d-lg-inline">ultiple</span>
                <input ${disabled} class="multiple-check" type="checkbox" style="width:100%;">
              </label>
            </div>
            <div class="col-auto align-self-center">
              <a ${hide} href="#" class="insert-event-field"><i class="cil-plus  float-right" data-toggle="tooltip" data-placement="bottom" title="Insert Field" style="margin-left:7px;"></i></a>
            </div>
            <div class="col-auto align-self-center">
              <a ${hide} href="#"><i class="cil-trash js-remove float-right" data-toggle="tooltip" data-placement="bottom" title="Remove Collection Group"></i></a>
            </div>
          </div>
        </div>
        <div class="container field-container" style="margin-right:0px; margin-left:0px; max-width:7000px;"> 
        </div>  
      </div>  
    </div>`);
  $(`#event-schema-${projectID}`).append(newRow);
  createSortable(newRow[0], projectID, type, 'collection');
  if (newField) {
    //insertNewField
    newRow.find('.insert-event-field').trigger('click');
  }
  return newRow;
};

const insertNewAPIRow = (projectID, type, newField) => {
  let hide = '';
  let disabled = '';
  if (type == 'disabled') {
    hide = `style="display:none;"`;
    disabled = `disabled`;
  }
  const counter = $s.collectionCounter;
  $s.collectionCounter++;
  const collectionDropdown = getCollDropdown(projectID, type, counter);

  const newRow = $(`
    <div class="list-group"  style="padding-right:0px;">
              </label>
            </div>
            <div class="col-auto" style="font-size: 0.7rem;">
              <label class="text-center">M<span class="d-none d-lg-inline">ultiple</span>
                <input ${disabled} class="multiple-check" type="checkbox" style="width:100%;">
              </label>
            </div>
            <div class="col-auto align-self-center">
              <a ${hide} href="#" class="insert-event-field"><i class="cil-plus  float-right" data-toggle="tooltip" data-placement="bottom" title="Insert Field" style="margin-left:7px;"></i></a>
            </div>
            <div class="col-auto align-self-center">
              <a ${hide} href="#"><i class="cil-trash js-remove float-right" data-toggle="tooltip" data-placement="bottom" title="Remove Collection Group"></i></a>
            </div>
          </div>
        </div>
        <div class="container field-container" style="margin-right:0px; margin-left:0px; max-width:7000px;"> 
        </div>  
      </div>  
    </div>`);
  $(`#api-schema-${projectID}`).append(newRow);
  createSortable(newRow[0], projectID, type, 'collection');
  if (newField) {
    //insertNewField
    newRow.find('.insert-api-field').trigger('click');
  }
  return newRow;
};

const fillCollectionFields = (dropdown, collID) => {
  if (!$s.collections) return;
  const col = $s.collections.filter(c => c._id == collID);
  const fields = $s.fields.filter(f => f.collectionID == collID);
  dropdown.empty();
  dropdown.append(
    $('<option>', {
      value: '',
      text: '-- Select Field --'
    })
  );

  $.each(fields, function(i, item) {
    const required = item.required ? 'required' : '';
    const ref = item.ref ? 'ref.' : '';
    let extra = '';
    if (required || ref) extra = `${required}${ref}`;
    if (extra) extra = `(${extra.trim()})`;
    dropdown.append(
      $('<option>', {
        value: item._id,
        text: `${item.label} ${extra}`
      })
    );
  });
};

const showHideButtons = (el, hideClasses, showClasses) => {
  if (el) $(el).css('display', 'none');
  for (let i = 0; i < hideClasses.length; i++) {
    $(el)
      .siblings(`button.${hideClasses[i]}`)
      .css('display', 'none');
  }
  for (let i = 0; i < showClasses.length; i++) {
    $(el)
      .siblings(`button.${showClasses[i]}`)
      .css('display', 'inline-block');
  }
};

const getEventSchema = projectID => {
  let ret = [];
  const collectionGroups = $(`#event-schema-${projectID}`).find('.list-group-item.collection');
  for (let k = 0; k < collectionGroups.length; k++) {
    const collID = $(collectionGroups[k])
      .find('.select-collection')
      .val();
    const insert = $(collectionGroups[k])
      .find('.insert-check')
      .is(':checked');
    const update = $(collectionGroups[k])
      .find('.update-check')
      .is(':checked');
    const multiple = $(collectionGroups[k])
      .find('.multiple-check')
      .is(':checked');

    const fields = $(collectionGroups[k]).find('.select-field');
    if (fields.length > 0) {
      for (let f = 0; f < fields.length; f++) {
        let obj = {};
        let field = $(fields[f]).val();
        obj.collectionID = collID;
        obj.field = field;
        obj.insert = insert;
        obj.update = update;
        obj.multiple = multiple;
        ret.push(obj);
      }
    } else {
      let obj = {};
      obj.collectionID = collID;
      obj.field = '';
      obj.insert = insert;
      obj.update = update;
      obj.multiple = multiple;
      ret.push(obj);
    }
  }
  console.log(ret);
  return ret;
};

const getCollectionDropdown = (projectID, name, exclude, disable) => {
  let disabled = '';
  if (disable) {
    disabled = 'disabled';
  }
  let dropdown = `<select ${disabled} class="form-control" name="${name}">`;
  dropdown += `<option value="" >--- Select Collection ---</option>`;
  if ($s.collections) {
    const projectCollections = $s.collections.filter(e => e.projectID == projectID);
    projectCollections.forEach(i => {
      if (!exclude.includes(i._id)) {
        dropdown += `<option  value="${i._id}">${i.name}</option>`;
      }
    });
  }
  dropdown += `</select>`;
  return dropdown;
};

const getRefreshNamingPatternDiv = namingPatternData => {
  let ret = `<p > Please choose the field below to refresh all values of the selected field according to the naming pattern. </p>`;
  const dropdown = getSimpleDropdown(namingPatternData, { name: 'fieldID' });
  ret += getFormRow(dropdown, 'Field', {});

  return ret;
};

const getEditFieldDiv = projectID => {
  let ret = `<p> Please choose target collection and operation type to transfer your data of fields into target collection. </p>`;
  ret += getFormRow(
    getCollectionDropdown(projectID, 'targetCollection', [], false),
    'Target Collection',
    {}
  );
  const operationTypeDropdown = getSimpleDropdown(
    [{ _id: 'move-ref', name: 'Move and Keep Reference' }],
    { name: 'type' }
  );
  ret += getFormRow(operationTypeDropdown, 'Operation Type', {});

  return ret;
};

const getInsertChildRefDiv = async (projectID, collID) => {
  let ret = `<p>Please choose a collection to be used for referencing. </p>`;
  const exclude = [collID];
  ret += getFormRow(
    getCollectionDropdown(projectID, 'childRefCollection', exclude, false),
    'Parent Collection',
    {}
  );
  const labelField = { name: 'label', label: 'Reference Label', type: 'String' };
  const labelDiv = await getFormElement(labelField, getProjectData(projectID), $s);
  ret += getFormRow(labelDiv, labelField.label, labelField);

  return ret;
};

const bindEventHandlers = () => {
  // ================= API CONFIG =============
  $(document).on('change', `select.select-api`, async function(e) {
    const projectID = $(this).attr('projectID');
    const apiID = $(this).val();
    if (apiID) {
      await refreshAPIWorkflow(projectID, apiID, 'disabled');
    } else {
      $(`#api-workflow-${projectID}`).empty();
    }
  });
  $(document).on('click', `button.insert-api`, async function(e) {
    const projectID = $(this).attr('projectID');
    showHideButtons(
      this,
      ['insert-api', 'edit-api', 'delete-api', 'update-api'],
      ['cancel-api', 'save-api']
    );
    await refreshAPIWorkflow(projectID, '', 'new');
  });
  $(document).on('click', `button.save-api`, async function(e) {
    const projectID = $(this).attr('projectID');
    const formValues = $(`#api-workflow-${projectID}`).find('input,textarea,select');
    const [formObj, stop] = createFormObj(formValues, [], true, 'undefined');
    formObj.projectID = projectID;
    if (!IsJson5String(formObj.config)) {
      showInfoModal('Please enter a valid JSON for config.');
    } else if (!stop) {
      formObj.config = JSON5.parse(formObj.config);
      try {
        const res = await axios({
          method: 'POST',
          url: 'api/v1/config/apis',
          data: formObj
        });
        if (res.data.status == 'success') {
          showHideButtons(
            this,
            ['cancel-api', 'save-api', 'update-api'],
            ['insert-api', 'edit-api', 'delete-api']
          );
          await getAjaxData('apis');
          console.log(res.data);
          const newApiId =
            res.data.data && res.data.data.data && res.data.data.data._id
              ? res.data.data.data._id
              : '';
          refreshCustomDropdown(projectID, newApiId, 'api');
        }
      } catch (err) {
        if (err.response && err.response.data && err.response.data.message) {
          showInfoModal(JSON.stringify(err.response.data.message));
        } else {
          showInfoModal(err);
        }
      }
    }
  });
  $(document).on('click', `button.cancel-api`, function(e) {
    const projectID = $(this).attr('projectID');
    $(`#select-api-${projectID}`).trigger('change');
    showHideButtons(
      this,
      ['cancel-api', 'save-api', 'update-api'],
      ['insert-api', 'edit-api', 'delete-api']
    );
  });

  $(document).on('click', `button.edit-api`, async function(e) {
    showHideButtons(
      this,
      ['insert-api', 'edit-api', 'delete-api', 'save-api'],
      ['cancel-api', 'update-api']
    );
    const projectID = $(this).attr('projectID');
    const apiID = $(`#select-api-${projectID}`).val();
    await refreshAPIWorkflow(projectID, apiID, 'new');
  });
  $(document).on('click', `button.update-api`, async function(e) {
    const projectID = $(this).attr('projectID');
    const apiID = $(`#select-api-${projectID}`).val();
    const formValues = $(`#api-workflow-${projectID}`).find('input,textarea,select');
    const [formObj, stop] = createFormObj(formValues, [], true, 'undefined');
    formObj.projectID = projectID;
    console.log(formObj);
    if (!IsJson5String(formObj.config)) {
      showInfoModal('Please enter a valid JSON for config.');
    } else if (!stop) {
      formObj.config = JSON5.parse(formObj.config);
      try {
        const res = await axios({
          method: 'PATCH',
          url: `api/v1/config/apis/${apiID}`,
          data: formObj
        });
        if (res.data.status == 'success') {
          showHideButtons(
            this,
            ['cancel-api', 'save-api', 'update-api'],
            ['insert-api', 'edit-api', 'delete-api']
          );
          await getAjaxData('apis');
          refreshCustomDropdown(projectID, apiID, 'api');
        }
      } catch (err) {
        console.log(err);
        if (err.response && err.response.data && err.response.data.message) {
          showInfoModal(JSON.stringify(err.response.data.message));
        } else {
          showInfoModal(err);
        }
      }
    }
  });
  $(document).on('click', `button.delete-api`, function(e) {
    const projectID = $(this).attr('projectID');
    const apiID = $(`#select-api-${projectID}`).val();
    $('#crudModalError').empty();
    $('#crudModalTitle').text(`Remove API Config`);
    $('#crudModalYes').text('Remove');
    $('#crudModalBody').empty();
    $('#crudModalBody').append(getErrorDiv());
    $('#crudModalBody').append(`<p>Are you sure you want to delete config?</p>`);
    $('#crudModal').off();
    $('#crudModal').on('click', '#crudModalYes', async function(e) {
      e.preventDefault();
      try {
        const res = await axios({
          method: 'DELETE',
          url: `api/v1/config/apis/${apiID}`
        });
        if (res.data.status == 'success') {
          showHideButtons(
            '',
            ['cancel-api', 'save-api', 'update-api'],
            ['insert-api', 'edit-api', 'delete-api']
          );
          await getAjaxData('apis');
          refreshCustomDropdown(projectID, '', 'api');
        }
      } catch (err) {
        if (err.response && err.response.data && err.response.data.message) {
          showInfoModal(JSON.stringify(err.response.data.message));
        } else {
          showInfoModal(err);
        }
      }
      $('#crudModal').modal('hide');
    });
    if (!apiID) {
      showInfoModal('Please select config to delete.');
    } else {
      $('#crudModal').modal('show');
    }
  });

  // ================= API CONFIG ENDS  =======
  // ================= EVENTS  =================
  $(document).on('change', `select.select-event`, async function(e) {
    const projectID = $(this).attr('projectID');
    const eventID = $(this).val();
    if (eventID) {
      await refreshEventWorkflow(projectID, eventID, 'disabled');
    } else {
      $(`#event-workflow-${projectID}`).empty();
    }
  });
  $(document).on('change', `select.select-collection`, function(e) {
    const selectedCollID = $(this).val();
    const selectField = $(this)
      .closest('.list-group-item')
      .find('.select-field');
    fillCollectionFields(selectField, selectedCollID);
  });

  $(document).on('click', `a.insert-event-field`, function(e) {
    e.preventDefault();
    const divToAppend = $(this)
      .closest('.list-group-item')
      .find('.field-container');
    const projectID = $(this).attr('projectID');
    const counter = $(this)
      .closest('.list-group-item')
      .find('.select-collection')
      .attr('counter');
    const isInsertFieldVisible = $(this).css('display') !== 'none';
    if (isInsertFieldVisible) {
      insertNewField(projectID, divToAppend, 'new', counter);
    } else {
      insertNewField(projectID, divToAppend, 'disabled', counter);
    }
  });
  $(document).on('click', `button.insert-event-row`, function(e) {
    e.preventDefault();
    const projectID = $(this).attr('projectID');
    insertNewEventRow(projectID, 'new', true);
  });
  $(document).on('click', `button.save-event`, async function(e) {
    const projectID = $(this).attr('projectID');
    const name = $(`#event-name-${projectID}`).val();
    if (!name) {
      showInfoModal('Please enter event name before saving.');
    } else {
      const eventSchema = getEventSchema(projectID);
      let data = {};
      data.name = name;
      data.fields = eventSchema;
      data.projectID = projectID;
      // get perms data
      const formValues = $(`#event-perms-${projectID}`).find('input');
      const [formObj, stop] = createFormObj(formValues, [], true, 'undefined');
      data.perms = formObj.perms;
      try {
        const res = await axios({
          method: 'POST',
          url: 'api/v1/events',
          data
        });
        if (res.data.status == 'success') {
          showHideButtons(
            this,
            ['cancel-event', 'save-event', 'update-event'],
            ['insert-event', 'edit-event', 'delete-event']
          );
          await getAjaxData('events');
          console.log(res.data);
          const newEventId =
            res.data.data && res.data.data.data && res.data.data.data._id
              ? res.data.data.data._id
              : '';
          refreshEventDropdown(projectID, newEventId);
        }
      } catch (err) {
        if (err.response && err.response.data && err.response.data.message) {
          showInfoModal(JSON.stringify(err.response.data.message));
        } else {
          showInfoModal(err);
        }
      }
    }
  });
  $(document).on('click', `button.cancel-event`, function(e) {
    const projectID = $(this).attr('projectID');
    $(`#select-event-${projectID}`).trigger('change');
    showHideButtons(
      this,
      ['cancel-event', 'save-event', 'update-event'],
      ['insert-event', 'edit-event', 'delete-event']
    );
  });
  $(document).on('click', `button.insert-event`, async function(e) {
    const projectID = $(this).attr('projectID');
    showHideButtons(
      this,
      ['insert-event', 'edit-event', 'delete-event', 'update-event'],
      ['cancel-event', 'save-event']
    );
    await refreshEventWorkflow(projectID, '', 'new');
  });
  $(document).on('click', `button.edit-event`, async function(e) {
    showHideButtons(
      this,
      ['insert-event', 'edit-event', 'delete-event', 'save-event'],
      ['cancel-event', 'update-event']
    );
    const projectID = $(this).attr('projectID');
    const eventID = $(`#select-event-${projectID}`).val();
    await refreshEventWorkflow(projectID, eventID, 'new');
  });
  $(document).on('click', `button.update-event`, async function(e) {
    const projectID = $(this).attr('projectID');
    const eventID = $(`#select-event-${projectID}`).val();
    const name = $(`#event-name-${projectID}`).val();
    if (!name) {
      showInfoModal('Please enter event name before saving.');
    } else if (!eventID) {
      showInfoModal('Please choose event before editing.');
    } else {
      const eventSchema = getEventSchema(projectID);
      let data = {};
      data.name = name;
      data.fields = eventSchema;
      data.projectID = projectID;
      // get perms data
      const formValues = $(`#event-perms-${projectID}`).find('input');
      const [formObj, stop] = createFormObj(formValues, [], true, 'undefined');
      data.perms = formObj.perms;
      try {
        const res = await axios({
          method: 'PATCH',
          url: `api/v1/events/${eventID}`,
          data
        });
        if (res.data.status == 'success') {
          showHideButtons(
            this,
            ['cancel-event', 'save-event', 'update-event'],
            ['insert-event', 'edit-event', 'delete-event']
          );
          await getAjaxData('events');
          refreshEventDropdown(projectID, eventID);
        }
      } catch (err) {
        console.log(err);
        if (err.response && err.response.data && err.response.data.message) {
          showInfoModal(JSON.stringify(err.response.data.message));
        } else {
          showInfoModal(err);
        }
      }
    }
  });
  $(document).on('click', `button.delete-event`, function(e) {
    const projectID = $(this).attr('projectID');
    const eventID = $(`#select-event-${projectID}`).val();
    $('#crudModalError').empty();
    $('#crudModalTitle').text(`Remove Event`);
    $('#crudModalYes').text('Remove');
    $('#crudModalBody').empty();
    $('#crudModalBody').append(getErrorDiv());
    $('#crudModalBody').append(`<p>Are you sure you want to delete event?</p>`);
    $('#crudModal').off();
    $('#crudModal').on('click', '#crudModalYes', async function(e) {
      e.preventDefault();
      try {
        const res = await axios({
          method: 'DELETE',
          url: `api/v1/events/${eventID}`
        });
        if (res.data.status == 'success') {
          showHideButtons(
            '',
            ['cancel-event', 'save-event', 'update-event'],
            ['insert-event', 'edit-event', 'delete-event']
          );
          await getAjaxData('events');
          refreshEventDropdown(projectID, '');
        }
      } catch (err) {
        if (err.response && err.response.data && err.response.data.message) {
          showInfoModal(JSON.stringify(err.response.data.message));
        } else {
          showInfoModal(err);
        }
      }
      $('#crudModal').modal('hide');
    });
    if (!eventID) {
      showInfoModal('Please select event to delete.');
    } else {
      $('#crudModal').modal('show');
    }
  });

  // ================= EVENTS ENDS  =================

  // insert child reference button
  $(document).on('click', `button.insert-child-ref`, async function(e) {
    const collID = $(this).attr('collID');
    const collName = $(this).attr('collName');
    const projectID = $(this).attr('projectID');
    const childRefDiv = await getInsertChildRefDiv(projectID, collID);
    const projectData = $s.projects.filter(p => p._id === projectID);
    const projectName = projectData[0].name;
    $('#crudModalYes').text('Save');
    $('#crudModalBody').empty();
    $('#crudModalBody').append(getErrorDiv());
    $('#crudModalBody').append(childRefDiv);
    $('#crudModal').off();
    $('#crudModalTitle').text(`Insert Reference Field`);

    $('#crudModal').on('click', '#crudModalYes', async function(e) {
      e.preventDefault();
      $('#crudModalError').empty();
      const formValues = $('#crudModal').find('input,select');
      const requiredFields = ['label', 'childRefCollection'];
      let [formObj, stop] = createFormObj(formValues, requiredFields, true, true);
      if (stop === false) {
        let newFormObj = {};
        const parentCollectionName = $('#crudModal')
          .find('select[name*=childRefCollection] option:selected')
          .text();
        newFormObj.collectionID = collID;
        newFormObj.ref = `${projectName}_${parentCollectionName}`;
        newFormObj.name = `${parentCollectionName}_id`;
        newFormObj.label = formObj.label;
        newFormObj.required = true;
        newFormObj.type = 'mongoose.Schema.ObjectId';
        console.log('newFormObj', newFormObj);
        try {
          const res = await axios({
            method: 'POST',
            url: 'api/v1/fields',
            data: newFormObj
          });
          if (res.data.status == 'success') {
            console.log(res.data);
            refreshDataTables(collID, projectID);
            $('#crudModal').modal('hide');
          }
        } catch (err) {
          if (err.response && err.response.data && err.response.data.message) {
            showInfoModal(JSON.stringify(err.response.data.message));
          } else {
            showInfoModal(err);
          }
        }
      }
    });

    $('#crudModal').modal('show');
  });

  //Refresh Identifier Data
  $(document).on('click', `button.refresh-namingPattern-data`, async function(e) {
    const collID = $(this).attr('collID');
    const collName = $(this).attr('collName');
    const namingPatternData = $s.fields.filter(f => f.namingPattern && f.collectionID == collID);
    let div = await getRefreshNamingPatternDiv(namingPatternData);
    $('#crudModalYes').text('Refresh');
    $('#crudModalBody').empty();
    $('#crudModalBody').append(getErrorDiv());
    $('#crudModalBody').append(div);
    $('#crudModal').off();
    $('#crudModalTitle').text(`Refresh Naming Patterns`);

    $('#crudModal').on('click', '#crudModalYes', async function(e) {
      e.preventDefault();
      $('#crudModalError').empty();
      const formValues = $('#crudModal').find('input,select');
      const requiredFields = ['fieldID'];
      let [formObj, stop] = createFormObj(formValues, requiredFields, true, true);
      if (stop === false) {
        console.log('formObj', formObj);
        try {
          const res = await axios({
            method: 'POST',
            url: 'api/v1/fields/refreshIdentifier',
            data: formObj
          });
          if (res.data.status == 'success') {
            console.log(res.data);
            $('#crudModal').modal('hide');
          }
        } catch (err) {
          if (err.response && err.response.data && err.response.data.message) {
            showInfoModal(JSON.stringify(err.response.data.message));
          } else {
            showInfoModal(err);
          }
        }
      }
    });
    $('#crudModal').modal('show');
  });

  //Transfer Fields Data button
  $(document).on('click', `button.edit-field-data`, async function(e) {
    const collID = $(this).attr('collID');
    const collName = $(this).attr('collName');
    const projectID = $(this).attr('projectID');
    const editFieldDiv = await getEditFieldDiv(projectID);
    $('#crudModalYes').text('Transfer');
    $('#crudModalBody').empty();
    $('#crudModalBody').append(getErrorDiv());
    $('#crudModalBody').append(editFieldDiv);
    $('#crudModal').off();
    $('#crudModalTitle').text(`Transfer Field Data`);
    const table = $(`#${collID}`).DataTable();
    const tableData = table.rows().data();
    const rows_selected = table.column(0).checkboxes.selected();
    const selectedData = tableData.filter(f => rows_selected.indexOf(f._id) >= 0);
    let sourceFields = [];
    for (let i = 0; i < selectedData.length; i++) {
      sourceFields.push(selectedData[i]._id);
    }

    $('#crudModal').on('click', '#crudModalYes', async function(e) {
      e.preventDefault();
      $('#crudModalError').empty();
      const formValues = $('#crudModal').find('input,select');
      const requiredFields = ['type', 'targetCollection'];
      let [formObj, stop] = createFormObj(formValues, requiredFields, true, true);
      if (stop === false) {
        formObj.sourceCollection = collID;
        formObj.sourceFields = sourceFields;
        console.log('formObj', formObj);
        try {
          const res = await axios({
            method: 'POST',
            url: 'api/v1/fields/transfer',
            data: formObj
          });
          if (res.data.status == 'success') {
            console.log(res.data);
            $('#crudModal').modal('hide');
          }
        } catch (err) {
          if (err.response && err.response.data && err.response.data.message) {
            showInfoModal(JSON.stringify(err.response.data.message));
          } else {
            showInfoModal(err);
          }
        }
      }
    });

    if (rows_selected.length === 0) {
      showInfoModal('Please click checkboxes to transfer fields of data.');
    } else if (rows_selected.length > 0) {
      $('#crudModal').modal('show');
    }
  });

  // ================= EDIT BUTTON =================
  $(document).on('click', `button.edit-data`, async function(e) {
    const collID = $(this).attr('collID');
    const collLabel = $(this).attr('collLabel');
    const collName = $(this).attr('collName');
    const projectID = $(this).attr('projectID');
    let targetUrl = '';
    let collectionFields = '';
    if (collID == `all_collections_${projectID}`) {
      collectionFields = await getFieldsOfCollectionDiv(collName, projectID);
      $('#crudModalTitle').text(`Edit Collection`);
      targetUrl = 'collections';
    } else if (collID == 'all_projects') {
      collectionFields = await getFieldsOfProjectDiv();
      $('#crudModalTitle').text(`Edit Project`);
      targetUrl = 'projects';
    } else {
      collectionFields = await getFieldsOfFieldsDiv(collName, projectID);
      $('#crudModalTitle').text(`Edit Field`);
      targetUrl = 'fields';
    }
    $('#crudModalYes').text('Save');
    $('#crudModalBody').empty();
    $('#crudModalBody').append(getErrorDiv());
    $('#crudModalBody').append(collectionFields);
    $('#crudModal').off();
    const table = $(`#${collID}`).DataTable();
    const tableData = table.rows().data();
    const rows_selected = table.column(0).checkboxes.selected();
    const selectedData = tableData.filter(f => rows_selected.indexOf(f._id) >= 0);

    $('#crudModal').on('show.coreui.modal', async function(e) {
      fillFormByName('#crudModal', 'input, select', selectedData[0], true);
      await prepDataPerms('#crudModal', selectedData[0]);
      await prepDataRestrictTo('#crudModal', selectedData[0]);
      if (rows_selected.length > 1) {
        prepareMultiUpdateModal('#crudModal', '#crudModalBody', 'input, select');
      } else {
        prepareClickToActivateModal(
          '#crudModal',
          '#crudModalBody',
          'input, select',
          selectedData[0]
        );
      }
    });

    $('#crudModal').on('click', '#crudModalYes', async function(e) {
      e.preventDefault();
      $('#crudModalError').empty();
      const formValues = $('#crudModal').find('input,select');
      const requiredValues = formValues.filter('[required]');
      const requiredFields = $.map(requiredValues, function(el) {
        return $(el).attr('name');
      });
      let formObj, stop;
      if (rows_selected.length > 1) {
        [formObj, stop] = createFormObj(formValues, requiredFields, true, true);
      } else {
        [formObj, stop] = createFormObj(formValues, requiredFields, true, 'undefined');
      }
      formObj = convertFormObj(formObj);
      // get only updated fields:
      if (rows_selected.length === 1) {
        formObj = getUpdatedFields(selectedData[0], formObj);
      }
      if (stop === false && collName) {
        for (var i = 0; i < selectedData.length; i++) {
          const success = await crudAjaxRequest(
            targetUrl,
            'PATCH',
            selectedData[i]._id,
            projectID,
            collName,
            formObj,
            formValues,
            '#crudModalError'
          );
          if (!success) {
            updateNavbarTables(collID, projectID);
            break;
          }
          if (success && selectedData.length - 1 === i) {
            updateNavbarTables(collID, projectID);
            $('#crudModal').modal('hide');
          }
        }
      }
    });

    if (rows_selected.length === 0) {
      showInfoModal('Please click checkboxes to edit items.');
    } else if (rows_selected.length > 0) {
      $('#crudModal').modal('show');
    }
  });

  // ================= INSERT BUTTON =================
  $(document).on('click', `button.insert-data`, async function(e) {
    $('#crudModalError').empty();
    const collID = $(this).attr('collID');
    const collLabel = $(this).attr('collLabel');
    const collName = $(this).attr('collName');
    const projectID = $(this).attr('projectID');
    let collectionFields;
    let targetUrl;
    if (collID == `all_collections_${projectID}`) {
      collectionFields = await getFieldsOfCollectionDiv(collName, projectID);
      $('#crudModalTitle').text(`Insert Collection`);
      targetUrl = 'collections';
    } else if (collID == 'all_projects') {
      collectionFields = await getFieldsOfProjectDiv();
      $('#crudModalTitle').text(`Insert Project`);
      targetUrl = 'projects';
    } else {
      collectionFields = await getFieldsOfFieldsDiv(collName, projectID);
      $('#crudModalTitle').text(`Insert Field`);
      targetUrl = 'fields';
    }
    $('#crudModalYes').text('Save');
    $('#crudModalBody').empty();
    $('#crudModalBody').append(getErrorDiv());
    $('#crudModalBody').append(collectionFields);
    $('#crudModal').off();
    await prepDataPerms('#crudModal', {});
    await prepDataRestrictTo('#crudModal', {});
    prepareClickToActivateModal('#crudModal', '#crudModalBody', 'input, select', {});
    $('#crudModal').on('click', '#crudModalYes', async function(e) {
      e.preventDefault();
      const formValues = $('#crudModal').find('input,select');
      const requiredValues = formValues.filter('[required]');
      const requiredFields = $.map(requiredValues, function(el) {
        return $(el).attr('name');
      });
      let [formObj, stop] = createFormObj(formValues, requiredFields, true, true);
      formObj = convertFormObj(formObj);
      if (stop === false && collName) {
        const success = await crudAjaxRequest(
          targetUrl,
          'POST',
          '',
          projectID,
          collName,
          formObj,
          formValues,
          '#crudModalError'
        );
        if (success) {
          // create default identifier field on collection insert
          if (targetUrl == 'collections') {
            const identifierField = {
              collectionID: success,
              identifier: true,
              label: 'ID',
              name: 'id',
              namingPattern: '${AUTOINCREMENT}',
              required: true,
              type: 'String',
              unique: true
            };
            await crudAjaxRequest(
              'fields',
              'POST',
              '',
              projectID,
              collName,
              identifierField,
              formValues,
              '#crudModalError'
            );
          }
          await updateNavbarTables(collID, projectID);
          $('#crudModal').modal('hide');
        }
      }
    });
    $('#crudModal').modal('show');
  });

  // ================= DELETE BUTTON =================
  $(document).on('click', `button.delete-data`, async function(e) {
    $('#crudModalError').empty();
    const collID = $(this).attr('collID');
    const collLabel = $(this).attr('collLabel');
    const collName = $(this).attr('collName');
    const projectID = $(this).attr('projectID');
    const table = $(`#${collID}`).DataTable();
    const tableData = table.rows().data();
    const rows_selected = table.column(0).checkboxes.selected();
    const selectedData = tableData.filter(f => rows_selected.indexOf(f._id) >= 0);
    const items = selectedData.length === 1 ? `the item?` : `${selectedData.length} items?`;
    let targetUrl = '';
    if (collID == `all_collections_${projectID}`) {
      $('#crudModalTitle').text(`Remove Collection`);
      targetUrl = 'collections';
    } else if (collID == 'all_projects') {
      $('#crudModalTitle').text(`Remove Project`);
      targetUrl = 'projects';
    } else {
      $('#crudModalTitle').text(`Remove Field`);
      targetUrl = 'fields';
    }
    $('#crudModalYes').text('Remove');
    $('#crudModalBody').empty();
    $('#crudModalBody').append(getErrorDiv());
    $('#crudModalBody').append(`<p>Are you sure you want to delete ${items}</p>`);
    $('#crudModal').off();
    $('#crudModal').on('click', '#crudModalYes', async function(e) {
      e.preventDefault();
      for (var i = 0; i < selectedData.length; i++) {
        const success = await crudAjaxRequest(
          targetUrl,
          'DELETE',
          selectedData[i]._id,
          projectID,
          collName,
          {},
          {},
          '#crudModalError'
        );
        if (!success) {
          updateNavbarTables(collID, projectID);
          break;
        }
        if (success && selectedData.length - 1 === i) {
          updateNavbarTables(collID, projectID);
          $('#crudModal').modal('hide');
        }
      }
    });
    if (selectedData.length === 0) {
      showInfoModal('Please click checkboxes to delete items.');
    } else if (selectedData.length > 0) {
      $('#crudModal').modal('show');
    }
  });
};

const refreshCustomDropdown = (projectID, selectId, type) => {
  let dropdownID = '';
  if (type == 'api') {
    dropdownID = `#select-api-${projectID}`;
  } else if (type == 'event') {
    dropdownID = `#select-event-${projectID}`;
  }
  let dropdown = $(dropdownID);

  const newDropdown = getCustomDropdown(projectID, type);
  dropdown.replaceWith(newDropdown);
  dropdown = $(dropdownID);
  if (selectId) {
    dropdown.val(selectId);
  }
  dropdown.trigger('change');
};

const refreshEventDropdown = (projectID, selectId) => {
  const dropdown = $(`#select-event-${projectID}`);
  const events = $s.events.filter(f => f.projectID == projectID);
  dropdown.empty();
  dropdown.append(
    $('<option>', {
      value: '',
      text: '-- Select Event --'
    })
  );
  $.each(events, function(i, item) {
    dropdown.append(
      $('<option>', {
        value: item._id,
        text: item.name
      })
    );
  });
  if (selectId) {
    dropdown.val(selectId);
  }
  dropdown.trigger('change');
};

const getCustomDropdown = (projectID, type) => {
  const projectData = $s.projects.filter(p => p._id === projectID);
  const projectName = projectData[0].name;
  let idPart = '';
  let label = '';
  let data = '';
  if (type === 'event') {
    idPart = 'select-event';
    label = 'Select Event';
    data = $s.events;
  } else if (type === 'api') {
    idPart = 'select-api';
    label = 'Select Route';
    data = $s.apis;
  }
  const idText = projectID ? `id="${idPart}-${projectID}"` : '';
  let dropdown = `<select class="form-control ${idPart}" projectID="${projectID}" ${idText}>`;
  dropdown += `<option value="" >--- ${label} ---</option>`;
  if (data) {
    const subData = data.filter(e => e.projectID == projectID);
    subData.forEach(i => {
      if (type == 'event') {
        dropdown += `<option  value="${i._id}">${i.name}</option>`;
      } else if (type == 'api') {
        ///api/v1/projects/vitiligo/data/sample/summary
        let collectionName = '';
        if ($s.collections) {
          const collData = $s.collections.filter(c => c._id === i.collectionID);
          if (collData[0]) collectionName = collData[0].name;
        }
        dropdown += `<option  value="${i._id}">/api/v1/projects/${projectName}/data/${collectionName}/format/${i.route}</option>`;
      }
    });
  }
  dropdown += `</select>`;
  return dropdown;
};

const getAPITab = projectID => {
  const dropdown = getCustomDropdown(projectID, 'api');
  const ret = `
  <div class="row" style="margin-top: 20px;">
    <div class="col-sm-10">
      ${dropdown}
    </div>
    <div class="col-sm-2">
      <button class="btn btn-primary insert-api" type="button" data-toggle="tooltip" data-placement="bottom" title="Insert" projectID="${projectID}">
        <i class="cil-plus"> </i>
      </button>
      <button class="btn btn-primary edit-api" type="button" data-toggle="tooltip" data-placement="bottom" title="Edit" projectID="${projectID}">
        <i class="cil-pencil"> </i>
      </button>
      <button class="btn btn-primary delete-api" type="button" data-toggle="tooltip" data-placement="bottom" title="Delete" projectID="${projectID}">
        <i class="cil-trash"> </i>
      </button>
      <button style="display:none;" class="btn btn-primary cancel-api" type="button" data-toggle="tooltip" data-placement="bottom" title="Cancel" projectID="${projectID}">
        <i class="cil-reload"> </i>
      </button>
      <button style="display:none;" class="btn btn-primary save-api" type="button" data-toggle="tooltip" data-placement="bottom" title="Save API config" projectID="${projectID}">
        <i class="cil-save"> </i>
      </button>
      <button style="display:none;" class="btn btn-primary update-api" type="button" data-toggle="tooltip" data-placement="bottom" title="Update API Config" projectID="${projectID}">
        <i class="cil-save"> </i>
      </button>
    </div>
  </div>
  <div class="row" style="margin-top: 20px;" id="api-workflow-${projectID}">
  </div>
  `;
  return ret;
};

const getTreeTab = projectID => {
  //style="border: 1px black solid; max-width: 900px;"
  const ret = `<section id="d3-tree-${projectID}" style="height: 500px; max-width:100%;"></section>`;
  return ret;
};
const getEventTab = projectID => {
  const dropdown = getCustomDropdown(projectID, 'event');
  const ret = `
  <div class="row" style="margin-top: 20px;">
    <div class="col-sm-10">
      ${dropdown}
    </div>
    <div class="col-sm-2">
      <button class="btn btn-primary insert-event" type="button" data-toggle="tooltip" data-placement="bottom" title="Insert" projectID="${projectID}">
        <i class="cil-plus"> </i>
      </button>
      <button class="btn btn-primary edit-event" type="button" data-toggle="tooltip" data-placement="bottom" title="Edit" projectID="${projectID}">
        <i class="cil-pencil"> </i>
      </button>
      <button class="btn btn-primary delete-event" type="button" data-toggle="tooltip" data-placement="bottom" title="Delete" projectID="${projectID}">
        <i class="cil-trash"> </i>
      </button>
      <button style="display:none;" class="btn btn-primary cancel-event" type="button" data-toggle="tooltip" data-placement="bottom" title="Cancel" projectID="${projectID}">
        <i class="cil-reload"> </i>
      </button>
      <button style="display:none;" class="btn btn-primary save-event" type="button" data-toggle="tooltip" data-placement="bottom" title="Save Event" projectID="${projectID}">
        <i class="cil-save"> </i>
      </button>
      <button style="display:none;" class="btn btn-primary update-event" type="button" data-toggle="tooltip" data-placement="bottom" title="Update Event" projectID="${projectID}">
        <i class="cil-save"> </i>
      </button>
    </div>
  </div>
  <div class="row" style="margin-top: 20px;" id="event-workflow-${projectID}">
  </div>
  `;
  return ret;
};

const refreshCollectionNavbar = async (projectId, type) => {
  console.log('refreshCollectionNavbar');
  const projectTabID = 'projectTab_' + getCleanDivId(projectId);
  const isNavbarExist = $(`#${projectTabID}`).html();
  if (isNavbarExist) {
    await getAjaxData();
    await getAjaxData('events');
    await getAjaxData('apis');
  }

  let header = '<ul class="nav nav-tabs" role="tablist" style="margin-top: 10px;">';
  let content = '<div class="tab-content">';
  let tabs = [];
  tabs.push(
    {
      name: 'all_collections',
      label: 'All Collections',
      id: `all_collections_${projectId}`
    },
    {
      name: 'all_events',
      label: 'All Events',
      id: `all_events_${projectId}`
    },
    {
      name: 'tree_view',
      label: 'Tree View',
      id: `tree_view_${projectId}`
    },
    {
      name: 'all_apis',
      label: 'API Config',
      id: `all_apis_${projectId}`
    }
  );
  tabs = tabs.concat($s.collections);
  let k = 0;
  for (var i = 0; i < tabs.length; i++) {
    const collectionProjectID = tabs[i].projectID;
    if (
      (projectId && collectionProjectID == projectId) ||
      (!projectId && !collectionProjectID) ||
      tabs[i].id == `all_collections_${projectId}` ||
      tabs[i].id == `all_events_${projectId}` ||
      tabs[i].id == `all_apis_${projectId}` ||
      tabs[i].id == `tree_view_${projectId}`
    ) {
      k++;
      const collectionName = tabs[i].name;
      const collectionLabel = tabs[i].label;
      const collectionId = tabs[i].id;
      const id = getCleanDivId(collectionId);
      const collTabID = 'collTab_' + id;
      const active = k === 1 ? 'active' : '';
      const headerLi = `
      <li class="nav-item">
          <a class="nav-link ${active} collection" data-toggle="tab" tableID="${collectionId}" collectionId="${collectionId}" projectID="${projectId}" href="#${collTabID}" aria-expanded="true">${collectionLabel}</a>
      </li>`;
      header += headerLi;
      let colNavbar = '';
      let crudButtons = '';
      if (tabs[i].id == `all_events_${projectId}`) {
        colNavbar = getEventTab(projectId);
      } else if (tabs[i].id == `all_apis_${projectId}`) {
        colNavbar = getAPITab(projectId);
      } else if (tabs[i].id == `tree_view_${projectId}`) {
        colNavbar = getTreeTab(projectId);
      } else {
        let dbEditor = true;
        let refreshIdentifier = true;
        let childRef = true;
        let delBtn = false;
        if (tabs[i].id == `all_collections_${projectId}`) {
          refreshIdentifier = false;
          dbEditor = false;
          childRef = false;
          delBtn = true;
        }
        colNavbar = getCollectionTable(collectionId, projectId);
        crudButtons = getCrudButtons(collectionId, collectionLabel, collectionName, projectId, {
          excel: false,
          refreshIdentifier: refreshIdentifier,
          dbEditor: dbEditor,
          childRef: childRef,
          delBtn: delBtn
        });
      }

      const contentDiv = `
      <div role="tabpanel" class="tab-pane ${active}" searchtab="true" id="${collTabID}">
          ${crudButtons}
          ${colNavbar}
        </div>`;
      content += contentDiv;
    }
  }
  header += `</ul>`;
  content += `</div>`;

  let ret = '';
  ret += '<div role="tabpanel">';
  ret += header;
  ret += content;
  ret += '</div>';
  if (isNavbarExist && type == 'refresh') {
    $(`#${projectTabID}`).html('');
    $(`#${projectTabID}`).append(ret);
    $('a.collection[data-toggle="tab"]').trigger('show.coreui.tab');
    return;
  } else {
    return ret;
  }
};

const getAjaxData = async type => {
  if (type == 'events') {
    let [events] = await Promise.all([ajaxCall('GET', '/api/v1/events')]);
    $s.events = events;
  } else if (type == 'apis') {
    let [apis] = await Promise.all([ajaxCall('GET', '/api/v1/config/apis')]);
    $s.apis = apis;
  } else {
    let [collections, fields, projects] = await Promise.all([
      ajaxCall('GET', '/api/v1/collections'),
      ajaxCall('GET', '/api/v1/fields'),
      ajaxCall('GET', '/api/v1/projects')
    ]);
    $s.collections = collections;
    $s.fields = fields;
    $s.projects = projects;
  }
};

export const refreshAdminProjectNavbar = async () => {
  console.log('refreshAdminProjectNavbar');
  const isNavbarExist = $('#admin-allProjectNav').html();
  if (!isNavbarExist) {
    showTableTabs();
    bindEventHandlers();
  }
  await getAjaxData();
  await getAjaxData('events');
  await getAjaxData('apis');

  let tabs = [];
  tabs.push({ name: 'all_projects', label: 'All Projects', id: 'all_projects' });
  if ($s.projects.length) tabs = tabs.concat($s.projects);

  let header = '<ul class="nav nav-tabs" role="tablist">';
  let content = '<div class="tab-content">';

  for (var i = 0; i < tabs.length; i++) {
    const projectId = tabs[i].id;
    const projectLabel = tabs[i].label;
    const projectName = tabs[i].name;
    const id = getCleanDivId(projectId);
    const projectTabID = 'projectTab_' + id;
    const active = i === 0 ? 'active' : '';
    const headerLi = `
    <li class="nav-item">
        <a class="nav-link ${active} collection" data-toggle="tab" tableID="${projectId}" projectID="${projectId}" href="#${projectTabID}" aria-expanded="true">${projectLabel}</a>
    </li>`;
    header += headerLi;

    let colNavbar = '';
    let crudButtons = '';
    if (tabs[i].id == 'all_projects') {
      colNavbar = getCollectionTable(projectId, projectId);
      crudButtons = getCrudButtons(projectId, projectLabel, projectName, projectId, {
        excel: false,
        delBtn: true
      });
    } else {
      colNavbar = await refreshCollectionNavbar(projectId, 'return');
    }

    const contentDiv = `
    <div role="tabpanel" class="tab-pane ${active}" searchtab="true" id="${projectTabID}">
        ${crudButtons}
        ${colNavbar}
      </div>`;
    content += contentDiv;
  }
  header += `</ul>`;
  content += `</div>`;

  let ret = '';
  ret += '<div role="tabpanel">';
  ret += header;
  ret += content;
  ret += '</div>';
  if (isNavbarExist && ret) {
    $('#admin-allProjectNav').html('');
    $('#admin-allProjectNav').append(ret);
    $('a.collection[data-toggle="tab"]').trigger('show.coreui.tab');
    return;
  } else {
    return ret;
  }
};

const getProjectData = projectID => {
  if (!projectID) return '';
  const projectData = $s.projects.filter(field => field._id === projectID);
  if (projectData && projectData[0]) return projectData[0];
  return '';
};

const getFieldsOfFieldsDiv = async (collName, projectID) => {
  let ret = '';
  const fields = Object.keys(fieldsOfFieldsModel);
  for (var k = 0; k < fields.length; k++) {
    const name = fields[k];
    if (name == 'collectionID') {
      fieldsOfFieldsModel[name].default = collName;
    }
    const label = fieldsOfFieldsModel[name].label;
    const element = await getFormElement(fieldsOfFieldsModel[name], getProjectData(projectID), $s);
    ret += getFormRow(element, label, fieldsOfFieldsModel[name]);
  }
  return ret;
};

const getFieldsOfCollectionDiv = async (collName, projectID) => {
  let ret = '';
  const fields = Object.keys(fieldsOfCollectionsModel);
  for (var k = 0; k < fields.length; k++) {
    const name = fields[k];
    if (name == 'projectID') {
      fieldsOfCollectionsModel[name].default = projectID;
    }
    const label = fieldsOfCollectionsModel[name].label;
    const element = await getFormElement(
      fieldsOfCollectionsModel[name],
      getProjectData(projectID),
      $s
    );
    ret += getFormRow(element, label, fieldsOfCollectionsModel[name]);
  }
  return ret;
};

const getFieldsOfProjectDiv = async () => {
  let ret = '';
  const fields = Object.keys(fieldsOfProjectModel);
  for (var k = 0; k < fields.length; k++) {
    const name = fields[k];
    const label = fieldsOfProjectModel[name].label;
    const element = await getFormElement(fieldsOfProjectModel[name], '', $s);
    ret += getFormRow(element, label, fieldsOfProjectModel[name]);
  }
  return ret;
};
