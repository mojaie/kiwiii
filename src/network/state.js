
/** @module network/state */

import d3 from 'd3';

import Collection from '../common/collection.js';
import {default as idb} from '../common/idb.js';


export default class NetworkState {
  constructor(view, nodes, edges) {
    /* Settings */

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

    this.fieldWidth = 1200;
    this.fieldHeight = 1200;


    /* Attributes */

    this.viewID = view.viewID;
    this.name = view.name;

    this.nodes = new Collection(nodes);
    this.edges = new Collection(edges);


    /* Appearance */

    this.nodeColor = {
      field: null, scale: 'linear', domain: [0, 1],
      range: ['#7fffd4', '#7fffd4'], unknown: '#7fffd4'
    };
    if (view.hasOwnProperty('nodeColor')) {
      this.nodeColor.field = view.nodeColor.field;
      this.nodeColor.scale = view.nodeColor.scale;
      this.nodeColor.domain = view.nodeColor.domain;
      this.nodeColor.range = view.nodeColor.range;
      this.nodeColor.unknown = view.nodeColor.unknown;
    }

    this.nodeSize = {
      field: null, scale: 'linear', domain: [1, 1],
      range: [40, 40], unknown: 40
    };
    if (view.hasOwnProperty('nodeSize')) {
      this.nodeSize.field = view.nodeSize.field;
      this.nodeSize.scale = view.nodeSize.scale;
      this.nodeSize.domain = view.nodeSize.domain;
      this.nodeSize.range = view.nodeSize.range;
      this.nodeSize.unknown = view.nodeSize.unknown;
    }

    this.nodeLabel = {
      text: null, size: 12, visible: false
    };
    if (view.hasOwnProperty('nodeLabel')) {
      this.nodeLabel.text = view.nodeLabel.text;
      this.nodeLabel.size = view.nodeLabel.size;
      this.nodeLabel.visible = view.nodeLabel.visible;
    }

    this.nodeLabelColor = {
      field: null, scale: 'linear', domain: [1, 1],
      range: ['#cccccc', '#cccccc'], unknown: '#cccccc'
    };
    if (view.hasOwnProperty('nodeLabelColor')) {
      this.nodeLabelColor.field = view.nodeLabelColor.field;
      this.nodeLabelColor.scale = view.nodeLabelColor.scale;
      this.nodeLabelColor.domain = view.nodeLabelColor.domain;
      this.nodeLabelColor.range = view.nodeLabelColor.range;
      this.nodeLabelColor.unknown = view.nodeLabelColor.unknown;
    }

    this.edgeWidth = {
      scale: 'linear', domain: [0.5, 1],
      range: [10, 10], unknown: 1
    };
    if (view.hasOwnProperty('edgeWidth')) {
      this.edgeWidth.scale = view.edgeWidth.scale;
      this.edgeWidth.domain = view.edgeWidth.domain;
      this.edgeWidth.range = view.edgeWidth.range;
      this.edgeWidth.unknown = view.edgeWidth.unknown;
    }

    this.edgeLabel = {
      size: 12, visible: false
    };
    if (view.hasOwnProperty('edgeLabel')) {
      this.edgeLabel.size = view.edgeLabel.size;
      this.edgeLabel.visible = view.edgeLabel.visible;
    }

    // Edge threshold
    this.networkThresholdCutoff = view.networkThresholdCutoff;
    this.networkThreshold = view.networkThreshold || view.networkThresholdCutoff;

    // Transform
    this.transform = view.fieldTransform || {x: 0, y: 0, k: 1};

    // Force
    this.forcePreset = view.forcePreset || 'aggregate';

    /* Event listener */

    this.zoomListener = null;
    this.dragListener = null;

    // Update notifier
    this.updateComponentNotifier = null;
    this.updateNodeNotifier = null;
    this.updateEdgeNotifier = null;
    this.updateNodeAttrNotifier = null;
    this.updateEdgeAttrNotifier = null;

    this.snapShotNotifier = null;

    this.fitNotifier = null;

    // Force control
    this.setForceNotifier = null;
    this.stickNotifier = null;
    this.relaxNotifier = null;
    this.restartNotifier = null;
    this.tickCallback = () => {};


    /* Working memory */

    // Working copies
    // D3.force does some destructive operations
    this.ns = JSON.parse(JSON.stringify(this.nodes.records()));
    this.es = JSON.parse(JSON.stringify(this.edges.records()));

    // Adjacency
    // Assuming that the network is undirected graph and
    // source index < target index
    this.ns.forEach(n => {
      n.adjacency = [];
    });
    this.es.forEach((e, i) => {
      e.num = i;  // e.index will be overwritten by d3-force
      this.ns[e.source].adjacency.push([e.target, i]);
      this.ns[e.target].adjacency.push([e.source, i]);
    });

    // Drawing
    this.forceField = {
      top: 0, right: this.fieldWidth, bottom: this.fieldHeight, left: 0};
    this.viewBox = {
      top: 0, right: this.fieldWidth, bottom: this.fieldHeight, left: 0};
    this.focusArea = {};
    this.boundary = {};
    this.prevTransform = {
      x: this.transform.x, y: this.transform.y, k: this.transform.k
    };

    if (view.coords) {
      this.simulationOnLoad = false;
      // Set default state
      this.setAllCoords(view.coords);
      this.setFocusArea();
      this.setBoundary();
    } else {
      this.simulationOnLoad = true;
    }
  }

