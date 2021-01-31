/* eslint-disable */
import axios from 'axios';
import {
  getCleanDivId,
  showInfoModal,
  createFormObj,
  convertFormObj,
  getUpdatedFields,
  showFormError,
  fillFormByName,
  prepareMultiUpdateModal,
  prepareClickToActivateModal
} from './jsfuncs';
import {
  getCollectionFieldData,
  getFieldsDiv,
  getParentCollection,
  prepOntologyDropdown
} from './crudData';

// GLOBAL SCOPE
let $s = { data: {} };

const ajaxCall = async (method, url) => {
  console.log(method, url);
  try {
    const res = await axios({
      method,
      url
    });
    //console.log(res.data.data.data);
    return res.data.data.data;
  } catch (err) {
    //console.log(err);
    return '';
  }
};

const getTableHeaders = collID => {
  let ret = '';
  ret += `<th></th>`; // for checkboxes
  // const { parentCollLabel } = getParentCollection(collID);
  // if (parentCollLabel) ret += `<th>${parentCollLabel}</th>`;
  for (var i = 0; i < $s.fields.length; i++) {
    if ($s.fields[i].collectionID == collID && $s.fields[i].label && $s.fields[i].hidden !== true)
      ret += `<th>${$s.fields[i].label}</th>`;
  }
  ret += `<th>ID</th>`;
  return ret;
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
    const collectionFields = await getFieldsDiv(collID);
    $('#crudModalTitle').text(`Edit ${collLabel}`);
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
      prepOntologyDropdown('#crudModal', selectedData[0]);
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
            'data',
            'PATCH',
            selectedData[i]._id,
            projectID,
            collName,
            formObj,
            formValues
          );
          if (!success) {
            refreshDataTables(collID, collName, projectID);
            break;
          }
          if (success && selectedData.length - 1 === i) {
            refreshDataTables(collID, collName, projectID);
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
    const collectionFields = await getFieldsDiv(collID);
    $('#crudModalTitle').text(`Insert ${collLabel}`);
    $('#crudModalYes').text('Save');
    $('#crudModalBody').empty();
    $('#crudModalBody').append(getErrorDiv());
    $('#crudModalBody').append(collectionFields);
    $('#crudModal').off();
    prepOntologyDropdown('#crudModal', {});
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
          'data',
          'POST',
          '',
          projectID,
          collName,
          formObj,
          formValues
        );
        if (success) {
          refreshDataTables(collID, collName, projectID);
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
    $('#crudModalTitle').text(`Remove ${collLabel}`);
    $('#crudModalYes').text('Remove');
    $('#crudModalBody').empty();
    $('#crudModalBody').append(getErrorDiv());
    $('#crudModalBody').append(`<p>Are you sure you want to delete ${items}</p>`);
    $('#crudModal').off();
    $('#crudModal').on('click', '#crudModalYes', async function(e) {
      e.preventDefault();
      for (var i = 0; i < selectedData.length; i++) {
        const success = await crudAjaxRequest(
          'data',
          'DELETE',
          selectedData[i]._id,
          projectID,
          collName,
          {},
          {}
        );
        if (!success) {
          refreshDataTables(collID, collName, projectID);
          break;
        }
        if (success && selectedData.length - 1 === i) {
          refreshDataTables(collID, collName, projectID);
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

export const getCrudButtons = (collID, collLabel, collName, projectID) => {
  const data = `collLabel="${collLabel}" collID="${collID}" projectID="${projectID}" collName="${collName}"`;
  const ret = `
  <div class="row" style="margin-top: 20px;">
    <div class="col-sm-12">
      <button class="btn insert-data btn-primary" type="button" ${data}>Insert</button>
      <button class="btn edit-data btn-primary" type="button" ${data}">Edit</button>
      <button class="btn delete-data btn-primary" type="button" ${data}">Delete</button>
    </div>
  </div>`;
  return ret;
};

const getCollectionTable = collID => {
  const headers = getTableHeaders(collID);
  const ret = `
  <div class="table-responsive" style="overflow-x:auto; width:100%; ">
    <table id="${collID}" class="table table-striped" style='white-space: nowrap; width:100%;' cellspacing="0" >
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
  return $s.fields.filter(field => field.collectionID === collectionID && field.hidden !== true);
};

const getProjectData = projectID => {
  const project = $s.projects.filter(item => item.id === projectID);
  const projectName = project[0] && project[0].name ? project[0].name : '';
  const projectPart = projectName ? `projects/${projectName}/` : '';
  return { projectName, projectPart };
};

export const crudAjaxRequest = async (
  targetCollection,
  method,
  id,
  projectID,
  collName,
  formObj,
  formValues
) => {
  let url = '';
  const idsPart = id ? `/${id}` : '';
  if (targetCollection == 'data') {
    const { projectPart } = getProjectData(projectID);
    url = `/api/v1/${projectPart}data/${collName}${idsPart}`;
  } else {
    url = `/api/v1/${targetCollection}${idsPart}`;
  }
  try {
    console.log('formObj', formObj);
    const res = await axios({
      method: method,
      url: url,
      data: formObj
    });
    if (res && res.data && res.data.status === 'success') {
      return true;
    }
    return false;
  } catch (e) {
    console.log(e);
    let err = '';
    if (e.response && e.response.data) {
      console.log(e.response.data);
      if (e.response.data.error && e.response.data.error.errors) {
        showFormError(formValues, e.response.data.error.errors, true);
        return;
      }
      if (e.response.data.message) err += JSON.stringify(e.response.data.message);
    }
    if (!err) err = JSON.stringify(e);
    if (err) showInfoInDiv('#crudModalError', err);
    return false;
  }
};

const prepareDataForSingleColumn = async (collName, projectID) => {
  let ret = [];
  if (!collName) return ret;
  const { projectPart, projectName } = getProjectData(projectID);
  const data = await ajaxCall('GET', `/api/v1/${projectPart}data/${collName}`);
  if (data) {
    const saveDataPath = `${projectName}_${collName}`;
    $s.data[saveDataPath] = data;
    const dataCopy = data.slice();
    ret = dataCopy.map(el => {
      $.each(el, function(k) {
        if ((typeof el[k] === 'object' && el[k] !== null) || Array.isArray(el[k])) {
          el[k] = JSON.stringify(el[k]);
        }
      });
      return el;
    });
  }
  return ret;
};

const refreshDataTables = async (TableID, collName, projectID) => {
  const data = await prepareDataForSingleColumn(collName, projectID);
  const collectionID = TableID;

  if (!$.fn.DataTable.isDataTable(`#${TableID}`)) {
    const collFields = getFieldsOfCollection(TableID);
    let columns = [];
    columns.push({ data: '_id' }); // for checkboxes
    // 1. if parent collection id is defined, insert as a new field
    // const { parentCollName } = getParentCollection(collectionID);
    // if (parentCollName) {
    //   columns.push({ data: `${parentCollName}_id` }); // for checkboxes
    // }

    for (var i = 0; i < collFields.length; i++) {
      columns.push({ data: collFields[i].name });
    }
    columns.push({ data: '_id' });
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
    dataTableObj.scrollCollapse = true;
    dataTableObj.colReorder = true;
    dataTableObj.sScrollX = true;
    $s.TableID = $(`#${TableID}`).DataTable(dataTableObj);
  } else {
    $(`#${TableID}`)
      .DataTable()
      .clear()
      .rows.add(data)
      .draw();
  }
};
const showTableTabs = () => {
  $(document).on('show.coreui.tab', 'a.collection[data-toggle="tab"]', function(e) {
    const collName = $(e.target).attr('collName');
    const tableID = $(e.target).attr('tableID');
    const projectID = $(e.target).attr('projectID');
    refreshDataTables(tableID, collName, projectID);
  });
  $(document).on('shown.coreui.tab', 'a.collection[data-toggle="tab"]', function(e) {
    $($.fn.dataTable.tables(true))
      .DataTable()
      .columns.adjust();
  });
};

const getCollectionNavbar = async projectId => {
  // await getCollectionFieldData();
  let header = '<ul class="nav nav-tabs" role="tablist" style="margin-top: 10px;">';
  let content = '<div class="tab-content">';

  if ($s.collections.length == 0) {
    content = '';
    header += '<p> No document found.</p>';
  }
  let k = 0;
  for (var i = 0; i < $s.collections.length; i++) {
    const collectionProjectID = $s.collections[i].projectID;
    if ((projectId && collectionProjectID == projectId) || (!projectId && !collectionProjectID)) {
      k++;
      const collectionName = $s.collections[i].name;
      const collectionLabel = $s.collections[i].label;
      const collectionId = $s.collections[i].id;
      const id = getCleanDivId(collectionLabel);
      const collTabID = 'collTab_' + id;
      const active = k === 1 ? 'active' : '';
      const headerLi = `
      <li class="nav-item">
          <a class="nav-link ${active} collection" data-toggle="tab" collName="${collectionName}" tableID="${collectionId}" projectID="${projectId}" href="#${collTabID}" aria-expanded="true">${collectionLabel}</a>
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

export const getProjectNavbar = async () => {
  showTableTabs();
  bindEventHandlers();
  let [projects, collections, fields] = await Promise.all([
    ajaxCall('GET', '/api/v1/projects'),
    ajaxCall('GET', '/api/v1/collections'),
    ajaxCall('GET', '/api/v1/fields')
  ]);
  $s.collections = collections;
  $s.fields = fields;
  $s.projects = projects;
  let tabs = [];
  // tabs.push({ label: 'Public', id: '', name: 'public' });
  if ($s.projects) tabs = tabs.concat($s.projects);
  let header = '<ul class="nav nav-tabs" role="tablist">';
  let content = '<div class="tab-content">';

  if ($s.projects.length == 0) {
    content = '';
    header = '<p> No document found.</p>';
  }
  for (var i = 0; i < tabs.length; i++) {
    const projectId = tabs[i].id;
    const projectLabel = tabs[i].label;
    const projectName = tabs[i].name;
    const id = getCleanDivId(projectName);
    const projectTabID = 'projectTab_' + id;
    const active = i === 0 ? 'active' : '';
    const headerLi = `
    <li class="nav-item">
        <a class="nav-link ${active} collection" data-toggle="tab" href="#${projectTabID}" aria-expanded="true">${projectLabel}</a>
    </li>`;
    header += headerLi;
    const colNavbar = await getCollectionNavbar(projectId);

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
