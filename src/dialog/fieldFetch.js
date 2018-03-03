
/** @module dialog/fieldFetch */

import _ from 'lodash';

import {default as button} from '../component/button.js';
import {default as box} from '../component/formBox.js';
import {default as modal} from '../component/modal.js';


function menuButton(selection) {
  selection.append('a')
      .call(button.dropdownMenuModal,
            'fieldconf', 'Field Setting', 'fieldconf-dialog');
}


function body(selection, fields) {
  selection
      .call(modal.submitDialog, 'fieldconf-dialog', 'Field Setting')
    .select('.modal-body').append('div')
      .classed('ids', true)
      .call(box.textareaBox, 'search-query', 'Query', fields);

      // Prevent implicit submission
      document.getElementById('join-search')
        .addEventListener('keypress', event => {
          if (event.keyCode === 13) event.preventDefault();
        });
      const dataKeys = dataFields.map(e => e.key);
      const resourceFields = _(resources.map(e => e.fields))
        .flatten()
        .uniqBy('key')
        .value()
        .filter(e => e.key !== 'id');
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
