
/** @module dialog/fieldFetch */


import {default as button} from '../component/button.js';
import {default as box} from '../component/formBox.js';
import {default as modal} from '../component/modal.js';

const id = 'fieldfetch-dialog';
const title = 'Import fields from database';


function menuLink(selection) {
  selection.call(button.dropdownMenuModal, 'fieldfetch', title, id);
}


function body(selection, fields) {
  const dialog = selection.call(modal.submitDialog, id, title);
  dialog.select('.modal-body').append('div')
      .classed('ids', true)
      .call(lbox.checklistBox, 'fieldfetch-list', 'Query', fields);



      // Prevent implicit submission
      document.getElementById('join-search')
        .addEventListener('keypress', event => {
          if (event.keyCode === 13) event.preventDefault();
        });
      const dataKeys = dataFields.map(e => e.key);
      const resourceFields = KArray.from(resources.map(e => e.fields))
        .extend().unique('key').filter(e => e.key !== 'id');
      d3.select('#join-keys')
        .call(cmp.checkboxList, resourceFields, 'keys', d => d.key, d => d.name)
        .selectAll('li')
        .each(function(d) { // disable already shown columns
          d3.select(this).selectAll('label').select('input')
            .property('checked', dataKeys.includes(d.key))
            .attr('disabled', dataKeys.includes(d.key) ? 'disabled' : null);
        });
      d3.select('#join-search')
        .on('keyup', function () {
          const match = d => fmt.partialMatch(d3form.value(this), d.name);
          d3.select('#join-keys').selectAll('li')
            .style('visibility', d => match(d) ? null : 'hidden')
            .style('position', d => match(d) ? null : 'absolute');
        });
      d3.select('#join-submit')
        .on('click', () => {
          d3.select('#loading-circle').style('display', 'inline');
          const selected = d3form.checkboxValues('#join-keys');
          const queryFieldKeys = resourceFields.map(e => e.key)
            .filter(e => !dataKeys.includes(e))
            .filter(e => selected.includes(e));
          const query = {
            type: 'fieldfilter',
            targetFields: queryFieldKeys,
            key: 'compound_id',
            values: compoundIDs
          };
          return fetcher.get('run', query)
            .then(fetcher.json)
            .then(json => callback(mapper.tableToMapping(json, 'id')),
                  fetcher.error);
      });
}


function value(selection) {
  return {
  };
}



export default {
  menuButton, body, value
};
