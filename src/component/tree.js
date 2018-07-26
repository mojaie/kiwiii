
/** @module component/tree */

import d3 from 'd3';


function nextLevel(selection, node, renderNodeFunc) {
  node.children.forEach(child => {
    const item = selection.append('li').datum(child.data);  // Bind data record
    const content = item.append('span');
    const arrow = child.hasOwnProperty('children') ? '▼ ' : '';
    content.append('span')
        .classed('arrow', true)
        .text(arrow);
    content.call(renderNodeFunc, child.data);

    // Collapse on click
    content.select('.arrow')
      .on('click', function () {
        const childList = item.select('ul');
        if (!childList.size()) return;
        const expanded = childList.style('display') !== 'none';
        content.select('.arrow').text(expanded ? '▶ ' : '▼ ');
        childList.style('display', expanded ? 'none' : 'inherit');
      });

    // Search next level
    if (!child.hasOwnProperty('children')) return;
    item.append('ul')
        .style('list-style-type', 'none')
        .call(nextLevel, child, renderNodeFunc);
  });
}


 // Generate tree view
function tree(selection, items, renderNodeFunc) {
  selection
      .classed('viewport', true)
      .style('overflow-y', 'scroll')
      .style('height', '500px')
    .append('div')
      .classed('body', true)
      .style('transform', 'scale(1.5)')
      .style('transform-origin', 'top left');
  if (items) {
    selection.call(treeItems, items, renderNodeFunc);
  }
}


// Update tree data
function treeItems(selection, items, renderNodeFunc) {
  const root = d3.stratify()
      .id(d => d.id)
      .parentId(d => d.parent)(items);
  selection.select('.body').append('ul')
      .style('padding-left', 0)
      .style('list-style-type', 'none')
      .call(nextLevel, root, renderNodeFunc);
}


/**
* Node content
* @param {d3.selection} selection - selection of node content (span element)
*/
function checkboxNode(selection, item) {
  selection.append('input')
      .attr('type', 'checkbox');
  selection.append('span')
      .text(item.id);
}


/**
 * Return list of checkbox values
 * @param {d3.selection} selection - selection of node content (span element)
 */
function checkboxValues(selection) {
  return selection.select('.body')
    .selectAll('input:checked').data().map(d => d.id);
}


export default {
  tree, treeItems, checkboxNode, checkboxValues
};
