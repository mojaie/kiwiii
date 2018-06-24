
/** @module common/file */

import pako from 'pako';


function readFile(file, sizeLimit, blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const truncated = sizeLimit ? file.slice(0, sizeLimit) : file;
    reader.onload = event => resolve(event.target.result);
    reader.onerror = error => reject(error);
    if (blob) {
      reader.readAsArrayBuffer(truncated);
    } else {
      reader.readAsText(truncated);
    }
  });
}


function parseJSON(data, compressed) {
  const text = compressed ? pako.inflate(data, {to: 'string'}) : data;
  return JSON.parse(text);
}


function loadJSON(file) {
  const compressed = file.name.endsWith('c') || file.name.endsWith('.gz');
  return readFile(file, false, compressed)
    .then(data => parseJSON(data, compressed));
}


function fetchJSON(url) {
  const decoded = decodeURIComponent(url);
  const compressed = decoded.endsWith('c') || decoded.endsWith('.gz');
  return fetch(decoded)
    .then(res => compressed ? res.arrayBuffer() : res.json())
    .then(data => parseJSON(data, compressed));
}


function downloadDataFile(data, name) {
  try {
    // cannot hundle large file with dataURI scheme
    // url = 'data:application/json,' + encodeURIComponent(JSON.stringify(json))
    const url = window.URL.createObjectURL(new Blob([data]));
    const a = document.createElement('a');
    a.download = name;
    a.href = url;
    // a.click() does not work on firefox
    a.dispatchEvent(new MouseEvent('click', {
      'view': window,
      'bubbles': true,
      'cancelable': false
    }));
    // window.URL.revokeObjectURL(url) does not work on firefox
  } catch (e) {
    // no DOM (unit testing)
  }
}


function downloadJSON(json, name, compress=true) {
  const str = JSON.stringify(json);
  const data = compress ? pako.gzip(str) : str;
  const ext = `.ap${compress ? 'c' : 'r'}`;
  downloadDataFile(data, `${name}${ext}`);
}


export default {
  readFile, parseJSON, loadJSON, fetchJSON,
  downloadDataFile, downloadJSON
};
