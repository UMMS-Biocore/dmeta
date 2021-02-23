/* eslint-disable */
import axios from 'axios';
import XLSX from 'XLSX';
const JSON5 = require('json5');
import { saveAs } from 'file-saver';

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
import { getFieldsDiv, prepOntologyDropdown, prepReferenceDropdown } from './formModules/crudData';
import { prepDataPerms } from './formModules/dataPerms';
import Handsontable from 'handsontable';

// GLOBAL SCOPE
let $s = { data: {}, handsontables: {}, compare: {}, dropzone: '' };

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
  ret += `<th>DID</th>`;
  const { parentCollLabel } = getParentCollection(collID);
  if (parentCollLabel) ret += `<th>${parentCollLabel}</th>`;
  for (var i = 0; i < $s.fields.length; i++) {
    if ($s.fields[i].collectionID == collID && $s.fields[i].label && $s.fields[i].hidden !== true)
      ret += `<th>${$s.fields[i].label}</th>`;
  }
  ret += `<th>ID</th>`;
  ret += `<th>Permission</th>`;
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

const getProjectDataObj = projectID => {
  if (!projectID) return '';
  const projectData = $s.projects.filter(field => field._id === projectID);
  if (projectData && projectData[0]) return projectData[0];
  return '';
};

const makeReadOnlyUpdate = hot => {
  const data = hot.getData();
  for (let n = 0; n < data.length; n++) {
    hot.setCellMeta(n, 0, 'readOnly', true);
    hot.setCellMeta(n, 1, 'readOnly', true);
  }
};

// highlight imported table data
const makeUpdatedTableData = tableID => {
  const hot = $s.handsontables[tableID];
  const data = hot.getData();
  for (let r = 0; r < data.length; r++) {
    for (let c = 0; c < data[r].length; c++) {
      if (c === 0 || c === 1) continue;
      hot.setCellMeta(r, c, 'className', 'bg-yellow');
    }
  }
  hot.render();
};

const createHandsonTable = (tableID, header, statusExcelData) => {
  console.log(tableID);
  console.log($(`#${tableID}`));
  $(`#${tableID}`).css('display', 'block');
  const isHandsonTableInit = $(`#${tableID}`).hasClass('handsontable');
  if (!isHandsonTableInit) {
    const container = document.getElementById(tableID);
    const hot = new Handsontable(container, {
      data: statusExcelData,
      colHeaders: header,
      // height: 700,
      rowHeaders: true,
      stretchH: 'all',
      contextMenu: true,
      columnSorting: {
        indicator: true,
        headerAction: true
      },
      afterChange: changes => {
        if (changes) {
          changes.forEach(([row, prop, oldValue, newValue]) => {
            if (oldValue === null) oldValue = '';
            if (oldValue != newValue) {
              hot.setCellMeta(row, prop, 'className', 'bg-yellow');
              hot.render();
            }
          });
        }
      },
      afterCreateCol: () => {
        hot.render();
      },
      afterCreateRow: () => {
        makeReadOnlyUpdate(hot, statusExcelData);
        hot.render();
      },
      afterRemoveRow: () => {
        hot.render();
      },
      afterRemoveCol: () => {
        hot.render();
      }
    });
    // hot.alter('insert_col', 0, 2);
    // hot.setDataAtCell(0, 0, 'Update Status');
    // cellProperties.readOnly;
    //cellPropertiesID = $("#example1grid").handsontable('getCellMeta',i,j);
    //cellPropertiesID.readOnly = value;
    makeReadOnlyUpdate(hot, statusExcelData);
    hot.render();
    $s.handsontables[tableID] = hot;
  }
};

