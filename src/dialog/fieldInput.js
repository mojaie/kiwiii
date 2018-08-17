
/** @module dialog/fieldInput */

import d3 from 'd3';

import {default as misc} from '../common/misc.js';
import {default as scale} from '../common/scale.js';

import {default as badge} from '../component/badge.js';
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
  const mbody = selection.call(modal.submitDialog, id, title)
      .select('.modal-body');

  // Custom field name
  mbody.append('div')
      .classed('key', true)
      .call(box.textBox, 'Field key')
    .select('.form-control')
      .attr('required', 'required');

  // Field type
  const options = [
    {key: 'checkbox', name: 'Checkbox', format: 'checkbox'},
    {key: 'text_field', name: 'Text field', format: 'text_field'},
    {key: 'template', name: 'Template', format: 'html'}
  ];
  mbody.append('div')
      .classed('type', true)
      .call(lbox.selectBox, 'Type')
      .call(lbox.updateSelectBoxOptions, options)
      .on('change',  function () {
        const type = box.formValue(d3.select(this));
        const custom = type === 'template';
        selection.selectAll('.tmpbuild .form-control')
            .property('disabled', !custom);
            // .style('opacity',  custom ? null : 0.3);
      });

  // Template builder
  const coid = misc.uuidv4().slice(0, 8);
  const tmpBox = mbody.append('div')
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
      .classed('tmpbuild', true)
      .classed('card', true)
      .classed('card-body', true);

  // Template field
  collapse.append('div')
      .classed('tmpfield', true)
      .classed('mb-1', true)
      .call(lbox.selectBox, 'Field')
      .on('change', function () {
        const rcd = lbox.selectedRecord(d3.select(this));
        const notation = rcd.d3_format ? `:${rcd.d3_format}` : '';
        selection.select('.notation')
            .call(box.updateReadonlyValue, `{${rcd.key}${notation}}`);
      });

  // Notation
  collapse.append('div')
      .classed('notation', true)
      .call(box.readonlyBox, 'Notation');

  // Template input
  collapse.append('div')
      .classed('contents', true)
      .call(box.textareaBox, 'Contents', 5);
}


function updateBody(selection, fields) {
  selection.select('.key')
      .call(box.updateFormValue, '')
      .on('input', function() {
        const value = box.formValue(d3.select(this));
        const noDup = keyNoDup(d3.select(this), fields);
        if (!noDup) box.setValidity(d3.select(this), false);
        const invmsg = noDup ? 'Please provide valid field name'
          : `Key '${value}' already exsists`;
        d3.select(this).call(badge.updateInvalidMessage, invmsg);
        const valid = dialogFormValid(selection, fields);
        selection.select('.submit').property('disabled', !valid);
      });
  selection.select('.type')
      .call(box.updateFormValue, 'checkbox')
      .on('change', function () {
        const valid = dialogFormValid(selection, fields);
        selection.select('.submit').property('disabled', !valid);
      });
  const tmpFields = fields.filter(e => misc.sortType(e.format) !== 'none');
  selection.select('.tmpfield')
      .call(lbox.updateSelectBoxOptions, tmpFields)
      .call(box.updateFormValue, 'index')
      .dispatch('change');
  selection.select('.contents')
      .call(box.updateFormValue, '')
      .on('input', function () {
        const valid = dialogFormValid(selection, fields);
        selection.select('.submit').property('disabled', !valid);
      });
  selection.select('.submit').property('disabled', true);
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


function keyNoDup(selection, fields) {
  const value = box.formValue(selection);
  return !fields.map(e => e.key).includes(value);
}


function contentsValid(selection, tmpFields) {
  const value = box.formValue(selection);
  const valid = box.formValid(selection);
  const outer = value.split(/\{.+?\}/g);
  const inner = (value.match(/\{.+?\}/g) || []).map(e => e.slice(1, -1));
  const validKey = inner.some(n => {
    const ns = n.split(':');
    if (!tmpFields.map(e => e.key).includes(ns[0])) return false;
    if (ns.length > 2) return false;
    if (ns.length === 1) return true;
    return scale.isD3Format(ns[1]);
  });
  const validFormat = outer.concat(inner)
    .every(n => !n.includes('{') && !n.includes('}'));
  return valid && validKey && validFormat;
}

function dialogFormValid(selection, fields) {
  const isTmp = box.formValue(selection.select('.type')) === 'template';
  const keyv = box.formValid(selection.select('.key'));
  const noDup = keyNoDup(selection.select('.key'), fields);
  const tmpFields = fields.filter(e => misc.sortType(e.format) !== 'none');
  const contv = contentsValid(selection.select('.contents'), tmpFields);
  return keyv && noDup && (!isTmp || contv);
}


function value(selection) {
  const key = box.formValue(selection.select('.key'));
  const typeField = lbox.selectedRecord(selection.select('.type'));
  const cont = box.formValue(selection.select('.contents'));
  return {
    field: {key: key, name: key, format: typeField.format},
    converter: formatterGen[typeField.key](cont)
  };
}


export default {
  menuLink, body, updateBody, value
};
