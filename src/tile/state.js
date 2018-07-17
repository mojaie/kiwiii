
/** @module tile/state */


import Collection from '../common/collection.js';
import {default as idb} from '../common/idb.js';


export default class TileState {
  constructor(view, items) {
    /* Settings */
    this.groupMarginRatio = 0.05;

    /* Attributes */

    this.viewID = view.viewID;
    this.name = view.name;

    this.items = new Collection(items);


    /* Appearance */

    this.rowCount = view.rowCount || 8;
    this.columnCount = view.columnCount || 12;
    this.groupField = view.groupField || null;
    this.groupsPerRow = view.groupsPerRow || 1;
    this.fixRowCount = view.fixRowCount || false;
    this.fixColumnCount = view.fixColumnCount || false;
    this.tileAspectRatio = 1;
    this.showRowNumber = view.showRowNumber || false;
    this.showColumnNumber = view.showColumnNumber || false;


    this.tileContent = {
      field: null, visible: false
    };
    if (view.hasOwnProperty('tileContent')) {
      this.tileContent.field = view.tileContent.field;
      this.tileContent.visible = view.tileContent.visible;
    }

    this.tileColor = {
      field: null, scale: 'linear', domain: [0, 1],
      range: ['#7fffd4', '#7fffd4'], unknown: '#7fffd4'
    };
    if (view.hasOwnProperty('tileColor')) {
      this.tileColor.field = view.tileColor.field;
      this.tileColor.scale = view.tileColor.scale;
      this.tileColor.domain = view.tileColor.domain;
      this.tileColor.range = view.tileColor.range;
      this.tileColor.unknown = view.tileColor.unknown;
    }

    this.tileText = {
      field: null, size: 12, visible: false
    };
    if (view.hasOwnProperty('tileText')) {
      this.tileText.field = view.tileText.field;
      this.tileText.size = view.tileText.size;
      this.tileText.visible = view.tileText.visible;
      this.tileText.halign = view.tileText.halign;
      this.tileText.valign = view.tileText.valign;
    }

    this.tileTextColor = {
      field: null, scale: 'linear', domain: [0, 1],
      range: ['#7fffd4', '#7fffd4'], unknown: '#7fffd4'
    };
    if (view.hasOwnProperty('tileTextColor')) {
      this.tileTextColor.field = view.tileTextColor.field;
      this.tileTextColor.scale = view.tileTextColor.scale;
      this.tileTextColor.domain = view.tileTextColor.domain;
      this.tileTextColor.range = view.tileTextColor.range;
      this.tileTextColor.unknown = view.tileTextColor.unknown;
    }

    // Drawing
    // TODO: duplicated from NetworkState
    // Need refactoring (extract superclass InteractiveView)
    this.fieldWidth = 1200;
    this.fieldHeight = 800;
    this.transform = view.fieldTransform || {x: 0, y: 0, k: 1};
    this.viewBox = {
      top: 0, right: this.fieldWidth, bottom: this.fieldHeight, left: 0};
    this.focusArea = {};
    this.boundary = {};
    this.prevTransform = {
      x: this.transform.x, y: this.transform.y, k: this.transform.k
    };

    this.zoomListener = null;
    this.updateItemNotifier = null;
    this.updateItemAttrNotifier = null;

    this.setFactor();
    this.setFocusArea();
  }

  setFocusArea() {
    const tx = this.transform.x;
    const ty = this.transform.y;
    const tk = this.transform.k;
    const margin = 50;
    this.focusArea.top = (this.viewBox.top - ty) / tk - margin;
    this.focusArea.left = (this.viewBox.left - tx) / tk - margin;
    this.focusArea.bottom = (this.viewBox.bottom - ty) / tk + margin;
    this.focusArea.right = (this.viewBox.right - tx) / tk + margin;
    // this.showFocusArea();  // debug
  }

  setTransform(tx, ty, tk) {
    this.transform.x = tx;
    this.transform.y = ty;
    this.transform.k = tk;
    // this.showTransform(); // debug
    this.setFocusArea();
  }

  setViewBox(width, height) {
    this.viewBox.right = width;
    this.viewBox.bottom = height;
    // this.showViewBox();  // debug
    this.setFocusArea();
  }

  setFactor() {
    const cf = this.groupsPerRow + this.groupMarginRatio * (this.groupsPerRow + 1);
    this.groupWidth = this.viewBox.right / cf;
    this.groupHeight = this.groupWidth * this.tileAspectRatio;
    this.groupMarginH = this.groupWidth * this.groupMarginRatio;
    this.groupMarginV = this.groupHeight * this.groupMarginRatio;
    this.columnWidth = this.groupWidth / this.columnCount;
    this.rowHeight = this.columnWidth * this.tileAspectRatio;
  }

  getPos(gCol, gRow, col, row) {
    const x = this.groupWidth * gCol + this.groupMarginH * (gCol + 1) + this.columnWidth * col;
    const y = this.groupHeight * gRow + this.groupMarginV * (gRow + 1) + this.rowHeight * row;
    return [x, y];
  }

  currentItems() {
    const res = [];
    const tileCount = this.columnCount * this.rowCount;
    this.items.records().forEach((rcd, i) => {
      const groupIdx = Math.floor(i / tileCount);
      const tileIdx = i % tileCount;
      const gRow = Math.floor(groupIdx / this.groupsPerRow);
      const gCol = groupIdx % this.groupsPerRow;
      const row = Math.floor(tileIdx / this.columnCount);
      const col = tileIdx % this.columnCount;
      const pos = this.getPos(gCol, gRow, col, row);
      const newrcd = {x: pos[0], y: pos[1]};
      Object.assign(newrcd, rcd);
      res.push(newrcd);
    });
    return res;
  }

  itemsToRender() {
    return this.currentItems().filter(
      e => this.focusArea.top < e.y
        && this.focusArea.left < e.x
        && this.focusArea.bottom > e.y
        && this.focusArea.right > e.x
    );
  }

  save() {
    return Promise.all([
      idb.updateCollection(this.items.collectionID, this.items.export()),
      idb.updateView(this.viewID, this.export())
    ]);
  }

  export() {
    return {
      $schema: "https://mojaie.github.io/kiwiii/specs/tile_v1.0.json",
      viewID: this.viewID,
      name: this.name,
      viewType: "tile",
      items: this.items.collectionID,
      rowCount: this.rowCount,
      columnCount: this.columnCount,
      groupField: this.groupField,
      groupsPerRow: this.groupsPerRow,
      tileContent: this.tileContent,
      tileColor: this.tileColor,
      tileText: this.tileText,
      tileTextColor: this.tileTextColor
    };
  }

}
