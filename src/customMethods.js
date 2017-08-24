
/**
 * Capitalize the text -- upper case => Upper Case
 */
String.prototype.capitalize = function() {
  return this.replace(/(?:^|\s)\S/g, e => e.toUpperCase());
};


/**
 * Return array of object filtered by given unique key
 */
Array.prototype.unique = function(key) {
  return this.reduce((a, b) => {
    if (a.find(e => e[key] === b[key]) === undefined) a.push(b);
    return a;
  }, []);
};


/**
 * Merge arrays
 */
Array.prototype.extend = function() {
  return this.reduce((a, b) => {
    Array.prototype.push.apply(a, b);
    return a;
  }, []);
};


// Merge arrays(Asynchronous)
Array.prototype.extendAsync = function() {
  return Promise.all(this).then(res => {
    return res.reduce((a, b) => {
      Array.prototype.push.apply(a, b);
      return a;
    }, []);
  });
};
