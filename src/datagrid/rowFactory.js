
/** @module datagrid/rowFactory */

import {default as misc} from '../common/misc.js';
import {default as img} from '../common/image.js';


function d3Format(selection, value, field) {
  selection.text(misc.formatNum(value, field.d3_format));
}


function text(selection, value) {
  selection.text(value);
}


function html(selection, value) {
  selection.html(value);
}


function compound_id(selection, value) {
  selection.append('a')
      .attr('href',`profile.html?compound=${value}`)
      .attr('target', '_blank')
      .text(value);
}


function image(selection, value) {
  selection.append('img')
      .attr('width', 180)
      .attr('height', 180)
      .attr('src', value);
}

function checkbox(selection, value, disabled) {
  selection.append('input')
      .attr('type', 'checkbox')
      .property('checked', value)
      .property('disabled', disabled)
      .on('click', function () {
        if (state.assays.includes(record.key)) {
          record.check = this.checked;
        }
      });

}

function call(selection, value) {
  selection.call(value);
}


const cellFunc = {
  numeric: text,
  text: text,
  raw: text,
  d3_format: d3Format,
  compound_id: compound_id,
  plot: img.plotCell,
  image: image,
  control: call,
  svg: html,
  html: html
};


function rowFactory(fields) {
  return (selection, record) => {
    fields.forEach(field => {
      const value = record[field.key];
      const cell = selection.append('div')
        .classed('dg-cell', true)
        .classed('align-middle', true)
        .style('display', 'inline-block')
        .style('width', `${field.width}px`);
      if (value === undefined) return;
      cell.call(cellFunc[field.format], value, field);
    });
  };
}


export default {
  d3Format, text, html, compound_id, image, checkbox, call, rowFactory
};
