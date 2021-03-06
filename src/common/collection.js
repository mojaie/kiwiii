
/** @module common/collection */

import _ from 'lodash';

import {default as idb} from './idb.js';
import {default as fetcher} from './fetcher.js';
import {default as mapper} from './mapper.js';


export default class Collection {
  /**
   * Create Collection from a flashflood response datatable
   * If data is not specified, put datatables later by this.append(data)
   * @param {object} coll - Collection or response object
   */
  constructor(coll) {
    // Settings
    this.autoIndex = 'index';  // enumerate records

    this.collectionID = coll.collectionID || null;
    this.instance = coll.instance || null;
    this.name = coll.name || null;
    if (coll.records) {
      this.contents = [coll];
      this.fields = [];
    } else {
      this.contents = coll.contents;
      this.fields = coll.fields || [];
    }
    this.contents.forEach(content => {
      content.fields.forEach(e => this.addField(e));
    });
  }

  /**
   * Add fields
   * @param {array} fs - list of fields
   */
  addField(field) {
    if (this.fields.find(e => e.key === field.key)) return;
    if (!field.hasOwnProperty('name')) field.name = field.key;
    if (!field.hasOwnProperty('visible')) field.visible = true;
    if (field.hasOwnProperty('d3_format')) field.format = 'd3_format';
    if (!field.hasOwnProperty('format')) field.format = 'raw';
    this.fields.push(field);
  }

  /**
   * Update fields properties
   * @param {array} fs - list of fields
   */
  updateFields(fs) {
    this.fields = [];
    fs.forEach(e => this.addField(e));
  }

  /**
   * Join fields
   * @param {object} mapping - column mapper object
   */
  joinFields(mapping) {
    this.contents.forEach(c => {
      mapper.apply(c, mapping);
    });
    if (mapping.hasOwnProperty('fields')) {
      mapping.fields.forEach(e => this.addField(e));
    } else {
      this.addField(mapping.field);
    }
  }

  /**
   * Apply function to the original data records
   * new fields should be manually added by Collection.addField
   * @param {function} func - function to be applied
   */
  apply(func) {
    this.contents.forEach(content => {
      content.records.forEach(rcd => {
        func(rcd);
      });
    });
  }

  /**
   * Return all records of the collection
   * @return {array} records
   */
  records() {
    return _.flatten(this.contents.map(e => e.records));
  }

  fetch(command) {
    const fs = this.contents
      .filter(e => ['running', 'ready', 'interrupted', 'queued'].includes(e.status))
      .map(content => {
        const query = {id: content.workflowID, command: command};
        return fetcher.get('progress', query)
          .then(fetcher.json)
          .then(data => {
            return idb.updateCollection(this.instance, this.collectionID, coll => {
              const i = coll.contents
                .findIndex(e => e.workflowID === query.id);
              if (data.status === 'failure') {  // No data found on server
                coll.contents[i].status = 'failure';
              } else {
                coll.contents[i] = data;
              }
            });
          });
      });
    return Promise.all(fs)
      .then(() => idb.getCollection(this.instance, this.collectionID))
      .then(coll => {
        this.contents = coll.contents;
      });
  }

  /**
   * Retrieve workflows and store it into a local store.
   * @return {Promise}
   */
  pull() {
    return this.fetch('pull');
  }

  /**
   * Retrieve workflows, abort all ongoing workflow task
   * and store it into a local store.
   * @return {Promise}
   */
  abort() {
    return this.fetch('abort');
  }

  /**
   * Return total number of records
   * @return {float} total number of records
   */
  size() {
    return _.sum(this.contents.map(e => e.records.length));
  }

  /**
   * Return status
   * @return {string} status
   */
  status() {
    if (this.contents.some(e => e.status === 'interrupted')) return 'interrupted';
    if (this.contents.some(e => e.status === 'running')) return 'running';
    if (this.contents.some(e => e.status === 'queued')) return 'queued';
    if (this.contents.some(e => e.status === 'ready')) return 'ready';
    if (this.contents.some(e => e.status === 'aborted')) return 'aborted';
    if (this.contents.some(e => e.status === 'failure')) return 'failure';
    return 'done';
  }

  /**
   * Return ongoing or not
   * @return {bool} ongoing or not
   */
  ongoing() {
    const s = ['ready', 'queued', 'running', 'interrupted'];
    return s.includes(this.status());
  }

  /**
   * Return percentage of workflow progress
   * @return {float} progress in percent
   */
  progress() {
    return _.min(this.contents.map(e => e.progress));
  }

  /**
   * Return total execution time
   * @return {float} total time
   */
  execTime() {
    return _.sum(this.contents.map(e => e.execTime));
  }

  /**
   * Export collection object as JSON
   * @return {object} collection JSON
   */
  // TODO: new method that exports only visible fields
  export() {
    return {
      $schema: "https://mojaie.github.io/kiwiii/specs/collection_v1.0.json",
      collectionID: this.collectionID,
      name: this.name,
      fields: this.fields,
      contents: this.contents
    };
  }
}
