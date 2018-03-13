
/** @module datagrid/rowFactory */

import {default as misc} from '../common/misc.js';
import {default as img} from '../common/image.js';


function rowFactory(fields) {
  return (selection, record) => {
    fields.forEach(field => {
      const value = record[field.key];
      const cell = selection.append('div')
        .classed('dg-cell', true)
        .classed('align-middle', true)
        .style('display', 'inline-block')
        .style('width', `${field.width}px`)
        .style('word-wrap', 'break-word');
      if (value === undefined) return;
      if (field.format === 'd3_format') {
        cell.text(misc.formatNum(value, field.d3_format));
      } else if (['numeric', 'text', 'raw'].includes(field.format)) {
        cell.text(value);
      } else if (field.format === 'compound_id') {
        cell.append('a')
            .attr('href',`profile.html?compound=${value}`)
            .attr('target', '_blank')
            .text(value);
      } else if (field.format === 'plot') {
        cell.call(img.plotCell, value);  // TODO:
      } else if (field.format === 'image') {
        cell.append('img')
            .attr('width', 180)
            .attr('height', 180)
            .attr('src', value);
      } else if (field.format === 'control') {
        cell.call(value);
      } else {
        cell.html(value);
      }
    });
  };
}


export default {
  rowFactory
};
