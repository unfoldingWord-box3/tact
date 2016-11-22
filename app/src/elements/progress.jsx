var React = require('react');
var ProgressBar = require('react-bootstrap').ProgressBar;

var Progress = function(props) {
  const training = props.training * 50;
  const aligning = props.aligning * 50;
  const progress = (
    <ProgressBar>
      <ProgressBar striped bsStyle="warning" now={training} key={1} />
      <ProgressBar striped bsStyle="success" now={aligning} key={2} />
    </ProgressBar>
  );
  return (
    <div className='progress'>{progress}</div>
  );
}
module.exports = Progress;
