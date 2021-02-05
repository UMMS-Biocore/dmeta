/* eslint-disable */
import axios from 'axios';
import { getCleanDivId } from './jsfuncs';
import { getInsertDataDiv } from './formModules/crudData';
// GLOBAL SCOPE
let $s = { data: {}, compare: {}, diff: {} };
let $g = { data: {} };

// Make it for all projects for now only vitiligo supported
const projectPart = 'projects/vitiligo/';
const colls = ['exp', 'biosamp', 'sample', 'file'];

const ajaxCall = async (method, url) => {
  try {
    const res = await axios({
      method,
      url
    });
    return res.data.data;
  } catch (err) {
    console.log(err);
    return '';
  }
};

// save crudCalls in $s.compare object:
// e.g. $s.compare.tableID.rowIdx: {
//                                   POST: { req:{}, res:{}, log:"", status:""},
//                                   PATCH: {req:{}, res:{}, log:"", status:""}
//                                  }
const crudCall = async (method, url, data, tableID, rowIdx) => {
  if (!$s.compare[tableID]) $s.compare[tableID] = {};
  if (!$s.compare[tableID][rowIdx]) $s.compare[tableID][rowIdx] = {};
  if (!$s.compare[tableID][rowIdx][method]) {
    $s.compare[tableID][rowIdx][method] = { req: '', res: '', log: '', status: '' };
  }
  try {
    Object.keys(data).forEach(key => {
      if (data[key] && (data[key].charAt(0) == '{' || data[key].charAt(0) == '[')) {
        console.log(data[key]);
        data[key] = eval(data[key]);
      }
    });
  } catch {
    console.log('eval failed', data);
    $s.compare[tableID][rowIdx][method].log = 'Format error in json data.';
    $s.compare[tableID][rowIdx][method].status = 'error';
    return '';
  }
  try {
    $s.compare[tableID][rowIdx][method].req = data;

    console.log('data', data);

    const res = await axios({
      method,
      url,
      data
    });
    $s.compare[tableID][rowIdx][method].res = res.data.data.data;
    if (method == 'POST' && res.data.status == 'success') {
      $s.compare[tableID][rowIdx][method].status = 'inserted';
    } else if (method == 'PATCH' && res.data.status == 'success') {
      $s.compare[tableID][rowIdx][method].status = 'updated';
    } else {
      $s.compare[tableID][rowIdx][method].status = res.data.status;
    }
    return res;
  } catch (err) {
    $s.compare[tableID][rowIdx][method].log = err;
    if (err.response && err.response.data && err.response.data.message) {
      $s.compare[tableID][rowIdx][method].log = err.response.data.message;
    }
    $s.compare[tableID][rowIdx][method].status = 'error';
    console.log(err);
    return '';
  }
};

const getTableColumns = data => {
  const defCols = ['$plusButton', 'Status'];
  if (data[0]) {
    const dataCols = Object.keys(data[0]);
    return defCols.concat(dataCols);
  }
  return [];
};

const getTableHeaders = cols => {
  let ret = '';
  for (var i = 0; i < cols.length; i++) {
    let label = cols[i];
    if (cols[i] == '$plusButton') label = '';
    ret += `<th>${label}</th>`;
  }
  return ret;
};

