
/** @module datatable */

import d3 from 'd3';

import {default as common} from './common.js';
import {default as hfile} from './helper/file.js';
import {default as win} from './helper/window.js';
import {default as button} from './component/button.js';
import {default as store} from './store/StoreConnection.js';
import {default as view} from './datagrid/view.js';
import {default as sort} from './datagrid/sort.js';
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
}


function run() {
  return common.loader()
    .then(() => {
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
        return Promise.resolve();
      }
    });
}


export default {
  run, view
};
