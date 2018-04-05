
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


function binaryToDataURI(binary) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = event => {
      resolve(event.target.result);
    };
    reader.readAsDataURL(binary);
  });
}


export default {
  plotCell, plotThumbnail, binaryToDataURI
};