const getImportTable = (data, TableID) => {
  const cols = getTableColumns(data);
  const headers = getTableHeaders(cols);
  const ret = `
  <div class="table-responsive" style="overflow-x:auto; width:100%; ">
    <table id="${TableID}" class="table table-striped" style='white-space: nowrap; width:100%;' cellspacing="0" >
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
const bindEventHandlers = () => {
  $(document).on('click', '.update-db', function(e) {
    e.preventDefault();
    const tabId = $(this).attr('tabId');
    // reset $s object
    $s.data[tabId] = {};
    $s.compare[tabId] = {};
    $s.diff[tabId] = {};
    getDbData(tabId);
  });
};

const getDiffTable = obj => {
  console.log('obj', obj);
  let ret = '';
  if (obj && obj.status == 'not-equal' && obj.db && obj.google) {
    const headerRow = ['', 'database', 'google-sheet'];
    const rowHeaders = Object.keys(obj.db);
    ret += '<h4 style="text-align: center; margin-bottom:10px;">Difference Table</h4>';
    ret += '<table class="table-not-striped" style="width:100%"><tbody>';
    ret += `<tr style="font-weight:700;"><td>${headerRow[0]}</td><td>${headerRow[1]}</td><td>${headerRow[2]}</td></tr>`;
    for (var k = 0; k < rowHeaders.length; k++) {
      const label = rowHeaders[k] ? rowHeaders[k] : '';
      const dbVal = obj.db[rowHeaders[k]] ? obj.db[rowHeaders[k]] : '-';
      const googleVal = obj.google[rowHeaders[k]] ? obj.google[rowHeaders[k]] : '-';
      ret += `<tr><td>${label}</td><td>${dbVal}</td><td>${googleVal}</td></tr>`;
    }
    ret += '</tbody></table>';
  }
  if (obj && obj.log) {
    const log = JSON.stringify(obj.log);
    ret += '<h4 style="text-align: center; margin-top:30px; margin-bottom:10px;">Log</h4>';
    ret += '<table class="table-not-striped" style="width:100%"><tbody>';
    ret += `<tr><td>${log}</td></tr>`;
    ret += '</tbody></table>';
  }
  return ret;
};
const getCrudTable = (obj, method) => {
  let ret = '';
  if (obj) {
    if (obj.req) {
      const headerRow = ['', 'Requested', 'Returned'];
      const rowHeaders = Object.keys(obj.req);
      ret += `<h4 style="text-align: center; margin-top:30px; margin-bottom:10px;">AJAX Table - ${method} Request</h4>`;
      ret += '<table class="table-not-striped" style="width:100%"><tbody>';
      ret += `<tr style="font-weight:700;"><td>${headerRow[0]}</td><td>${headerRow[1]}</td><td>${headerRow[2]}</td></tr>`;
      for (var k = 0; k < rowHeaders.length; k++) {
        const label = rowHeaders[k] ? rowHeaders[k] : '';
        const reqVal = obj.req[rowHeaders[k]] ? obj.req[rowHeaders[k]] : '-';
        const resVal = obj.res[rowHeaders[k]] ? obj.res[rowHeaders[k]] : '-';
        ret += `<tr><td>${label}</td><td>${reqVal}</td><td>${resVal}</td></tr>`;
      }
      ret += '</tbody></table>';
    }
    if (obj.log) {
      const log = JSON.stringify(obj.log);
      ret += '<h4 style="text-align: center; margin-top:30px; margin-bottom:10px;">AJAX Log</h4>';
      ret += '<table class="table-not-striped" style="width:100%"><tbody>';
      ret += `<tr><td>${log}</td></tr>`;
      ret += '</tbody></table>';
    }
  }
  return ret;
};

const prepareCompTable = (diffObj, crudObj, method) => {
  let table = '';
  table += getDiffTable(diffObj);
  table += getCrudTable(crudObj, method);
  return table;
};

const formatChildRow = async (rowdata, rowIdx, TableID) => {
  const diffObj = getDiffObj(TableID, rowIdx);
  const { crudObj, method } = getCrudObj(TableID, rowIdx);
  const table = prepareCompTable(diffObj, crudObj, method);
  if (!table) return 'No Data found.';
  const ret = `
  <div style="margin-top:10px; width:1850px;">
    <div class="row">
      <div class="col-sm-9">
        <div class="card">
          <div class="card-body summary_card" style="overflow:auto;">
            ${table}
          </div>
        </div>
      </div>
    </div>
  </div>`;
  return ret;
};

const compareWithDB = async (gdata, ddata, tabId) => {
  //console.log(ddata[0].name);
  // get parentCollection data
  const parentColl = colls[Number(tabId) - 1];
  const currColl = colls[tabId];
  const dat = await ajaxCall('GET', `/api/v1/${projectPart}data/${parentColl}`);
  const parentData = dat.data;

  for (var i = 0; i < gdata.length; i++) {
    let recordfound = [];
    try {
      //name should be unique for this check
      recordfound = ddata.filter(ddata => ddata.name === gdata[i].name);
    } catch (err) {
      console.log(err);
    }
    //record found -> then compare it and patch if necessary
    // save diff in $s.diff object:
    // e.g. $s.diff.tableID.rowIdx: {db:recordfound[0][key], google:gdata[i][key], status:""}
    if (recordfound.length > 0) {
      if (!$s.diff[tabId]) $s.diff[tabId] = {};
      if (!$s.diff[tabId][i]) $s.diff[tabId][i] = { db: {}, google: {}, status: '' };
      let k = 0;
      Object.keys(gdata[i]).forEach(key => {
        let gdat = gdata[i][key];
        let rec = recordfound[0][key];
        try {
          if (gdat && (gdat.charAt(0) == '{' || gdat.charAt(0) == '[')) {
            let val = eval(gdat);
            console.log(val);
            gdat = JSON.stringify(val);
          }
        } catch (err) {
          console.log('format error', err);
        }

        if (rec && (typeof rec === 'object' || Array.isArray(rec))) rec = JSON.stringify(rec);
        if (gdat != rec) {
          $s.diff[tabId][i].db[key] = rec;
          $s.diff[tabId][i].google[key] = gdat;
          k++;
        }
      });

      // ** Consider removing unused keys

      if (k > 0) {
        console.log(ddata);
        console.log('Patch ', gdata[i].name);
        $s.diff[tabId][i].status = 'not-equal';

        const res = await crudCall(
          'PATCH',
          `/api/v1/${projectPart}data/${currColl}/${recordfound[0]._id}`,
          gdata[i],
          tabId,
          i
        );
      } else {
        // values are equal, update status equal
        $s.diff[tabId][i].status = 'passed';
      }
      // record not found -> insert document
    } else {
      let m = 0;
      // copy gdata[i] for insert
      let insert = $.extend(true, {}, gdata[i]);
      if (tabId == 1 && !insert.exp_id) {
        m++;
        console.log(parentData[0]._id);
        // there is only one experiment for now
        insert.exp_id = parentData[0]._id;
      } else if (tabId == 2 && !insert.biosamp_id) {
        // find parent data based on their unique_id
        const recordfound = parentData.filter(dat => dat.unique_id === insert.unique_id);
        if (recordfound.length > 0) {
          m++;
          insert.biosamp_id = recordfound[0]._id;
        }
      } else if (tabId == 3 && !insert.sample_id) {
        const recordfound = parentData.filter(dat => dat.unique_id === insert.unique_id);
        if (recordfound.length > 0) {
          m++;
          insert.sample_id = recordfound[0]._id;
        }
      }
      if (m > 0) {
        console.log('DATA:[', i, ']', insert);
        const res = await crudCall(
          'POST',
          `/api/v1/${projectPart}data/${currColl}`,
          insert,
          tabId,
          i
        );
      } else {
        if (!$s.diff[tabId]) $s.diff[tabId] = {};
        if (!$s.diff[tabId][i]) $s.diff[tabId][i] = { status: '', log: '' };
        $s.diff[tabId][i].status = 'no-parent';
        $s.diff[tabId][
          i
        ].log = `Insert couldn't be performed. Parent collection data not found for unique_id=${insert.unique_id}`;
      }
    }
    updateRowStatus(tabId, i);
  }
  updateTableDropdown(tabId);
  console.log($s.compare);
  console.log($s.diff);
};

