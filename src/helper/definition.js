
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
  if (['numeric', 'd3_format'].includes(fmt)) return 'numeric';
  if (['text', 'compound_id'].includes(fmt)) return 'text';
  return 'none';
}


function ongoing(data) {
  return ['running', 'ready'].includes(data.status);
}


export default {
  defaultFieldProperties, sortType, ongoing
};
