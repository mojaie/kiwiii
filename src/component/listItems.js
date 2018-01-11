
/** @module component/listItems */


function selectOptions(selection, data, key, text) {
  const options = selection.selectAll('option')
    .data(data, key);
  options.exit().remove();
  options.enter().append('option')
    .merge(options)
      .attr('value', key)
      .text(text);
}


function checkboxList(selection, data, name, key, text) {
  const items = selection.selectAll('li').data(data, key);
  items.exit().remove();
  const entered = items.enter().append('li')
    .attr('class', 'form-check')
    .append('label');
  entered.append('input');
  entered.append('span');
  const updated = entered.merge(items.select('label'))
    .attr('class', 'form-check-label');
  updated.select('input')
    .attr('type', 'checkbox')
    .attr('class', 'form-check-input')
    .attr('name', name)
    .attr('value', key);
  updated.select('span')
    .text(text);
}


// checkbox list with tooltip
// call $('[data-toggle="tooltip"]').tooltip() after this function
// TODO: legacy
function checkboxListT(selection, data, name, key, text) {
  const items = selection.selectAll('li').data(data, key);
  items.exit().remove();
  const entered = items.enter().append('li')
    .attr('class', 'form-check')
    .append('label');
  entered.append('input');
  entered.append('a');
  const updated = entered.merge(items.select('label'))
    .attr('class', 'form-check-label');
  updated.select('input')
    .attr('type', 'checkbox')
    .attr('class', 'form-check-input')
    .attr('name', name)
    .attr('value', key);
  updated.select('a')
    .attr('data-toggle', 'tooltip')
    .attr('data-placement', 'bottom')
    .attr('title', d => d.description || 'No')
    .text(text);
}


export default {
  selectOptions, checkboxList, checkboxListT
};
