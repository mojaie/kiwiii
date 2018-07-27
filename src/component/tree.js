
/** @module component/tree */

import d3 from 'd3';


function nextLevel(selection, node, nodeFactory) {
  node.children.forEach(child => {
    const item = selection.append('li').datum(child.data);  // Bind data record
    const content = item.append('span')
      .style('display', 'inline-block');
    const arrow = child.hasOwnProperty('children') ? '▼ ' : '';
    content.append('span')
        .classed('arrow', true)
        .text(arrow);
    content.call(nodeFactory, child.data);

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
        .call(nextLevel, child, nodeFactory);
  });
}


 // Generate tree view
function tree(selection) {
  selection
      .classed('viewport', true)
      .style('overflow-y', 'scroll')
      .style('height', '400px')
    .append('div')
      .classed('body', true);
}


// Generate tree view
function setHeight(selection, height) {
  selection.style('height', `${height}px`);
}


// Update tree data
function treeItems(selection, items, keyFunc, nodeFactory) {
  const root = d3.stratify()
      .id(keyFunc)
      .parentId(d => d.parent)(items);
  selection.select('ul').remove();
  if (!root.hasOwnProperty('children')) return;
  selection.select('.body').append('ul')
      .classed('root', true)
      .style('padding-left', 0)
      .style('list-style-type', 'none')
      .call(nextLevel, root, nodeFactory);
  selection.selectAll('ul.root > li')
      .classed('my-2', true);
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
  tree, treeItems, setHeight, checkboxNode, checkboxValues
};
