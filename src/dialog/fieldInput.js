
/** @module dialog/fieldInput */

import d3 from 'd3';

import {default as misc} from '../common/misc.js';

import {default as button} from '../component/button.js';
import {default as box} from '../component/formBox.js';
import {default as lbox} from '../component/formListBox.js';
import {default as modal} from '../component/modal.js';


const id = 'fieldinput-dialog';
const title = 'Add custom field';


function menuLink(selection) {
  selection.call(button.dropdownMenuModal, title, id, 'menu-addcheckbox');
}


function body(selection) {
  const dialog = selection.call(modal.submitDialog, id, title);
  const body = dialog.select('.modal-body');
  body.append('div')
      .classed('key', true)
      .call(box.textBox, 'Field key');
  const options = [
    {key: 'checkbox', name: 'Checkbox', format: 'checkbox'},
    {key: 'text_field', name: 'Text field', format: 'text_field'},
    {key: 'template', name: 'Template', format: 'html'}
  ];
  body.append('div')
      .classed('type', true)
      .call(lbox.selectBox, 'Type')
      .call(lbox.updateSelectBoxOptions, options);
  // Template builder
  const coid = misc.uuidv4().slice(0, 8);
  const tmpBox = body.append('div')
      .classed('mb-3', true);
  tmpBox.append('p')
    .append('button')
      .classed('btn', true)
      .classed('btn-sm', true)
      .classed('btn-outline-primary', true)
      .classed('dropdown-toggle', true)
      .attr('data-toggle', 'collapse')
      .attr('data-target', `#${coid}-collapse`)
      .attr('aria-expanded', 'false')
      .attr('aria-controls', `${coid}-collapse`)
      .text('Template builder');
  const collapse = tmpBox.append('div')
      .classed('collapse', true)
      .attr('id', `${coid}-collapse`)
    .append('div')
      .classed('card', true)
      .classed('card-body', true);
  collapse.append('div')
      .classed('tmpfield', true)
      .classed('mb-1', true)
      .call(lbox.selectBox, 'Field');
  collapse.append('div')
      .classed('notation', true)
      .call(box.readonlyBox, 'Notation');
  collapse.append('div')
      .classed('contents', true)
      .call(box.textareaBox, 'Contents', 5);
}


function updateBody(selection, fields) {
  selection.select('.key')
      .call(box.formValue, '')
      .on('input', function () {
        selection.select('.submit')
            .property('disabled', !valid(selection, fields));
      });
  selection.select('.type')
      .call(box.updateFormValue, 'checkbox')
      .on('change',  function () {
        const type = box.formValue(selection.select('.type'));
        const custom = type === 'template';
        selection.selectAll('.tmpfield, .notation, .contents')
            .selectAll('select, input, textarea')
            .property('disabled', !custom)
            .style('opacity',  custom ? null : 0.3);
        selection.select('.submit')
            .property('disabled', !valid(selection, fields));
      })
      .dispatch('change');
  const tmpFields = fields.filter(e => misc.sortType(e.format) !== 'none');
  selection.select('.tmpfield')
      .call(lbox.updateSelectBoxOptions, tmpFields)
      .call(box.updateFormValue, 'index')
      .on('change', function () {
        const field = d3.select(this).select('select').property('value');
        const frcd = d3.select(this).selectAll('option').data()
          .find(e => e.key === field);
        const notation = frcd.d3_format ? `:${frcd.d3_format}` : '';
        selection.select('.notation').select('input')
              .property('value', `{${frcd.key}${notation}}`);
      })
      .dispatch('change');
  selection.select('.contents')
      .call(box.updateFormValue, '')
      .on('input', function () {
        selection.select('.submit')
            .property('disabled', !valid(selection, fields));
      });
}


const formatterGen = {
  checkbox: () => (() => false),
  text_field: () => (() => ''),
  template: tmp => {
    const parseInner = (rcd, n) => {
      const arr = n.slice(1, -1).split(':');
      if (arr.length === 1) {
        return rcd[arr[0]];
      } else {
        return d3.format(arr[1])(rcd[arr[0]]);
      }
    };
    const inner = tmp.match(/\{.+?\}/g) || [];
    const outer = tmp.split(/\{.+?\}/g);
    return rcd => {
      const ic = inner.slice();
      const oc = outer.slice();
      const txtarr = [oc.shift()];
      while (ic.length) {
        txtarr.push(parseInner(rcd, ic.shift()));
        txtarr.push(oc.shift());
      }
      return txtarr.join('').replace(/(?:\r\n|\r|\n)/g, '<br />');
    };
  }
};


function valid(selection, fields) {
  const key = box.textBoxValue(selection.select('.key'));
  const keyValid = key !== '' && !fields.map(e => e.key).includes(key);
  selection.select('.key').select('input')
    .style('background-color', keyValid ? '#ffffff' : '#ffcccc');
  const tmpFields = fields.filter(e => misc.sortType(e.format) !== 'none');
  const cont = box.textareaBoxValue(selection.select('.contents'));
  const contEmpty = cont === '';
  const contOuter = cont.split(/\{.+?\}/g);
  const contInner = (cont.match(/\{.+?\}/g) || []).map(e => e.slice(1, -1));
  const contInvalidKey = contInner
    .some(n => {
      const ns = n.split(':');
      if (!tmpFields.map(e => e.key).includes(ns[0])) return true;
      if (ns.length > 2) return true;
      if (ns.length === 1) return false;
      try {
        d3.format(ns[1]);
      } catch(err) {
        return true;
      }
      return false;
    });
  const contInvalidFormat = contOuter.concat(contInner)
    .some(n => n.includes('{') || n.includes('}'));
  const contValid = !(contEmpty || contInvalidKey || contInvalidFormat);
  selection.select('.contents').select('textarea')
    .style('background-color', contValid ? '#ffffff' : '#ffcccc');
  if (!keyValid) return false;
  if (box.formValue(selection.select('.type')) !== 'template') {
    return true;
  }
  return contValid;
}


function value(selection) {
  const key = box.textBoxValue(selection.select('.key'));
  const type = box.formValue(selection.select('.type'));
  const format = selection.select('.type').selectAll('option').data()
    .find(e => e.key === type).format;
  const cont = box.textareaBoxValue(selection.select('.contents'));
  return {
    field: {key: key, name: key, format: format},
    converter: formatterGen[type](cont)
  };
}


export default {
  menuLink, body, updateBody, value
};
