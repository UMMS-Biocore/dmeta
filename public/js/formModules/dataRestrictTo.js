/* eslint-disable */
import { createFormObj, ajaxCall, showInfoInDiv, fillFormByName } from './../jsfuncs';
import { getFormRow } from './crudData';
const JSON5 = require('json5');

// GLOBAL SCOPE
let $s = { dataTableObj: {}, globalEventBinders: false };

const getTableHeaders = labels => {
  let ret = '';
  for (var i = 0; i < labels.length; i++) {
    ret += `<th>${labels[i]}</th>`;
  }
  return ret;
};

const getOptionsButton = tableID => {
  return `
    <div class="btn-group" role="group">
      <button class="btn btn-info dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Options</button>
      <div class="dropdown-menu" style="margin: 0px;">
          <a tableid="${tableID}" class="dropdown-item delete-data-restrictTo" href="#">Delete</a></div>
    </div>`;
};

const getRestrictToTable = (id, labels) => {
  const headers = getTableHeaders(labels);
  const ret = `
  <div>
    <div class="float-right" style="padding:7px;">
        <button class="btn insert-data-restrictTo btn-info" tableid="${id}" type="button">Insert</button>
    </div>
    <div class="table-responsive" style="overflow-x:visible; overflow-y:visible; width:100%; ">
      <table id="${id}" class="table table-striped" style='white-space: nowrap; width:100%;' cellspacing="0" >
          <thead>
              <tr>
              ${headers}
              </tr>
          <tbody>
          </tbody>
      </thead>
      </table>
    </div>
  </div>`;
  return ret;
};

const prepRestrictToData = async (groups, permsObj) => {
  // getUserGroups: GET: {{URL}}/api/v1/usergroups
  // getUserIDWithEmail: GET: {{URL}}/api/v1/users/useridwithemail/${encodeURIComponent(email)
  // getEmailWithUserID" GET: {{URL}}/api/v1/users/emailwithuserid/$id

  // prepare permsData for dataTableObj
  // type:["user", "group","role"]
  // permsData format:
  // {"group":["5fb45793aa5adff6f407f2d2"],"user":["5fb4575faa5adff6f407f2d1"]}

  // permsDataArr format:
  // [{ id:"36g3..." name:"test@user.com", type:"user"},
  // { id:"4g3..."  name:"test_group", type:"group"},
  // { id:"admin"   name:"admin", type:"role"}]
  let permsData = [];
  const types = Object.keys(permsObj);
  for (var t = 0; t < types.length; t++) {
    const type = types[t];
    for (var i = 0; i < permsObj[type].length; i++) {
      const id = permsObj[type][i];
      if (type == 'user') {
        try {
          const email = await ajaxCall('GET', `/api/v1/users/emailwithuserid/${id}`);
          permsData.push({ id: id, type: type, name: email });
        } catch (err) {
          console.log(err);
        }
      } else if (type == 'group') {
        const groupData = groups.filter(f => f._id == id);
        console.log(groups);
        console.log(groupData);
        if (groupData && groupData[0] && groupData[0].name) {
          permsData.push({
            id: id,
            type: type,
            name: groupData[0].name
          });
        }
      } else if (type == 'role') {
        permsData.push({ id: id, type: type, name: id });
      }
      console.log(permsData);
    }
  }

  console.log(permsData);
  return permsData;
};

