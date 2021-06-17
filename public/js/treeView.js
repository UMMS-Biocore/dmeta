/* eslint-disable */
import d3 from './library/d3_3.5.3';
import 'd3-mitch-tree/dist/css/d3-mitch-tree.min.css';
import 'd3-mitch-tree/dist/css/d3-mitch-tree-theme-default.min.css';
d3.mitchTree = require('d3-mitch-tree/dist/js/d3-mitch-tree.min.js');
import { getDropdownFields, fillFormByName, prepareClickToActivateModal } from './jsfuncs';
import { editDataModal, insertDataModal, deleteDataModal } from './dashboard';

let $s = { tree: {}, dataTree: {}, collectionFlatTree: [], scope: {}, treePlugin: {} };

const getChildrenOfCollection = collID => {
  let childCollections = $s.collectionFlatTree.filter(d => d.parentIds.includes(collID));
  return childCollections;
};

const getRefField = (collID, childColls) => {
  const parentIds = childColls.parentIds;
  const refFieldNames = childColls.refFieldNames;
  for (let k = 0; k < parentIds.length; k++) {
    if (parentIds[k] == collID) {
      return refFieldNames[k];
    }
  }
  return '';
};

d3.contextMenu = function(type, openCallback) {
  // create the div element that will hold the context menu
  d3.selectAll('.d3-context-menu')
    .data([1])
    .enter()
    .append('div')
    .attr('class', 'd3-context-menu');

  // close menu
  d3.select('body').on('click.d3-context-menu', function() {
    d3.select('.d3-context-menu').style('display', 'none');
  });

  // this gets executed when a contextmenu event occurs
  return function(data, index) {
    const parentIds = data.data.parentIds;
    const parentLabels = data.data.parentLabels;
    const parentId = data.data.parentId;
    let menu = [];
    if (type == 'collection') {
      menu.push({
        title: 'Edit Fields',
        action: function(elm, d, i) {
          $('.nav-tabs a[href="#collTab_' + data.data.id + '"]').tab('show');
        }
      });
      if (parentLabels.length > 1) {
        for (let k = 0; k < parentLabels.length; k++) {
          const selparentIds = parentIds[k];
          if (parentId != selparentIds) {
            menu.push({
              title: `Change View for ${parentLabels[k]} Branch`,
              action: function(elm, d, i) {
                $s.tree[data.data.projectID][data.data.id]['parentId'] = selparentIds;
                refreshTreeView(data.data.projectID, $s.scope, true);
              }
            });
          }
        }
      }
    } else if (type == 'data') {
      let collID = data.data.id.split('-')[0];
      if (collID == 'all_data') return;
      //main parent collections doesn't have name info
      if (!data.data.name) {
        menu.push({
          title: `Insert ${data.data.description}`,
          action: async function(elm, d, i) {
            const collectionID = data.data.id;
            let button = $(`button.insert-data[collid*=${collectionID}]`);
            const callbackOnSuccess = function(scope, collectID, dataID) {
              refreshTreeView(data.data.projectID, scope, true, {
                collectionID: collectID,
                dataID: dataID
              });
            };
            await insertDataModal(button, true, callbackOnSuccess);
          }
        });
      } else {
        let dataName = data.data.dataName;
        const childColls = getChildrenOfCollection(collID);
        for (let k = 0; k < childColls.length; k++) {
          const refField = getRefField(collID, childColls[k]);
          const childrenCollID = childColls[k].id;
          menu.push({
            title: `Insert ${childColls[k].description}`,
            action: async function(elm, d, i) {
              const collectionID = data.data.id.split('-')[0];
              let button = $(`button.insert-data[collid*=${collectionID}]`);
              if (childrenCollID) {
                button = $(`button.insert-data[collid*=${childrenCollID}]`);
              }
              // const dataID = data.data.id.split('-')[1];
              const callbackOnSuccess = function(scope, collectID, dataID) {
                refreshTreeView(data.data.projectID, scope, true, {
                  collectionID: collectID,
                  dataID: dataID
                });
              };
              await insertDataModal(button, false, callbackOnSuccess);
              if (refField) {
                const selData = {};
                selData[refField] = dataName;
                console.log(selData);
                fillFormByName('#crudModal', 'input, select', selData, true);
                prepareClickToActivateModal(
                  '#crudModal',
                  '#crudModalBody',
                  'input, select',
                  selData
                );
              }
            }
          });
        }
        menu.push({
          title: 'Edit',
          action: function(elm, d, i) {
            const collectionID = data.data.id.split('-')[0];
            const button = $(`button.edit-data[collid*=${collectionID}]`);
            const dataID = data.data.id.split('-')[1];
            const callback = function(scope) {
              refreshTreeView(data.data.projectID, scope, true, {
                collectionID,
                dataID
              });
            };
            editDataModal(button, [dataID], callback);
          }
        });
        menu.push({
          title: 'Delete',
          action: async function(elm, d, i) {
            const parentID = data.parent.data.id;
            const parentCollId = parentID.split('-')[0];
            const parentDataId = parentID.split('-')[1];
            const collectionID = data.data.id.split('-')[0];
            const button = $(`button.delete-data[collid*=${collectionID}]`);
            const dataID = data.data.id.split('-')[1];
            const callback = function(scope) {
              if (parentCollId) {
                refreshTreeView(data.data.projectID, scope, true, {
                  collectionID: parentCollId,
                  dataID: parentDataId
                });
              }
            };
            await deleteDataModal(button, [dataID], callback);
          }
        });
        if (parentLabels && parentLabels.length > 1) {
          for (let k = 0; k < parentLabels.length; k++) {
            const selparentIds = parentIds[k];
            if (parentId != selparentIds) {
              menu.push({
                title: `Change View for ${parentLabels[k]} Branch`,
                action: function(elm, d, i) {
                  const collectionID = data.data.id.split('-')[0];
                  const dataID = data.data.id.split('-')[1];
                  $s.dataTree[data.data.projectID][collectionID]['parentId'] = k;
                  refreshTreeView(data.data.projectID, $s.scope, true, { collectionID, dataID });
                }
              });
            }
          }
        }
      }
    }

    var elm = this;

    d3.selectAll('.d3-context-menu').html('');
    var list = d3.selectAll('.d3-context-menu').append('ul');
    list
      .selectAll('li')
      .data(menu)
      .enter()
      .append('li')
      .html(function(d) {
        return typeof d.title === 'string' ? d.title : d.title(data);
      })
      .on('click', function(d, i) {
        d.action(elm, data, index);
        d3.select('.d3-context-menu').style('display', 'none');
      });
    // the openCallback allows an action to fire before the menu is displayed
    // an example usage would be closing a tooltip
    if (openCallback) {
      if (openCallback(data, index) === false) {
        return;
      }
    }
    // display context menu
    d3.select('.d3-context-menu')
      .style('left', d3.event.pageX - 2 + 'px')
      .style('top', d3.event.pageY - 2 + 'px')
      .style('display', 'block');

    d3.event.preventDefault();
    d3.event.stopPropagation();
  };
};

