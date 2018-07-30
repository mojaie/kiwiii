
/** @module network/state */

import Collection from '../common/collection.js';
import TransformState from  '../common/transform.js';
import {default as idb} from '../common/idb.js';


export default class NetworkState extends TransformState {
  constructor(view, nodes, edges) {
    super(1200, 1200, view.fieldTransform);

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

    /* Attributes */

    this.viewID = view.viewID || null;
    this.storeID = view.storeID || null;
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
      field: null, size: 12, visible: false
    };
    if (view.hasOwnProperty('nodeLabel')) {
      this.nodeLabel.field = view.nodeLabel.field;
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

    this.edgeColor = {
      field: null, scale: 'linear', domain: [0, 1],
      range: ['#999999', '#999999'], unknown: '#999999'
    };
    if (view.hasOwnProperty('edgeColor')) {
      this.edgeColor.field = view.edgeColor.field;
      this.edgeColor.scale = view.edgeColor.scale;
      this.edgeColor.domain = view.edgeColor.domain;
      this.edgeColor.range = view.edgeColor.range;
      this.edgeColor.unknown = view.edgeColor.unknown;
    }

    this.edgeWidth = {
      field: 'weight', scale: 'linear', domain: [0.5, 1],
      range: [10, 10], unknown: 1
    };
    if (view.hasOwnProperty('edgeWidth')) {
      this.edgeWidth.field = view.edgeWidth.field;
      this.edgeWidth.scale = view.edgeWidth.scale;
      this.edgeWidth.domain = view.edgeWidth.domain;
      this.edgeWidth.range = view.edgeWidth.range;
      this.edgeWidth.unknown = view.edgeWidth.unknown;
    }

    this.edgeLabel = {
      field: 'weight', size: 12, visible: false
    };
    if (view.hasOwnProperty('edgeLabel')) {
      this.edgeLabel.field = view.edgeLabel.field;
      this.edgeLabel.size = view.edgeLabel.size;
      this.edgeLabel.visible = view.edgeLabel.visible;
    }

    this.edgeLabelColor = {
      field: null, scale: 'linear', domain: [1, 1],
      range: ['#cccccc', '#cccccc'], unknown: '#cccccc'
    };
    if (view.hasOwnProperty('edgeLabelColor')) {
      this.edgeLabelColor.field = view.edgeLabelColor.field;
      this.edgeLabelColor.scale = view.edgeLabelColor.scale;
      this.edgeLabelColor.domain = view.edgeLabelColor.domain;
      this.edgeLabelColor.range = view.edgeLabelColor.range;
      this.edgeLabelColor.unknown = view.edgeLabelColor.unknown;
    }

    // Connection threshold
    this.connThldField = view.connThldField || 'weight';
    this.minConnThld = view.minConnThld;
    this.currentConnThld = view.currentConnThld || view.minConnThld;

    // Force
    this.simulationOnLoad = true;
    this.forcePreset = view.forcePreset || 'aggregate';

    // Event listeners
    this.zoomListener = null;
    this.dragListener = null;

    // Event notifiers
    this.updateAllNotifier = null;
    this.updateComponentNotifier = null;
    this.updateNodeNotifier = null;
    this.updateEdgeNotifier = null;
    this.updateNodeAttrNotifier = null;
    this.updateEdgeAttrNotifier = null;
    this.updateControlBoxNotifier = () => {};
    this.fitNotifier = () => {};
    this.setForceNotifier = () => {};
    this.stickNotifier = () => {};
    this.relaxNotifier = () => {};
    this.restartNotifier = () => {};
    this.tickCallback = () => {};

    // Working copies
    // D3.force does some destructive operations
    this.ns = null;
    this.es = null;
    this.coords = view.coords;

    // Init
    this.updateWorkingCopy();
  }

  updateWorkingCopy() {
    this.ns = JSON.parse(JSON.stringify(this.nodes.records()));
    this.ns.forEach(n => { n.adjacency = []; });
    this.es = JSON.parse(JSON.stringify(this.edges.records()));
    this.es.forEach((e, i) => {
      e.num = i;  // e.index will be overwritten by d3-force
      this.ns[e.source].adjacency.push([e.target, i]);
      this.ns[e.target].adjacency.push([e.source, i]);
    });
    if (this.coords) {
      this.setAllCoords(this.coords);
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
    this.simulationOnLoad = false;
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

  currentEdges() {
    return this.es.filter(e => e[this.connThldField] >= this.currentConnThld);
  }

  edgesToRender() {
    return this.currentEdges().filter(
      e => this.focusArea.top < Math.max(e.sy, e.ty)
        && this.focusArea.left < Math.max(e.sx, e.tx)
        && this.focusArea.bottom > Math.min(e.sy, e.ty)
        && this.focusArea.right > Math.min(e.sx, e.tx)
    );
  }

  save() {
    return idb.updateItem(this.storeID, item => {
      const ni = item.dataset
        .findIndex(e => e.collectionID === this.nodes.collectionID);
      item.dataset[ni] = this.nodes.export();
      const ei = item.dataset
        .findIndex(e => e.collectionID === this.edges.collectionID);
      item.dataset[ei] = this.edges.export();
      const vi = item.views
        .findIndex(e => e.viewID === this.viewID);
      item.views[vi] = this.export();
    });
  }

  export() {
    this.coords = this.ns.map(e => ({x: e.x, y: e.y}));
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
      edgeColor: this.edgeColor,
      edgeWidth: this.edgeWidth,
      edgeLabel: this.edgeLabel,
      connThldField: this.connThldField,
      currentConnThld: this.currentConnThld,
      minConnThld: this.minConnThld,
      fieldTransform: this.transform,
      coords: this.coords
    }));
  }
}