const getCrudObj = (TableID, rowIdx) => {
  let crudObj;
  let method;
  if ($s.compare[TableID] && $s.compare[TableID][rowIdx] && $s.compare[TableID][rowIdx].PATCH) {
    crudObj = $s.compare[TableID][rowIdx].PATCH;
    method = 'PATCH';
  }
  if ($s.compare[TableID] && $s.compare[TableID][rowIdx] && $s.compare[TableID][rowIdx].POST) {
    crudObj = $s.compare[TableID][rowIdx].POST;
    method = 'POST';
  }
  return { crudObj, method };
};
const getDiffObj = (TableID, rowIdx) => {
  let diffObj;
  if ($s.diff[TableID] && $s.diff[TableID][rowIdx]) diffObj = $s.diff[TableID][rowIdx];
  return diffObj;
};

const getDiffStatus = (TableID, rowIdx) => {
  let status = '';
  if ($s.diff[TableID] && $s.diff[TableID][rowIdx] && $s.diff[TableID][rowIdx].status)
    return $s.diff[TableID][rowIdx].status;
  return status;
};

const updateTableDropdown = TableID => {
  const statusColumn = 1;
  const selectID = `#select-${TableID}-Status`;
  console.log(selectID);
  $(selectID).empty();
  let i = 0;
  $s[TableID].column(statusColumn)
    .data()
    .unique()
    .sort()
    .each(function(d, j) {
      if (d) {
        i++;
        if (i === 1)
          $(selectID).append(`<div class="col-sm-1"><label>Status Filter:</label></div>`);
        $(selectID).append(`
        <div class="col-sm-1">
          <div class="form-check">
            <input data-val="${d}" data-column="${statusColumn}" class="form-check-input toggle-filter-${TableID}" type="checkbox" value=""></input>
            <label class="form-check-label" style="display:block; white-space: nowrap;
               text-overflow: ellipsis;"  >
              <span style="text-align:left;">${d}</span>
            </label>
          </div>
        </div>`);
      }
    });
  $(`input.toggle-filter-${TableID}`).trigger('change');
};