export const prepDataRestrictTo = async (formId, data) => {
  if (!$s.globalEventBinders) {
    bindGlobalEventHandlers();
    $s.globalEventBinders = true;
  }
  const formValues = $(formId).find('input.data-restrictTo');
  let groups;
  if (formValues.length > 0) {
    groups = await ajaxCall('GET', '/api/v1/groups');
  }
  for (var k = 0; k < formValues.length; k++) {
    const nameAttr = $(formValues[k]).attr('name');
    console.log(data.restrictTo);
    let permsObj = {};
    try {
      if (data.restrictTo) permsObj = JSON5.parse(data.restrictTo);
    } catch (err) {
      console.log('format err', err, permsObj);
    }
    console.log('permsObj', permsObj);
    // prepare permsData for dataTableObj
    const permsData = await prepRestrictToData(groups, permsObj);
    console.log('permsData', permsData);

    const labels = ['User/Group/Role', 'Type', 'Actions'];
    const fieldList = ['name', 'type'];
    const tableID = 'restrictTo-table';
    const tableDiv = getRestrictToTable(tableID, labels);
    $(formValues[k]).css('display', 'none');
    $(formValues[k]).after(tableDiv);
    let columns = [];
    for (var i = 0; i < fieldList.length; i++) {
      columns.push({ data: fieldList[i] });
    }
    columns.push({
      data: null,
      className: 'center',
      fnCreatedCell: function(nTd, sData, oData, iRow, iCol) {
        $(nTd).attr('align', 'center');
        $(nTd).html(getOptionsButton(tableID));
      }
    });

    var dataTableObj = {
      columns: columns,
      columnDefs: [
        { defaultContent: '', targets: '_all' } //hides undefined error,
      ],
      language: {
        emptyTable: 'No restriction for inserting new data.'
      }
    };
    dataTableObj.dom = '';
    dataTableObj.destroy = true;
    dataTableObj.data = permsData;
    dataTableObj.hover = true;
    // dataTableObj.scroller = true;
    // dataTableObj.colReorder = true;
    // dataTableObj.scrollX = '500';
    $s.dataTableObj[tableID] = $(`#${tableID}`).DataTable(dataTableObj);
  }
};

const getErrorDiv = id => {
  return `<p style="background-color:#e211112b;" id="${id}"></p>`;
};

const getDropdown = (el_name, data, required, dataType) => {
  const requiredText = required ? 'required' : '';
  let dropdown = `<select ${requiredText} class="form-control data-restrictTo-${el_name}" name="${el_name}">`;
  if (!required) dropdown += `<option value="" >--- Select ---</option>`;
  if (data) {
    data.forEach(i => {
      if (dataType == 'Array') dropdown += `<option  value="${i}">${i}</option>`;
      if (dataType == 'usergroups')
        dropdown += `<option  value="${i.group_id}">${i.group_name}</option>`;
    });
  }

  dropdown += `</select>`;
  return dropdown;
};

//[{ id:"36g3..." name:"test@user.com",  type:"user"},
// { id:"4g3..."  name:"test_group",  type:"group"},
// { id:"admin"   name:"admin", type:"role"}]
const getDataDiv = async () => {
  const usergroups = await ajaxCall('GET', '/api/v1/usergroups');
  console.log(usergroups);
  let ret = '';
  const typeElement = getDropdown('type', ['user', 'group', 'role'], false, 'Array');
  const roleElement = getDropdown('role', ['admin', 'project-admin', 'user'], true, 'Array');
  const groupElement = getDropdown('group', usergroups, true, 'usergroups');
  const userElement = `<input class="form-control data-restrictTo-user" type="text" name="user" required value=""></input>`;

  ret += getFormRow(typeElement, 'Share with', '');
  ret += getFormRow(userElement, 'E-Mail of the User', { hide: true });
  ret += getFormRow(roleElement, 'Role', { hide: true });
  ret += getFormRow(groupElement, 'Group', { hide: true });
  return ret;
};

