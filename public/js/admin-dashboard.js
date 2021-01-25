/* eslint-disable */
import axios from 'axios';
import {
  getCleanDivId,
  createFormObj,
  showInfoModal,
  convertFormObj,
  fillFormByName,
  getUpdatedFields,
  prepareMultiUpdateModal
} from './jsfuncs';
import { getCrudButtons, crudAjaxRequest } from './dashboard';
import { getFormElement, getFormRow } from './crudData';

// GLOBAL SCOPE
let $s = { data: {} };
$s.AdminCollectionFields = [
  'name',
  'label',
  'type',
  'required',
  'unique',
  'hidden',
  'active',
  'required',
  'default',
  'enum',
  'checkvalid',
  'min',
  'max',
  'lowercase',
  'uppercase',
  'minlength',
  'maxlength',
  'trim',
  'ref',
  'collectionID',
  'id',
  'creationDate',
  'lastUpdateDate'
];

$s.AdminAllCollectionFields = [
  'name',
  'label',
  'slug',
  'version',
  'active',
  'parentCollectionID',
  'projectID',
  'id',
  'perms',
  'restrictTo',
  'owner',
  'creationDate',
  'lastUpdateDate'
];

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
  hidden: {
    name: 'hidden',
    label: 'Hidden',
    type: 'boolean'
  },
  active: {
    name: 'active',
    label: 'Active',
    type: 'boolean',
    default: true
  },
  required: {
    name: 'required',
    label: 'Required',
    type: 'Mixed',
    default: false
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
  }
};
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

const getTableHeaders = collID => {
  let ret = '';
  ret += `<th></th>`; // for checkboxes

  let headerList;
  if (collID == 'all_collections') {
    headerList = $s.AdminAllCollectionFields;
  } else {
    headerList = $s.AdminCollectionFields;
  }
  for (var k = 0; k < headerList.length; k++) {
    const label = headerList[k].charAt(0).toUpperCase() + headerList[k].slice(1);
    ret += `<th>${label}</th>`;
  }
  return ret;
};

