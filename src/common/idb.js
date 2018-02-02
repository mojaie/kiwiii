
/** @module common/idb */

import Dexie from 'Dexie';

import {default as misc} from './misc.js';


const schema = {
  items: 'storeID, dataType, created'
};

let idb = new Dexie('Store');
idb.version(1).stores(schema);


function getAllItems() {
  return idb.items
    .orderBy('created')
    .reverse()
    .toArray();
}


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


function getItemByID(storeID) {
  return idb.items
    .where('storeID')
    .equals(storeID)
    .first()
    .catch(err => {
      console.error(`IDBError: Unexpected table ID: ${storeID}`, err);
    });
}


function deleteItem(storeID) { // returns num of deleted items
  return idb.items
    .where('storeID')
    .equals(storeID)
    .delete();
}


function putItem(data) { // returns id in success
  if (!data.storeID) {
    data.storeID = misc.uuidv4();
  }
  return idb.items.put(data);
}


function updateItem(storeID, updateFunc) {  // returns num of updated items
  return idb.items
    .where('storeID')
    .equals(storeID)
    .modify(updateFunc)
    .catch(err => {
      console.error('IDBError: Update failed', err);
    });
}


function reset() {
  // Try this before tackling with local db troubles
  return idb.delete().then(() => {
    idb = new Dexie('Store');
    idb.version(1).stores(schema);
  });
}


export default {
  getAllItems, getItemsByDataType, getItemByID,
  deleteItem, putItem, updateItem, reset
};
