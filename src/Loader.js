
import {
  setGlobalConfig, localChemInstance, fetcherInstances, setResources
} from './store/StoreConnection.js';

const localServer = localChemInstance();


function initialize() {
  if ('serviceWorker' in navigator && !debug) {
    navigator.serviceWorker
      .register('sw.js')
      .then(registration => {
        console.info(
          'ServiceWorker registration successful with scope: ',
          registration.scope
        );
      }).catch(err => {
        console.info('ServiceWorker registration failed: ', err);
      });
  } else if (debug) {
    console.info('Off-line mode is disabled for debugging');
  } else {
    console.info('Off-line mode is not supported');
  }
  const serverTmpl = localServer.templates().then(res => {
    setGlobalConfig('templates', res.templates);
  });
  const serverConfig = localServer.status().then(res => {
    setGlobalConfig('server', res);
  });
  // TODO: skip loader if there is already resources in the store
  // 1. collate resource version
  // 2. if no local resource or server resource is newer, fetch
  const rsrcFetched = fetcherInstances()
    .map(api => api.getResources())
    .extendAsync().then(res => {
      const indexed = res.map((e, i) => {
        e.idx = i;
        return e;
      });
      return setResources(indexed);
    });
  return Promise.all([serverTmpl, serverConfig, rsrcFetched]);
}


export function loader() {
  if (document.location.protocol === "file:") {
    console.info('Off-line mode (local file)');
    setGlobalConfig('onLine', false);
    return Promise.resolve();
  }
  if ('onLine' in navigator) {
    if (!navigator.onLine) {
      console.info('Off-line mode (no internet connection)');
      setGlobalConfig('onLine', false);
      return Promise.resolve();
    }
  }
  return fetch(`${localServer.baseURL}favicon.ico`)
    .then(() => {
      // HTTP 404
      setGlobalConfig('onLine', true);
      return initialize();
    }).catch(() => {
      console.info('Off-line mode (server not responding)');
      setGlobalConfig('onLine', false);
      return Promise.resolve();
    });
}
