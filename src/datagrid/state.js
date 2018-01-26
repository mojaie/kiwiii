
/** @module datagrid/state */

import {default as def} from '../helper/definition.js';
import {default as legacy} from '../helper/legacySchema.js';


export default class DatagridState {
  constructor(data) {

    // Import from legacy format data
    data = legacy.convertTable(data);

    this.records = JSON.parse(JSON.stringify(data.records));  // deep copy
    this.fields = JSON.parse(JSON.stringify(data.fields));  // deep copy

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

    this.visibleFields = this.fields.filter(e => e.visible)
      .map(e => {
        e.width = this.defaultColumnWidth[def.sortType(e.format)];
        e.height = this.defaultColumnHeight[def.sortType(e.format)];
        return e;
      });
    this.rowHeight = this.visibleFields
      .reduce((a, b) => a.height > b.height ? a : b).height;
    this.contentWidth = this.visibleFields
      .reduce((a, b) => ({width: a.width + b.width})).width + this.scrollBarSpace;
    this.keyFunc = d => d.index;

    this.bodyHeight = this.records.length * this.rowHeight;

    this.vieportTop = null;
    this.previousVieportTop = null;
    this.vieportBottom = null;

    this.numViewportRows = null;
    this.previousNumViewportRows = null;
  }

  setScrollPosition(position) {
    this.previousVieportTop = this.viewportTop;
    this.viewportTop = position;
    this.viewportBottom = Math.min(
      this.viewportTop + this.numViewportRows, this.records.length);
  }

  recordsToRender() {
    return this.records.slice(this.viewportTop, this.viewportBottom);
  }


  snapshot() {
    return {
    };
  }


}