const getExcelNavbar = (collId, tabs) => {
  let header = '<ul class="nav nav-tabs" role="tablist" style="margin-top: 10px;">';
  let content = '<div class="tab-content">';
  let k = 0;
  for (var i = 0; i < tabs.length; i++) {
    k++;
    const cleanTabName = getCleanDivId(`${collId}_${tabs[i]}`);
    const tabID = 'excelTab_' + cleanTabName;
    const active = k === 1 ? 'active' : '';
    const excelId = `import-spreadsheet-${collId}-${i}`;
    const headerLi = `
      <li class="nav-item">
          <a class="nav-link ${active} excel-tabs" excelId="${excelId}" data-toggle="tab" href="#${tabID}" aria-expanded="true">${tabs[i]}</a>
      </li>`;
    header += headerLi;
    const excelTable = getExcelTable(excelId);
    const contentDiv = `
      <div role="tabpanel" class="tab-pane ${active}" excelId="${excelId}" searchtab="true" id="${tabID}">
          ${excelTable}
        </div>`;
    content += contentDiv;
  }
  header += `</ul>`;
  content += `</div>`;

  let ret = '';
  ret += '<div>';
  ret += header;
  ret += content;
  ret += '</div>';
  return ret;
};

const getKeyValueExcel = (cleanHeader, rowData) => {
  let key = '';
  let value = '';
  // if header ends with _DID, get _id from data collections
  if (cleanHeader.match(/(.*)_DID$/)) {
    const refCollName = cleanHeader.match(/(.*)_DID$/)[1];
    key = `${refCollName}_id`;
    value = rowData;
    // get _id info
    const refColl = $s.collections.filter(col => col.name === refCollName);
    if (refColl && refColl[0] && refColl[0]._id) {
      const collData = $s.data[refColl[0]._id];
      const selData = collData.filter(d => d.DID == rowData);
      if (selData && selData[0] && selData[0]._id) {
        key = `${refCollName}_id`;
        value = selData[0]._id;
      }
    }
  } else {
    key = cleanHeader;
    if (rowData === null) {
      value = '';
    } else {
      value = rowData;
    }
  }
  return { key, value };
};
const syncTableData = async (tableID, collid, collName, projectid) => {
  const hot = $s.handsontables[tableID];
  const data = hot.getData();
  const header = hot.getColHeader();
  const { projectPart } = getProjectData(projectid);
  for (let i = 0; i < data.length; i++) {
    let updatedObj = {};
    let insertObj = {};
    const rowData = data[i];
    const rowProperties = hot.getCellMetaAtRow(i);
    let updtCheck = false;
    for (let k = 0; k < rowProperties.length; k++) {
      if (k == 0 || k == 1) continue; // Skip Update status and update log columns
      const cleanHeader = header[k].replace(`${collName}.`, '');
      const { key, value } = getKeyValueExcel(cleanHeader, rowData[k]);
      if (key != '_id' && key != 'DID' && value) insertObj[key] = value;
      if (
        key != '_id' &&
        key != 'DID' &&
        rowProperties[k].className &&
        rowProperties[k].className == 'bg-yellow'
      ) {
        updtCheck = true;
        updatedObj[key] = value;
      }
    }
    console.log('updtCheck', i, updtCheck, updatedObj, insertObj);
    if (updtCheck) {
      try {
        if (!$.isEmptyObject(updatedObj)) {
          const rowID = getExcelRowID(collid, collName, header, rowData);
          // update document
          let res;
          if (rowID) {
            res = await excelCrudCall(
              'PATCH',
              `/api/v1/${projectPart}data/${collName}/${rowID}`,
              updatedObj,
              collid,
              i
            );
            console.log(res);
            // insert new document
          } else {
            res = await excelCrudCall(
              'POST',
              `/api/v1/${projectPart}data/${collName}`,
              insertObj,
              collid,
              i
            );
          }
          // update _id and DID, perms columns
          console.log(res);
          const newID = res._id;
          const newDID = res.DID;
          const newPerms = res.perms;
          const indexID = header.indexOf(`${collName}._id`);
          const indexDID = header.indexOf(`${collName}.DID`);
          const indexPerms = header.indexOf(`${collName}.perms`);
          if (indexID != -1 && newID) hot.setDataAtCell(i, indexID, newID);
          if (indexDID != -1 && newDID) hot.setDataAtCell(i, indexDID, newDID);
          if (indexPerms != -1 && newPerms) {
            if (typeof newPerms === 'object' && newPerms !== null) {
              hot.setDataAtCell(i, indexPerms, JSON.stringify(newPerms));
            } else {
              hot.setDataAtCell(i, indexPerms, newPerms);
            }
          }
        }
      } catch (err) {
        console.log(err);
      } finally {
        const status = $s.compare[collid][i].status;
        const log = $s.compare[collid][i].log;
        console.log(i);
        console.log(status);
        console.log(log);
        hot.setDataAtCell(i, 0, status);
        hot.setDataAtCell(i, 1, log);
        if (status == 'updated' || status == 'inserted') {
          for (let n = 0; n < header.length; n++) {
            hot.setCellMeta(i, n, 'className', '');
          }
        } else {
          hot.setCellMeta(i, 0, 'className', '');
          hot.setCellMeta(i, 1, 'className', '');
        }
        hot.render();
      }
    }
  }
};

