
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
  data.storeID = misc.uuidv4().slice(0, 8);
  data.sessionStarted = now.toString();
  return idb.items.put(data);
}


/**
 * Insert a data object to the store
 * @param {object} response - response data
 * @return {string} - viewID if sucessfully added
 */
function newDatagrid(response) {
  const now = new Date();
  const storeID = misc.uuidv4().slice(0, 8);
  const viewID = misc.uuidv4().slice(0, 8);
  const collectionID = response.workflowID.slice(0, 8);
  const data = {
    $schema: "https://mojaie.github.io/kiwiii/specs/package_v1.0.json",
    storeID: storeID,
    name: viewID,  // TODO: generate from response.query
    views: [
      {
        $schema: "https://mojaie.github.io/kiwiii/specs/datagrid_v1.0.json",
        viewID: viewID,
        name: viewID,  // TODO: generate from response.query
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
  return idb.items.put(data)
    .then(() => ({storeID: storeID, viewID:viewID}));
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
 * Returns a view
 * @param {string} storeID - store ID
 * @param {string} viewID - view ID
 * @return {array} view objects
 */
function getView(storeID, viewID) {
  return getAllItems()
    .then(items => items.find(e => e.storeID === storeID).views)
    .then(views => {
      const view = views.find(e => e.viewID === viewID);
      if (!view) return;
      view.storeID = storeID;
      return view;
    });
}


/**
 * Append a view next to a specific view
 * @param {string} storeID - store ID
 * @param {string} viewID - view ID
 * @param {object} viewObj - view object
 */
function appendView(storeID, viewID, viewObj) {
  return updateItem(storeID, item => {
    const pos = item.views.findIndex(e => e.viewID === viewID);
    item.views.splice(pos + 1, 0, viewObj);
  });
}


/**
 * Update view
 * @param {string} storeID - store ID
 * @param {string} viewID - view ID
 * @param {object} viewObj - view object or update function
 */
function updateView(storeID, viewID, viewObj) {
  return updateItem(storeID, item => {
    const pos = item.views.findIndex(e => e.viewID === viewID);
    if (_.isFunction(viewObj)) {
      viewObj(item.views[pos]);
    } else {
      item.views[pos] = viewObj;
    }
  });
}


/**
 * Delete a data object from the store
 * @param {string} storeID - store ID
 * @return {integer} - number of deleted items
 */
function deleteView(storeID, viewID) {
  return updateItem(storeID, item => {
    const pos = item.views.findIndex(e => e.viewID === viewID);
    item.views.splice(pos, 1);
    // prune orphaned collections
    const bin = {};
    item.dataset.forEach(e => { bin[e.collectionID] = 0; });
    item.views.forEach(view => {
      ['rows', 'items', 'nodes', 'edges']
        .filter(e => view.hasOwnProperty(e))
        .forEach(e => { bin[view[e]] += 1; });
    });
    Object.entries(bin).forEach(entry => {
      if (!entry[1]) {
        const i = item.dataset.findIndex(e => e.collectionID === entry[0]);
        item.dataset.splice(i, 1);
      }
    });
  });
}


/**
 * Returns a collection
 * @param {string} storeID - store ID
 * @param {string} collID - Collection ID
 * @return {array} Collection objects
 */
function getCollection(storeID, collID) {
  return getAllItems()
    .then(items => items.find(e => e.storeID === storeID).dataset)
    .then(colls => {
      const coll = colls.find(e => e.collectionID === collID);
      if (!coll) return;
      coll.storeID = storeID;
      return coll;
    });
}


/**
 * Append a view next to a specific view
 * @param {string} storeID - store ID
 * @param {string} collID - Collection ID
 * @param {object} collObj - Collection object
 */
function appendCollection(storeID, collID, collObj) {
  return updateItem(storeID, item => {
    const pos = item.dataset.findIndex(e => e.collectionID === collID);
    item.dataset.splice(pos + 1, 0, collObj);
  });
}


/**
 * Update collection
 * @param {string} storeID - store ID
 * @param {string} collID - Collection ID
 * @param {object} collObj - Collection object or update function
 */
function updateCollection(storeID, collID, collObj) {
  return updateItem(storeID, item => {
    const pos = item.dataset.findIndex(e => e.collectionID === collID);
    if (_.isFunction(collObj)) {
      collObj(item.dataset[pos]);
    } else {
      item.dataset[pos] = collObj;
    }
  });
}


export default {
  reset, getAllItems, getItem, importItem, newDatagrid, updateItem, deleteItem,
  getView, appendView, updateView, deleteView,
  getCollection, appendCollection, updateCollection
};
