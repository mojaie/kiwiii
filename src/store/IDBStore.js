
import Dexie from 'Dexie';

// TODO: can indexed records improve query performance ?

const schema = {
  app: 'key',
  items: 'id, dataType, created',
  resources: 'id'
};

let idb = new Dexie('Store');
idb.version(1).stores(schema);


function getAppSetting(key) {
  return idb.app.where('key').equals(key).first()
    .then(res => {
      if (res === undefined) return undefined;
      return res.value;
    });
}


function putAppSetting(k, v) {  // returns id in success
  return idb.app.put({ key: k, value: v });
}


function getResources() {
  return idb.resources.toArray();
}


function putResources(data) { // returns last id in success
  return idb.resources.bulkPut(data);
}


function getAllItems() {
  return idb.items.orderBy('created').reverse()
    .toArray();
}


function getItemsByDataType(type) {
  return idb.items.where('dataType').equals(type).reverse()
    .sortBy('created');
}


function getItemById(tableId) {
  return idb.items.where('id').equals(tableId).first();
}


function updateItem(tableId, callback) {  // returns num of updated items
  return idb.items.where('id').equals(tableId).modify(callback);
}


function deleteItem(tableId) { // returns num of deleted items
  return idb.items.where('id').equals(tableId).delete();
}


function putItem(data) { // returns id in success
  return idb.items.put(data);
}


function reset() {
  // Try this before tackling with local db troubles
  return idb.delete().then(() => {
    idb = new Dexie('Store');
    idb.version(1).stores(schema);
  });
}

export default {
  getAppSetting, putAppSetting, getResources, putResources,
  getAllItems, getItemsByDataType, getItemById,
  updateItem, deleteItem, putItem, reset
};
