
/** @module tile/state */


import Collection from '../common/collection.js';
import {default as idb} from '../common/idb.js';


export default class TileState {
  constructor(view, items) {
    /* Settings */
    this.pColMarginRatio = 0.05;

    /* Attributes */

    this.viewID = view.viewID;
    this.name = view.name;

    this.items = new Collection(items);
    this.panelField = this.panelField || null;


    /* Appearance */

    this.rowCount = view.rowCount || 8;
    this.columnCount = view.columnCount || 12;
    this.fixPanelSize = view.fixPanelSize || false;
    this.fixAspectRatio = true;  // TODO
    this.panelsPerRow = view.panelsPerRow || 1;
    this.panelsPerColumn = view.panelsPerColumn || 1;
    this.fixPageSize = view.fixPageSize || false;
    this.currentPage = view.currentPage || 0;


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
    this.forceField = {
      top: 0, right: this.fieldWidth, bottom: this.fieldHeight, left: 0};
    this.viewBox = {
      top: 0, right: this.fieldWidth, bottom: this.fieldHeight, left: 0};
    this.focusArea = {};
    this.boundary = {};
    this.prevTransform = {
      x: this.transform.x, y: this.transform.y, k: this.transform.k
    };

    this.zoomListener = null;
    this.updatePanelNotifier = null;
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
    const cf = this.panelsPerColumn + this.pColMarginRatio * (this.panelsPerColumn + 1);
    this.panelColWidth = this.viewBox.right / cf;
    this.panelColMargin = this.panelColWidth * this.pColMarginRatio;
    this.columnWidth = this.panelColWidth / this.columnCount;
    this.rowHeight = this.columnWidth;
  }

  getPos(pageCol, pageRow, column, row) {
    const x = this.panelColWidth * pageRow + this.panelColMargin * (pageRow + 1) + this.columnWidth * row;
    const y = this.panelColWidth * pageCol + this.panelColMargin * (pageCol + 1) + this.columnWidth * column;
    return [x, y];
  }

  pageRecords(pageNum) {
    const pp = this.panelsPerRow * this.panelsPerColumn;
    const panels = this.items.contents.slice(pp * pageNum, pp * (pageNum + 1));
    const res = [];
    panels.forEach((panel, i) => {
      const pc = Math.floor(i / this.panelsPerColumn);
      const pr = i % this.panelsPerColumn;
      const itemCount = this.rowCount * this.columnCount;
      const tiles = panel.records.slice(0, itemCount);
      tiles.forEach((tile, j) => {
        const c = Math.floor(j / this.columnCount);
        const r = j % this.columnCount;
        const pos = this.getPos(pc, pr, c, r);
        const record = {
          x: pos[0], y: pos[1], panel: panel[this.groupField]
        };
        Object.assign(record, tile);
        res.push(record);
      });
    });
    return res;
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
      tileContent: this.tileContent,
      tileColor: this.tileColor
    };
  }

}
