
/** @module common/core */

import {default as idb} from './idb.js';
import {default as fetcher} from './fetcher.js';
import {default as misc} from './misc.js';


function fetchProgress(storeID, command='update') {
  return idb.getItemByID(storeID)
    .then(data => {
      if (!data) return Promise.reject(`Store: ${storeID} is not available`);
      if (!['ready', 'running'].includes(data.status)) return;
      const query = {id: data.reference.workflow, command: command};
      return fetcher.get('progress', query)
        .then(fetcher.json)
        .then(data => {
          if (data.status === 'failure') {  // No data found on server
            return idb.updateItem(storeID, item => {
              item.status = 'failure';
            });
          }
          return idb.updateItem(storeID, item => {
            item.status = data.status;
            item.progress = data.progress;
            item.execTime = data.execTime;
            item.fields = misc.defaultFieldProperties(data.fields);
            item.records = data.records;
          });
        });
    });
}


export default {
  fetchProgress
};
