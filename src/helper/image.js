
/** @module helper/image */

import vega from 'vega';

function showPlot(vegaSpec, selector) {
  new vega.View(vega.parse(vegaSpec))
    .initialize(selector)
    .run();
}


function plotThumbnail(vegaSpec) {
  const view = new vega.View(vega.parse(vegaSpec));
  return view.toImageURL('png');  // Promise
}


export default {
  showPlot, plotThumbnail
};