const convertPermData = async formObj => {
  let data = '';
  const type = formObj.type;
  if (type == 'role') {
    return { id: formObj.role, name: formObj.role, type };
  } else if (type == 'group') {
    const group_name = $('#crudModal2')
      .find('.data-restrictTo-group option:selected')
      .text();
    return { id: formObj.group, name: group_name, type };
  } else if (type == 'user') {
    try {
      if (formObj.user) {
        const userid = await ajaxCall('GET', `/api/v1/users/useridwithemail/${formObj.user}`);
        if (!userid) {
          showInfoInDiv('#crudModalError2', 'User not found.');
          return data;
        }
        return { id: userid, name: formObj.user, type };
      }
    } catch (e) {
      console.log(e);
      showInfoInDiv('#crudModalError2', 'User not found.');
    }
  }
  return data;
};
const bindGlobalEventHandlers = () => {
  //  permission type change will update visible form fields
  $(document).on('change', `select.data-restrictTo-type`, async function(e) {
    const permType = $(this).val();
    const userDiv = $('#crudModal2')
      .find('.data-restrictTo-user')
      .closest('.row');
    const groupDiv = $('#crudModal2')
      .find('.data-restrictTo-group')
      .closest('.row');
    const roleDiv = $('#crudModal2')
      .find('.data-restrictTo-role')
      .closest('.row');
    const permDiv = $('#crudModal2')
      .find('.data-restrictTo-perm')
      .closest('.row');
    if (permType == 'user') {
      userDiv.css('display', 'flex');
      groupDiv.css('display', 'none');
      roleDiv.css('display', 'none');
      permDiv.css('display', 'flex');
    } else if (permType == 'group') {
      userDiv.css('display', 'none');
      groupDiv.css('display', 'flex');
      roleDiv.css('display', 'none');
      permDiv.css('display', 'flex');
    } else if (permType == 'role') {
      userDiv.css('display', 'none');
      groupDiv.css('display', 'none');
      roleDiv.css('display', 'flex');
      permDiv.css('display', 'flex');
    } else {
      userDiv.css('display', 'none');
      groupDiv.css('display', 'none');
      roleDiv.css('display', 'none');
      permDiv.css('display', 'none');
    }
  });
  // ================= INSERT BUTTON =================
  $(document).on('click', `button.insert-data-restrictTo`, async function(e) {
    $('#crudModalError2').empty();
    const tableid = $(this).attr('tableid');
    let form = await getDataDiv();
    $('#crudModalTitle2').text(`Share with ...`);
    $('#crudModalYes2').text('Save');
    $('#crudModalBody2').empty();
    $('#crudModalBody2').append(getErrorDiv('crudModalError2'));
    $('#crudModalBody2').append(form);

    $('#crudModal2').off();
    $('#crudModal2').on('click', '#crudModalYes2', async function(e) {
      e.preventDefault();
      $('#crudModalError2').empty();
      const formValues = $('#crudModal2').find('input,select');
      const requiredValues = formValues.filter('[required]');
      const requiredFields = $.map(requiredValues, function(el) {
        if (
          $(el)
            .closest('.row')
            .css('display') !== 'none'
        ) {
          return $(el).attr('name');
        } else {
          return;
        }
      });
      let [formObj, stop] = createFormObj(formValues, requiredFields, true, true);
      const data = await convertPermData(formObj);

      if (stop === false && data) {
        $(`#${tableid}`)
          .DataTable()
          .row.add(data)
          .draw();
        $('#crudModal2').modal('hide');
      }
    });
    $('#crudModal2').modal('show');
  });

  // ================= DELETE BUTTON =================
  $(document).on('click', `a.delete-data-restrictTo`, async function(e) {
    $('#crudModalError2').empty();
    const tableid = $(this).attr('tableid');
    var clickedRow = $(this).closest('tr');
    $('#crudModalTitle2').text(`Remove Permission`);
    $('#crudModalYes2').text('Remove');
    $('#crudModalBody2').empty();
    $('#crudModalBody2').append(getErrorDiv('crudModalError2'));
    $('#crudModalBody2').append(`<p>Are you sure you want to delete the permission?</p>`);
    $('#crudModal2').off();
    $('#crudModal2').on('click', '#crudModalYes2', async function(e) {
      e.preventDefault();
      $(`#${tableid}`)
        .DataTable()
        .row(clickedRow)
        .remove()
        .draw();
      $('#crudModal2').modal('hide');
    });
    $('#crudModal2').modal('show');
  });
};
