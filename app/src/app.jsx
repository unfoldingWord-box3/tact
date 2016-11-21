
var React = require('react');
var ReactDOM = require('react-dom');
var localforage = require('localforage');
var tact = require('../../tact/tact.js');
var FormGroup = require('react-bootstrap').FormGroup;
var Table = require('react-bootstrap').Table;
var ControlLabel = require('react-bootstrap').ControlLabel;
var FormControl = require('react-bootstrap').FormControl;
var ListGroup = require('react-bootstrap').ListGroup;
var ListGroupItem = require('react-bootstrap').ListGroupItem;
var ProgressBar = require('react-bootstrap').ProgressBar;

function Alignment(props) {
  const alignment = props.alignment;
  const phrases = alignment.map((phrase, index) =>
    <td key={index}>
      <ListGroup className='phrase'>
        <ListGroupItem>{phrase[0]}</ListGroupItem>
        <ListGroupItem>{phrase[1]}</ListGroupItem>
        <ListGroupItem>{phrase[2]}</ListGroupItem>
      </ListGroup>
    </td>
  );
  return (
    <tr className='segment'>{phrases}</tr>
  );
}

function AlignmentsList(props) {
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

class CorpusForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      trainingProgress: 0,
      aligningProgress: 0,
      alignments: [],
      source: `BGB - Berean Greek Bible
      Βίβλος γενέσεως Ἰησοῦ Χριστοῦ υἱοῦ Δαυὶδ υἱοῦ Ἀβραάμ.
      Ἀβραὰμ ἐγέννησεν τὸν Ἰσαάκ, Ἰσαὰκ δὲ ἐγέννησεν τὸν Ἰακώβ, Ἰακὼβ δὲ ἐγέννησεν τὸν Ἰούδαν καὶ τοὺς ἀδελφοὺς αὐτοῦ,
      Ἰούδας δὲ ἐγέννησεν τὸν Φαρὲς καὶ τὸν Ζαρὰ ἐκ τῆς Θάμαρ, Φαρὲς δὲ ἐγέννησεν τὸν Ἑσρώμ, Ἑσρὼμ δὲ ἐγέννησεν τὸν Ἀράμ,
      Ἀρὰμ δὲ ἐγέννησεν τὸν Ἀμιναδάβ, Ἀμιναδὰβ δὲ ἐγέννησεν τὸν Ναασσών, Ναασσὼν δὲ ἐγέννησεν τὸν Σαλμών,
      Σαλμὼν δὲ ἐγέννησεν τὸν Βόες ἐκ τῆς Ῥαχάβ, Βόες δὲ ἐγέννησεν τὸν Ἰωβὴδ ἐκ τῆς Ῥούθ, Ἰωβὴδ δὲ ἐγέννησεν τὸν Ἰεσσαί,
      Ἰεσσαὶ δὲ ἐγέννησεν τὸν Δαυὶδ τὸν βασιλέα. Δαυὶδ δὲ ἐγέννησεν τὸν Σολομῶνα ἐκ τῆς τοῦ Οὐρίου,
      Σολομὼν δὲ ἐγέννησεν τὸν Ῥοβοάμ, Ῥοβοὰμ δὲ ἐγέννησεν τὸν Ἀβιά, Ἀβιὰ δὲ ἐγέννησεν τὸν Ἀσάφ,
      Ἀσὰφ δὲ ἐγέννησεν τὸν Ἰωσαφάτ, Ἰωσαφὰτ δὲ ἐγέννησεν τὸν Ἰωράμ, Ἰωρὰμ δὲ ἐγέννησεν τὸν Ὀζίαν,
      Ὀζίας δὲ ἐγέννησεν τὸν Ἰωαθάμ, Ἰωαθὰμ δὲ ἐγέννησεν τὸν Ἄχαζ, Ἄχαζ δὲ ἐγέννησεν τὸν Ἑζεκίαν,
      Ἑζεκίας δὲ ἐγέννησεν τὸν Μανασσῆ, Μανασσῆς δὲ ἐγέννησεν τὸν Ἀμώς, Ἀμὼς δὲ ἐγέννησεν τὸν Ἰωσίαν,
      Ἰωσίας δὲ ἐγέννησεν τὸν Ἰεχονίαν καὶ τοὺς ἀδελφοὺς αὐτοῦ ἐπὶ τῆς μετοικεσίας Βαβυλῶνος.
      Μετὰ δὲ τὴν μετοικεσίαν Βαβυλῶνος Ἰεχονίας ἐγέννησεν τὸν Σαλαθιήλ, Σαλαθιὴλ δὲ ἐγέννησεν τὸν Ζοροβαβέλ,
      Ζοροβαβὲλ δὲ ἐγέννησεν τὸν Ἀβιούδ, Ἀβιοὺδ δὲ ἐγέννησεν τὸν Ἐλιακίμ, Ἐλιακὶμ δὲ ἐγέννησεν τὸν Ἀζώρ,
      Ἀζὼρ δὲ ἐγέννησεν τὸν Σαδώκ, Σαδὼκ δὲ ἐγέννησεν τὸν Ἀχίμ, Ἀχὶμ δὲ ἐγέννησεν τὸν Ἐλιούδ,
      Ἐλιοὺδ δὲ ἐγέννησεν τὸν Ἐλεάζαρ, Ἐλεάζαρ δὲ ἐγέννησεν τὸν Ματθάν, Ματθὰν δὲ ἐγέννησεν τὸν Ἰακώβ,
      Ἰακὼβ δὲ ἐγέννησεν τὸν Ἰωσὴφ τὸν ἄνδρα Μαρίας, ἐξ ἧς ἐγεννήθη Ἰησοῦς ὁ λεγόμενος Χριστός.
      Πᾶσαι οὖν αἱ γενεαὶ ἀπὸ Ἀβραὰμ ἕως Δαυὶδ γενεαὶ δεκατέσσαρες, καὶ ἀπὸ Δαυὶδ ἕως τῆς μετοικεσίας Βαβυλῶνος γενεαὶ δεκατέσσαρες, καὶ ἀπὸ τῆς μετοικεσίας Βαβυλῶνος ἕως τοῦ Χριστοῦ γενεαὶ δεκατέσσαρες.
      Τοῦ δὲ Ἰησοῦ Χριστοῦ ἡ γένεσις οὕτως ἦν. μνηστευθείσης τῆς μητρὸς αὐτοῦ Μαρίας τῷ Ἰωσήφ, πρὶν ἢ συνελθεῖν αὐτοὺς εὑρέθη ἐν γαστρὶ ἔχουσα ἐκ πνεύματος ἁγίου.
      Ἰωσὴφ δὲ ὁ ἀνὴρ αὐτῆς, δίκαιος ὢν καὶ μὴ θέλων αὐτὴν δειγματίσαι, ἐβουλήθη λάθρᾳ ἀπολῦσαι αὐτήν.`,
      target: `BLB - Berean Literal Bible
      The book of the genealogy of Jesus Christ, son of David, son of Abraham:
      Abraham begat Isaac, and Isaac begat Jacob, and Jacob begat Judah and his brothers.
      And Judah begat Perez and Zerah out of Tamar, and Perez begat Hezron, and Hezron begat Ram.
      And Ram begat Amminadab, and Amminadab begat Nahshon, and Nahshon begat Salmon.
      And Salmon begat Boaz out of Rahab, and Boaz begat Obed out of Ruth, and Obed begat Jesse,
      and Jesse begat David the king. Next: David begat Solomon, out of the wife of Uriah,
      and Solomon begat Rehoboam, and Rehoboam begat Abijah, and Abijah begat Asa.
      And Asa begat Jehoshaphat, and Jehoshaphat begat Joram, and Joram begat Uzziah.
      And Uzziah begat Jotham, and Jotham begat Ahaz, and Ahaz begat Hezekiah.
      And Hezekiah begat Manasseh, and Manasseh begat Amos, and Amos begat Josiah,
      and Josiah begat Jechoniah and his brothers at the time of the carrying away to Babylon.
      And after the carrying away to Babylon: Jechoniah begat Shealtiel, and Shealtiel begat Zerubbabel,
      and Zerubbabel begat Abiud, and Abiud begat Eliakim, and Eliakim begat Azor.
      And Azor begat Zadok, and Zadok begat Achim, and Achim begat Eliud.
      And Eliud begat Eleazar, and Eleazar begat Matthan, and Matthan begat Jacob,
      And Jacob begat Joseph, the husband of Mary, of whom was born Jesus, the One being called Christ.
      So all the generations from Abraham to David were fourteen generations, and from David until the carrying away to Babylon fourteen generations, and from the carrying away to Babylon to the Christ fourteen generations.
      Now the birth of Jesus Christ came about in this way: His mother Mary, having been pledged to Joseph, before their coming together, was found holding in womb through the Holy Spirit.
      Then Joseph her husband, being righteous and not willing to shame her publicly, resolved to divorce her quietly.`
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
    event.preventDefault();
    console.log(this.state);
    var _this = this;
    tact.corpus.pivot(this.state.source.split('\n'), this.state.target.split('\n'), function(corpus) {
      var corrections = [];
      function progress(percent) {
        console.log(percent);
      };
      console.log('corpus was submitted: \n', corpus);
      tact.training.train(corpus, corrections,
        function(percent) {
          _this.setState({trainingProgress: percent});
        },
        progress,
        function() { console.log('corpus complete'); },
        function() { console.log('corrections complete'); },
        function() {
          console.log('training complete');
          tact.aligning.align(corpus,
            function(percent) {
              _this.setState({aligningProgress: percent})
            },
            function(alignments) {
              console.log(alignments);
              _this.setState({alignments: alignments});
            }
          );
        }
      );
    });
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <FormGroup controlId="sourceCorpus">
          <ControlLabel>Source Lines:</ControlLabel>
          <FormControl componentClass="textarea" placeholder={this.state.source} onChange={this.handleSourceChange} />
        </FormGroup>
        <FormGroup controlId="targetCorpus">
          <ControlLabel>Target Lines:</ControlLabel>
          <FormControl componentClass="textarea" placeholder={this.state.target} onChange={this.handleTargetChange} />
        </FormGroup>
        <FormGroup controlId="submit">
          <input type="submit" value="Submit" />
        </FormGroup>
        <FormGroup controlId="progress">
          Progress:
          <Progress training={this.state.trainingProgress} aligning={this.state.aligningProgress} />
        </FormGroup>
        <AlignmentsList alignments={this.state.alignments} />
      </form>
    );
  }
}

function Progress(props) {
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

ReactDOM.render(<CorpusForm />, document.getElementById('app'));
