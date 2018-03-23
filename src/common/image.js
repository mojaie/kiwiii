
/** @module common/image */

import vega from 'vega';


function plotCell(selection, record, field) {
  new vega.View(vega.parse(record[field.key]))
    .initialize(selection.node())
    .run();
}


function plotThumbnail(vegaSpec) {
  const view = new vega.View(vega.parse(vegaSpec));
  return view.toImageURL('png');  // Promise
}


export default {
  plotCell, plotThumbnail
};
