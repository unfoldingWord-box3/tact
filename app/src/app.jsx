'use strict';

var React = require('react');
var ReactDOM = require('react-dom');

class CorpusForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      source: 'Replace with Source lines of corpus',
      target: 'Replace with Target lines of corpus'
    };

    this.handleSourceChange = this.handleSourceChange.bind(this);
    this.handleTargetChange = this.handleTargetChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleSourceChange(event) {
    this.setState({source: event.target.value});
  }
  handleTargetChange(event) {
    this.setState({target: event.target.value});
  }

  handleSubmit(event) {
    alert('corpus was submitted: \n' + this.state.source + '\n' + this.state.target);
    event.preventDefault();
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        Source Lines:
        <textarea value={this.state.source} onChange={this.handleSourceChange} />
        <br />
        Target Lines:
        <textarea value={this.state.target} onChange={this.handleTargetChange} />
        <br />
        <input type="submit" value="Submit" />
      </form>
    );
  }
}

ReactDOM.render(<CorpusForm />, document.getElementById('app'));
