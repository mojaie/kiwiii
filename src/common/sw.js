
/** @module common/sw */


function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('sw.js')
      .then(reg => {
        console.info('ServiceWorker registration successful with scope: ', reg.scope);
      }).catch(err => {
        console.info('ServiceWorker registration failed: ', err);
      });
  } else {
    console.info('Off-line mode is not supported');
  }
}


export default {
  registerServiceWorker
};
