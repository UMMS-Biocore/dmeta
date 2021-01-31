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
  prepareClickToActivateModal
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
  'default',
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
  'required',
  'parentCollectionID',
  'projectID',
  'id',
  'perms',
  'restrictTo',
  'owner',
  'creationDate',
  'lastUpdateDate'
];

$s.AdminAllProjectFields = [
  'name',
  'label',
  'slug',
  'id',
  'perms',
  'restrictTo',
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
  slug: {
    name: 'slug',
    label: 'Slug',
    type: 'String'
  },
  label: {
    name: 'label',
    label: 'Label',
    type: 'String',
    required: true
  }
};

const fieldsOfCollectionsModel = {
  name: {
    name: 'name',
    label: 'Name',
    type: 'String',
    required: true
  },
  slug: {
    name: 'slug',
    label: 'Slug',
    type: 'String'
  },
  label: {
    name: 'label',
    label: 'Label',
    type: 'String',
    required: true
  },
  parentCollectionID: {
    name: 'parentCollectionID',
    label: 'Parent Collection',
    type: 'mongoose.Schema.ObjectId',
    ref: 'collections'
  },
  projectID: {
    name: 'projectID',
    label: 'Project',
    type: 'mongoose.Schema.ObjectId',
    ref: 'projects'
  },
  version: {
    name: 'version',
    label: 'Version',
    type: 'Number',
    required: true,
    default: '1'
  },
  required: {
    name: 'required',
    label: 'Required',
    type: 'boolean',
    default: false
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
const getCollectionsOfProject = projectID => {
  console.log('projectID', projectID);
  return $s.collections.filter(field => field.projectID === projectID);
};

const prepareDataForSingleColumn = async (tableID, projectID) => {
  let data;
  if (tableID == `all_collections_${projectID}`) {
    // Use "$s.collections" prepare all_collections table
    data = getCollectionsOfProject(projectID);
    console.log('all collections', data);
  } else if (tableID == 'all_projects') {
    // Use "$s.projects" prepare all_projects table
    data = $s.projects;
  } else {
    // Use $s.fields to prepare data
    data = getFieldsOfCollection(tableID);
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
};

const showTableTabs = () => {
  $(document).on('show.coreui.tab', 'a.collection[data-toggle="tab"]', function(e) {
    const tableID = $(e.target).attr('tableID');
    const projectID = $(e.target).attr('projectID');
    refreshDataTables(tableID, projectID);
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
    await refreshCollectionNavbar(projectID);
  } else {
    refreshDataTables(collID, projectID);
  }
};

const bindEventHandlers = () => {
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
      collectionFields = await getFieldsOfFieldsDiv(collName);
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

    $('#crudModal').on('show.coreui.modal', function(e) {
      fillFormByName('#crudModal', 'input, select', selectedData[0]);
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
            formValues
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
      collectionFields = await getFieldsOfFieldsDiv(collName);
      $('#crudModalTitle').text(`Insert Field`);
      targetUrl = 'fields';
    }
    $('#crudModalYes').text('Save');
    $('#crudModalBody').empty();
    $('#crudModalBody').append(getErrorDiv());
    $('#crudModalBody').append(collectionFields);
    $('#crudModal').off();
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
          formValues
        );
        if (success) {
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
          {}
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

const refreshCollectionNavbar = async projectId => {
  console.log('refreshCollectionNavbar');
  const projectTabID = 'projectTab_' + getCleanDivId(projectId);
  const isNavbarExist = $(`#${projectTabID}`).html();
  if (isNavbarExist) {
    await getAjaxData();
  }

  let header = '<ul class="nav nav-tabs" role="tablist" style="margin-top: 10px;">';
  let content = '<div class="tab-content">';
  let tabs = [];
  tabs.push({
    name: 'all_collections',
    label: 'All Collections',
    id: `all_collections_${projectId}`
  });
  tabs = tabs.concat($s.collections);
  let k = 0;
  for (var i = 0; i < tabs.length; i++) {
    const collectionProjectID = tabs[i].projectID;
    if (
      (projectId && collectionProjectID == projectId) ||
      (!projectId && !collectionProjectID) ||
      tabs[i].id == `all_collections_${projectId}`
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
      const colNavbar = getCollectionTable(collectionId, projectId);
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
  if (isNavbarExist) {
    $(`#${projectTabID}`).html('');
    $(`#${projectTabID}`).append(ret);
    $('a.collection[data-toggle="tab"]').trigger('show.coreui.tab');
    return;
  } else {
    return ret;
  }
};

const getAjaxData = async () => {
  let [collections, fields, projects] = await Promise.all([
    ajaxCall('GET', '/api/v1/collections'),
    ajaxCall('GET', '/api/v1/fields'),
    ajaxCall('GET', '/api/v1/projects')
  ]);
  $s.collections = collections;
  $s.fields = fields;
  $s.projects = projects;
};

export const refreshAdminProjectNavbar = async () => {
  console.log('refreshAdminProjectNavbar');
  const isNavbarExist = $('#admin-allProjectNav').html();
  if (!isNavbarExist) {
    showTableTabs();
    bindEventHandlers();
  }
  await getAjaxData();

  let tabs = [];
  tabs.push({ name: 'all_projects', label: 'All Projects', id: 'all_projects' });
  tabs = tabs.concat($s.projects);

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
      crudButtons = getCrudButtons(projectId, projectLabel, projectName, projectId);
    } else {
      colNavbar = await refreshCollectionNavbar(projectId);
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
  if (isNavbarExist) {
    $('#admin-allProjectNav').html('');
    $('#admin-allProjectNav').append(ret);
    $('a.collection[data-toggle="tab"]').trigger('show.coreui.tab');
    return;
  } else {
    return ret;
  }
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

const getFieldsOfCollectionDiv = async (collName, projectID) => {
  let ret = '';
  const fields = Object.keys(fieldsOfCollectionsModel);
  for (var k = 0; k < fields.length; k++) {
    const name = fields[k];
    if (name == 'projectID') {
      fieldsOfCollectionsModel[name].default = projectID;
    }
    const label = fieldsOfCollectionsModel[name].label;
    const element = await getFormElement(fieldsOfCollectionsModel[name]);
    ret += getFormRow(element, label, fieldsOfCollectionsModel[name]);
  }
  return ret;
};

const getFieldsOfProjectDiv = async () => {
  let ret = '';
  const fields = Object.keys(fieldsOfProjectModel);
  for (var k = 0; k < fields.length; k++) {
    const name = fields[k];
    // if (name == 'projectID') {
    //   fieldsOfProjectModel[name].default = projectID;
    // }
    const label = fieldsOfProjectModel[name].label;
    const element = await getFormElement(fieldsOfProjectModel[name]);
    ret += getFormRow(element, label, fieldsOfProjectModel[name]);
  }
  return ret;
};
