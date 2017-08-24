
export default class Fetcher {
  constructor() {
    this.baseURL = "";
    this.available = false;
  }

  xhrRequest(url, formData=null, options={}) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('method' in options ? options.method : 'POST', url);
      xhr.responseType = 'responseType' in options ? options.responseType : 'json';
      xhr.withCredentials = 'withCredentials' in options ? options.withCredentials : false;
      xhr.onload = () => {
        if (xhr.status !== 200) {
          reject(xhr);
        } else {
          resolve(xhr.response);
        }
      };
      xhr.send(formData);
    });
  }

  now() {
    const now = new Date();
    return now.toString();
  }

  getResources() {
    // required
  }

  formatResult(cols, data) {
    // to be called by store.updateTable
    // required for chemical domain
    data.lastUpdated = this.now();
    return data;
  }

  getRecords() {
    // required
  }

  getRecordsByCompound() {
    // required for activity domain
  }

  getMapping() {
    // required for activity domain
  }

  getGraphEdges() {

  }
}
