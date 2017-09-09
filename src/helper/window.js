
import KArray from './KArray.js';


function URLQuery() {
  return KArray.from(window.location.search.substring(1).split("&"))
    .map(e => e.split('=')).toObject();
}


export default {
  URLQuery
};
