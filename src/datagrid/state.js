
/** @module datagrid/state */

import _ from 'lodash';

import Collection from '../common/collection.js';
import {default as idb} from '../common/idb.js';
import {default as misc} from '../common/misc.js';

import {default as component} from './component.js';
import {default as factory} from './rowFactory.js';


export default class DatagridState {
  constructor(view, coll) {
    this.viewID = view.viewID || null;
    this.name = view.name || null;
    this.sortOrder = view.sortOrder || [];
    this.filterText = view.filterText || null;
    this.rows = new Collection(coll);

    this.visibleFields = null;
    this.sortedRecords = null;
    this.filteredRecords = null;

    // TODO: auto adjust
    this.defaultColumnHeight = {
      numeric: 40,
      text: 40,
      none: 200
    };
    this.scrollBarSpace = 20;
    this.keyFunc = d => d.index;

    // Size
    this.rowHeight = null;
    this.bodyHeight = null;

    // Viewport
    this.viewportHeight = null;
    this.numViewportRows = null;
    this.viewportTop = 0;
    this.previousViewportTop = null;
    this.viewportBottom = null;

    this.fixedViewportHeight = null;

    // Event notifier
    this.updateContentsNotifier = null;
    this.updateFilterNotifier = null;

    this.headerCellRenderer = component.headerCellRenderer;
    this.rowFactory = () => factory.rowFactory(this.visibleFields);
  }

  /**
   * Set viewport height and number of rows to show
   * @param {int} height - viewport height
   */
  setViewportSize(height) {
    this.viewportHeight = this.fixedViewportHeight || height;
  }

  /**
   * Set range of the row indices to show
   * @param {int} position - Index of the top row to show
   */
  setScrollPosition(position) {
    this.previousViewportTop = this.viewportTop;
    this.viewportTop = position;
    this.viewportBottom = Math.min(
      this.viewportTop + this.numViewportRows, this.filteredRecords.length);
  }

  setNumViewportRows() {
    this.numViewportRows = Math.ceil(this.viewportHeight / this.rowHeight) + 1;
  }

  resizeViewport(height) {
    this.setViewportSize(height);
    this.setNumViewportRows();
  }

  /**
   * Apply header data
   */
  applyHeader() {
    this.visibleFields = this.rows.fields.filter(e => e.visible);
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
  }

  /**
   * Apply row data
   * 1. applyHeader: define fields and set rowHeight
   * 2. resize: measure actual window size and calc viewportHeight
   * 3. applyData: calc number of rows from rowHeight and viewportHeight
   * 4. setScrollPosition: calc row index range
   * 5. recordsToShow: slice rows to show
   */
  applyData() {
    this.setNumViewportRows();
    this.applyOrder();
  }

  applyOrder(key, order) {
    if (key) {
      this.sortedRecords = _.orderBy(this.rows.records().slice(), [key], [order]);
    } else {
      const keys = this.sortOrder.map(e => e.key);
      const orders = this.sortOrder.map(e => e.order);
      if (keys) {
        this.sortedRecords = _.orderBy(this.rows.records().slice(), keys, orders);
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

  updateFields(fs) {
    this.rows.updateFields(fs);
  }

  joinFields(mapping) {
    this.rows.joinFields(mapping);
    this.applyData();
  }

  recordsToShow() {
    return this.filteredRecords.slice(this.viewportTop, this.viewportBottom);
  }

  save() {
    return Promise.all([
      idb.updateCollection(this.rows.collectionID, this.rows.export()),
      idb.updateView(this.viewID, this.export())
    ]);
  }

  export() {
    return {
      $schema: "https://mojaie.github.io/kiwiii/specs/datagrid_v1.0.json",
      viewID: this.viewID,
      name: this.name,
      viewType: "datagrid",
      rows: this.rows.collectionID,
      sortOrder: this.sortOrder,
      filterText: this.filterText
    };
  }
}