const updateRowStatus = (TableID, rowIdx) => {
  //Status column locaapited at second column
  let status = '';
  let crudObjStatus = '';
  const statusColIdx = 1;
  const { crudObj } = getCrudObj(TableID, rowIdx);
  if (crudObj) crudObjStatus = crudObj.status;
  const diffStatus = getDiffStatus(TableID, rowIdx);
  if (diffStatus == 'passes' || !crudObjStatus) {
    status = diffStatus;
  } else if (crudObjStatus) {
    status = crudObjStatus;
  }
  $s[TableID].cell({ row: rowIdx, column: statusColIdx }).data(status);
};

const getDbData = async tabId => {
  // Only three collections supported now (make this part generic)
  const data = await ajaxCall('GET', `/api/v1/${projectPart}data/${colls[tabId]}`);
  $s.data[tabId] = data.data;
  compareWithDB($g.data[tabId], $s.data[tabId], tabId);
};

const showTableTabs = async googleSheetId => {
  $(document).on('show.coreui.tab', 'a.collection[data-toggle="tab"]', function(e) {
    const collName = $(e.target).attr('collName');
    const tableID = $(e.target).attr('tableID');
    const contentDivId = $(e.target).attr('href');
    if (collName != 'Run') {
      refreshDataTables(googleSheetId, tableID, contentDivId);
    }
  });
  $(document).on('shown.coreui.tab', 'a.collection[data-toggle="tab"]', function(e) {
    $($.fn.dataTable.tables(true))
      .DataTable()
      .columns.adjust();
  });
};
const prepareData = async (googleSheetId, tableID) => {
  try {
    const data = await ajaxCall('GET', ` /api/v1/misc/getGoogleSheet/${googleSheetId}/${tableID}`);
    $g.data[tableID] = JSON.parse(data);
    return JSON.parse(data);
  } catch (err) {
    return '';
  }
};

