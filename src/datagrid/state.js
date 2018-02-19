
/** @module datagrid/state */

import {default as legacy} from '../common/legacySchema.js';
import {default as mapper} from '../common/mapper.js';
import {default as misc} from '../common/misc.js';
import KArray from '../common/KArray.js';


export default class DatagridState {
  constructor(data) {

    // Import from legacy format data
    this.data = legacy.convertTable(data);
    this.fields = null;  // Working copy (set by setFields method)

    this.defaultColumnWidth = {
      numeric: 120,
      text: 200,
      none: 200
    };
    this.defaultColumnHeight = {
      numeric: 40,
      text: 40,
      none: 200
    };
    this.scrollBarSpace = 20;

    this.keyFunc = d => d.index;

    this.visibleFields = null;
    this.rowHeight = null;
    this.contentWidth = null;
    this.bodyHeight = null;

    this.vieportTop = null;
    this.previousVieportTop = null;
    this.vieportBottom = null;

    this.numViewportRows = null;
    this.previousNumViewportRows = null;

    this.updateHeaderNotifier = null;

    // Initialize
    this.setFields(this.data.fields);
  }

  setScrollPosition(position) {
    this.previousVieportTop = this.viewportTop;
    this.viewportTop = position;
    this.viewportBottom = Math.min(
      this.viewportTop + this.numViewportRows, this.data.records.length);
  }

  recordsToShow() {
    return this.data.records.slice(this.viewportTop, this.viewportBottom);
  }

  setFields(fields) {
    this.fields = fields.map(e => {
      e.width = this.defaultColumnWidth[misc.sortType(e.format)];
      e.height = this.defaultColumnHeight[misc.sortType(e.format)];
      return e;
    });
    this.visibleFields = this.fields.filter(e => e.visible);
    this.rowHeight = this.visibleFields
      .reduce((a, b) => a.height > b.height ? a : b).height;
    this.contentWidth = this.visibleFields
      .reduce((a, b) => ({width: a.width + b.width})).width + this.scrollBarSpace;
    this.bodyHeight = this.data.records.length * this.rowHeight;
  }

  joinFields(mapping) {
    mapper.apply(this.data, mapping);
    this.setFields(this.data.fields);
  }

  export() {
    this.data.id = misc.uuidv4();
    return this.data;
  }

}
