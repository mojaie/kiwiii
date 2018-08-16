
/** @module common/client */

import _ from 'lodash';


function URLQuery() {
  const pairs = window.location.search.substring(1).split("&")
    .map(e => e.split('='));
  return _.fromPairs(pairs);
}


function compatibility() {
  try {
    () => {};
  } catch (err) {
    return 'Client compatibility error: Arrow function not supported';
  }
  try {
    FormData;
  } catch (err) {
    return 'Client compatibility error: FormData not supported';
  }
  try {
    fetch;
  } catch (err) {
    return 'Client compatibility error: fetch API not supported';
  }
}


function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    if (!debug) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('../sw.js');  // TODO: root path option
      });
    } else {
      console.info('Service worker is disabled for debugging');
    }
  } else {
    console.info('Service worker is not supported');
  }
}


function registerCtrlCommand(key, callback) {
  document.addEventListener('keydown', event => {
    if (event.ctrlKey && event.key === key) {
      callback();
    }
  });
}


export default {
  URLQuery, compatibility, registerServiceWorker, registerCtrlCommand
};
