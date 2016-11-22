
var React = require('react');
var ReactDOM = require('react-dom');
var localforage = require('localforage');
var tact = require('../../tact/tact.js');

var CorpusForm = require('./elements/corpus.jsx');

ReactDOM.render(<CorpusForm />, document.getElementById('app'));
