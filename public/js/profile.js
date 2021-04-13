/* eslint-disable */
import axios from 'axios';
import moment from 'moment';

import { showInfoModal, createFormObj, fillFormByName } from './jsfuncs';
import { getFormRow } from './formModules/crudData';

// GLOBAL SCOPE
let $s = { usergroups: {} };

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

const getErrorDiv = () => {
  return '<p style="background-color:#e211112b;" id="crudModalError"></p>';
};
const getGroupMemberTableOptions = (owner_id, u_id) => {
  var button = '';
  if (owner_id === u_id) {
    //if user is the owner of the group
    var button = `<div class="btn-group">
        <button type="button" class="btn btn-primary dropdown-toggle" data-toggle="dropdown" aria-expanded="true">Options <span class="fa fa-caret-down"></span></button>
        <ul class="dropdown-menu" role="menu">
          <li><a class="dropdown-item removeUserFromGroup" >Remove User from Group</a></li>
        </ul></div>`;
  }
  return button;
};

const getAdminTableOptions = (active, role) => {
  var button = `<div class="btn-group">
      <button type="button" class="btn btn-primary dropdown-toggle" data-toggle="dropdown" aria-expanded="true">Options <span class="fa fa-caret-down"></span></button>
      <ul class="dropdown-menu dropdown-menu-right" role="menu">
        <li><a class="dropdown-item editUser">Edit User</a></li>
        <li><a class="dropdown-item deleteUser">Delete User</a></li>
      </ul>
    </div>`;
  return button;
};
const getGroupTableOptions = (owner_id, u_id) => {
  if (owner_id === u_id) {
    //if user is the owner of the group
    var button = `<div class="btn-group">
        <button type="button" class="btn btn-primary dropdown-toggle" data-toggle="dropdown" aria-expanded="true">Options <span class="fa fa-caret-down"></span></button>
        <ul class="dropdown-menu" role="menu">
          <li><a class="dropdown-item viewGroupMembers">View Group Members</a></li>
          <li><a class="dropdown-item addUsers">Edit Group Members</a></li>
          <li><a class="dropdown-item editGroup">Edit Group Name</a></li>
          <li><a class="dropdown-item deleteGroup">Delete Group</a></li>
        </ul>
      </div>`;
  } else {
    var button = `<div class="btn-group"><button type="button" class="btn btn-primary dropdown-toggle" data-toggle="dropdown" aria-expanded="true">Options <span class="fa fa-caret-down"></span></button>
    <ul class="dropdown-menu" role="menu">
      <li><a class="dropdown-item viewGroupMembers">View Group Members</a></li>
    </ul>
    </div>`;
  }
  return button;
};

const refreshGroupUsersTable = async (TableID, rowData, group_id) => {
  let data = [];
  try {
    [data] = await Promise.all([ajaxCall('GET', `/api/v1/groups/${group_id}/user`)]);
  } catch (err) {
    console.log(err);
  }
  if (!data) data = [];
  if ($.fn.DataTable.isDataTable(`#${TableID}`)) {
    console.log('1');
    $(`#${TableID}`)
      .DataTable()
      .destroy();
  }
  if (!$.fn.DataTable.isDataTable(`#${TableID}`)) {
    let columns = [];
    columns.push({ data: 'name' });
    columns.push({ data: 'username' });
    columns.push({ data: 'email' });
    columns.push({
      data: null,
      fnCreatedCell: function(nTd, sData, oData, iRow, iCol) {
        $(nTd).html(getGroupMemberTableOptions(rowData.owner, rowData.user_id));
      }
    });
    var dataTableObj = {
      columns: columns,
      columnDefs: [
        { defaultContent: '', targets: '_all' } //hides undefined error,
      ]
    };
    dataTableObj.dom = '<"pull-left"f>lrt<"pull-left"i><"bottom"p><"clear">';
    dataTableObj.destroy = true;
    dataTableObj.pageLength = 10;
    dataTableObj.data = data;
    dataTableObj.hover = true;
    // speed up the table loading
    dataTableObj.deferRender = true;
    dataTableObj.scroller = true;
    dataTableObj.scrollCollapse = true;
    // dataTableObj.sScrollX = true; // dropdown remains under the datatable div
    $s.TableID = $(`#${TableID}`).DataTable(dataTableObj);
  }
};

