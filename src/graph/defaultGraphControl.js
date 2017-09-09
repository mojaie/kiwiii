
const defaultNodeColor = {
  id: 'color',
  field: null,
  scale: {
    domain: [0, 1],
    range: ['#7fffd4', '#7fffd4'],
    scale: 'linear',
    unknown: '#7fffd4'
  }
};

const defaultNodeSize = {
  id: 'size',
  field: null,
  scale: {
    domain: [0, 1],
    range: [40, 40],
    scale: 'linear',
    unknown: 40
  }
};

const defaultNodeLabel = {
  id: 'label',
  text: null,
  size: 12,
  visible: false,
  field: null,
  scale: {
    domain: [0, 1],
    range: ['#000000', '#000000'],
    scale: 'linear',
    unknown: '#000000'
  }
};

const defaultNodeContent = {
  structure: {visible: false}
};

const defaultEdge = {
  id: 'edge',
  visible: true,
  label: {
    size: 10,
    visible: false
  },
  scale: {
    domain: [0, 1],
    range: [5, 5],
    scale: 'linear',
    unknown: 5
  }
};


export default {
  defaultNodeColor, defaultNodeSize, defaultNodeLabel, defaultNodeContent,
  defaultEdge
};