const addStatusColumns = data => {
  let ret = [];
  for (let i = 0; i < data.length; i++) {
    let newArr = [];
    if (i == 0) {
      newArr.push('Update Status', 'Update Log');
    } else {
      newArr.push('', '');
    }
    newArr = newArr.concat(data[i]);
    ret.push(newArr);
  }
  return ret;
};
const createDropzone = (id, buttonID, destroy) => {
  console.log('createDropzone');
  if (destroy) {
    $(`#${id}`)[0].dropzone.destroy();
    $(`#${id}`).off();
  }
  if (!$(`#${id}`)[0].dropzone) {
    $(`#${id}`).dropzone({
      paramName: 'file', // The name that will be used to transfer the file
      maxFilesize: 30, // MB
      // maxFiles: 1,
      createImageThumbnails: false,
      dictDefaultMessage:
        'Drop your Excel file here or <button type="button" style="margin-left:4px;" class="btn btn-light" >Select File </button>',
      accept: function(file, done) {
        $s.dropzone = file.name;
        done();
      },
      init: function() {
        this.on('complete', function(file) {
          if (this.getUploadingFiles().length === 0 && this.getQueuedFiles().length === 0) {
            $(`#${buttonID}`).css('display', 'inline-block');
          }
        });
      }
    });
  }
};

const getExcelRowID = (collid, collName, header, rowData) => {
  let id = '';
  // search for ${collName}_id, or ${collName}.DID
  const indexID = header.indexOf(`${collName}._id`);
  const indexDID = header.indexOf(`${collName}.DID`);
  if (indexID != -1 && rowData[indexID]) return rowData[indexID];
  if (indexDID != -1 && rowData[indexDID]) {
    const data = $s.data[collid];
    const selData = data.filter(d => d.DID == rowData[indexDID]);
    if (selData && selData[0] && selData[0]._id) return selData[0]._id;
  }
  return id;
};

const excelCrudCall = async (method, url, data, tableID, rowIdx) => {
  if (!$s.compare[tableID]) $s.compare[tableID] = {};
  if (!$s.compare[tableID][rowIdx]) {
    $s.compare[tableID][rowIdx] = { req: '', res: '', log: '', status: '' };
  }

  try {
    Object.keys(data).forEach(key => {
      console.log(key);
      if (
        data[key] &&
        $.type(data[key]) === 'string' &&
        (data[key].charAt(0) == '{' || data[key].charAt(0) == '[')
      ) {
        data[key] = JSON5.parse(data[key]);
      }
    });
  } catch {
    console.log('Format error', data);
    $s.compare[tableID][rowIdx].log = 'Format error in json data.';
    $s.compare[tableID][rowIdx].status = 'error';
    return '';
  }
  try {
    $s.compare[tableID][rowIdx].req = data;
    console.log('data', data);

    const res = await axios({
      method,
      url,
      data
    });
    $s.compare[tableID][rowIdx].res = res.data.data.data;
    if (method == 'POST' && res.data.status == 'success') {
      $s.compare[tableID][rowIdx].status = 'inserted';
    } else if (method == 'PATCH' && res.data.status == 'success') {
      $s.compare[tableID][rowIdx].status = 'updated';
    } else {
      $s.compare[tableID][rowIdx].status = res.data.status;
    }
    $s.compare[tableID][rowIdx].log = '';
    return res.data.data.data;
  } catch (err) {
    $s.compare[tableID][rowIdx].log = err;
    if (err.response && err.response.data && err.response.data.message) {
      $s.compare[tableID][rowIdx].log = err.response.data.message;
    }
    $s.compare[tableID][rowIdx].status = 'error';
    console.log(err);
    return '';
  }
};

