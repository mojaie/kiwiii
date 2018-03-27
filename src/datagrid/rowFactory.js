
/** @module datagrid/rowFactory */

import {default as misc} from '../common/misc.js';
import {default as img} from '../common/image.js';


function d3Format(selection, record, field) {
  selection.text(misc.formatNum(record[field.key], field.d3_format));
}


function text(selection, record, field) {
  selection.text(record[field.key]);
}


function html(selection, record, field) {
  selection.html(record[field.key]);
}


function compound_id(selection, record, field) {
  selection.append('a')
      .attr('href',`profile.html?compound=${record[field.key]}`)
      .attr('target', '_blank')
      .text(record[field.key]);
}


function image(selection, record, field) {
  selection.append('img')
      .attr('width', 180)
      .attr('height', 180)
      .attr('src', record[field.key]);
}

function checkbox(selection, record, field) {
  selection.append('input')
      .attr('type', 'checkbox')
      .property('checked', record[field.key])
      .property('disabled', field.disabled ? record[field.disabled] : false)
      .on('click', function () {
        record[field.key] = this.checked;
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
  assay_id: text,
  list: text,
  plot: img.plotCell,
  image: image,
  checkbox: checkbox,
  control: call,
  svg: html,
  html: html
};


function rowFactory(fields) {
  return (selection, record) => {
    fields.forEach(field => {
      const cell = selection.append('div')
        .classed('dg-cell', true)
        .classed('align-middle', true)
        .classed('text-truncate', true)
        .style('display', 'inline-block')
        .style('width', `${field.width}px`);
      if (!record.hasOwnProperty(field.key)) return;
      cell.call(cellFunc[field.format], record, field);
    });
  };
}


export default {
  d3Format, text, html, compound_id, image, checkbox, call, rowFactory
};
