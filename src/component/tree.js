
/** @module component/tree */

import d3 from 'd3';


/**
 * Generate collapsible tree
 * @param {d3.selection} selection - selection of node content
 */
function tree() {
  let bodyHeight = 400;
  let keyDef = d => d.id;
  let parentDef = d => d.parent;
  let defaultLevel = 99999;
  let nodeEnterFactory = () => {};
  let nodeMergeFactory = () => {};

  // Recursively append child nodes
  function nextLevel(selection, data) {
    if (!selection.select('.childlist').size()) {
      selection.append('ul')
        .classed('childlist', true)
        .style('list-style-type', 'none');
    }
    const items = selection.select('.childlist')
      .selectAll('li')
        .data(data, keyDef);
    items.exit().remove();
    items.enter()
      .append('li')
        .each(function (d) {
          d3.select(this).call(nodeEnterFactory, d.data);
        })
      .merge(items)
        .each(function (d) {
          const node = d3.select(this);
          node.call(nodeMergeFactory, d.data);
          if (d.hasOwnProperty('children')) {
            node.call(nextLevel, d.children)
              .select('.arrow')
                .text(d => d.depth - 1 >= defaultLevel ? '▶ ' : '▼ ')
                .on('click', function () {  // Collapse on click
                  const childList = node.select('.childlist');
                  const expanded = childList.style('display') !== 'none';
                  d3.select(this).text(expanded ? '▶ ' : '▼ ');
                  childList.style('display', expanded ? 'none' : 'inherit');
                });
            node.select('.childlist')
                .style('display',
                  d => d.depth - 1 >= defaultLevel ? 'none' : 'inherit');
          } else {
            node.select('.childlist').remove();
          }
        });
  }

  function _tree(selection, records) {
    const root = d3.stratify()
        .id(keyDef)
        .parentId(parentDef)(records);
    selection
        .style('overflow-y', 'scroll')
        .style('height', `${bodyHeight}px`);
    if (!selection.select('.body').size()) {
      selection.append('div').classed('body', true);
    }
    selection.select('.body')
        .call(nextLevel, root.children || []);
    selection.selectAll('.body > ul')
        .style('padding-left', 0);
    selection.selectAll('.body > ul > li')
        .classed('my-2', true);
  }

  _tree.bodyHeight = function (h) {
    bodyHeight = h;
    return _tree;
  };

  _tree.keyDef = function (f) {
    keyDef = f;
    return _tree;
  };

  _tree.defaultLevel = function (lv) {
    defaultLevel = lv;
    return _tree;
  };

  _tree.nodeEnterFactory = function (f) {
    nodeEnterFactory = f;
    return _tree;
  };

  _tree.nodeMergeFactory = function (f) {
    nodeMergeFactory = f;
    return _tree;
  };

  return _tree;
}


/**
* Checkbox node (A basic implementation of nodeEnterFactory)
* @param {d3.selection} selection - selection of node content (li element)
*/
function checkboxNode(selection) {
  selection.append('span').classed('arrow', true);
  selection.append('input')
      .attr('type', 'checkbox');
  selection.append('span')
      .classed('label', true);
}


/**
* Update checkbox node content (A basic implementation of nodeMergeFactory)
* @param {d3.selection} selection - selection of node content (li element)
*/
function updateCheckbox(selection, record) {
  selection.select('.label')
      .text(record.id);
}


/**
 * Return an array of ids that are checked
 * @param {d3.selection} selection - selection of node content
 */
function checkboxValues(selection) {
  return selection.select('.body')
     .selectAll('input:checked').data().map(d => d.id);
}


export default {
  tree, checkboxNode, updateCheckbox, checkboxValues
};
