
/** @module tile/state */

import _ from 'lodash';

import Collection from '../common/collection.js';
import {default as idb} from '../common/idb.js';


export default class TileState {
  constructor(view, items) {
    /* Settings */
    this.chunkMarginRatio = 0.05;

    this.focusedViewThreshold = 200;
    this.enableFocusedView = true;
    this.focusedView = false;

    /* Attributes */

    this.viewID = view.viewID;
    this.name = view.name;

    this.items = new Collection(items);
    this.its = JSON.parse(JSON.stringify(this.items.records()));


    /* Appearance */

    this.rowCount = view.rowCount || 8;
    this.columnCount = view.columnCount || 12;
    this.groupField = view.groupField || null;
    this.chunksPerRow = view.chunksPerRow || 1;
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

    this.tileValue = {
      field: null, size: 12, visible: false
    };
    if (view.hasOwnProperty('tileValue')) {
      this.tileValue.field = view.tileValue.field;
      this.tileValue.size = view.tileValue.size;
      this.tileValue.visible = view.tileValue.visible;
      this.tileValue.halign = view.tileValue.halign;
      this.tileValue.valign = view.tileValue.valign;
    }

    this.tileValueColor = {
      field: null, scale: 'linear', domain: [0, 1],
      range: ['#7fffd4', '#7fffd4'], unknown: '#7fffd4'
    };
    if (view.hasOwnProperty('tileValueColor')) {
      this.tileValueColor.field = view.tileValueColor.field;
      this.tileValueColor.scale = view.tileValueColor.scale;
      this.tileValueColor.domain = view.tileValueColor.domain;
      this.tileValueColor.range = view.tileValueColor.range;
      this.tileValueColor.unknown = view.tileValueColor.unknown;
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
    this.scaleExtent = [1, Infinity];
    this.translateExtent = [[0, 0], [this.fieldWidth, Infinity]];

    this.chunkWidth = null;
    this.chunkHeight = null;
    this.chunkMarginH = null;
    this.chunkMarginV = null;
    this.columnWidth = null;
    this.rowHeight = null;

    this.zoomListener = null;
    this.updateFieldNotifier = null;
    this.updateItemNotifier = null;
    this.updateItemAttrNotifier = null;
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

  setCoords() {
    this.its.forEach(item => {
      const cRow = Math.floor(item.chunk / this.chunksPerRow);
      const cCol = item.chunk % this.chunksPerRow;
      item.x = this.chunkWidth * cCol + this.chunkMarginH * (cCol + 1) + this.columnWidth * item.col;
      item.y = this.chunkHeight * cRow + this.chunkMarginV * (cRow + 1) + this.rowHeight * item.row;
    });
  }

  setIndices() {
    const tileCount = this.columnCount * this.rowCount;
    let totalChunks = 0;
    Object.entries(_.groupBy(this.its, this.groupBy))
      .sort(group => group[0])
      .forEach((group, i) => {
        group[1].forEach((rcd, j) => {
          const tileIdx = j % tileCount;
          rcd.group = i;
          rcd.chunk = Math.floor(j / tileCount) + totalChunks;
          rcd.row = Math.floor(tileIdx / this.columnCount);
          rcd.col = tileIdx % this.columnCount;
        });
        totalChunks += Math.ceil(group[1].length / tileCount);
    });
    this.setCoords();
  }

  setFieldSize() {
    this.chunkWidth = this.fieldWidth /
      (this.chunksPerRow + this.chunkMarginRatio * (this.chunksPerRow + 1));
    this.chunkHeight = this.chunkWidth * this.tileAspectRatio;
    this.chunkMarginH = this.chunkWidth * this.chunkMarginRatio;
    this.chunkMarginV = this.chunkHeight * this.chunkMarginRatio;
    this.columnWidth = this.chunkWidth / this.columnCount;
    this.rowHeight = this.columnWidth * this.tileAspectRatio;
    this.setIndices();
  }

  itemsToRender() {
    return this.its.filter(
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
      chunksPerRow: this.chunksPerRow,
      tileContent: this.tileContent,
      tileColor: this.tileColor,
      tileValue: this.tileValue,
      tileValueColor: this.tileValueColor,
      fieldTransform: this.transform
    };
  }

}