const getProjectCollectionFlatTree = ($scope, projectID) => {
  let treeData = [];
  const projectData = $scope.projects.filter(e => e._id == projectID);
  const projectName = projectData[0].name;
  const projectCollections = $scope.collections.filter(e => e.projectID == projectID);
  const projectCollectionsIDs = projectCollections.map(e => e._id);
  treeData.push({ id: 'project', description: projectName, parentId: null, parentIds: [] });
  let rootIds = [];
  for (var i = 0; i < projectCollections.length; i++) {
    const collectionID = projectCollections[i]._id;
    let obj = { id: collectionID };
    const refFields = $scope.fields.filter(e => e.collectionID == collectionID && e.ref);
    const refCollectionIDs = [];
    const refCollectionLabels = [];
    const refFieldNames = [];
    for (var k = 0; k < refFields.length; k++) {
      let ref = refFields[k].ref;
      let refName = refFields[k].name;
      const PREFIX = `${projectName}_`;
      if (ref.indexOf(PREFIX) == 0) {
        const refCollectionName = ref.slice(PREFIX.length);
        const refColl = projectCollections.filter(e => e.name == refCollectionName);
        if (refColl && refColl[0]) {
          refCollectionIDs.push(refColl[0]._id);
          refCollectionLabels.push(refColl[0].label);
          refFieldNames.push(refName);
        }
      }
    }
    obj['parentIds'] = refCollectionIDs;
    obj['parentLabels'] = refCollectionLabels;
    obj['refFieldNames'] = refFieldNames;
    // obj['name'] = projectCollections[i].name;
    obj['description'] = projectCollections[i].label;
    obj['projectID'] = projectID;
    if (refCollectionIDs[0] && projectCollectionsIDs.includes(refCollectionIDs[0])) {
      if ($s.tree[projectID][collectionID] && $s.tree[projectID][collectionID]['parentId']) {
        obj['parentId'] = $s.tree[projectID][collectionID]['parentId'];
      } else {
        obj['parentId'] = refCollectionIDs[0];
        $s.tree[projectID][collectionID] = {};
        $s.tree[projectID][collectionID]['parentId'] = refCollectionIDs[0];
      }
    } else {
      obj['parentId'] = 'project';
      rootIds.push(collectionID);
    }
    treeData.push(obj);
  }
  return treeData;
};