const refreshDataTables = async (googleSheetId, TableID, contentDivId) => {
  const searchBarID = `#searchBar-${TableID}`;
  const initCompImport = function(settings, json) {
    console.log('initCompImport');
    var api = new $.fn.dataTable.Api(settings);

    var columnsToSearch = { 1: 'Status' };
    for (var i in columnsToSearch) {
      var selectID = `select-${TableID}-${columnsToSearch[i]}`;
      var filterID = `filter-${TableID}-${columnsToSearch[i]}`;
      $(TableID + '_filter').css('display', 'inline-block');
      $(searchBarID).append(
        `<div style="margin-bottom:20px; padding-left:8px;" id="${filterID}"></div>`
      );

      $(`<div id="${selectID}" class="row" ><div class="col-sm-6"></div></div>`)
        .appendTo($('#' + filterID).empty())
        .attr('data-col', i);
    }

    // Add event listener for opening and closing details
    $(document).on('click', `td.details-control-${TableID}`, async function(e) {
      var icon = $(this).find('i');
      var tr = $(this).closest('tr');
      var row = api.row(tr);
      const rowIdx = $s[TableID].row(this).index();
      if (row.child.isShown()) {
        // close child row
        row.child.hide();
        tr.removeClass('shown');
        icon.removeClass('cil-minus').addClass('cil-plus');
      } else {
        // Open child row
        const rowdata = row.data();
        const formattedRow = await formatChildRow(rowdata, rowIdx, TableID);
        row.child(formattedRow).show();
        tr.addClass('shown');
        icon.removeClass('cil-plus').addClass('cil-minus');
      }
    });

    // Bind event handler for toggle-filter checkbox at the sidebar
    $(document).on('change', `input.toggle-filter-${TableID}`, function(e) {
      var dataColumn = $(this).attr('data-column');
      let vals = [];
      var dataFilters = $(`input.toggle-filter-${TableID}[data-column="${dataColumn}"]`);
      for (var k = 0; k < dataFilters.length; k++) {
        if ($(dataFilters[k]).is(':checked')) {
          vals.push($(dataFilters[k]).attr('data-val'));
        }
      }
      var valReg = '';
      for (var k = 0; k < vals.length; k++) {
        var val = $.fn.dataTable.util.escapeRegex(vals[k]);
        if (val) {
          if (k + 1 !== vals.length) {
            valReg += val + '|';
          } else {
            valReg += val;
          }
        }
      }
      api
        .column(dataColumn)
        .search(valReg ? '(^|,)' + valReg + '(,|$)' : '', true, false)
        .draw();
    });
  };

  if (!$.fn.DataTable.isDataTable(`#${TableID}`)) {
    const data = await prepareData(googleSheetId, TableID);
    if (data) {
      const tableContent = getImportTable(data, TableID);
      $(contentDivId).append(tableContent);

      const cols = getTableColumns(data);
      let columns = [];
      for (var i = 0; i < cols.length; i++) {
        if (cols[i] == '$plusButton') {
          columns.push({
            className: `details-control-${TableID}`,
            orderable: false,
            data: null,
            defaultContent: '<i class="cil-plus"></i>'
          });
        } else {
          columns.push({ data: cols[i] });
        }
      }
      var dataTableObj = {
        columns: columns,
        columnDefs: [
          { defaultContent: '-', targets: '_all' } //hides undefined error
        ],
        order: [[2, 'asc']],
        initComplete: initCompImport,
        lengthMenu: [
          [10, 25, 50, -1],
          [10, 25, 50, 'All']
        ]
      };
      dataTableObj.pageLength = 25;
      dataTableObj.dom = '<"' + searchBarID + '.pull-left"f>lrt<"pull-left"i><"bottom"p><"clear">';
      dataTableObj.destroy = true;
      dataTableObj.data = data;
      dataTableObj.hover = true;
      // speed up the table loading
      dataTableObj.deferRender = true;
      dataTableObj.scroller = true;
      dataTableObj.scrollCollapse = true;
      dataTableObj.colReorder = true;
      dataTableObj.sScrollX = true;

      $s[TableID] = $(`#${TableID}`).DataTable(dataTableObj);
    }
  }
};

export const getImportPageNavBar = async googleSheetId => {
  bindEventHandlers();
  showTableTabs(googleSheetId);
  let header = '<ul class="nav nav-tabs" role="tablist" style="margin-top: 10px;">';
  let content = '<div class="tab-content">';

  let tabNames = ['Biosample', 'Sample', 'Files', 'Run'];
  for (var i = 0; i < tabNames.length; i++) {
    const tabId = i + 1;
    const Name = tabNames[i];
    const Label = tabNames[i];
    const id = getCleanDivId(Label);
    const importTabId = 'importTab_' + id;
    const active = i === 0 ? 'active' : '';
    const headerLi = `
      <li class="nav-item">
          <a class="nav-link ${active} collection" data-toggle="tab" collName="${Name}" tableID="${tabId}" href="#${importTabId}" aria-expanded="true">${Label}</a>
      </li>`;
    header += headerLi;
    let contentDiv = `
      <div role="tabpanel" class="tab-pane ${active}" searchtab="true" id="${importTabId}">
        <div class="row" style="margin-top: 10px;">
          <div class="col-sm-12">
            <button class="btn update-db btn-primary" type="button" tabId="${tabId}">Update ${Label}</button>
          </div>
        </div>
      </div>`;
    if (Name == 'Run') {
      const insertDiv = await getInsertDataDiv();
      contentDiv = `<div role="tabpanel" class="tab-pane ${active}" searchtab="true" id="${importTabId}">${insertDiv}</div>`;
    }
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
