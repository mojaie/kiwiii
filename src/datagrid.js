
/** @module datatable */

import d3 from 'd3';

import {default as common} from './common.js';
import {default as fetcher} from './fetcher.js';
import {default as store} from './store/StoreConnection.js';
import {default as hfile} from './helper/file.js';
import {default as win} from './helper/window.js';
import {default as button} from './component/button.js';
import {default as box} from './component/formBox.js';
import {default as view} from './datagrid/view.js';
import {default as sort} from './datagrid/sort.js';
import {default as dialog} from './datagrid/dialog.js';
import {default as group} from './datagrid/dialogFormGroup.js';
import DatagridState from './datagrid/state.js';


function render(data) {
  const storeID = win.URLQuery().id || null;
  const state = new DatagridState(data);
  d3.select('#datagrid')
    .call(view.datagrid, state)
    .call(sort.setSort, state);

  // Resize window
  window.onresize = () =>
    d3.select('#datagrid').call(view.resize, state);

  // Toolbar
  if (d3.select('#toolbar').selectAll('div,span,a').size()) {
    d3.select('#toolbar').selectAll('div,span,a').remove();
  }
  const menu = d3.select('#toolbar').append('div')
      .call(button.dropdownMenuButton, null, 'View control', 'primary')
      .select('.dropdown-menu');
  // Save
  menu.append('a')
      .call(button.dropdownMenuItem, null, 'Save view')
      .on('click', function () {
        if (storeID) {
          return store.updateTableAttribute(storeID, 'snapshot', state.snapshot())
              .then(() => console.info('Snapshot saved'));
        } else {
          data.snapshot = state.snapshot();
          return loadNewDatagrid(data);
        }
      });
  // Select fields
  menu.append('a')
      .call(button.dropdownMenuModal,
            'fields', 'Fields setting', 'fields-dialog');
  // Add fields from file
  menu.append('a')
      .call(button.dropdownMenuModal,
            'importfields', 'Add fields from file', 'importfields-dialog');
  // Network generation
  menu.append('a')
      .call(button.dropdownMenuModal,
            'network', 'Generate network view', 'network-dialog');
  // Rename
  menu.append('a')
      .call(button.dropdownMenuModal,
            'rename', 'Rename view', 'rename-dialog');
  // JSON
  menu.append('a')
      .call(button.dropdownMenuItem, null, 'Export to JSON')
      .on('click', () => {
        // Save snapshot before save
        return store.updateTableAttribute(storeID, 'snapshot', state.snapshot())
          .then(store.getTable)
          .then(g => hfile.downloadJSON(g, g.edges.name));
      });
  // Excel
  menu.append('a')
      .call(button.dropdownMenuItem, null, 'Export to Excel worksheet')
      .on('click', () => {
        // Save snapshot before save
        return store.updateTableAttribute(storeID, 'snapshot', state.snapshot())
          .then(store.getTable)
          .then(g => hfile.downloadJSON(g, g.edges.name));
  });
}


function loadNewDatagrid(data) {
  return common.interactiveInsert(data)
    .then(id => {
      window.location = `datagrid.html?id=${id}`;
    });
}


