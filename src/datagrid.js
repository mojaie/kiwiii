
/** @module datagrid */

import {default as core} from './common/core.js';
import {default as fetcher} from './common/fetcher.js';
import {default as hfile} from './common/file.js';
import {default as idb} from './common/idb.js';
import {default as misc} from './common/misc.js';

import DatagridState from './datagrid/state.js';
import {default as sort} from './datagrid/sort.js';
import {default as view} from './datagrid/view.js';
import {default as datagridApp} from './datagrid/datagridApp.js';
import {default as newDatagrid} from './datagrid/newDatagrid.js';


function run() {
  // TODO: offline mode flags
  const localFile = document.location.protocol !== "file:";  // TODO
  const offLine = 'onLine' in navigator && !navigator.onLine;  // TODO
  const response = {};
  return fetcher.get('server')
    .then(fetcher.json)
    .then(res => {
      response.server = res;
    })
    .then(() => fetcher.get('schema'))
    .then(fetcher.json)
    .then(res => {
      response.schema = res;
    })
    .catch(() => {
      console.info('Server did not respond');
      response.server = {};
      response.schema = {
        resources: [], templates: [], compoundIDPlaceholder: null
      };
    })
    .then(() => {
      console.info('Off-line mode is disabled for debugging');
      const storeID = misc.URLQuery().id || null;
      const dataURL = misc.URLQuery().location || null;
      const error = misc.URLQuery().err || null;
      if (error) {
        console.error(decodeURI(error));
      }
      if (storeID) {
        // Load from IndexedDB store
        core.fetchProgress(storeID, 'update')
          .then(() => idb.getItemByID(storeID))
          .then(item => datagridApp.app(item, response.server))
          .catch(err => {
            window.location = `datagrid.html?err=${err}`;
          });
      } else if (dataURL) {
        // Fetch via HTTP
        hfile.fetchJSON(dataURL)
          .then(item => datagridApp.app(item, response.server));
      } else {
        // New datagrid
        newDatagrid.app(response.server, response.schema);
      }
    });
}


export default {
  DatagridState, sort, view, run
};
