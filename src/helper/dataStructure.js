
/** @module helper/dataStructure */


/**
 * Convert column mapping to table
 * @param {object} mapping - column mapping
 * @return {object} table object
 */
function columnMappingToTable(mapping) {
  const keyCol = {
    key: mapping.key,
    name: mapping.key,
    sort: 'text',
    visible: true
  };
  const cols = mapping.hasOwnProperty('column') ? mapping.column : mapping.columns;
  const tbl = {
    columns: [keyCol].concat(cols),
    records: Object.entries(mapping.mapping).map(entry => {
      const rcd = {};
      rcd[mapping.key] = entry[0];
      if (mapping.hasOwnProperty('column')) {
        rcd[mapping.column.key] = entry[1];
      } else {
        const colKeys = mapping.columns.map(col => col.key);
        entry[1].forEach((val, i) => {
          rcd[colKeys[i]] = val;
        });
      }
      return rcd;
    })
  };
  return tbl;
}


/**
 * Convert csv text to column mapping
 * @param {string} csvString - csv data text
 * @return {object} column mapping
 */
function csvToMapping(csvString) {
  const lines = csvString.split(/\n|\r|\r\n/);
  const header = lines.shift().split(',');
  const key = header.shift();
  const now = new Date();
  const mapping = {
    created: now.toString(),
    columns: [],
    key: key,
    mapping: {}
  };
  const headerIdx = [];
  header.forEach((h, i) => {
    if (h === '') return;
    headerIdx.push(i);
    mapping.columns.push({key: h, name: h, sort: 'text', visible: true});
  });
  lines.forEach(line => {
    const values = line.split(',');
    const k = values.shift();
    mapping.mapping[k] = Array(headerIdx.length);
    headerIdx.forEach(i => {
      mapping.mapping[k][i] = values[i];
    });
  });
  return mapping;
}


/**
 * Convert single column mapping to multi column mapping
 * @param {object} mapping - single column mapping
 * @return {object} multi column mapping
 */
function singleToMultiMapping(mapping) {
  const newMapping = {};
  Object.entries(mapping.mapping).forEach(m => {
    newMapping[m[0]] = [m[1]];
  });
  return {
    created: mapping.created,
    columns: [mapping.column],
    key: mapping.key,
    mapping: newMapping
  };
}


export default {
  columnMappingToTable, csvToMapping, singleToMultiMapping
};
