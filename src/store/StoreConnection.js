
import {default as def} from '../helper/definition.js';
import {default as mapper} from '../helper/mapper.js';
import {default as store} from './IDBStore.js';


function getAppSetting(key) {
  return store.getAppSetting(key)
    .catch(err => {
      console.error(`Unexpected key: ${key}`);
      Promise.reject(err);
    });
}


function setAppSetting(key, value) {
  return store.putAppSetting(key, value)
    .catch(err => {
      console.error(`Unexpected key: ${key} or value: ${value}`);
      Promise.reject(err);
    });
}


function getResources() {
  return store.getResources();
}


function setResources(rsrcs) {
  return store.putResources(rsrcs)
    .catch(err => {
      console.error(`Unexpected resources: ${rsrcs}`);
      Promise.reject(err);
    });
}


function getAllTables() {
  return store.getAllItems();
}


function getTablesByDataType(type) {
  return store.getItemsByDataType(type)
    .catch(err => {
      console.error(`Unexpected dataType: ${type}`);
      Promise.reject(err);
    });
}


function getTable(id) {
  return store.getItemById(id)
    .catch(err => {
      console.error(`Unexpected table ID: ${id}`);
      Promise.reject(err);
    });
}


function setFieldProperties(id, updates) {
  return store.updateItem(id, item => {
    item.fields.forEach((fd, i) => {
      fd.visible = updates.visibles.includes(fd.key);
      fd.sortType = updates.sortTypes[i];
      fd.digit = updates.digits[i];
    });
    item.revision++;
  })
  .catch(err => {
    console.error(`Unexpected table ID: ${id} or updates: ${updates}`);
    Promise.reject(err);
  });
}


function joinFields(id, mapping) {
  return store.updateItem(id, item => {
    mapper.apply(item, mapping);
    item.revision++;
  })
  .catch(err => {
    console.error(`Unexpected table ID: ${id} or mapping: ${mapping}`);
    Promise.reject(err);
  });
}


function updateTableAttribute(id, key, value) {
  return store.updateItem(id, item => {
    item[key] = value;
    item.revision++;
  })
  .catch(err => {
    console.error(`Unexpected table ID: ${id}, key: ${key} or value: ${value}`);
    Promise.reject(err);
  });
}


function insertTable(data) {
  data.fields = def.defaultFieldProperties(data.fields);
  return store.putItem(data)
    .catch(err => {
      console.error(`Unexpected data: ${data}`);
      Promise.reject(err);
    });
}


function updateTable(data) {
  if (data.status === 'failure') {  // No data found on server
    return updateTableAttribute(data.id, 'status', 'failure');
  }
  // update
  return store.updateItem(data.id, item => {
    data.fields = def.defaultFieldProperties(data.fields);
    Object.assign(item, data);
    item.revision++;
  });
}


function deleteTable(id) {
  return store.deleteItem(id)
    .catch(err => {
      console.error(`Unexpected table ID: ${id}`);
      Promise.reject(err);
    });
}


function reset() {
  return store.reset();
}


export default {
  getAppSetting, setAppSetting, getResources, setResources,
  getAllTables, getTablesByDataType, getTable,
  setFieldProperties, joinFields,
  updateTableAttribute, insertTable, updateTable,
  deleteTable, reset
};
