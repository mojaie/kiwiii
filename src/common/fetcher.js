
/** @module common/fetcher */


const baseURL = '../req/';

function get(url, query={}) {
  const isEmpty = Object.keys(query).length;
  const q = isEmpty ? `?query=${JSON.stringify(query)}` : '';
  return fetch(
    `${baseURL}${url}${q}`,
    {
      credentials: 'include'
    }
  ).then(res => {
    if (res.status !== 200) {
      return Promise.reject(new Error(res.statusText));
    }
    return Promise.resolve(res);
  });
}

function json(response) {
  return response.json();
}

function text(response) {
  return response.text();
}

function blob(response) {
  return response.blob();
}

function post(url, formdata) {
  return fetch(
    `${baseURL}${url}`,
    {
      method: 'POST',
      body: formdata,
      credentials: 'include'
    }
  ).then(res => {
    if (res.status !== 200) {
      return Promise.reject(new Error(res.statusText));
    }
    return Promise.resolve(res);
  });
}

function error(err) {
  console.error(err);
  return null;
}

function serverStatus() {
  const response = {};
  return get('server')
    .then(json)
    .then(res => {
      response.server = res;
    })
    .then(() => get('schema'))
    .then(json)
    .then(res => {
      response.schema = res;
    })
    .then(() => response);
}


export default {
  get, json, text, blob, post, error, serverStatus
};
