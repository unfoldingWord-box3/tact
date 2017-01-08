
function DB() {
  this.localforage = undefined
  if (typeof localStorage === "undefined" || localStorage === null) {
    var LocalStorage = require('node-localstorage').LocalStorage
    localStorage = new LocalStorage('./localstorage')
  }
  this.localforage = require('localforage')
  // this.localforage.setDriver(this.localforage.LOCALSTORAGE)
  this.localforage.config({
    driver      : this.localforage.LOCALSTORAGE, // Force WebSQL; same as using setDriver()
    name        : 'tact',
    version     : 1.0,
    size        : 500000000, // Size of database, in bytes. WebSQL-only for now.
    storeName   : 'tact', // Should be alphanumeric, with underscores.
    description : 'a place to persist training tables'
  })
}

DB.prototype.table = function(namespace) {
  return this.localforage.createInstance({"name": namespace})
}

exports = module.exports = DB
