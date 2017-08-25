
/** @module fetcher/Fetcher */

/** HTTP fetcher class. */
class Fetcher {
  /** @constructs Fetcher */
  constructor() {
    /** @prop {string} baseURL - fetcher base URL */
    this.baseURL = "";
    /** @prop {bool} available - resource availability */
    this.available = false;
  }

  /**
   * Send XMLHttpRequest
   * TODO: use fetch API instead
   * @param {string} url - resource URL
   * @param {FormData} formData - Formdata object
   * @param {object} options - XMLHttpRequest options
   * @return {Promise} Promise object
   */
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


export default Fetcher;