const getProjectDataFlatTree = ($scope, projectID, collectionTree) => {
  let treeData = [];
  treeData.push({ id: 'all_data', description: 'All Data', parentId: null, parentIds: [] });
  for (let i = 0; i < collectionTree.length; i++) {
    const collID = collectionTree[i].id;
    const collDetails = $scope.collections.filter(i => i._id === collID);
    let collLabel = '';
    if (collDetails && collDetails[0] && collDetails[0].label) collLabel = collDetails[0].label;
    const parentCollIds = collectionTree[i].parentIds;
    const parentCollLabels = collectionTree[i].parentLabels;
    const refFieldNames = collectionTree[i].refFieldNames;
    const collData = $scope.data[collID];
    const fieldsOfCollection = $scope.fields.filter(f => f.collectionID === collID);
    let showFields = ['name'];
    if (collID != 'project' && fieldsOfCollection) {
      const showFieldsData = getDropdownFields(collData[0], fieldsOfCollection);
      if (showFieldsData && showFieldsData[0]) showFields = showFieldsData;
    }

    if (collectionTree[i].parentId == 'project') {
      treeData.push({
        id: collID,
        description: collectionTree[i].description,
        parentId: 'all_data',
        parentIds: [],
        projectID: projectID
      });
    }
    if (collID != 'project' && collData) {
      for (let k = 0; k < collData.length; k++) {
        const dataID = collData[k]._id;
        let dataName = collData[k][showFields[0]];
        let obj = {};
        obj['dataName'] = dataName;
        if (collData[k][showFields[1]]) dataName = `${dataName}\n${collData[k][showFields[1]]}`;
        let parentDataIds = [];
        let parentLabels = [];
        let id = `${collID}-${dataID}`;
        obj.id = id;
        obj.description = dataName;
        obj.projectID = projectID;
        obj.name = collLabel;
        for (let n = 0; n < refFieldNames.length; n++) {
          let refField = refFieldNames[n];
          const refData = collData[k][refField];
          if (refData && refData._id) {
            parentDataIds.push(`${parentCollIds[n]}-${refData._id}`);
            parentLabels.push(parentCollLabels[n]);
          } else {
            console.log(refField);
            console.log(collData[k]);
            console.log(refData);
          }
        }
        obj['parentIds'] = parentDataIds;
        obj['parentLabels'] = parentLabels;
        if (parentDataIds[0]) {
          if (
            $s.dataTree[projectID][collID] &&
            $s.dataTree[projectID][collID]['parentId'] !== undefined
          ) {
            obj['parentId'] = parentDataIds[$s.dataTree[projectID][collID]['parentId']];
          } else {
            obj['parentId'] = parentDataIds[0];
            $s.dataTree[projectID][collID] = {};
            $s.dataTree[projectID][collID]['parentId'] = 0;
          }
        } else {
          obj['parentId'] = collID;
        }
        treeData.push(obj);
      }
    }
  }
  console.log('treeData', treeData);
  return treeData;
};

