
/** @module common/idb */

import _ from 'lodash';
import Dexie from 'Dexie';

import {default as misc} from './misc.js';
import {default as legacy} from './legacySchema.js';

// TODO: need package, view and dataset tables?
const schema = {
  items: 'storeID, sessionStarted'
};

let idb = new Dexie('Store');
idb.version(1).stores(schema);


/**
 * Delete all data store
 * Try this before dealing with local db issues
 */
function reset() {
  return idb.delete().then(() => {
    idb = new Dexie('Store');
    idb.version(1).stores(schema);
  });
}


/**
 * Returns all data store items
 * @return {array} data store objects
 */
function getAllItems() {
  return idb.items
    .orderBy('sessionStarted')
    .reverse()
    .toArray();
}


/**
 * Get data store items by store ID
 * @param {string} storeID - store ID
 * @return {array} data store object
 */
function getItem(storeID) {
  return idb.items
    .where('storeID')
    .equals(storeID)
    .first()
    .catch(err => {
      console.error(`IDBError: Unexpected table ID: ${storeID}`, err);
    });
}


/**
 * Insert a data object to the store
 * @param {object} data - data
 * @return {string} - storeID if sucessfully added
 */
function importItem(data) {
  // Legacy format converter
  if (!data.hasOwnProperty('views')) {
    data = legacy.convertPackage(data);
  }
  const now = new Date();
  data.sessionStarted = now.toString();
  // Reindex
  data.storeID = misc.uuidv4().slice(0, 8);
  data.views.forEach(view => {
    view.viewID = misc.uuidv4().slice(0, 8);
  });
  data.dataset.forEach(coll => {
    const newCollID = misc.uuidv4().slice(0, 8);
    data.views.forEach(view => {
      ['rows', 'nodes', 'edges'].filter(e => view.hasOwnProperty(e))
        .forEach(type => {
          if (view[type] === coll.collectionID) {
            view[type] = newCollID;
          }
        });
    });
    coll.collectionID = newCollID;
  });
  return idb.items.put(data);
}


/**
 * Insert a data object to the store
 * @param {object} response - response data
 * @return {string} - viewID if sucessfully added
 */
function newDatagrid(response) {
  const now = new Date();
  const collectionID = response.workflowID.slice(0, 8);
  const viewID = misc.uuidv4().slice(0, 8);
  const data = {
    $schema: "https://mojaie.github.io/kiwiii/specs/package_v1.0.json",
    storeID: misc.uuidv4().slice(0, 8),
    name: viewID,
    views: [
      {
        $schema: "https://mojaie.github.io/kiwiii/specs/datagrid_v1.0.json",
        viewID: viewID,
        name: viewID,
        viewType: "datagrid",
        rows: collectionID,
        checkpoints: [
          {type: 'creation', date: now.toString()}
        ]
      }
    ],
    dataset: [
      {
        $schema: "https://mojaie.github.io/kiwiii/specs/collection_v1.0.json",
        collectionID: collectionID,
        contents: [response]
      }
    ],
    sessionStarted: now.toString()
  };
  return idb.items.put(data).then(() => viewID);
}


/**
 * Update data object in the store
 * @param {string} storeID - store ID
 * @param {function} updateFunc - update function
 * @return {integer} - number of updated items
 */
function updateItem(storeID, updateFunc) {
  return idb.items
    .where('storeID')
    .equals(storeID)
    .modify(updateFunc)
    .catch(err => {
      console.error('IDBError: Update failed', err);
    });
}


/**
 * Delete a data object from the store
 * @param {string} storeID - store ID
 * @return {integer} - number of deleted items
 */
function deleteItem(storeID) {
  return idb.items
    .where('storeID')
    .equals(storeID)
    .delete();
}


/**
 * Returns all views
 * @return {array} view objects
 */
function getAllViews() {
  return getAllItems()
    .then(items => _.flatten(items.map(e => e.views)));
}


/**
 * Returns a view
 * @param {string} viewID - view ID
 * @return {array} view objects
 */
function getView(viewID) {
  return getAllViews()
    .then(views => views.find(e => e.viewID === viewID));
}


function getPos(query, key, field) {
  return getAllItems().then(items => {
    let pos;
    let storeID;
    for (let item of items) {
      const i = item[field].findIndex(e => e[key] === query);
      if (i >= 0) {
        storeID = item.storeID;
        pos = i;
        break;
      }
    }
    return [storeID, pos];
  });
}


/**
 * Append a view next to a specific view
 * @param {string} viewID - view ID
 * @param {object} viewObj - view object
 */
function appendView(viewID, viewObj) {
  return getPos(viewID, 'viewID', 'views').then(pos => {
    return updateItem(pos[0], item => {
      item.views.splice(pos[1] + 1, 0, viewObj);
    });
  });
}


/**
 * Update view
 * @param {string} viewID - view ID
 * @param {object} viewObj - view object or update function
 */
function updateView(viewID, viewObj) {
  return getPos(viewID, 'viewID', 'views').then(pos => {
    return updateItem(pos[0], item => {
      if (_.isFunction(viewObj)) {
        viewObj(item.views[pos[1]]);
      } else {
        item.views[pos[1]] = viewObj;
      }
    });
  });
}


/**
 * Delete a data object from the store
 * @param {string} storeID - store ID
 * @return {integer} - number of deleted items
 */
function deleteView(viewID) {
  // TODO: prune orphaned collections
  // TODO: delete item if there is no view
  return getPos(viewID, 'viewID', 'views').then(pos => {
    return updateItem(pos[0], item => {
      item.views.splice(pos[1], 1);
    });
  });
}


/**
 * Returns all collections
 * @return {array} Collection objects
 */
function getAllCollections() {
  return getAllItems()
    .then(items => _.flatten(items.map(e => e.dataset)));
}


/**
 * Returns a collection
 * @param {string} collID - Collection ID
 * @return {array} Collection objects
 */
function getCollection(collID) {
  return getAllCollections()
    .then(colls => colls.find(e => e.collectionID === collID));
}


/**
 * Append a view next to a specific view
 * @param {string} collID - Collection ID
 * @param {object} collObj - Collection object
 */
function appendCollection(collID, collObj) {
  return getPos(collID, 'collectionID', 'dataset').then(pos => {
    return updateItem(pos[0], item => {
      item.dataset.splice(pos[1] + 1, 0, collObj);
    });
  });
}


/**
 * Update collection
 * @param {string} collID - Collection ID
 * @param {object} collObj - Collection object or update function
 */
function updateCollection(collID, collObj) {
  return getPos(collID, 'collectionID', 'dataset').then(pos => {
    return updateItem(pos[0], item => {
      if (_.isFunction(collObj)) {
        collObj(item.dataset[pos[1]]);
      } else {
        item.dataset[pos[1]] = collObj;
      }
    });
  });
}


export default {
  reset, getAllItems, getItem, importItem, newDatagrid, updateItem, deleteItem,
  getAllViews, getView, appendView, updateView, deleteView,
  getAllCollections, getCollection, appendCollection, updateCollection
};
