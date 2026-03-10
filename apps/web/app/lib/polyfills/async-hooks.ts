// AsyncLocalStorage shim for browser/client build
export class AsyncLocalStorage {
  constructor() { 
    this._store = null; 
  }
  getStore() { 
    return this._store; 
  }
  run(store, callback, ...args) {
    const prev = this._store;
    this._store = store;
    try { 
      return callback(...args); 
    }
    finally { 
      this._store = prev; 
    }
  }
  exit(callback, ...args) { 
    return callback(...args); 
  }
}
