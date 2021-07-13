/* eslint-disable */
import axios from 'axios';
import {
  createFormObj,
  convertFormObj,
  getDropdownFields,
  showInfoModal,
  getSimpleDropdown
} from './../jsfuncs';
import { getFormRow } from './../formModules/crudData';

let $s = { data: {}, collections: {}, fields: {}, projects: {}, server: {} };

const updateDropdownOptions = (dropdown, data) => {
  console.log(dropdown);
  console.log(data);
  dropdown.empty();
  for (var k = 0; k < data.length; k++) {
    if (data[k]['_id'] && data[k]['name']) {
      dropdown.append(
        $('<option></option>')
          .val(data[k]['_id'])
          .html(data[k]['name'])
      );
    }
  }
};

const getFilePatternDiv = () => {
  return `<div class="form-group row">
  <label class="col-md-3 col-form-label text-right">File Pattern</label>
  <div class="col-md-9">
      <div class="filePattern customize" style="display: block;">
          
      </div>    
      
      <div class="form-group">
      <div class="col-sm-12">
          <div class="col-sm-6 singlepatternDiv" style="display:none;">
              <p class="col-sm-4 control-label">Filename Extension <span><a data-toggle="tooltip" data-placement="bottom" title="Please enter end of the file name to filter files (eg. fastq or fq.gz). This pattern will be removed from the file names to fill 'Names' field in the table below."><i class='glyphicon glyphicon-info-sign'></i></a></span> </p>
              <div class="col-sm-8">
                  <input type="text" class="form-control" id="single_pattern" name="single_pattern" value="">
              </div>
              <div class="col-sm-12" style="margin-top:8px;">
                  <select id="singleList" type="select-multiple" multiple class="form-control" size="9"></select>
              </div>
          </div>
          <div class="col-sm-6 forwardpatternDiv" style="display:none;">
              <p class="col-sm-4 control-label">R1 Pattern <span><a data-toggle="tooltip" data-placement="bottom" title="Please enter pattern for forward reads eg. _R1"><i class='glyphicon glyphicon-info-sign'></i></a></span> </p>
              <div class="col-sm-8">
                  <input type="text" class="form-control" id="forward_pattern" name="forward_pattern" value="_R1">
              </div>
              <div class="col-sm-12" style="margin-top:8px; margin-bottom:12px;">
                  <select id="forwardList" type="select-multiple" multiple class="form-control" size="9"></select>
              </div>
          </div>
          <div class="col-sm-6 reversepatternDiv" style="display:none;">
              <p class="col-sm-4 control-label">R2 Pattern <span><a data-toggle="tooltip" data-placement="bottom" title="Please enter pattern for reverse reads eg. _R2"><i class='glyphicon glyphicon-info-sign'></i></a></span> </p>
              <div class="col-sm-8">
                  <input type="text" class="form-control" id="reverse_pattern" name="reverse_pattern" value="_R2">
              </div>
              <div class="col-sm-12" style="margin-top:8px; margin-bottom:12px;">
                  <select id="reverseList" type="select-multiple" multiple class="form-control" size="9"></select>
              </div>
          </div>
          <div class="col-sm-6 r3patternDiv" style="display:none;">
              <p class="col-sm-4 control-label">R3 Pattern <span><a data-toggle="tooltip" data-placement="bottom" title="Please enter pattern for reads eg. _R3"><i class='glyphicon glyphicon-info-sign'></i></a></span> </p>
              <div class="col-sm-8">
                  <input type="text" class="form-control" id="r3_pattern" name="r3_pattern" value="_R3">
              </div>
              <div class="col-sm-12" style="margin-top:8px;">
                  <select id="r3List" type="select-multiple" multiple class="form-control" size="9"></select>
              </div>
          </div>
          <div class="col-sm-6 r4patternDiv" style="display:none;">
              <p class="col-sm-4 control-label">R4 Pattern <span><a data-toggle="tooltip" data-placement="bottom" title="Please enter pattern for reads eg. _R4"><i class='glyphicon glyphicon-info-sign'></i></a></span> </p>
              <div class="col-sm-8">
                  <input type="text" class="form-control" id="r4_pattern" name="r4_pattern" value="_R4">
              </div>
              <div class="col-sm-12" style="margin-top:8px;">
                  <select id="r4List" type="select-multiple" multiple class="form-control" size="9"></select>
              </div>
          </div>
      </div>
  </div>
  <div class="form-group patternButs" style="display:none;">
      <div class="col-sm-12">
          <div class="col-sm-8"></div>
          <div class="col-sm-4">
              <span class="pull-right" style="padding-top:7px; padding-left:5px;"><a data-toggle="tooltip" data-placement="bottom" title="In order to merge multiple files, first select the files and then click 'Add Selected Files' button. If you don't need to merge files, you can simply click 'Add All Files' button."><i class='glyphicon glyphicon-info-sign'></i></a></span>
              <button id="add_selection_file" type="button" class="btn btn-primary pull-right" onclick="addSelection()">Add Selected Files</button>
              <button id="smart_add_file" type="button" class="btn btn-primary pull-right" style="margin-right:3px;" onclick="smartSelection()">Add All Files</button>
              <button id="clear_selection" type="button" class="btn btn-warning pull-right" style="margin-right:3px;" onclick="clearSelection()">Reset</button>
          </div>
      </div>
  </div>
  <div class="form-group patternTable" style="display:none;">
      <div class="col-sm-12" style="padding:30px;">
          <table id="selectedSamples" class="table table-striped compact table-bordered display" cellspacing="0" width="100%">
              <thead>
                  <tr>
                      <th scope="col">Name</th>
                      <th scope="col">Files Used</th>
                      <th scope="col">Directory</th>
                      <th scope="col" style="width:20px;">Remove</th>
                      <th scope="col">Amz_key</th>
                      <th scope="col">Goog_key</th>
                  </tr>
              </thead>
              <tbody></tbody>
          </table>
      </div>
  </div>   
      
  </div>
</div>`;
};

