
/** @module datagrid/state */

import _ from 'lodash';

import {default as mapper} from '../common/mapper.js';
import {default as misc} from '../common/misc.js';

import {default as factory} from './rowFactory.js';


export default class DatagridState {
  constructor(data) {
    this.data = data;

    this.visibleFields = null;
    this.sortedRecords = null;
    this.filteredRecords = null;

    // Snapshot
    const snp = this.data.snapshot || {sortOrder: [], filterText: null};
    this.sortOrder = snp.sortOrder || [];
    this.filterText = snp.filterText || null;

    this.defaultColumnHeight = {
      numeric: 40,
      text: 40,
      none: 200
    };
    this.scrollBarSpace = 20;
    this.keyFunc = d => d.index;

    // Size
    this.rowHeight = null;
    this.contentWidth = null;
    this.bodyHeight = null;

    // Viewport
    this.viewportHeight = null;
    this.numViewportRows = null;
    this.previousNumViewportRows = null;
    this.viewportTop = null;
    this.previousVieportTop = null;
    this.viewportBottom = null;
    this.currentScrollTop = 0;

    this.fixedViewportHeight = null;

    // Event notifier
    this.updateContentsNotifier = null;
    this.updateFilterNotifier = null;

    this.rowFactory = () => factory.rowFactory(this.visibleFields);

    // Initialize
    this.applyData();
  }

  setViewportSize(height) {
    this.viewportHeight = this.fixedViewportHeight || height;
    this.previousNumViewportRows = this.numViewportRows;
    this.numViewportRows = Math.ceil(this.viewportHeight / this.rowHeight) + 1;
  }

  setScrollPosition(position) {
    this.previousViewportTop = this.viewportTop;
    this.viewportTop = position;
    this.viewportBottom = Math.min(
      this.viewportTop + this.numViewportRows, this.filteredRecords.length);
  }

  setSortOrder(key, order) {
    const ki  = this.sortOrder.findIndex(e => e.key);
    const obj = {key: key, order: order};
    if (ki !== -1) this.sortOrder.splice(ki, 1);
    this.sortOrder.splice(0, 0, obj);
    this.applyOrder(key, order);
  }

  setFilterText(text) {
    this.filterText = text;
    this.applyFilter();
  }

  joinFields(mapping) {
    mapper.apply(this.data, mapping);
    this.applyData();
  }

  applyData() {
    this.visibleFields = this.data.fields.filter(e => e.visible);
    const widthfSum = this.visibleFields.reduce((a, c) => a + (c.widthf || 1), 0);
    this.visibleFields = this.visibleFields.map(e => {
      const field = {
        width: (e.widthf || 1) / widthfSum * 100,
        height: e.height || this.defaultColumnHeight[misc.sortType(e.format)]
      };
      return Object.assign(field, e);
    });
    this.rowHeight = this.visibleFields
      .reduce((a, b) => a.height > b.height ? a : b).height;
    this.applyOrder();
  }

  applyOrder(key, order) {
    if (key) {
      this.sortedRecords = _.orderBy(this.data.records.slice(), [key], [order]);
    } else {
      const keys = this.sortOrder.map(e => e.key);
      const orders = this.sortOrder.map(e => e.order);
      if (keys) {
        this.sortedRecords = _.orderBy(this.data.records.slice(), keys, orders);
      }
    }
    this.applyFilter();
  }

  applyFilter() {
    if (this.filterText === null) {
      this.filteredRecords = this.sortedRecords.slice();
    } else {
      const fields = this.visibleFields
        .filter(e => misc.sortType(e.format) !== 'none')
        .map(e => e.key);
      this.filteredRecords = this.sortedRecords.filter(row => {
        return fields.some(f => misc.partialMatch(this.filterText, row[f]));
      });
    }
    this.bodyHeight = this.filteredRecords.length * this.rowHeight;
  }

  recordsToShow() {
    return this.filteredRecords.slice(this.viewportTop, this.viewportBottom);
  }

  export() {
    this.data.id = misc.uuidv4();
    return this.data;
  }

}
