
import {default as def} from './helper/definition.js';
import {default as win} from './helper/window.js';
import {default as misc} from './helper/misc.js';
import {default as store} from './store/StoreConnection.js';
import {default as dialog} from './component/Dialog.js';
import {default as fetcher} from './fetcher.js';


function interactiveInsert(data) {
  return store.getTable(data.id)
    .then(found => {
      if (!found) return Promise.resolve(data); // no existing table
      if (data.revision == found.revision) return Promise.reject(data.id); // same revision
      // data id conflict
      $('#importconfirm-dialog').modal('toggle');
      return new Promise(res => {
        dialog.importConfirmDialog(action => {
          if (action === 'overwrite') {
            res(data);
          }
          if (action === 'keepboth') {
            data.id = misc.uuidv4();
            res(data);
          }
        });
      });
    })
    .then(
      data => store.insertTable(data).then(() => data.id), // insert or update table
      id => {
        if (id) return Promise.resolve(id); // same revision -> call existing table
        return Promise.reject();
      }
    );
}


function fetchResults(command='update') {
  return store.getTable(win.URLQuery().id)
    .then(data => {
      if (!def.ongoing(data)) return Promise.reject();
      return data;
    })
    .then(data => {
      const query = {id: data.id, command: command};
      return fetcher.get('res', query)
        .then(fetcher.json)
        .then(store.updateTable, fetcher.error);
    }, () => Promise.resolve());
}


function loader() {
  /*
  if (document.location.protocol === "file:") {
    console.info('Off-line mode (local file)');
    store.setGlobalConfig('onLine', false);
    return Promise.resolve();
  }
  if ('onLine' in navigator) {
    if (!navigator.onLine) {
      console.info('Off-line mode (no internet connection)');
      store.setGlobalConfig('onLine', false);
      return Promise.resolve();
    }
  }*/
  if ('serviceWorker' in navigator && !debug) {
    navigator.serviceWorker
      .register('sw.js')
      .then(reg => {
        console.info('ServiceWorker registration successful with scope: ', reg.scope);
      }).catch(err => {
        console.info('ServiceWorker registration failed: ', err);
      });
  } else if (debug) {
    console.info('Off-line mode is disabled for debugging');
  } else {
    console.info('Off-line mode is not supported');
  }
  const server = fetcher.get('server')
    .then(fetcher.json)
    .catch(() => null);
  const local = store.getAppSetting('serverInstance');
  return Promise.all([server, local]).then(ps => {
    const serverStatus = ps[0];
    const clientInstance = ps[1];
    if (!serverStatus) return Promise.resolve(null);
    if (serverStatus.instance === clientInstance) {
      console.info('Resource schema is already up to date');
      return Promise.resolve(serverStatus);
    } else {
      return fetcher.get('schema')
        .then(fetcher.json)
        .then(schema => {
          console.info(`New resource schema version: ${serverStatus.instance}`);
          return Promise.all([
            store.setResources(schema.resources),
            store.setAppSetting('templates', schema.templates),
            store.setAppSetting(
              'compoundIDPlaceholder', schema.compoundIDPlaceholder),
            store.setAppSetting('serverInstance', serverStatus.instance),
            store.setAppSetting('rdkit', serverStatus.rdkit)
          ])
          .then(() => Promise.resolve(serverStatus));
        }, fetcher.error);
    }
  });
}


export default {
  interactiveInsert, fetchResults, loader
};
