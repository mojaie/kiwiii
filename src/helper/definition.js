
/** @module helper/definition */

function fetchable(tbl) {
  return ['In progress', 'Queued', 'Aborting'].includes(tbl.status);
}


function abortRequestable(tbl) {
  return ['In progress', 'Queued'].includes(tbl.status);
}


function conclike(col) {
  return col.hasOwnProperty('valueType')
    && ['AC50', 'IC50', 'ED50'].includes(col.valueType);
}


function dataSourceId(domain, resource, column) {
  return [domain, resource, column]
    .map(e => e.capitalize())
    .join('');  // DomainResourceColumn
}


export default {
  fetchable, abortRequestable, conclike, dataSourceId
};
