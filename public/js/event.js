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

const refreshEventTable = async () => {
  const TableID = 'table-events';
  try {
    let [projects, collections, eventlogs] = await Promise.all([
      ajaxCall('GET', '/api/v1/projects'),
      ajaxCall('GET', '/api/v1/collections'),
      ajaxCall('GET', '/api/v1/eventlogs')
    ]);
    $s.collections = collections;
    $s.projects = projects;
    $s.eventlogs = eventlogs;
  } catch {
    $s.events = [];
  }
  if (!$s.eventlogs) $s.eventlogs = [];
  const data = $s.eventlogs;
  let fomatted_data = [];
  if (data.length) {
    fomatted_data = data.map(i => {
      i.creationDate = moment(i.creationDate).format('YYYY-MM-DD hh:mm:ss');
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
    columns.push({ data: 'doc_id' });
    columns.push({ data: 'project.name' });
    columns.push({ data: 'coll.name' });
    columns.push({ data: 'type' });
    columns.push({ data: 'creationDate' });
    columns.push({ data: 'owner.username' });
    columns.push({ data: 'req' });

    var dataTableObj = {
      columns: columns,
      order: [[4, 'desc']],
      columnDefs: [
        { defaultContent: '', targets: '_all' } //hides undefined error,
      ]
    };
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
  const headers = getTableHeaders([
    'Doc',
    'Project',
    'Collection',
    'Type',
    'Date',
    'Performed By',
    'Request'
  ]);
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
          <span style="font-size:large; font-weight:600;"><i class="cil-history"> </i> Event History</span>
        </div>
        <div class="card-body">
          ${table}
        </div>
      </div>
    </div>
  </div>`;
  return div;
};

export const loadEventContent = async () => {
  await refreshEventTable();
};

const bindEventHandlers = () => {
  // -------- Events -----------
  $(document).on('click', `button.admin-add-user`, async function(e) {});
};

export const getEventNavbar = async () => {
  bindEventHandlers();
  const id = 'events';
  const eventDiv = getEventDiv(id);
  return eventDiv;
};
