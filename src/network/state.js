
/** @module network */

import d3 from 'd3';


export default class NetworkState {
  constructor(data, width, height) {
    // TODO: v0.8 compatibility
    this.nodes = data.nodes.records;
    this.edges = data.edges.records;
    this.transform = data.edges.snapshot.fieldTransform;
    this.nodeColor= data.edges.snapshot.nodeColor;
    this.nodeSize = data.edges.snapshot.nodeSize;
    this.nodeContent = data.edges.snapshot.nodeContent;
    this.nodeLabel = data.edges.snapshot.nodeLabel;
    this.edgeVisible = data.edges.snapshot.edge.visible;
    this.edgeWidth = data.edges.snapshot.edge;
    this.edgeLabel = data.edges.snapshot.edge.label;
    this.networkThreshold = data.edges.networkThreshold;

    // Working memory
    this.forceField = {top: 0, right: width, bottom: height, left: 0};
    this.viewBox = {top: 0, right: width, bottom: height, left: 0};
    this.focusArea = {};
    this.boundary = {};
    // Assuming that the network is undirected graph and
    // source index < target index
    this.adjacency = this.nodes.map(() => []);
    this.edges.forEach((e, i) => {
      this.adjacency[e.source].push([e.target, i]);
      this.adjacency[e.target].push([e.source, i]);
    });

    // Set default state
    this.setAllCoords(data.edges.snapshot.nodePositions);
    this.setFocusArea();
    this.setBoundary();
  }

  setBoundary() {
    const xs = this.nodes.map(e => e.x);
    const ys = this.nodes.map(e => e.y);
    this.boundary.top = Math.min.apply(null, ys);
    this.boundary.left = Math.min.apply(null, xs);
    this.boundary.bottom = Math.max.apply(null, ys);
    this.boundary.right = Math.max.apply(null, xs);
    this.showBoundary(); // debug
  }

  setFocusArea() {
    const tx = this.transform.x;
    const ty = this.transform.y;
    const tk = this.transform.k;
    const margin = 0;
    this.focusArea.top = (this.viewBox.top - ty) / tk - margin;
    this.focusArea.left = (this.viewBox.left - tx) / tk - margin;
    this.focusArea.bottom = (this.viewBox.bottom - ty) / tk + margin;
    this.focusArea.right = (this.viewBox.right - tx) / tk + margin;
    this.showFocusArea();  // debug
  }

  setTransform(tx, ty, tk) {
    this.transform.x = tx;
    this.transform.y = ty;
    this.transform.k = tk;
    this.showTransform(); // debug
    this.setFocusArea();
  }

  setViewBox(width, height) {
    this.viewBox.right = width;
    this.viewBox.bottom = height;
    this.showViewBox();  // debug
    this.setFocusArea();
  }

  setAllCoords(coordsList) {
    this.nodes.forEach(e => {
      e.x = coordsList[e.index].x;
      e.y = coordsList[e.index].y;
    });
    this.edges.forEach(d => {
      d.sx = coordsList[d.source].x;
      d.sy = coordsList[d.source].y;
      d.tx = coordsList[d.target].x;
      d.ty = coordsList[d.target].y;
    });
    this.setBoundary();
  }

  setCoords(n, x, y) {
    this.nodes[n].x = x;
    this.nodes[n].y = y;
    this.adjacency[n].forEach(e => {
      const nbr = e[0];
      const edge = e[1];
      if (n < nbr) {
        this.edges[edge].sx = x;
        this.edges[edge].sy = y;
      } else {
        this.edges[edge].tx = x;
        this.edges[edge].ty = y;
      }
    });
    this.setBoundary();
  }

  nodesToRender() {
    return this.nodes.filter(
      e => e.y > this.focusArea.top && e.x > this.focusArea.left
        && e.y < this.focusArea.bottom && e.x < this.focusArea.right
    );
  }

  edgesToRender() {
    if (!this.edgeVisible) return [];
    return this.edges.filter(
      e => e.weight >= this.networkThreshold
        && this.focusArea.top < Math.max(e.sy, e.ty)
        && this.focusArea.left < Math.max(e.sx, e.tx)
        && this.focusArea.bottom > Math.min(e.sy, e.ty)
        && this.focusArea.right > Math.min(e.sx, e.tx)
    );
  }

  snapshot() {
    return {
      nodeColor: this.nodeColor,
      nodeSize: this.nodeSize
    };
  }

  showTransform() {
    d3.select('#debug-transform')
      .text(JSON.stringify(this.transform));
  }

  showBoundary() {
    d3.select('#debug-boundary')
      .text(JSON.stringify(this.boundary));
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
