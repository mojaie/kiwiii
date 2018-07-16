
/** @module tile/state */


import Collection from '../common/collection.js';
import {default as idb} from '../common/idb.js';


export default class TileState {
  constructor(view, items) {
    /* Settings */
    this.pColMarginRatio = 0.1;

    /* Attributes */

    this.viewID = view.viewID;
    this.name = view.name;

    this.items = new Collection(items);
    this.panelField = this.panelField || null;

    this.viewBox = {
      top: 0, right: 1200, bottom: 800, left: 0};

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

    this.setFactor();
  }

  setFactor() {
    const cf = this.panelsPerColumn + this.pColMarginRatio * (this.panelsPerColumn + 1);
    this.panelColWidth = this.viewBox.right / cf;
    this.panelColMargin = this.panelColWidth * this.pColMarginRatio;
    this.columnWidth = this.panelColWidth / this.columnCount;
    this.rowHeight = this.columnWidth;
  }

  getPos(pageCol, pageRow, column, row) {
    const x = this.panelColWidth * pageCol + this.panelColMargin * (pageCol + 1) + this.columnWidth * column;
    const y = this.panelColWidth * pageRow + this.panelColMargin * (pageRow + 1) + this.columnWidth * row;
    return [x, y];
  }

  pageRecords(pageNum) {
    const pp = this.panelsPerRow * this.panelsPerColumn;
    const panels = this.items.contents.slice(pp * pageNum, pp * (pageNum + 1));
    const res = [];
    panels.forEach((panel, i) => {
      const pc = Math.round(i / this.panelsPerColumn);
      const pr = i % this.panelsPerColumn;
      const itemCount = this.rowCount * this.columnCount;
      const tiles = panel.records.slice(0, itemCount);
      tiles.forEach((tile, j) => {
        const c = Math.round(j / this.columnCount);
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
