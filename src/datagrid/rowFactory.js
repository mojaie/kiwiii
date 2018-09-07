
/** @module datagrid/rowFactory */

import {default as misc} from '../common/misc.js';
import {default as idb} from '../common/idb.js';
import {default as img} from '../common/image.js';


function d3Format(selection, record, field) {
  selection.text(misc.formatNum(record[field.key], field.d3_format));
}


function text(selection, record, field) {
  selection.text(record[field.key]);
}


function date(selection, record, field) {
  // TODO; formatter
  selection.text(record[field.key]);
}


function html(selection, record, field) {
  // TODO: Check vulnerabilities
  selection.html(record[field.key]);
}


function compoundID(selection, record, field) {
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


function textField(selection, record, field) {
  selection.append('input')
      .attr('type', 'text')
      .style('width', '90%')
      .property('value', record[field.key])
      .on('change', function () {
        record[field.key] = this.value;
      });
}


function call(selection, value) {
  selection.call(value);
}


function asyncImage(selection, record, field) {
  const req = `${field.request}${record[field.key]}`;
  idb.getAsset(req)
    .then(res => {
      if (res !== undefined) return res;
      return fetch(req, { credentials: 'include' })
        .then(res => res.blob())
        .then(res => idb.putAsset(req, res).then(() => res));
    })
    .then(obj => {
      selection.append('img')
          .attr('width', 180)
          .attr('height', 180)
          .attr('src', URL.createObjectURL(obj));
    });
}


function asyncHtml(selection, record, field) {
  const req = `${field.request}${record[field.key]}`;
  idb.getAsset(req)
    .then(res => {
      if (res !== undefined) return res;
      return fetch(req, { credentials: 'include' })
        .then(res => res.text())
        .then(res => idb.putAsset(req, res).then(() => res));
    })
    .then(txt => {
      selection.html(txt);
    });
}


const cellFunc = {
  numeric: text,
  text: text,
  date: date,
  raw: text,
  d3_format: d3Format,
  compound_id: compoundID,
  assay_id: text,
  list: text,
  plot: img.plotCell,
  image: image,
  checkbox: checkbox,
  text_field: textField,
  control: call,
  svg: html,
  html: html,
  async_image: asyncImage,
  async_html: asyncHtml
};


function rowCell(selection) {
  selection.classed('dg-cell', true)
    .classed('align-middle', true)
    .classed('text-truncate', true)
    .style('display', 'inline-block');
}


function rowFactory(fields) {
  return (selection, record) => {
    fields.forEach(field => {
      const cell = selection.append('div')
          .call(rowCell)
          .style('width', `${field.width}%`);
      if (!record.hasOwnProperty(field.key)) return;
      cell.call(cellFunc[field.format], record, field);
    });
  };
}


export default {
  d3Format, text, html, compoundID, image, checkbox, textField, call,
  asyncImage, asyncHtml,
  rowCell, rowFactory
};
