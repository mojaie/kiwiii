
/** @module common/transform */

import d3 from 'd3';


export default class TransformState {
  constructor(width, height, transform) {
    this.fieldWidth = width;
    this.fieldHeight = height;

    this.viewBox = {
      top: 0,
      right: this.fieldWidth,
      bottom: this.fieldHeight,
      left: 0
    };

    this.focusArea = {};
    this.focusAreaMargin = 50;

    this.boundary = {
      top: 0,
      right: this.fieldWidth,
      bottom: this.fieldHeight,
      left: 0
    };

    this.transform = transform || {x: 0, y: 0, k: 1};
    this.prevTransform = {
      x: this.transform.x,
      y: this.transform.y,
      k: this.transform.k
    };

    this.resizeNotifier = () => {};
  }

  setFocusArea() {
    const tx = this.transform.x;
    const ty = this.transform.y;
    const tk = this.transform.k;
    const margin = this.focusAreaMargin;
    this.focusArea.top = (this.viewBox.top - ty) / tk - margin;
    this.focusArea.left = (this.viewBox.left - tx) / tk - margin;
    this.focusArea.bottom = (this.viewBox.bottom - ty) / tk + margin;
    this.focusArea.right = (this.viewBox.right - tx) / tk + margin;
    // this.showFocusArea();  // debug
  }

  setViewBox(width, height) {
    this.viewBox.right = width;
    this.viewBox.bottom = height;
    // this.showViewBox();  // debug
    this.setFocusArea();
  }

  setTransform(tx, ty, tk) {
    this.transform.x = tx;
    this.transform.y = ty;
    this.transform.k = tk;
    // this.showTransform(); // debug
    this.setFocusArea();
  }

  fitTransform() {
    const vh = this.viewBox.bottom;
    const vw = this.viewBox.right;
    const vr = vw / vh;
    const bh = this.boundary.bottom - this.boundary.top;
    const bw = this.boundary.right - this.boundary.left;
    const br = bw / bh;
    const isPortrait = vr >= br;
    const tk = isPortrait ? vh / bh : vw / bw;
    const adjustH = isPortrait ? (vw - bw * tk) / 2 : 0;
    const adjustV = isPortrait ? 0 : (vh - bh * tk) / 2;
    const tx = -(this.boundary.left) * tk + adjustH;
    const ty = -(this.boundary.top) * tk + adjustV;
    this.setTransform(tx, ty, tk);
  }

  showTransform() {
    d3.select('#debug-transform')
      .text(JSON.stringify(this.transform));
  }

  showFocusArea() {
    d3.select('#debug-focusarea')
      .text(JSON.stringify(this.focusArea));
  }

  showViewBox() {
    d3.select('#debug-viewbox')
      .text(JSON.stringify(this.viewBox));
  }
}
