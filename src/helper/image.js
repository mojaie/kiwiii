import vega from 'vega';

export function showPlot(vegaSpec, selector) {
  new vega.View(vega.parse(vegaSpec))
    .initialize(selector)
    .run();

}

export function plotThumbnail(vegaSpec) {
  const view = new vega.View(vega.parse(vegaSpec));
  return view.toImageURL('png');  // Promise
}
