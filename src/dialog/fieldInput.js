
/** @module dialog/fieldInput */

import {default as button} from '../component/button.js';
import {default as box} from '../component/formBox.js';
import {default as lbox} from '../component/formListBox.js';
import {default as modal} from '../component/modal.js';


const id = 'fieldinput-dialog';
const title = 'Append input field';


function menuLink(selection) {
  selection.call(button.dropdownMenuModal, 'fieldinput', title, id);
}


function body(selection) {
  const dialog = selection.call(modal.submitDialog, id, title);
  const body = dialog.select('.modal-body');
  body.append('div')
      .classed('key', true)
      .call(box.textBox, null, 'Field key', 40, null);
  const options = [
    {key: 'checkbox', name: 'Checkbox'},
    {key: 'text_field', name: 'Text field'}
  ];
  body.append('div')
      .classed('type', true)
      .call(lbox.selectBox, null, 'Type', options, 'checkbox');

}


function updateBody(selection) {
  selection.select('.key')
      .call(box.updateTextBox, null);
  selection.select('.type')
      .call(lbox.updateSelectBox, 'checkbox');
}


const defaultValues = {
  checkbox: false,
  text_field: ''
};


function value(selection) {
  const key = box.textBoxValue(selection.select('.key'));
  const type = lbox.selectBoxValue(selection.select('.type'));
  return {
    field: {key: key, name: key, format:type},
    default: defaultValues[type]
  };
}


export default {
  menuLink, body, updateBody, value
};