function run() {
  return common.loader()
    .then(serverStatus => {
      if (win.URLQuery().hasOwnProperty('id')) {
        // IndexedDB
        return common.fetchResults('update')
          .then(() => store.getTable(win.URLQuery().id))
          .then(render);
      } else if (win.URLQuery().hasOwnProperty('location')) {
        // Location parameter enables direct access to graph JSON via HTTP
        return hfile.fetchJSON(win.URLQuery().location)
          .then(render);
      } else {
        // Load data manually
        if (d3.select('#toolbar').selectAll('div,a').size()) {
          d3.select('#toolbar').selectAll('div,a').remove();
        }
        const menu = d3.select('#toolbar').append('div')
            .call(button.dropdownMenuButton, null, '+ New datagrid', 'primary')
            .select('.dropdown-menu');
        // Search by ID
        menu.append('a')
            .call(button.dropdownMenuModal,
                  'search', 'Search by compound ID', 'search-dialog');
        // Search by structure
        menu.append('a')
            .call(button.dropdownMenuModal,
                  'struct', 'Search by structure', 'struct-dialog');
        // Search by properties
        menu.append('a')
        .call(button.dropdownMenuModal,
              'prop', 'Search by properties', 'filter-dialog');
        // SDFile
        menu.append('a')
        .call(button.dropdownMenuModal,
              'sdf', 'Import SDFile', 'sdf-dialog');
        // JSON
        menu.append('a')
            .call(button.dropdownMenuFile, 'import', 'Import view')
            .on('change', function () {
              const file = button.dropdownMenuFileValue(d3.select(this));
              hfile.loadJSON(file).then(render);
            });
        d3.select('#toolbar').append('a')
            .call(button.menuButton, null, 'Control panel', 'outline-secondary')
            .attr('href', 'control.html')
            .attr('target', '_blank');

        // Dialogs
        if (d3.select('#dialogs').selectAll('div').size()) {
          d3.select('#dialogs').selectAll('div').remove();
        }
        if (!serverStatus) return Promise.resolve();
        return store.getResources()
          .then(rsrc => {
            const chemrsrc = rsrc.filter(e => e.domain === 'chemical');
            // ID search
            const searchd = d3.select('#dialogs').append('div')
                .call(dialog.searchDialog);
            searchd.select('.submit')
                .on('click', function () {
                  d3.select('#loading-icon').style('display', 'inline');
                  const query = {
                    workflow: 'search',
                    targets: chemrsrc.map(e => e.id),
                    key: 'compound_id',
                    values: box.textareaBoxLines(searchd.select('.ids'))
                  };
                  return fetcher.get(query.workflow, query)
                    .then(fetcher.json)
                    .then(loadNewDatagrid, fetcher.error);
                });
            // Structure search
            const structd = d3.select('#dialogs').append('div')
                .call(dialog.structDialog, chemrsrc);
            structd.select('.submit')
                .on('click', function () {
                  d3.select('#loading-icon').style('display', 'inline');
                  const query = {
                    workflow: box.selectBoxValue(structd.select('.method')),
                    targets: box.checkboxListValue(structd.select('.targets')),
                    queryMol: group.queryMolGroupValue(structd.select('.qmol')),
                    params: group.simOptionGroupValue(structd.select('.option'))
                  };
                  query.params.measure = box.selectBoxValue(structd.select('.measure'));
                  query.params.threshold = box.numberBoxValue(structd.select('.thld'));
                  return fetcher.get(query.workflow, query)
                    .then(fetcher.json)
                    .then(loadNewDatagrid, fetcher.error);
                });
            // Filter
            const filterd = d3.select('#dialogs').append('div')
                .call(dialog.filterDialog, chemrsrc);
            filterd.select('.submit')
                .on('click', function () {
                  d3.select('#loading-icon').style('display', 'inline');
                  const query = {
                    workflow: 'filter',
                    targets: chemrsrc.map(e => e.id),
                    key: 'compound_id',
                    value: box.textBoxValue(filterd.select('.value')),
                    operator: box.selectBoxValue(filterd.select('.operator'))
                  };
                  return fetcher.get(query.workflow, query)
                    .then(fetcher.json)
                    .then(loadNewDatagrid, fetcher.error);
                });
            // Import SDFile
            const sdfd = d3.select('#dialogs').append('div')
                .call(dialog.sdfDialog, chemrsrc);
            sdfd.select('.submit')
                .on('click', () => {
                  d3.select('#loading-circle').style('display', 'inline');
                  const params = {
                    fields: d3form.checkboxValues('#sdf-cols'),
                    implh: d3form.checked('#sdf-implh'),
                    recalc: d3form.checked('#sdf-recalc')
                  };
                  const formData = new FormData();
                  formData.append('contents', d3form.firstFile('#sdf-file'));
                  formData.append('params', JSON.stringify(params));
                  return fetcher.post('sdfin', formData)
                    .then(fetcher.json)
                    .then(callback, fetcher.error);
                });
          });
      }

    });
}


export default {
  run, view
};
