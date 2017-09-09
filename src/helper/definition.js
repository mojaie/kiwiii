
/** @module helper/definition */


const defaultHiddenFields = ['_mw', '_mw_wo_sw', '_logp', '_formula', '_nonH'];

const defaultSort = {
    id: 'text',
    compound_id: 'text',
    assay_id: 'text',
    svg: 'none',
    json: 'none',
    plot: 'none',
    text: 'text',
    ec50: 'numeric',
    'active%': 'numeric',
    'inhibition%': 'numeric',
    numeric: 'numeric',
    count: 'numeric',
    int: 'numeric',
    flag: 'numeric',
    bool: 'numeric',
    image: 'none',
    control: 'none',
    'undefined': 'none'
};

const defaultDigit = {
    id: 'raw',
    compound_id: 'raw',
    assay_id: 'raw',
    svg: 'raw',
    json: 'raw',
    plot: 'raw',
    text: 'raw',
    ec50: 'scientific',
    'active%': 'rounded',
    'inhibition%': 'rounded',
    numeric: 'rounded',
    count: 'raw',
    int: 'raw',
    flag: 'raw',
    bool: 'raw',
    image: 'raw',
    control: 'raw',
    'undefined': 'raw'
};

function defaultFieldProperties(fields) {
  return fields.map(e => {
    if (!e.hasOwnProperty('name')) e.name = e.key;
    if (!e.hasOwnProperty('visible')) e.visible = !defaultHiddenFields.includes(e.key);
    if (!e.hasOwnProperty('sortType')) e.sortType = defaultSort[e.valueType];
    if (!e.hasOwnProperty('digit')) e.digit = defaultDigit[e.valueType];
    return e;
  });
}

function ongoing(data) {
  return ['running', 'ready'].includes(data.status);
}


export default {
  defaultHiddenFields, defaultFieldProperties, ongoing
};
