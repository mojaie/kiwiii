
/** @module component/shape */

import {default as misc} from '../common/misc.js';


function monocolorBar(selection, colors, text) {
  const group = selection.append('g');
  group.append('rect')
      .attr('x', 0).attr('y', 0)
      .attr('width', 100).attr('height', 10)
      .attr('fill', colors[0]);
  group.append('text')
      .attr('text-anchor', 'middle')
      .attr('x', 50).attr('y', 10)
      .attr('font-size', 12)
      .text(text);
}

function bicolorBar(selection, colors, text) {
  const id = misc.uuidv4().slice(0, 8);  // Aboid inline SVG ID dupulicate
  selection.call(monocolorBar, colors, text);
  const grad = selection.append('defs')
    .append('linearGradient')
      .attr('id', id);
  grad.append('stop')
      .attr('offset', 0).attr('stop-color', colors[0]);
  grad.append('stop')
      .attr('offset', 1).attr('stop-color', colors[1]);
  selection.select('rect')
      .attr('fill', `url(#${id})`);
}

function tricolorBar(selection, colors, text) {
  const id = misc.uuidv4().slice(0, 8);  // Aboid inline SVG ID dupulicate
  selection.call(monocolorBar, colors, text);
  const grad = selection.append('defs')
    .append('linearGradient')
      .attr('id', id);
  grad.append('stop')
    .attr('offset', 0).attr('stop-color', colors[0]);
  grad.append('stop')
    .attr('offset', 0.5).attr('stop-color', colors[1]);
  grad.append('stop')
    .attr('offset', 1).attr('stop-color', colors[2]);
  selection.select('rect')
      .attr('fill', `url(#${id})`);
}

function categoricalBar(selection, colors, text) {
  const sw = 100 / colors.length;
  const group = selection.append('g');
  colors.forEach((e, i) => {
    group.append('rect')
        .attr('x', sw * i).attr('y', 0)
        .attr('width', sw).attr('height', 10)
        .attr('fill', colors[i]);
  });
  group.append('text')
      .attr('text-anchor', 'middle')
      .attr('x', 50).attr('y', 10)
      .attr('font-size', 12)
      .text(text);
}

function setSize(selection, width, height) {
  selection.attr('width', width).attr('height', height);
}


const colorBar = {
  'monocolor': monocolorBar,
  'bicolor': bicolorBar,
  'tricolor': tricolorBar,
  'categorical': categoricalBar,
  'custom': monocolorBar
};


export default {
  colorBar, setSize
};