  setBoundary() {
    const xs = this.ns.map(e => e.x);
    const ys = this.ns.map(e => e.y);
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
    this.ns.forEach(n => {
      n.x = coordsList[n.index].x;
      n.y = coordsList[n.index].y;
      // this.es can be changed by forceSimulation so use adjacency
      n.adjacency.forEach(e => {
        const nbr = e[0];
        const edge = e[1];
        if (n.index < nbr) {
          this.es[edge].sx = coordsList[n.index].x;
          this.es[edge].sy = coordsList[n.index].y;
        } else {
          this.es[edge].tx = coordsList[n.index].x;
          this.es[edge].ty = coordsList[n.index].y;
        }
      });
    });
    this.setBoundary();
  }

  setCoords(n, x, y) {
    this.ns[n].x = x;
    this.ns[n].y = y;
    this.ns[n].adjacency.forEach(e => {
      const nbr = e[0];
      const edge = e[1];
      if (n < nbr) {
        this.es[edge].sx = x;
        this.es[edge].sy = y;
      } else {
        this.es[edge].tx = x;
        this.es[edge].ty = y;
      }
    });
    this.setBoundary();
  }

  nodesToRender() {
    return this.ns.filter(
      e => e.y > this.focusArea.top && e.x > this.focusArea.left
        && e.y < this.focusArea.bottom && e.x < this.focusArea.right
    );
  }

  edgesToRender() {
    return this.es.filter(
      e => e.weight >= this.networkThreshold
        && this.focusArea.top < Math.max(e.sy, e.ty)
        && this.focusArea.left < Math.max(e.sx, e.tx)
        && this.focusArea.bottom > Math.min(e.sy, e.ty)
        && this.focusArea.right > Math.min(e.sx, e.tx)
    );
  }

  save() {
    return Promise.all([
      idb.updateCollection(this.nodes.collectionID, this.nodes.export()),
      idb.updateCollection(this.edges.collectionID, this.edges.export()),
      idb.updateView(this.viewID, this.export())
    ]);
  }

  export() {
    // TODO: need deep copy?
    return JSON.parse(JSON.stringify({
      $schema: "https://mojaie.github.io/kiwiii/specs/network_v1.0.json",
      viewID: this.viewID,
      name: this.name,
      viewType: "network",
      nodes: this.nodes.collectionID,
      edges: this.edges.collectionID,
      nodeColor: this.nodeColor,
      nodeSize: this.nodeSize,
      nodeLabel: this.nodeLabel,
      nodeLabelColor: this.nodeLabelColor,
      edgeWidth: this.edgeWidth,
      edgeLabel: this.edgeLabel,
      networkThreshold: this.networkThreshold,
      networkThresholdCutoff: this.networkThresholdCutoff,
      fieldTransform: this.transform,
      coords: this.ns.map(e => ({x: e.x, y: e.y}))
    }));
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