const getCollectionTable = collID => {
  const headers = getTableHeaders(collID);
  const ret = `
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
  return $s.fields.filter(field => field.collectionID === collectionID);
};

const prepareDataForSingleColumn = async collID => {
  let data;
  if (collID == 'all_collections') {
    // Use "$s.collections" prepare all_collections table
    data = $s.collections;
  } else {
    // Use $s.fields to prepare data
    data = getFieldsOfCollection(collID);
  }
  const dataCopy = data.slice();
  const ret = dataCopy.map(el => {
    $.each(el, function(k) {
      if ((typeof el[k] === 'object' && el[k] !== null) || Array.isArray(el[k])) {
        el[k] = JSON.stringify(el[k]);
      }
    });
    return el;
  });
  return ret;
};

const refreshDataTables = async TableID => {
  if (!$.fn.DataTable.isDataTable(`#${TableID}`)) {
    const data = await prepareDataForSingleColumn(TableID);
    let columns = [];
    let fieldList;
    if (TableID == 'all_collections') {
      fieldList = $s.AdminAllCollectionFields;
    } else {
      fieldList = $s.AdminCollectionFields;
    }
    columns.push({ data: '_id' }); // for checkboxes
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
    };
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
  } else {
    $s.fields = await ajaxCall('GET', '/api/v1/fields');
    const data = await prepareDataForSingleColumn(TableID);

    $(`#${TableID}`)
      .DataTable()
      .clear()
      .rows.add(data)
      .draw();
  }
};
const showTableTabs = () => {
  $(document).on('show.coreui.tab', 'a.collection[data-toggle="tab"]', function(e) {
    const tableID = $(e.target).attr('tableID');
    refreshDataTables(tableID);
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

const bindEventHandlers = () => {
  // ================= EDIT BUTTON =================
  $(document).on('click', `button.edit-data`, async function(e) {
    const collID = $(this).attr('collID');
    const collLabel = $(this).attr('collLabel');
    const collName = $(this).attr('collName');
    const projectID = $(this).attr('projectID');
    const collectionFields = await getFieldsOfFieldsDiv(collName);
    $('#crudModalTitle').text(`Edit Field`);
    $('#crudModalYes').text('Save');
    $('#crudModalBody').empty();
    $('#crudModalBody').append(getErrorDiv());
    $('#crudModalBody').append(collectionFields);
    $('#crudModal').off();
    const table = $(`#${collID}`).DataTable();
    const tableData = table.rows().data();
    const rows_selected = table.column(0).checkboxes.selected();
    const selectedData = tableData.filter(f => rows_selected.indexOf(f._id) >= 0);

    $('#crudModal').on('show.coreui.modal', function(e) {
      fillFormByName('#crudModal', 'input, select', selectedData[0]);
      if (rows_selected.length > 1) {
        prepareMultiUpdateModal('#crudModal', '#crudModalBody', 'input, select');
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
      let [formObj, stop] = createFormObj(formValues, requiredFields, true, true);
      formObj = convertFormObj(formObj);
      // get only updated fields:
      if (rows_selected.length === 1) {
        formObj = getUpdatedFields(selectedData[0], formObj);
      }
      if (stop === false && collName) {
        for (var i = 0; i < selectedData.length; i++) {
          const success = await crudAjaxRequest(
            'fields',
            'PATCH',
            selectedData[i]._id,
            projectID,
            collName,
            formObj,
            formValues
          );
          if (!success) {
            refreshDataTables(collID);
            break;
          }
          if (success && selectedData.length - 1 === i) {
            refreshDataTables(collID);
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
    const collectionFields = await getFieldsOfFieldsDiv(collName);
    $('#crudModalTitle').text(`Insert Field`);
    $('#crudModalYes').text('Save');
    $('#crudModalBody').empty();
    $('#crudModalBody').append(getErrorDiv());
    $('#crudModalBody').append(collectionFields);
    $('#crudModal').off();
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
          'fields',
          'POST',
          '',
          projectID,
          collName,
          formObj,
          formValues
        );
        if (success) {
          refreshDataTables(collID);
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
    $('#crudModalTitle').text(`Remove Field`);
    $('#crudModalYes').text('Remove');
    $('#crudModalBody').empty();
    $('#crudModalBody').append(getErrorDiv());
    $('#crudModalBody').append(`<p>Are you sure you want to delete ${items}</p>`);
    $('#crudModal').off();
    $('#crudModal').on('click', '#crudModalYes', async function(e) {
      e.preventDefault();
      for (var i = 0; i < selectedData.length; i++) {
        const success = await crudAjaxRequest(
          'fields',
          'DELETE',
          selectedData[i]._id,
          projectID,
          collName,
          {},
          {}
        );
        if (!success) {
          refreshDataTables(collID);
          break;
        }
        if (success && selectedData.length - 1 === i) {
          refreshDataTables(collID);
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

// NEEDS UPDATE! get all collection with project id
const getCollectionNavbar = projectId => {
  bindEventHandlers();
  let header = '<ul class="nav nav-tabs" role="tablist" style="margin-top: 10px;">';
  let content = '<div class="tab-content">';
  let tabs = [];
  tabs.push({ label: 'All Collections', id: 'all_collections' });
  tabs = tabs.concat($s.collections);
  let k = 0;
  for (var i = 0; i < tabs.length; i++) {
    const collectionProjectID = tabs[i].projectID;
    if ((projectId && collectionProjectID == projectId) || (!projectId && !collectionProjectID)) {
      k++;
      const collectionName = tabs[i].name;
      const collectionLabel = tabs[i].label;
      const collectionId = tabs[i].id;
      const id = getCleanDivId(collectionLabel);
      const collTabID = 'collTab_' + id;
      const active = k === 1 ? 'active' : '';
      const headerLi = `
      <li class="nav-item">
          <a class="nav-link ${active} collection" data-toggle="tab" tableID="${collectionId}" href="#${collTabID}" aria-expanded="true">${collectionLabel}</a>
      </li>`;
      header += headerLi;
      const colNavbar = getCollectionTable(collectionId);
      const crudButtons = getCrudButtons(collectionId, collectionLabel, collectionName, projectId);

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
  return ret;
};

export const getAdminProjectNavbar = async rowdata => {
  showTableTabs();
  let [collections, fields, projects] = await Promise.all([
    ajaxCall('GET', '/api/v1/collections'),
    ajaxCall('GET', '/api/v1/fields'),
    ajaxCall('GET', '/api/v1/projects')
  ]);
  $s.collections = collections;
  console.log($s.collections);
  $s.fields = fields;
  $s.projects = projects;
  let tabs = [];
  // tabs.push({ label: 'Public', id: '', name: 'public' });
  tabs = tabs.concat($s.projects);

  let header = '<ul class="nav nav-tabs" role="tablist">';
  let content = '<div class="tab-content">';

  for (var i = 0; i < tabs.length; i++) {
    const projectId = tabs[i].id;
    const projectLabel = tabs[i].label;
    const projectName = tabs[i].name;
    const id = getCleanDivId(projectName);
    const projectTabID = 'projectTab_' + id;
    const active = i === 0 ? 'active' : '';
    const headerLi = `
    <li class="nav-item">
        <a class="nav-link ${active}" data-toggle="tab" href="#${projectTabID}" aria-expanded="true">${projectLabel}</a>
    </li>`;
    header += headerLi;
    const colNavbar = getCollectionNavbar(projectId);

    const contentDiv = `
    <div role="tabpanel" class="tab-pane ${active}" searchtab="true" id="${projectTabID}">
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
  return ret;
};

const getFieldsOfFieldsDiv = async collName => {
  let ret = '';
  const fields = Object.keys(fieldsOfFieldsModel);
  for (var k = 0; k < fields.length; k++) {
    const name = fields[k];
    if (name == 'collectionID') {
      fieldsOfFieldsModel[name].default = collName;
    }
    const label = fieldsOfFieldsModel[name].label;
    const element = await getFormElement(fieldsOfFieldsModel[name]);
    ret += getFormRow(element, label, fieldsOfFieldsModel[name]);
  }
  return ret;
};
