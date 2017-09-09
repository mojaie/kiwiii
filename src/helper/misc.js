
/** @module helper/parser */

function getSDFPropList(str) {
  const re = />.*?<(\S+)>/g;
  const uniqCols = new Set();
  let arr;
  while ((arr = re.exec(str)) !== null) {
    uniqCols.add(arr[1]);
  }
  return Array.from(uniqCols);
}

// Ref. https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// TODO: not used
function queryFormData(query) {
  const formData = new FormData();
  Object.entries(query).forEach(kv => {
    if (Array.isArray(kv[1])) {
      kv[1].forEach(e => formData.append(kv[0], e));
    } else {
      formData.set(kv[0], kv[1]);
    }
  });
  return formData;
}


// TODO: not used
function queryURL(query) {
  const queryStr = [];
  Object.entries(query).forEach(e => {
    const val = Array.isArray(e[1]) ? JSON.stringify(e[1]) : e[1];
    const key = e[0];
    // const encoded = encodeURIComponent(val);
    queryStr.push(`${key}=${val}`);
  });
  return queryStr.join('&');
}


// TODO: not used
function capitalized(str) {
  return str.replace(/(?:^|\s)\S/g, e => e.toUpperCase());
}


export default {
  getSDFPropList, uuidv4
};