//use array of item to fill select element
function fillArray2Select(arr, id, clean) {
  if (clean === true) {
    $(id).empty();
  }
  for (var i = 0; i < arr.length; i++) {
    var param = arr[i];
    var optionGroup = new Option(param, param);
    $(id).append(optionGroup);
  }
}

function resetPatternList() {
  fillArray2Select([], '#singleList', true);
  fillArray2Select([], '#reverseList', true);
  fillArray2Select([], '#forwardList', true);
  fillArray2Select([], '#r3List', true);
  fillArray2Select([], '#r4List', true);
}

const viewDirButSearch = async (dir, runEnvDropdownEl) => {
  const env = $(runEnvDropdownEl).val();
  if (!env || !env.split('-')[0] || !env.split('-')[1]) {
    showInfoModal('Please choose File Environment before search.');
    return;
  }
  const profileType = env.split('-')[0];
  const profileId = env.split('-')[1];

  var amazon_cre_id = '';
  var google_cre_id = '';
  var warnUser = false;
  if (dir) {
    if (dir.match(/:\/\//)) {
      var lastChr1 = dir.slice(-1);
      var lastChr2 = dir.slice(-2);
      if (lastChr1 == '/' && lastChr2 != '//') {
        dir = dir.substring(0, dir.length - 1);
      }
    }
    console.log(dir);
    if (dir.match(/s3:/i)) {
      $('#mRunAmzKeyS3')
        .parents('.row')
        .css('display', 'flex');
      amazon_cre_id = $('#mRunAmzKeyS3').val();
      if (!amazon_cre_id) {
        showInfoModal('Please select Amazon Keys to search files in your S3 storage.');
        warnUser = true;
      }
    } else if (dir.match(/gs:/i)) {
      $('#mRunGoogKeyGS')
        .parents('.row')
        .css('display', 'flex');
      google_cre_id = $('#mRunGoogKeyGS').val();
      if (!google_cre_id) {
        showInfoModal('Please select Google Keys to search files in your Google storage.');
        warnUser = true;
      }
    }
    if (!warnUser) {
      if (!$s.server.url_server) {
        showInfoModal('Please choose server before search.');
        return;
      }
      let body = {
        dir,
        profileType,
        profileId,
        amazon_cre_id,
        google_cre_id
      };
      const method = 'GET'; // method for Dnext query
      const url = `${$s.server.url_server}/api/service.php?data=getLsDir`;
      const ls = await axios({
        method: 'POST',
        url: `/api/v1/misc/getDnextData`,
        data: { body, method, url }
      });
      console.log('ls', ls);
      if (ls && ls.data && ls.data.data && ls.data.data.data) {
        let dirList = ls.data.data.data;
        dirList = $.trim(dirList);
        console.log(dirList);
        var fileArr = [];
        var errorAr = [];
        if (dir.match(/s3:/i) || dir.match(/gs:/i)) {
          var raw = dirList.split('\n');
          for (var i = 0; i < raw.length; i++) {
            var filePath = raw[i].split(' ').pop();
            if (filePath) {
              if (
                filePath.toLowerCase() === dir.toLowerCase() ||
                filePath.toLowerCase() === dir.toLowerCase() + '/'
              ) {
                console.log('skip', filePath);
                continue;
              }
              if (filePath.match(/s3:/i) || filePath.match(/gs:/i)) {
                var allBlock = filePath.split('/');
                if (filePath.substr(-1) == '/') {
                  var lastBlock = allBlock[allBlock.length - 2];
                } else {
                  var lastBlock = allBlock[allBlock.length - 1];
                }
                fileArr.push(lastBlock);
              } else {
                errorAr.push(raw[i]);
              }
            } else {
              errorAr.push(raw[i]);
            }
          }
        } else if (dir.match(/:\/\//)) {
          fileArr = dirList.split('\n');
          errorAr = fileArr.filter(line => line.match(/:/));
          fileArr = fileArr.filter(line => !line.match(/:/));
        } else {
          fileArr = dirList.split('\n');
          errorAr = fileArr.filter(line => line.match(/ls:/));
          fileArr = fileArr.filter(line => !line.match(/:/));
        }
        console.log(fileArr);
        console.log(errorAr);
        if (fileArr.length > 0) {
          var copiedList = fileArr.slice();
          copiedList.unshift('..');
          fillArray2Select(copiedList, '#viewDir', true);
          $('#viewDir').data('fileArr', fileArr);
          $('#viewDir').data('fileDir', dir);
          var amzKey = '';
          var googKey = '';
          if (dir.match(/s3:/i)) {
            amzKey = $('#mRunAmzKeyS3').val();
          }
          if (dir.match(/gs:/i)) {
            googKey = $('#mRunGoogKeyGS').val();
          }
          $('#viewDir').data('amzKey', amzKey);
          $('#viewDir').data('googKey', googKey);
          $('#collection_type').trigger('change');
        } else {
          if (errorAr.length > 0) {
            var errTxt = errorAr.join(' ');
            showInfoModal(errTxt);
            resetPatternList();
          } else {
            fillArray2Select(['Files Not Found.'], '#viewDir', true);
            resetPatternList();
          }
        }
      } else {
        fillArray2Select(['Files Not Found.'], '#viewDir', true);
        resetPatternList();
      }
    } else {
      fillArray2Select(['Files Not Found.'], '#viewDir', true);
      resetPatternList();
    }
    $('#viewDir').css('display', 'inline');
    $('#viewDirDiv').css('display', 'block');
  } else {
    showInfoModal("Please enter 'File Location' to search files.");
  }
};

export const prepFileForm = (formId, data, $scope, projectID) => {
  console.log('prepFileForm');
  //   required fields for file collection:
  //    - name	Name	String
  //    - file_used	Used Files	Array
  //    - file_dir	Directory	Array
  //    - file_type	File Type	String
  //    - collection_type	Collection Type	String
  //    - file_env	File Environment	String
  //    - server_id	Server	mongoose.Schema.ObjectId
  //    - archive_dir	Archive Directory	String
  //    - s3_archive_dir	S3 Archive Directory	Array
  //    - gs_archive_dir	Google Storage Archive Directory	Array
  const nameField = $(formId).find(`[name='name']`);
  const fileUsedField = $(formId).find(`[name='file_used']`);
  const serverIDField = $(formId).find(`[name='server_id']`);
  const runEnvField = $(formId).find(`[name='file_env']`);
  const fileDirField = $(formId).find(`[name='file_dir']`);
  const fileTypeField = $(formId).find(`[name='file_type']`);
  const collectionTypeField = $(formId).find(`[name='collection_type']`);
  const archiveDirField = $(formId).find(`[name='archive_dir']`);
  const s3ArchiveDirField = $(formId).find(`[name='s3_archive_dir']`);
  const gsArchiveDirField = $(formId).find(`[name='gs_archive_dir']`);

  // 1. reorder rows
  const firstRow = $(formId)
    .find(`[name='name']`)
    .parents('.row')
    .siblings('.row')
    .first();
  $(nameField.parents('.row')).remove();
  $(fileUsedField.parents('.row')).remove();
  $(serverIDField.parents('.row')).insertBefore(firstRow);
  $(runEnvField.parents('.row')).insertAfter(serverIDField.parents('.row'));
  $(fileDirField.parents('.row')).insertAfter(runEnvField.parents('.row'));
  $(fileTypeField.parents('.row')).insertAfter(fileDirField.parents('.row'));
  $(collectionTypeField.parents('.row')).insertAfter(fileTypeField.parents('.row'));
  const filePatternDiv = getFilePatternDiv();
  $(collectionTypeField.parents('.row')).after(filePatternDiv);
  const filePatternDOM = $(formId).find(`div.filePattern`);
  $(archiveDirField.parents('.row')).insertAfter(filePatternDOM.parents('.row'));
  $(s3ArchiveDirField.parents('.row')).insertAfter(archiveDirField.parents('.row'));
  $(gsArchiveDirField.parents('.row')).insertAfter(s3ArchiveDirField.parents('.row'));

  // 2. prepare file_dir search button
  $(fileDirField).wrap('<div class="input-group"></div>');
  $(fileDirField).after(
    `<div class="input-group-append"><button id="viewDirBut" class="btn btn-primary" type="button" data-toggle="tooltip" data-placement="bottom" title="Please enter directory and click search button." ><i class="cil-search"> </i></button></div>`
  );
  $(fileDirField).parent().after(`
  <div id="viewDirDiv" class="form-group" style="margin-top: 10px; display: none;">
    <select id="viewDir" class="form-control" size="5" style="display: inline;"></select>
  </div>`);
  $('[data-toggle="tooltip"]').tooltip();

  let runEnvDropdownEl = '';
  if (serverIDField[0]) {
    if (runEnvField[0]) {
      if (!$(runEnvField[0]).hasClass('customize')) {
        // remove actual runEnvField
        const runEnvDropdown = getSimpleDropdown([], {
          name: 'file_env',
          class: 'no-hide'
        });
        runEnvDropdownEl = $(runEnvDropdown);
        $(runEnvField[0]).after(runEnvDropdownEl);
        $(runEnvField[0]).remove();
      }
    }

    $('#viewDirBut').on('click', async function(e) {
      let dir = $(fileDirField).val();
      dir = $.trim(dir);
      await viewDirButSearch(dir, runEnvDropdownEl);
    });

    // add amazon_cre_id and google_cre_id dropdowns
    const amzDropdown = getSimpleDropdown([], {
      id: 'mRunAmzKeyS3',
      name: 'amazon_cre_id',
      class: 'no-hide'
    });
    const googleDropdown = getSimpleDropdown([], {
      id: 'mRunGoogKeyGS',
      name: 'google_cre_id',
      class: 'no-hide'
    });
    const googleRow = getFormRow(googleDropdown, 'Google Keys', { required: true });
    const amzRow = getFormRow(amzDropdown, 'Amazon Keys', { required: true });
    $(googleRow)
      .css('display', 'none')
      .insertBefore(fileDirField.parents('.row'));
    $(amzRow)
      .css('display', 'none')
      .insertBefore(fileDirField.parents('.row'));

    // update filetype field
    const filetypeDropdown = getSimpleDropdown(
      [
        { _id: 'fastq', name: 'FASTQ' },
        { _id: 'bam', name: 'BAM' },
        { _id: 'bai', name: 'BAI' },
        { _id: 'bed', name: 'BED' },
        { _id: 'csv', name: 'CSV' },
        { _id: 'tab', name: 'TAB' },
        { _id: 'tsv', name: 'TSV' },
        { _id: 'txt', name: 'TXT' }
      ],
      {
        name: 'file_type',
        class: 'no-hide'
      }
    );
    $(fileTypeField[0]).after($(filetypeDropdown));
    $(fileTypeField[0]).remove();

    // update collectionType
    const collectionTypeDropdown = getSimpleDropdown(
      [
        { _id: 'single', name: 'Single/List' },
        { _id: 'pair', name: 'Paired List' },
        { _id: 'triple', name: 'Triple List' },
        { _id: 'quadruple', name: 'Quadruple List' }
      ],
      {
        name: 'collection_type',
        class: 'no-hide'
      }
    );
    $(collectionTypeField[0]).after($(collectionTypeDropdown));
    $(collectionTypeField[0]).remove();

    // 1. get all run environments of user from dnext on change of serverid
    $(serverIDField[0]).on('change', async function(e) {
      const serverId = $(this).val();
      console.log(serverId);
      if (serverId) {
        try {
          const res = await axios({
            method: 'GET',
            url: `/api/v1/server/${serverId}`
          });
          console.log(res);
          if (
            res &&
            res.data &&
            res.data.status === 'success' &&
            res.data.data &&
            res.data.data.data &&
            res.data.data.data[0]
          ) {
            $s.server = res.data.data.data[0];
            const url_server = res.data.data.data[0].url_server;
            console.log(url_server, 'url_server');
            if (url_server && runEnvDropdownEl) {
              let body = {};
              const method = 'GET'; // method for Dnext query
              const url = `${url_server}/api/service.php?data=getRunEnv`;
              const runEnvData = await axios({
                method: 'POST',
                url: `/api/v1/misc/getDnextData`,
                data: { body, method, url }
              });
              console.log('runEnvData', runEnvData);
              if (runEnvData && runEnvData.data && runEnvData.data.data) {
                updateDropdownOptions(runEnvDropdownEl, runEnvData.data.data.data);
              }
            }
            if (url_server) {
              let body = {};
              const method = 'GET'; // method for Dnext query
              const url = `${url_server}/api/service.php?data=getCloudKeys`;
              const cloudData = await axios({
                method: 'POST',
                url: `/api/v1/misc/getDnextData`,
                data: { body, method, url }
              });
              console.log('getCloudKeys', cloudData);
              if (
                cloudData &&
                cloudData.data &&
                cloudData.data.data &&
                cloudData.data.data.data &&
                cloudData.data.data.data['amazon']
              ) {
                updateDropdownOptions($('#mRunAmzKeyS3'), cloudData.data.data.data['amazon']);
              }
              if (
                cloudData &&
                cloudData.data &&
                cloudData.data.data &&
                cloudData.data.data.data &&
                cloudData.data.data.data['google']
              ) {
                updateDropdownOptions($('#mRunGoogKeyGS'), cloudData.data.data.data['google']);
              }
            }
          }
        } catch (err) {
          console.log(err);
        }
      } else {
        // empty dropdowns
        updateDropdownOptions(runEnvDropdownEl, []);
      }
    });
    if (!data || !data.server_id) {
      $(serverIDField[0])
        .prop('selectedIndex', 1)
        .trigger('change');
    }
  }
};
