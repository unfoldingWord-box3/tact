var React = require('react');
var Table = require('react-bootstrap').Table;
var ListGroup = require('react-bootstrap').ListGroup;
var ListGroupItem = require('react-bootstrap').ListGroupItem;

function Alignment(props) {
  const alignment = props.alignment;
  function className(score) {
    return ( (score > 1) ? 'correction' : ( score < 0.1 ? 'conflict' : 'suggestion' ) )
  }
  const phrases = alignment.map((phrase, index) =>
    <td key={index}>
      <ListGroup className='phrase'>
        <ListGroupItem>{phrase.source}</ListGroupItem>
        <ListGroupItem>{phrase.target}</ListGroupItem>
        <ListGroupItem className={className(phrase.confidence)}>{phrase.confidence}</ListGroupItem>
      </ListGroup>
    </td>
  );
  return (
    <tr className='segment'>{phrases}</tr>
  );
}

var AlignmentsList = function(props) {
  const alignments = props.alignments;
  var i = 0;
  const listAlignment = alignments.map((alignment, index) =>
    <tbody className='alignment' key={index}>
      <Alignment alignment={alignment} />
    </tbody>
  );
  return (
    <Table striped bordered id='alignments'>
      {listAlignment}
    </Table>
  );
}
module.exports = AlignmentsList;
