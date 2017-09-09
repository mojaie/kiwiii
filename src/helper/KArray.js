

class KArray extends Array {
  /**
   * Return array of object filtered by given unique key
   */
  unique(key) {
    return this.reduce((a, b) => {
      if (a.find(e => e[key] === b[key]) === undefined) a.push(b);
      return a;
    }, new KArray());
  }


  /**
   * Merge arrays
   */
  extend() {
    return this.reduce((a, b) => {
      Array.prototype.push.apply(a, b);
      return a;
    }, new KArray());
  }


  // Merge arrays(Asynchronous)
  extendAsync() {
    return Promise.all(this).then(res => {
      return res.reduce((a, b) => {
        Array.prototype.push.apply(a, b);
        return a;
      }, new KArray());
    });
  }

  toArray() {
    return new Array(this);
  }

  toObject() {
    const obj = {};
    this.forEach(kv => {
      obj[kv[0]] = kv[1];
    });
    return obj;
  }
}

export default KArray;