const getTreeData = ($scope, projectID, collData) => {
  let treeData = [];
  $s.collectionFlatTree = getProjectCollectionFlatTree($scope, projectID);
  // Collection data for dashboard
  if (collData) {
    treeData = getProjectDataFlatTree($scope, projectID, $s.collectionFlatTree);
    // Project Collections for admin page
  } else {
    treeData = $s.collectionFlatTree;
  }

  const arrayToTree = (items, id = null, link = 'parentId') =>
    items
      .filter(item => item[link] === id)
      .map(item => ({ ...item, children: arrayToTree(items, item.id) }));
  const data = arrayToTree(treeData);
  if (data[0]) {
    return data[0];
  }
  return data;
};

export const refreshTreeView = (projectID, $scope, reload, collData) => {
  $s.scope = $scope;
  let type = 'collection';
  if (collData) type = 'data';
  if (document.getElementById(`d3-tree-${projectID}`)) {
    const isTreeViewInitialized = $(`#d3-tree-${projectID}`).html();
    if (!isTreeViewInitialized || reload) {
      if (!$s.tree[projectID]) $s.tree[projectID] = {};
      if (!$s.dataTree[projectID]) $s.dataTree[projectID] = {};
      var data = getTreeData($scope, projectID, collData);
      var treePlugin = new d3.mitchTree.boxedTree()
        .setData(data)
        .setMinScale(0.001)
        .setElement(document.getElementById(`d3-tree-${projectID}`))
        .setIdAccessor(function(data) {
          return data.id;
        })
        .setChildrenAccessor(function(data) {
          return data.children;
        })
        .setBodyDisplayTextAccessor(function(data) {
          return data.description;
        })
        .setTitleDisplayTextAccessor(function(data) {
          return data.name;
        })
        //.setOrientation('topToBottom')
        // .setMargins({
        //   top: 0,
        //   right: 0,
        //   bottom: 0,
        //   left: 0
        // })
        .getNodeSettings()
        .setSizingMode('nodesize')
        .setVerticalSpacing(25)
        .setHorizontalSpacing(10)
        .back()
        .initialize();

      treePlugin.getZoomListener().scaleTo(treePlugin.getSvg(), 1.6);
      treePlugin
        .getZoomListener()
        .translateTo(treePlugin.getSvg(), treePlugin.getWidthWithoutMargins() / 2, 0);

      // Expand all nodes
      if (type === 'collection') {
        var nodes = treePlugin.getNodes();
        nodes.forEach(function(node, index, arr) {
          treePlugin.expand(node);
        });
        treePlugin.update(treePlugin.getRoot());
      }

      // events: {
      //   nodeClick: function(data, index, arr) {
      //     this.removeSelection(this.getRoot());
      //     event.nodeDataItem.selected = true;
      //     this.centerNode(event.nodeDataItem);
      //     // Cancel the collapse event
      //     if (event.type === 'collapse') event.preventDefault();
      //   }
      // }

      function updateTreeClasses(treePlugin) {
        treePlugin
          .getPanningContainer()
          .selectAll('g.node')
          .attr('class', function(data, index, arr) {
            var existingClasses = this.getAttribute('class');
            let multiParent = '';
            if (data.data.parentIds && data.data.parentIds.length > 1) {
              multiParent = 'multi-parent';
            }
            return existingClasses + ' ' + multiParent;
          });
        d3.selectAll('g.node').on('contextmenu', d3.contextMenu(type));
      }

      //Override the core update method, so it'd call our custom update method
      treePlugin.update = function(nodeDataItem) {
        // Call the original update method
        this.__proto__.update.call(this, nodeDataItem);
        updateTreeClasses(this);
      };
      updateTreeClasses(treePlugin);
    }
    if (collData) {
      const { collectionID, dataID } = collData;
      const focusNode = value => {
        var nodeMatchingText = treePlugin.getNodes().find(function(node) {
          return node.data.id == value;
        });
        if (nodeMatchingText) treePlugin.focusToNode(nodeMatchingText);
        // else if (value != null) treePlugin.focusToNode(value);
      };
      if (collectionID && dataID) {
        focusNode(`${collectionID}-${dataID}`);
      } else if (collectionID && !dataID) {
        focusNode(`${collectionID}`);
      }
    }
  }
};
