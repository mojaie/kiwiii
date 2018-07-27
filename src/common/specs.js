
/** @module common/specs */

import _ from 'lodash';


/**
 * Retern if the package has running tasks
 * @param {object} specs - package JSON
 * @return {bool} if there are any ongoing tasks
 */
function isRunning(specs) {
  return specs.dataset.some(coll => {
    return coll.contents.some(e => {
      return ['ready', 'queued', 'running', 'interrupted'].includes(e.status);
    });
  });
}


export default {
  isRunning
};
