
/** @module common/idb */

import Dexie from 'Dexie';

import {default as misc} from './misc.js';


const schema = {
  items: 'storeID, dataType, created'
};

let idb = new Dexie('Store');
idb.version(1).stores(schema);


/**
 * Returns all data store items
 * @return {array} data store objects
 */
function getAllItems() {
  return idb.items
    .orderBy('created')
    .reverse()
    .toArray();
}


/**
 * Get data store items by data type
 * @param {string} type - 'nodes' or 'edges'
 * @return {array} data store objects
 */
function getItemsByDataType(type) {
  return idb.items
    .where('dataType')
    .equals(type)
    .reverse()
    .sortBy('created')
    .catch(err => {
      console.error(`IDBError: Unexpected dataType: ${type}`, err);
    });
}


/**
 * Get data store items by store ID
 * @param {string} storeID - store ID
 * @return {array} data store object
 */
function getItemByID(storeID) {
  return idb.items
    .where('storeID')
    .equals(storeID)
    .first()
    .catch(err => {
      console.error(`IDBError: Unexpected table ID: ${storeID}`, err);
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
 * Insert a data object to the store
 * @param {object} data - data
 * @return {string} - storeID if sucessfully added
 */
function putItem(data) {
  if (!data.storeID) {
    data.storeID = misc.uuidv4();
  }
  return idb.items.put(data);
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
 * Delete all data store
 * Try this before dealing with local db issues
 */
function reset() {
  return idb.delete().then(() => {
    idb = new Dexie('Store');
    idb.version(1).stores(schema);
  });
}


export default {
  getAllItems, getItemsByDataType, getItemByID,
  deleteItem, putItem, updateItem, reset
};