const bindEventHandlers = () => {
  // ================= EDIT BUTTON =================
  $(document).on('shown.coreui.tab', `.excel-tabs[data-toggle="tab"]`, async function(e) {
    console.log(this);
    const excelId = $(this).attr('excelId');
    const hot = $s.handsontables[excelId];
    hot.render();
  });

  $(document).on('click', `button.edit-data`, async function(e) {
    const collID = $(this).attr('collID');
    const collLabel = $(this).attr('collLabel');
    const collName = $(this).attr('collName');
    const projectID = $(this).attr('projectID');
    const collectionFields = await getFieldsDiv(collID, getProjectDataObj(projectID));
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

    $('#crudModal').on('show.coreui.modal', async function(e) {
      fillFormByName('#crudModal', 'input, select', selectedData[0]);
      prepReferenceDropdown('#crudModal', selectedData[0]);
      prepOntologyDropdown('#crudModal', selectedData[0]);
      await prepDataPerms('#crudModal', selectedData[0]);
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

  const prepExcelData = (collid, rowData, columnsObj, collName, format) => {
    const selColumns = [];
    let reOrderedData = [];
    const data = $s.data[collid];
    const { parentCollName } = getParentCollection(collid);
    const collFields = getFieldsOfCollection(collid);
    let refFields = [];
    for (var i = 0; i < collFields.length; i++) {
      if (collFields[i].ref) refFields.push(collFields[i].name);
    }
    for (let i = 0; i < columnsObj.length; i++) {
      // skip first column for checkboxes
      if (i === 0 && columnsObj[i].mData == '_id') continue;
      selColumns.push(columnsObj[i].mData);
    }

    for (let i = 0; i < data.length; i++) {
      let newObj = {};
      for (let k = 0; k < selColumns.length; k++) {
        const col = selColumns[k];
        if (parentCollName && col == `${parentCollName}_id`) {
          newObj[`${collName}.${parentCollName}_DID`] =
            data[i][col] && data[i][col].DID ? data[i][col].DID : '';
        } else if (refFields.includes(col)) {
          const trimmedCol = col.replace(new RegExp('_id$'), '');
          if (data[i][col] && data[i][col].DID) {
            newObj[`${collName}.${trimmedCol}_DID`] = data[i][col].DID;
          } else if (data[i][col] && data[i][col]._id) {
            newObj[`${collName}.${trimmedCol}_id`] = data[i][col]._id;
          } else {
            newObj[`${collName}.${trimmedCol}_DID`] = '';
          }
        } else if (
          (typeof data[i][col] === 'object' && data[i][col] !== null) ||
          Array.isArray(data[i][col])
        ) {
          newObj[`${collName}.${col}`] = JSON.stringify(data[i][col]);
        } else {
          newObj[`${collName}.${col}`] = data[i][col];
        }
      }
      reOrderedData.push(newObj);
    }
    if (format === 'array') {
      let arrayData = [];
      const header = Object.keys(reOrderedData[0]);
      arrayData.push(header);
      for (let i = 0; i < reOrderedData.length; i++) {
        let newArr = [];
        for (let h = 0; h < header.length; h++) {
          newArr.push(reOrderedData[i][header[h]]);
        }
        arrayData.push(newArr);
      }
      reOrderedData = arrayData;
    }
    return reOrderedData;
  };

  $(document).on('click', `button.export-excel-data`, async function(e) {
    const collid = $(this).attr('collid');
    const colllabel = $(this).attr('colllabel');
    const collName = $(this).attr('collname');
    const datatable = $(`#${collid}`).DataTable();
    const rowData = datatable
      .rows({ order: 'applied' })
      .data()
      .toArray();
    let columnsObj = datatable.init().columns;
    const excelData = prepExcelData(collid, rowData, columnsObj, collName, 'object');
    if (excelData && excelData[0]) {
      const wb = XLSX.utils.book_new();
      wb.SheetNames.push(colllabel);
      let ws;
      let headers;
      if (headers) {
        rowData.unshift(headers);
        ws = XLSX.utils.json_to_sheet(excelData, { skipHeader: true });
      } else {
        ws = XLSX.utils.json_to_sheet(excelData);
      }
      ws['!cols'] = [];
      for (let i = 0; i < Object.keys(excelData[0]).length; i++) {
        ws['!cols'].push({ width: 25 });
      }
      wb.Sheets[colllabel] = ws;
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
      function s2ab(s) {
        var buf = new ArrayBuffer(s.length);
        var view = new Uint8Array(buf);
        for (var i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xff;
        return buf;
      }
      saveAs(new Blob([s2ab(wbout)], { type: 'application/octet-stream' }), `${colllabel}.xlsx`);
    }
  });

  // ================= Edit-excel-data =================
  $(document).on('click', `button.reset-import-excel-data`, async function(e) {
    const collid = $(this).attr('collid');
    const importTableID = `import-spreadsheet-div-${collid}`;
    const importTableButID = `load-excel-table-${collid}`;
    $(`#${importTableID}`).empty();
    $(`#${importTableButID}`).css('display', 'inline-block');
    const dropzoneId = `excelUpload-${collid}`;
    $(`#${dropzoneId}`).css('display', 'block');
    createDropzone(dropzoneId, importTableButID, true);
  });
  $(document).on('click', `button.cancel-excel-data`, async function(e) {
    const collid = $(this).attr('collid');
    const tableID = `spreadsheet-${collid}`;
    const importTableID = `import-spreadsheet-div-${collid}`;
    const importTableButID = `load-excel-table-${collid}`;
    $(`#${tableID}`).css('display', 'none');
    $(`#${importTableID}`).css('display', 'none');
    $(`#${importTableButID}`).css('display', 'none');
    $(this)
      .closest('.tab-pane')
      .find('.dropzone')
      .css('display', 'none');
    $(this)
      .siblings('button.edit-excel-data')
      .css('display', 'inline-block');
    $(this)
      .siblings('button.save-excel-data')
      .css('display', 'none');
    $(this)
      .siblings('button.save-import-excel-data')
      .css('display', 'none');
    $(this)
      .siblings('button.reset-import-excel-data')
      .css('display', 'none');
    $(this)
      .siblings('button.export-excel-data')
      .css('display', 'inline-block');
    $(this)
      .siblings('button.import-excel-data')
      .css('display', 'inline-block');
    $(this)
      .siblings('button.insert-data')
      .css('display', 'inline-block');
    $(this)
      .siblings('button.edit-data')
      .css('display', 'inline-block');
    $(this)
      .siblings('button.delete-data')
      .css('display', 'inline-block');

    $(this).css('display', 'none');
    $(this)
      .closest('.tab-pane')
      .find('.table-responsive')
      .css('display', 'block');
    $($.fn.dataTable.tables(true))
      .DataTable()
      .columns.adjust();
  });

  // ================= Save-excel-data =================

  $(document).on('click', `button.save-import-excel-data`, async function(e) {
    const collid = $(this).attr('collid');
    const projectID = $(this).attr('projectID');
    const importedDiv = `#import-spreadsheet-div-${collid}`;
    // find active tab
    const activeTab = $(`${importedDiv} ul.nav-tabs li a.active.excel-tabs`);
    const tableID = activeTab.attr('excelid');
    if (!tableID || !$s.handsontables[tableID]) {
      showInfoModal('Please load excel file to import data.');
    } else {
      const hot = $s.handsontables[tableID];
      const header = hot.getColHeader();
      if (header) {
        // skip first two columns
        const columnName = header[2];
        const splitted = columnName.split('.');
        if (splitted.length !== 2) {
          showInfoModal(
            'Header format is not recognized. Collection name and field name should separated with dot symbol. e.g. exp.name, exp._id, exp_series.DID'
          );
        } else {
          const collName = splitted[0];
          const coll = getCollectionByName(collName, projectID);
          console.log(coll);
          if (!coll || !coll[0] || !coll[0]._id) {
            showInfoModal(`Collection (${collectionName}) not found.`);
          } else {
            const collectionID = coll[0]._id;
            const projectid = coll[0].projectID;
            await syncTableData(tableID, collectionID, collName, projectid);
            refreshDataTables(collid, collName, projectid);
          }
        }
      }
    }
  });
  $(document).on('click', `button.save-excel-data`, async function(e) {
    const collid = $(this).attr('collid');
    const collName = $(this).attr('collname');
    const projectid = $(this).attr('projectid');
    const tableID = `spreadsheet-${collid}`;
    // format checker -> only one collection should be defined.
    // _id or DID field should be found
    await syncTableData(tableID, collid, collName, projectid);
    refreshDataTables(collid, collName, projectid);
  });

  $(document).on('click', `button.import-excel-data`, async function(e) {
    const collid = $(this).attr('collid');
    $(`#import-spreadsheet-div-${collid}`).css('display', 'block');
    $(this)
      .closest('.tab-pane')
      .find('.table-responsive')
      .css('display', 'none');
    $(this)
      .closest('.tab-pane')
      .find('.dropzone')
      .css('display', 'block');

    $(this).css('display', 'none');
    $(this)
      .siblings('button.insert-data')
      .css('display', 'none');
    $(this)
      .siblings('button.export-excel-data')
      .css('display', 'none');
    $(this)
      .siblings('button.edit-excel-data')
      .css('display', 'none');
    $(this)
      .siblings('button.cancel-excel-data')
      .css('display', 'inline-block');
    $(this)
      .siblings('button.save-excel-data')
      .css('display', 'none');
    $(this)
      .siblings('button.save-import-excel-data')
      .css('display', 'inline-block');
    $(this)
      .siblings('button.reset-import-excel-data')
      .css('display', 'inline-block');
    $(this)
      .siblings('button.edit-data')
      .css('display', 'none');
    $(this)
      .siblings('button.delete-data')
      .css('display', 'none');

    const dropzoneId = `excelUpload-${collid}`;
    const buttonID = `load-excel-table-${collid}`;
    const isTableLoaded = $(`#import-spreadsheet-div-${collid}`).html();
    if (!$(`#${dropzoneId}`)[0].dropzone) {
      createDropzone(dropzoneId, buttonID, false);
    } else if (isTableLoaded) {
      $(`#${dropzoneId}`).css('display', 'none');
    } else {
      $(`#${buttonID}`).css('display', 'inline-block');
    }
  });

  $(document).on('click', `button.load-excel-table`, async function(e) {
    const collid = $(this).attr('collid');
    const dropzoneId = `excelUpload-${collid}`;
    const buttonID = `load-excel-table-${collid}`;

    $(`#${dropzoneId}`).css('display', 'none');
    if ($s.dropzone) {
      $(`#${buttonID}`).css('display', 'none');
      // 1. get excel data
      const res = await axios({
        method: 'POST',
        url: '/api/v1/misc/readExcelUpload',
        data: { filename: $s.dropzone }
      });
      console.log(res);
      if (res && res.data && res.data.data) {
        // 2. create tabs
        const tabData = res.data.data;
        const tabs = Object.keys(tabData);
        const excelNavbar = getExcelNavbar(collid, tabs);
        // 3. insert excel tables
        $(`#import-spreadsheet-div-${collid}`).empty();
        $(`#import-spreadsheet-div-${collid}`).append(excelNavbar);
        // 4. load excel tables
        for (let i = 0; i < tabs.length; i++) {
          const statusExcelData = addStatusColumns(tabData[tabs[i]]);
          console.log(statusExcelData);
          let header = statusExcelData.shift();
          const tableID = `import-spreadsheet-${collid}-${i}`;
          createHandsonTable(tableID, header, statusExcelData);
          makeUpdatedTableData(tableID);
        }
      }
    }
  });

  $(document).on('click', `button.edit-excel-data`, async function(e) {
    const collid = $(this).attr('collid');
    const collName = $(this).attr('collname');
    const datatable = $(`#${collid}`).DataTable();
    const rowData = datatable
      .rows()
      .data()
      .toArray();
    let columnsObj = datatable.init().columns;
    const excelData = prepExcelData(collid, rowData, columnsObj, collName, 'array');
    const statusExcelData = addStatusColumns(excelData);
    let header = statusExcelData.shift();
    $(this)
      .closest('.tab-pane')
      .find('.table-responsive')
      .css('display', 'none');
    $(this)
      .closest('.tab-pane')
      .find('.dropzone')
      .css('display', 'none');

    $(this).css('display', 'none');
    $(this)
      .siblings('button.insert-data')
      .css('display', 'none');
    $(this)
      .siblings('button.export-excel-data')
      .css('display', 'none');
    $(this)
      .siblings('button.import-excel-data')
      .css('display', 'none');
    $(this)
      .siblings('button.cancel-excel-data')
      .css('display', 'inline-block');
    $(this)
      .siblings('button.save-excel-data')
      .css('display', 'inline-block');
    $(this)
      .siblings('button.save-import-excel-data')
      .css('display', 'none');
    $(this)
      .siblings('button.reset-import-excel-data')
      .css('display', 'none');
    $(this)
      .siblings('button.edit-data')
      .css('display', 'none');
    $(this)
      .siblings('button.delete-data')
      .css('display', 'none');

    const tableID = `spreadsheet-${collid}`;
    createHandsonTable(tableID, header, statusExcelData);
  });

  // ================= INSERT BUTTON =================

  $(document).on('click', `button.insert-data`, async function(e) {
    $('#crudModalError').empty();
    const collID = $(this).attr('collID');
    const collLabel = $(this).attr('collLabel');
    const collName = $(this).attr('collName');
    const projectID = $(this).attr('projectID');
    const collectionFields = await getFieldsDiv(collID, getProjectDataObj(projectID));
    $('#crudModalTitle').text(`Insert ${collLabel}`);
    $('#crudModalYes').text('Save');
    $('#crudModalBody').empty();
    $('#crudModalBody').append(getErrorDiv());
    $('#crudModalBody').append(collectionFields);
    $('#crudModal').off();
    prepOntologyDropdown('#crudModal', {});
    await prepDataPerms('#crudModal', {});
    prepareClickToActivateModal('#crudModal', '#crudModalBody', 'input, select', {});

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

export const getCrudButtons = (collID, collLabel, collName, projectID, tableButtons) => {
  const data = `collLabel="${collLabel}" collID="${collID}" projectID="${projectID}" collName="${collName}"`;
  let tableBut = '';
  if (tableButtons) {
    tableBut = `
    <button class="btn btn-primary edit-excel-data" type="button" data-toggle="tooltip" data-placement="bottom" title="Edit in Spreadsheet Format" ${data}>
      <i class="cil-view-module"> </i>
    </button>
    <button style="display:none;" class="btn btn-primary cancel-excel-data" type="button" data-toggle="tooltip" data-placement="bottom" title="Show Table Format" ${data}>
      <i class="cil-reload"> </i>
    </button>
    <button style="display:none;" class="btn btn-primary save-excel-data" type="button" data-toggle="tooltip" data-placement="bottom" title="Save Changes in Excel Format" ${data}>
      <i class="cil-save"> </i>
    </button>
    <button class="btn btn-primary export-excel-data" type="button" data-toggle="tooltip" data-placement="bottom" title="Download as Excel File" ${data}>
      <i class="cil-arrow-circle-bottom"> </i>
    </button>
    <button class="btn btn-primary import-excel-data" type="button" data-toggle="tooltip" data-placement="bottom" title="Import as Excel File" ${data}>
      <i class="cil-arrow-thick-to-left"> </i>
    </button>
    <button style="display:none;" class="btn btn-primary save-import-excel-data" type="button" data-toggle="tooltip" data-placement="bottom" title="Save Imported Excel Data" ${data}>
      <i class="cil-save"> </i>
    </button>
    <button style="display:none;" class="btn btn-primary reset-import-excel-data" type="button" data-toggle="tooltip" data-placement="bottom" title="New Import (Reset)" ${data}>
      <i class="cil-x-circle"> </i>
    </button>
    `;
  }
  const ret = `
  <div class="row" style="margin-top: 20px;">
    <div class="col-sm-12">
      <button class="btn btn-primary insert-data" type="button" data-toggle="tooltip" data-placement="bottom" title="Insert" ${data}>
        <i class="cil-plus"> </i>
      </button>
      <button class="btn btn-primary edit-data" type="button" data-toggle="tooltip" data-placement="bottom" title="Edit" ${data}>
        <i class="cil-pencil"> </i>
      </button>
      <button class="btn btn-primary delete-data" type="button" data-toggle="tooltip" data-placement="bottom" title="Delete" ${data}>
        <i class="cil-trash"> </i>
      </button>
      ${tableBut}
    </div>
  </div>`;
  return ret;
};

const getDropzoneTable = collID => {
  const ret = `
  <form id="excelUpload-${collID}" action="/api/v1/misc/fileUpload" method="post" enctype="multipart/form-data" class="dropzone" style="display:none;">
    <div class="fallback ">
      <input name="file" type="file" />
    </div>
  </form>
  <button style="margin-top:5px; float:right; display:none;" id="load-excel-table-${collID}" class="btn btn-primary load-excel-table" collID="${collID}" type="button"> Load Table </button>
  <div id="import-spreadsheet-div-${collID}"></div>`;
  return ret;
};

const getExcelTable = id => {
  const ret = `
  <div style="height:100%; overflow:hidden; margin-top:10px;">
    <div id="${id}">
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

const getCollectionByName = (collectionName, projectID) => {
  if (projectID) {
    return $s.collections.filter(col => col.name === collectionName && col.projectID === projectID);
  } else {
    return $s.collections.filter(col => col.name === collectionName && !col.projectID);
  }
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

const prepareDataForSingleColumn = async (collName, projectID, collectionID, collFields) => {
  let ret = [];
  if (!collName) return ret;
  let refFields = [];
  for (var i = 0; i < collFields.length; i++) {
    if (collFields[i].ref) refFields.push(collFields[i].name);
  }
  const { parentCollName } = getParentCollection(collectionID);
  const { projectPart, projectName } = getProjectData(projectID);
  const data = await ajaxCall('GET', `/api/v1/${projectPart}data/${collName}/populated`);
  if (data) {
    $s.data[collectionID] = data;
    const dataCopy = data.slice();
    ret = dataCopy.map(el => {
      let newObj = {};
      $.each(el, function(k) {
        if (parentCollName && `${parentCollName}_id` === k && el[k] && el[k].name) {
          if (el[k] && el[k].name) newObj[k] = el[k].name;
        } else if (refFields.includes(k) && el[k] && el[k].name) {
          if (el[k] && el[k].name) newObj[k] = el[k].name;
        } else if ((typeof el[k] === 'object' && el[k] !== null) || Array.isArray(el[k])) {
          newObj[k] = JSON.stringify(el[k]);
        } else {
          newObj[k] = el[k];
        }
      });
      return newObj;
    });
  }
  return ret;
};

const getParentCollection = collectionID => {
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

const refreshDataTables = async (TableID, collName, projectID) => {
  const collectionID = TableID;
  const collFields = getFieldsOfCollection(TableID);
  const data = await prepareDataForSingleColumn(collName, projectID, collectionID, collFields);

  if (!$.fn.DataTable.isDataTable(`#${TableID}`)) {
    let columns = [];
    columns.push({ data: '_id' }); // for checkboxes
    columns.push({ data: 'DID' }); // dolphin id
    // 1. if parent collection id is defined, insert as a new field
    const { parentCollName } = getParentCollection(collectionID);
    if (parentCollName) {
      columns.push({ data: `${parentCollName}_id` });
    }
    for (var i = 0; i < collFields.length; i++) {
      columns.push({ data: collFields[i].name });
    }
    columns.push({ data: '_id' });
    columns.push({ data: 'perms' });
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
      const colTable = getCollectionTable(collectionId);
      const colExcelTable = getExcelTable(`spreadsheet-${collectionId}`);
      const colDropzone = getDropzoneTable(collectionId);
      const crudButtons = getCrudButtons(
        collectionId,
        collectionLabel,
        collectionName,
        projectId,
        true
      );

      const contentDiv = `
      <div role="tabpanel" class="tab-pane ${active}" searchtab="true" id="${collTabID}">
          ${crudButtons}
          ${colTable}
          ${colExcelTable}
          ${colDropzone}
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
