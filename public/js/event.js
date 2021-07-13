/* eslint-disable */
import axios from 'axios';
import moment from 'moment';

import { showInfoModal } from './jsfuncs';

// GLOBAL SCOPE
let $s = { events: {} };

const ajaxCall = async (method, url) => {
  console.log(method, url);
  try {
    const res = await axios({
      method,
      url
    });
    return res.data.data.data;
  } catch (err) {
    //console.log(err);
    return '';
  }
};

const refreshEventTable = async (id, data) => {
  const TableID = `table-${id}`;
  if (!data) data = [];
  let fomatted_data = [];
  if (data.length) {
    fomatted_data = data.map(i => {
      i.creationDate = moment(i.creationDate)
        .utc()
        .format('YYYY-MM-DD hh:mm:ss');
      i.req = JSON.stringify(i.req);
      return i;
    });
  }
  if ($.fn.DataTable.isDataTable(`#${TableID}`)) {
    $(`#${TableID}`)
      .DataTable()
      .destroy();
  }
  if (!$.fn.DataTable.isDataTable(`#${TableID}`)) {
    let columns = [];
    let dataTableObj = {};
    if (id == 'events') {
      columns.push({ data: 'doc_id' });
      columns.push({ data: 'project.name' });
      columns.push({ data: 'coll.name' });
      columns.push({ data: 'type' });
      columns.push({ data: 'creationDate' });
      columns.push({ data: 'owner.username' });
      columns.push({ data: 'req' });
      dataTableObj.order = [[4, 'desc']];
    } else {
      columns.push({ data: 'doc_id' });
      columns.push({ data: 'target' });
      columns.push({ data: 'project.name' });
      columns.push({ data: 'coll.name' });
      columns.push({ data: 'field.name' });
      columns.push({ data: 'type' });
      columns.push({ data: 'creationDate' });
      columns.push({ data: 'owner.username' });
      columns.push({ data: 'req' });
      dataTableObj.order = [[6, 'desc']];
    }

    dataTableObj.columns = columns;
    dataTableObj.columnDefs = [
      { defaultContent: '', targets: '_all' } //hides undefined error,
    ];

    dataTableObj.dom = '<"pull-left"f>lrt<"pull-left"i><"bottom"p><"clear">';
    dataTableObj.destroy = true;
    dataTableObj.pageLength = 10;
    dataTableObj.data = fomatted_data;
    dataTableObj.hover = true;
    // speed up the table loading
    dataTableObj.deferRender = true;
    dataTableObj.scroller = true;
    dataTableObj.scrollCollapse = true;
    // dataTableObj.sScrollX = true; // dropdown remains under the datatable div
    $s.TableID = $(`#${TableID}`).DataTable(dataTableObj);
  }
};

const getTableHeaders = labels => {
  let ret = '';
  for (var i = 0; i < labels.length; i++) {
    ret += `<th>${labels[i]}</th>`;
  }
  return ret;
};

const getEventDiv = id => {
  let headers;
  let title;
  if (id == 'events') {
    title = 'Event History';
    headers = getTableHeaders([
      'Doc',
      'Project',
      'Collection',
      'Type',
      'Date',
      'Performed By',
      'Request'
    ]);
  } else if (id == 'adminevents') {
    title = 'Admin Event History';
    headers = getTableHeaders([
      'Doc',
      'Target',
      'Project',
      'Collection',
      'Field',
      'Type',
      'Date',
      'Performed By',
      'Request'
    ]);
  }

  const tableID = `table-${id}`;
  const table = `
  <div class="table-responsive" style="overflow-x:auto; width:100%; ">
    <table id="${tableID}" class="table table-striped" style='white-space: nowrap; width:100%;' cellspacing="0" >
        <thead>
            <tr>
            ${headers}
            </tr>
        </thead>
        <tbody>
        </tbody>
    </table>
  </div>`;
  const div = `
  <div style="margin-top:10px;" class="row">
    <div class="col-sm-12">
      <div class="card">
        <div class="card-header"> 
          <span style="font-size:large; font-weight:600;"><i class="cil-history"> </i> ${title}</span>
        </div>
        <div class="card-body">
          ${table}
        </div>
      </div>
    </div>
  </div>`;
  return div;
};

export const loadEventContent = async userRole => {
  try {
    let [projects, collections, eventlogs] = await Promise.all([
      ajaxCall('GET', '/api/v1/projects'),
      ajaxCall('GET', '/api/v1/collections'),
      ajaxCall('GET', '/api/v1/eventlogs')
    ]);
    $s.collections = collections;
    $s.projects = projects;
    $s.eventlogs = eventlogs;
    if (userRole == 'admin') {
      let [admineventlogs] = await Promise.all([ajaxCall('GET', '/api/v1/eventlogs/admin')]);
      $s.admineventlogs = admineventlogs;
      console.log($s.admineventlogs);
    }
  } catch {
    $s.eventlogs = [];
    $s.admineventlogs = [];
  }
  await refreshEventTable('events', $s.eventlogs);
  if (userRole == 'admin') {
    await refreshEventTable('adminevents', $s.admineventlogs);
  }
};

export const getEventNavbar = async id => {
  const eventDiv = getEventDiv(id);
  return eventDiv;
};
