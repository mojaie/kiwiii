
/** @module network/state */

import d3 from 'd3';

import {default as legacy} from '../common/legacySchema.js';
import {default as misc} from '../common/misc.js';


export default class NetworkState {
  constructor(data, width, height) {
    // View modes

    // Focused view mode (num of nodes displayed are less than the thld)
    // Show node contents
    // Disable smooth transition
    this.focusedViewThreshold = 100;
    this.enableFocusedView = true;
    this.focusedView = false;
    // Overlook view mode (num of nodes displayed are less than the thld)
    // Hide edges
    this.overlookViewThreshold = 500;
    this.enableOverlookView = true;
    this.overlookView = false;

    // Import from legacy format data
    this.data = legacy.convertNetwork(data);

    this.nodes = JSON.parse(JSON.stringify(this.data.nodes.records));  // Working copy
    this.edges = JSON.parse(JSON.stringify(this.data.edges.records));  // Working copy

    // Adjacency
    // Assuming that the network is undirected graph and
    // source index < target index
    this.nodes.forEach(n => {
      n.adjacency = [];
    });
    this.edges.forEach((e, i) => {
      e.num = i;  // e.index will be overwritten by d3-force
      this.nodes[e.source].adjacency.push([e.target, i]);
      this.nodes[e.target].adjacency.push([e.source, i]);
    });

    // Snapshot
    const snp = this.data.edges.snapshot || {
      nodeColor: {}, nodeSize: {}, nodeLabel: {}, nodeLabelColor: {},
      edgeWidth: {}, edgeLabel: {}
    };

    // Node attributes
    // this.nodeContentVisible = snp.nodeContentVisible || true;

    // nodeColor
    this.nodeColor = {};
    this.nodeColor.field = snp.nodeColor.field || null;
    this.nodeColor.scale = snp.nodeColor.scale || 'linear';
    this.nodeColor.domain = snp.nodeColor.domain || [0, 1];
    this.nodeColor.range = snp.nodeColor.range || ['#7fffd4', '#7fffd4'];
    this.nodeColor.unknown = snp.nodeColor.unknown || ['#7fffd4'];

    // nodeSize
    this.nodeSize = {};
    this.nodeSize.field = snp.nodeSize.field || null;
    this.nodeSize.scale = snp.nodeSize.scale || 'linear';
    this.nodeSize.domain = snp.nodeSize.domain || [1, 1];
    this.nodeSize.range = snp.nodeSize.range || [40, 40];
    this.nodeSize.unknown = snp.nodeSize.unknown || 40;

    // nodeLabel
    this.nodeLabel = {};
    this.nodeLabel.text = snp.nodeLabel.text || null;
    this.nodeLabel.size = snp.nodeLabel.size || 12;
    this.nodeLabel.visible = snp.nodeLabel.visible || false;

    // nodeLabelColor
    this.nodeLabelColor = {};
    this.nodeLabelColor.field = snp.nodeLabelColor.field || null;
    this.nodeLabelColor.scale = snp.nodeLabelColor.scale || 'linear';
    this.nodeLabelColor.domain = snp.nodeLabelColor.domain || [1, 1];
    this.nodeLabelColor.range = snp.nodeLabelColor.range || ['#7fffd4', '#7fffd4'];
    this.nodeLabelColor.unknown = snp.nodeLabelColor.unknown || ['#333333'];

    // Edge attributes
    // this.edgeVisible = snp.edgeVisible || true;
    this.networkThresholdCutoff = data.edges.query.params.threshold;
    this.networkThreshold = snp.networkThreshold || data.edges.query.params.threshold;

    // edgeWidth
    this.edgeWidth = {};
    this.edgeWidth.scale = snp.edgeWidth.scale || 'linear';
    this.edgeWidth.domain = snp.edgeWidth.domain || [0.5, 1];
    this.edgeWidth.range = snp.edgeWidth.range || [1, 5];
    this.edgeWidth.unknown = snp.edgeWidth.unknown || 1;

    // edgeLabel
    this.edgeLabel = {};
    this.edgeLabel.size = snp.edgeLabel.size || 12;
    this.edgeLabel.visible = snp.edgeLabel.visible || false;

    // Transform
    this.transform = snp.fieldTransform || {x: 0, y: 0, k: 1};

    // Event listener
    this.zoomListener = null;
    this.dragListener = null;

    // Update notifier
    this.updateComponentNotifier = null;
    this.updateNodeNotifier = null;
    this.updateEdgeNotifier = null;
    this.updateNodeAttrNotifier = null;
    this.updateEdgeAttrNotifier = null;
    // Snapshot
    this.snapShotNotifier = null;
    // Zoom control
    this.fitNotifier = null;
    // Force control
    this.setForceNotifier = null;
    this.stickNotifier = null;
    this.relaxNotifier = null;
    this.restartNotifier = null;
    this.tickCallback = () => {};

    // Working memory
    this.forceField = {top: 0, right: width, bottom: height, left: 0};
    this.viewBox = {top: 0, right: width, bottom: height, left: 0};
    this.focusArea = {};
    this.boundary = {};
    this.prevTransform = {
      x: this.transform.x, y: this.transform.y, k: this.transform.k
    };

    if (snp.coords) {
      this.simulationOnLoad = false;
      // Set default state
      this.setAllCoords(snp.coords);
      this.setFocusArea();
      this.setBoundary();
    } else {
      this.simulationOnLoad = true;
    }
  }

  setBoundary() {
    const xs = this.nodes.map(e => e.x);
    const ys = this.nodes.map(e => e.y);
    this.boundary.top = Math.min.apply(null, ys);
    this.boundary.left = Math.min.apply(null, xs);
    this.boundary.bottom = Math.max.apply(null, ys);
    this.boundary.right = Math.max.apply(null, xs);
    // this.showBoundary(); // debug
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

  setAllCoords(coordsList) {
    this.nodes.forEach(n => {
      n.x = coordsList[n.index].x;
      n.y = coordsList[n.index].y;
      // this.edges can be changed by forceSimulation so use adjacency
      n.adjacency.forEach(e => {
        const nbr = e[0];
        const edge = e[1];
        if (n.index < nbr) {
          this.edges[edge].sx = coordsList[n.index].x;
          this.edges[edge].sy = coordsList[n.index].y;
        } else {
          this.edges[edge].tx = coordsList[n.index].x;
          this.edges[edge].ty = coordsList[n.index].y;
        }
      });
    });
    this.setBoundary();
  }

  setCoords(n, x, y) {
    this.nodes[n].x = x;
    this.nodes[n].y = y;
    this.nodes[n].adjacency.forEach(e => {
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
      nodeSize: this.nodeSize,
      nodeLabel: this.nodeLabel,
      nodeLabelColor: this.nodeLabelColor,
      edgeWidth: this.edgeWidth,
      edgeLabel: this.edgeLabel,
      networkThreshold: this.networkThreshold,
      networkThresholdCutoff: this.networkThresholdCutoff,
      fieldTransform: this.transform,
      coords: this.nodes.map(e => ({x: e.x, y: e.y}))
    };
  }

  export() {
    this.data.edges.id = misc.uuidv4();
    this.data.edges.snapshot = this.snapshot();
    return JSON.parse(JSON.stringify(this.data));
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