const refreshGroupTable = async () => {
  const TableID = 'table-groups';
  try {
    let [usergroups] = await Promise.all([ajaxCall('GET', '/api/v1/groups/related')]);
    $s.usergroups = usergroups;
  } catch {
    $s.usergroups = [];
  }
  if (!$s.usergroups) $s.usergroups = [];
  const data = $s.usergroups;
  let fomatted_data = [];
  if (data.length) {
    fomatted_data = data.map(i => {
      i.creationDate = moment(i.creationDate).format('YYYY-MM-DD');
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
    columns.push({ data: 'name' });
    columns.push({ data: 'owner_username' });
    columns.push({ data: 'creationDate' });
    columns.push({
      data: null,
      fnCreatedCell: function(nTd, sData, oData, iRow, iCol) {
        $(nTd).html(getGroupTableOptions(oData.owner, oData.user_id));
      }
    });
    var dataTableObj = {
      columns: columns,
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

const refreshAdminTable = async () => {
  const TableID = 'table-admin';
  try {
    let [users] = await Promise.all([ajaxCall('GET', '/api/v1/users')]);
    $s.users = users;
  } catch {
    $s.users = [];
  }
  console.log($s.users);
  if (!$s.users) $s.users = [];
  const data = $s.users;
  let fomatted_data = [];
  if (data.length) {
    fomatted_data = data.map(i => {
      i.creationDate = moment(i.creationDate).format('YYYY-MM-DD');
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
    columns.push({ data: '_id' });
    columns.push({ data: 'name' });
    columns.push({ data: 'username' });
    columns.push({ data: 'email' });
    columns.push({ data: 'role' });
    columns.push({ data: 'active' });
    columns.push({ data: 'creationDate' });
    columns.push({
      data: null,
      fnCreatedCell: function(nTd, sData, oData, iRow, iCol) {
        $(nTd).html(getAdminTableOptions(oData.active, oData.role));
      }
    });
    var dataTableObj = {
      columns: columns,
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

const getGroupsTab = id => {
  const headers = getTableHeaders(['Group Name', 'Owner', 'Created On', 'Options']);
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
  const button = `<button class="btn btn-primary create-group" type="button">Create a Group</button>`;
  const groups = `
  <div style="margin-top:10px;" class="row">
    <div class="col-sm-12">
      <div class="card">
        <div class="card-header"> 
          <span style="font-size:large; font-weight:600;"><i class="cil-people"> </i> Groups</span>
          <div style="float:right;" class="card-header-actions">${button}</div>
        </div>
        <div class="card-body">
          ${table}
        </div>
      </div>
    </div>
  </div>`;
  return groups;
};

const getAdminTab = id => {
  const headers = getTableHeaders([
    'ID',
    'Name',
    'Username',
    'E-mail',
    'Role',
    'Active',
    'Member Date',
    'Options'
  ]);
  const tableID = `table-${id}`;
  const table = `
  <div class="table-responsive" style="overflow-x:auto; width:100%; ">
    <table id="${tableID}" class="table table-striped" style='white-space: nowrap; width:100%;' cellspacing="0" >
        <thead>
            <tr>
            ${headers}
            </tr>
        <tbody>
        </tbody>
    </thead>
    </table>
  </div>`;
  const button = `<button class="btn btn-primary admin-add-user" type="button">Add an User</button>`;
  const groups = `
  <div style="margin-top:10px;" class="row">
    <div class="col-sm-12">
      <div class="card">
        <div class="card-header"> 
        <span style="font-size:large; font-weight:600;"><i class="cil-people"> </i> User Panel</span>
          <div style="float:right;" class="card-header-actions">
            ${button}
          </div>
        </div>
      <div class="card-body">
        ${table}
      </div>
    </div>
    </div>
  </div>`;
  return groups;
};

export const loadProfileTabContent = userRole => {
  refreshGroupTable();
  if (userRole == 'admin') refreshAdminTable();
};

const getGroupForm = () => {
  let ret = `<form id="groupForm">`;
  const nameElement = `<input class="form-control" type="text" name="name" required value=""></input>`;
  ret += getFormRow(nameElement, 'Group Name', {});
  ret += '</form>';
  return ret;
};

const getInputElement = (name, attr) => {
  return `<input class="form-control" type="text" name="${name}" ${attr} value=""></input>`;
};

const getDropdown = (name, data) => {
  let dropdown = `<select class="form-control" name="${name}">`;
  if (data) {
    data.forEach(i => {
      dropdown += `<option  value="${i}">${i}</option>`;
    });
  }
  dropdown += `</select>`;
  return dropdown;
};

const getAdminUserForm = () => {
  let ret = `<form id="userForm">`;
  ret += getFormRow(getInputElement('name', 'required'), 'Name', {});
  ret += getFormRow(getInputElement('username', 'required'), 'Username', {});
  ret += getFormRow(getInputElement('email', 'required'), 'E-mail', {});
  ret += getFormRow(getDropdown('role', ['user', 'project-admin', 'admin']), 'Role', {});
  ret += '</form>';
  return ret;
};

const bindEventHandlers = () => {
  // -------- USERS -----------
  $(document).on('click', `button.admin-add-user`, async function(e) {
    $('#crudModalError').empty();
    const form = getAdminUserForm();
    $('#crudModalTitle').text(`Insert User`);
    $('#crudModalYes').text('Save');
    $('#crudModalBody').empty();
    $('#crudModalBody').append(getErrorDiv());
    $('#crudModalBody').append(form);
    $('#crudModal').off();

    $('#crudModal').on('click', '#crudModalYes', async function(e) {
      e.preventDefault();
      $('#crudModalError').empty();
      const formValues = $('#crudModal').find('input,select');
      const requiredValues = formValues.filter('[required]');
      const requiredFields = $.map(requiredValues, function(el) {
        return $(el).attr('name');
      });
      let [formObj, stop] = createFormObj(formValues, requiredFields, true, true);
      if (stop === false) {
        try {
          const res = await axios({
            method: 'POST',
            url: '/api/v1/users',
            data: formObj
          });
          if (res.data.status == 'success') {
            await refreshAdminTable();
            $('#crudModal').modal('hide');
          } else {
            showInfoModal('Error occured.');
          }
        } catch (err) {
          if (err.response && err.response.data && err.response.data.message) {
            showInfoModal(`Error occured.(${JSON.stringify(err.response.data.message)})`);
          } else {
            showInfoModal(`Error occured.(${JSON.stringify(err)})`);
          }
        }
      }
    });
    $('#crudModal').modal('show');
  });
  $(document).on('click', `a.deleteUser`, async function(e) {
    const clickedRow = $(this).closest('tr');
    const table = $('#table-admin').DataTable();
    const data = table.row(clickedRow).data();
    const user_id = data._id;

    $('#crudModalTitle').text(`Remove User`);
    $('#crudModalYes').text('Remove');
    $('#crudModalBody').empty();
    $('#crudModalBody').append(`<p>Are you sure you want to delete user (${data.name})?</p>`);
    $('#crudModal').off();
    $('#crudModal').on('click', '#crudModalYes', async function(e) {
      if (user_id) {
        try {
          const res = await axios({
            method: 'DELETE',
            url: `/api/v1/users/${user_id}`
          });
          await refreshAdminTable();
          $('#crudModal').modal('hide');
        } catch (err) {
          console.log(err);
          if (err.response && err.response.data && err.response.data.message) {
            showInfoModal(`Error occured.(${JSON.stringify(err.response.data.message)})`);
          } else {
            showInfoModal(`Error occured.(${JSON.stringify(err)})`);
          }
        }
      }
    });
    $('#crudModal').modal('show');
  });

  $(document).on('click', `a.editUser`, async function(e) {
    const clickedRow = $(this).closest('tr');
    const table = $('#table-admin').DataTable();
    const userData = table.row(clickedRow).data();
    const user_id = userData._id;

    $('#crudModalError').empty();
    const form = getAdminUserForm();
    $('#crudModalTitle').text(`Edit User`);
    $('#crudModalYes').text('Save');
    $('#crudModalBody').empty();
    $('#crudModalBody').append(getErrorDiv());
    $('#crudModalBody').append(form);
    $('#crudModal').off();
    fillFormByName('#userForm', 'input, select', userData, true);

    $('#crudModal').on('click', '#crudModalYes', async function(e) {
      e.preventDefault();
      $('#crudModalError').empty();
      const formValues = $('#crudModal').find('input,select');
      const requiredValues = formValues.filter('[required]');
      const requiredFields = $.map(requiredValues, function(el) {
        return $(el).attr('name');
      });
      let [formObj, stop] = createFormObj(formValues, requiredFields, true, true);
      console.log(formObj);
      if (stop === false) {
        try {
          const res = await axios({
            method: 'PATCH',
            url: `/api/v1/users/${user_id}`,
            data: formObj
          });
          console.log(res);
          if (res.data.status == 'success') {
            await refreshAdminTable();
            $('#crudModal').modal('hide');
          } else {
            showInfoModal('Error occured.');
          }
        } catch (err) {
          if (err.response && err.response.data && err.response.data.message) {
            showInfoModal(`Error occured.(${JSON.stringify(err.response.data.message)})`);
          } else {
            showInfoModal(`Error occured.(${JSON.stringify(err)})`);
          }
        }
      }
    });
    $('#crudModal').modal('show');
  });

  // -------- GROUPS -----------
  $(document).on('click', `a.deleteGroup`, async function(e) {
    const clickedRow = $(this).closest('tr');
    const grouptable = $('#table-groups').DataTable();
    const groupData = grouptable.row(clickedRow).data();
    const group_id = groupData._id;

    $('#crudModalTitle').text(`Remove Group`);
    $('#crudModalYes').text('Remove');
    $('#crudModalBody').empty();
    $('#crudModalBody').append(`<p>Are you sure you want to delete group (${groupData.name})?</p>`);
    $('#crudModal').off();
    $('#crudModal').on('click', '#crudModalYes', async function(e) {
      if (group_id) {
        try {
          const res = await axios({
            method: 'DELETE',
            url: `/api/v1/groups/${group_id}`
          });
          await refreshGroupTable();
          $('#crudModal').modal('hide');
        } catch (err) {
          if (err.response && err.response.data && err.response.data.message) {
            showInfoModal(`Error occured.(${JSON.stringify(err.response.data.message)})`);
          } else {
            showInfoModal(`Error occured.(${JSON.stringify(err)})`);
          }
        }
      }
    });
    $('#crudModal').modal('show');
  });

  $(document).on('click', `a.editGroup`, async function(e) {
    const clickedRow = $(this).closest('tr');
    const grouptable = $('#table-groups').DataTable();
    const groupData = grouptable.row(clickedRow).data();
    const group_id = groupData._id;

    $('#crudModalError').empty();
    const groupForm = getGroupForm();
    $('#crudModalTitle').text(`Edit Group`);
    $('#crudModalYes').text('Save');
    $('#crudModalBody').empty();
    $('#crudModalBody').append(getErrorDiv());
    $('#crudModalBody').append(groupForm);
    $('#crudModal').off();
    fillFormByName('#groupForm', 'input, select', groupData, true);

    $('#crudModal').on('click', '#crudModalYes', async function(e) {
      e.preventDefault();
      $('#crudModalError').empty();
      const formValues = $('#crudModal').find('input,select');
      const requiredValues = formValues.filter('[required]');
      const requiredFields = $.map(requiredValues, function(el) {
        return $(el).attr('name');
      });
      let [formObj, stop] = createFormObj(formValues, requiredFields, true, true);
      console.log(formObj);
      if (stop === false) {
        try {
          const res = await axios({
            method: 'PATCH',
            url: `/api/v1/groups/${group_id}`,
            data: formObj
          });
          console.log(res);
          if (res.data.status == 'success') {
            await refreshGroupTable();
            $('#crudModal').modal('hide');
          } else {
            showInfoModal('Error occured.');
          }
        } catch (err) {
          showInfoModal(JSON.stringify(err));
        }
      }
    });
    $('#crudModal').modal('show');
  });

  $(document).on('click', `button.create-group`, async function(e) {
    $('#crudModalError').empty();
    const groupForm = getGroupForm();
    $('#crudModalTitle').text(`Insert Group`);
    $('#crudModalYes').text('Save');
    $('#crudModalBody').empty();
    $('#crudModalBody').append(getErrorDiv());
    $('#crudModalBody').append(groupForm);
    $('#crudModal').off();

    $('#crudModal').on('click', '#crudModalYes', async function(e) {
      e.preventDefault();
      $('#crudModalError').empty();
      const formValues = $('#crudModal').find('input,select');
      const requiredValues = formValues.filter('[required]');
      const requiredFields = $.map(requiredValues, function(el) {
        return $(el).attr('name');
      });
      let [formObj, stop] = createFormObj(formValues, requiredFields, true, true);
      if (stop === false) {
        try {
          const res = await axios({
            method: 'POST',
            url: '/api/v1/groups',
            data: formObj
          });
          console.log(res);
          if (res.data.status == 'success') {
            await refreshGroupTable();
            if (res.data && res.data.data && res.data.data.data) {
              const group_id = res.data.data.data._id;
              const user_id = res.data.data.data.owner;
              const res2 = await axios({
                method: 'POST',
                url: '/api/v1/usergroups',
                data: { group_id, user_id }
              });
            }
            $('#crudModal').modal('hide');
          } else {
            showInfoModal('Error occured.');
          }
        } catch (err) {
          showInfoModal(JSON.stringify(err));
        }
      }
    });
    $('#crudModal').modal('show');
  });

  $(document).on('click', `a.addUsers,a.viewGroupMembers`, async function(e) {
    const clickedRow = $(this).closest('tr');
    const grouptable = $('#table-groups').DataTable();
    const rowData = grouptable.row(clickedRow).data();
    const group_id = rowData._id;
    if ($(this).hasClass('addUsers')) {
      $('#groupModalTitle').html('Edit Group Members');
      $('#groupModalAdd').css('display', 'block');
    } else if ($(this).hasClass('viewGroupMembers')) {
      $('#groupModalTitle').html('View Group Members');
      $('#groupModalAdd').css('display', 'none');
    }
    $('#groupModal').off();
    $('#groupModal').on('show.coreui.modal', async function(e) {
      $('#groupModal')
        .find('form')
        .trigger('reset');

      await refreshGroupUsersTable('groupmembertable', rowData, group_id);
    });

    $('#groupModal').on('click', `#groupModal_adduser`, async function(e) {
      const email = $('#groupModal_email').val();
      let user_id = '';
      if (email && group_id) {
        try {
          user_id = await ajaxCall('GET', `/api/v1/users/useridwithemail/${email}`);
        } catch (err) {
          console.log(err);
        }
        if (!user_id) {
          showInfoModal('E-mail not found.');
          return;
        }
        if (user_id) {
          try {
            const res = await axios({
              method: 'POST',
              url: '/api/v1/usergroups',
              data: {
                group_id: group_id,
                user_id: user_id
              }
            });
            console.log(res);
            if (res.data.status == 'success') {
              //update group members table
              await refreshGroupUsersTable('groupmembertable', rowData, group_id);
            } else {
              showInfoModal('Error occured. Please try again.');
            }
          } catch (err) {
            if (err.response && err.response.data && err.response.data.message) {
              showInfoModal(`Error occured.(${JSON.stringify(err.response.data.message)})`);
            } else {
              showInfoModal(`Error occured.(${JSON.stringify(err)})`);
            }
          }
        }
      } else {
        showInfoModal('Please enter e-mail to add user into a group.');
      }
    });
    $(document).on('click', `a.removeUserFromGroup`, async function(e) {
      const clickedRow = $(this).closest('tr');
      const groupmembertable = $('#groupmembertable').DataTable();
      const grouprowData = groupmembertable.row(clickedRow).data();
      const usergroup_id = grouprowData._id;

      $('#crudModalTitle').text(`Remove User`);
      $('#crudModalYes').text('Remove');
      $('#crudModalBody').empty();
      $('#crudModalBody').append(
        `<p>Are you sure you want to remove user (${grouprowData.name})?</p>`
      );
      $('#crudModal').off();
      $('#crudModal').on('click', '#crudModalYes', async function(e) {
        if (usergroup_id) {
          try {
            const res = await axios({
              method: 'DELETE',
              url: `/api/v1/usergroups/${usergroup_id}`
            });
            await refreshGroupUsersTable('groupmembertable', rowData, group_id);
            $('#crudModal').modal('hide');
          } catch (err) {
            if (err.response && err.response.data && err.response.data.message) {
              showInfoModal(`Error occured.(${JSON.stringify(err.response.data.message)})`);
            } else {
              showInfoModal(`Error occured.(${JSON.stringify(err)})`);
            }
          }
        }
      });
      $('#crudModal').modal('show');
    });
    $('#groupModal').modal('show');
  });
};

export const getProfileNavbar = async userRole => {
  bindEventHandlers();

  let tabs = [];
  tabs.push({ label: 'Groups', id: 'groups' });
  if (userRole == 'admin') {
    tabs.push({ label: 'Admin', id: 'admin' });
  }
  let header = '<ul class="nav nav-tabs" role="tablist">';
  let content = '<div class="tab-content">';

  for (var i = 0; i < tabs.length; i++) {
    const id = tabs[i].id;
    const label = tabs[i].label;
    const tabID = 'tab_' + id;
    const active = i === 0 ? 'active' : '';
    const headerLi = `
    <li class="nav-item">
        <a class="nav-link ${active}" data-toggle="tab" href="#${tabID}" aria-expanded="true">${label}</a>
    </li>`;
    header += headerLi;
    let tabContent = '';
    if (id == 'groups') {
      tabContent = getGroupsTab(id);
    } else if (id == 'admin') {
      tabContent = getAdminTab(id);
    }
    const contentDiv = `
    <div role="tabpanel" class="tab-pane ${active}" searchtab="true" id="${tabID}">
        ${tabContent}
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
