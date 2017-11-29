
/** @module helper/definition */


function defaultFieldProperties(fields) {
  return fields.map(e => {
    if (!e.hasOwnProperty('name')) e.name = e.key;
    if (!e.hasOwnProperty('visible')) e.visible = true;
    if (e.hasOwnProperty('d3_format')) e.format = 'd3_format';
    if (!e.hasOwnProperty('format')) e.format = 'raw';
    return e;
  });
}


function sortType(fmt) {
  if (fmt === 'd3_format') return 'numeric';
  if (fmt === 'numeric') return 'numeric';
  if (fmt === 'text') return 'text';
  return 'none';
}


function ongoing(data) {
  return ['running', 'ready'].includes(data.status);
}


export default {
  defaultFieldProperties, sortType, ongoing
};
