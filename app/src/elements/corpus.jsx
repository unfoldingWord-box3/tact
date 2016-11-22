var React = require('react');
var localforage = require('localforage');
var tact = require('../../../tact/tact.js');
var FormGroup = require('react-bootstrap').FormGroup;
var ControlLabel = require('react-bootstrap').ControlLabel;
var FormControl = require('react-bootstrap').FormControl;
var Grid = require('react-bootstrap').Grid;
var Row = require('react-bootstrap').Row;
var Col = require('react-bootstrap').Col;

var AlignmentsList = require('./alignment.jsx');
var Progress = require('./progress.jsx');

var corpusSource = `BGB - Berean Greek Bible
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
Ἰωσὴφ δὲ ὁ ἀνὴρ αὐτῆς, δίκαιος ὢν καὶ μὴ θέλων αὐτὴν δειγματίσαι, ἐβουλήθη λάθρᾳ ἀπολῦσαι αὐτήν.`;

var corpusTarget = `BLB - Berean Literal Bible
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
Then Joseph her husband, being righteous and not willing to shame her publicly, resolved to divorce her quietly.`;

var correctionsSource = `Βίβλος
γενέσεως
Ἰησοῦ
Χριστοῦ
υἱοῦ
Δαυὶδ
υἱοῦ
Ἀβραάμ

Ἀβραὰμ
ἐγέννησεν
τὸν Ἰσαάκ
δὲ
Ἰσαὰκ
ἐγέννησεν
τὸν Ἰακώβ
Ἰακὼβ
δὲ
ἐγέννησεν
τὸν Ἰούδαν
καὶ
τοὺς ἀδελφοὺς
αὐτοῦ

του`;

var correctionsTarget = `The book of
the genealogy of
Jesus
Christ
son of
David
son of
Abraham

Abraham
begat
Isaac
and
Isaac
begat
Jacob
Jacob
and
begat
Judah
and
brothers
his

the`;

class CorpusForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      trainingProgress: 0,
      aligningProgress: 0,
      alignments: [],
      corpusSource: corpusSource,
      corpusTarget: corpusTarget,
      correctionsSource: correctionsSource,
      correctionsTarget: correctionsTarget
    };

    this.handleCorpusSourceChange = this.handleCorpusSourceChange.bind(this);
    this.handleCorpusTargetChange = this.handleCorpusTargetChange.bind(this);
    this.handleCorrectionsSourceChange = this.handleCorrectionsSourceChange.bind(this);
    this.handleCorrectionsTargetChange = this.handleCorrectionsTargetChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleCorpusSourceChange(event) {
    this.setState({corpusSource: event.target.value});
  }
  handleCorpusTargetChange(event) {
    this.setState({corpusTarget: event.target.value});
  }
  handleCorrectionsSourceChange(event) {
    this.setState({correctionsSource: event.target.value});
  }
  handleCorrectionsTargetChange(event) {
    this.setState({correctionsTarget: event.target.value});
  }

  handleSubmit(event) {
    event.preventDefault();
    console.log(this.state);
    var _this = this;
    tact.corpus.pivot(_this.state.corpusSource.split('\n'), _this.state.corpusTarget.split('\n'), function(corpus) {
      tact.corpus.pivot(_this.state.correctionsSource.split('\n'), _this.state.correctionsTarget.split('\n'), function(corrections) {
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
    });
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <Grid>
          <Row>
            <Col xs={6} md={4}>
              <FormGroup bsSize="small" controlId="sourceCorpus">
                <ControlLabel>Source Lines:</ControlLabel>
                <FormControl componentClass="textarea" placeholder={this.state.corpusSource} onChange={this.handleCorpusSourceChange} />
              </FormGroup>
            </Col>
            <Col xs={6} md={4}>
              <FormGroup bsSize="small" controlId="targetCorpus">
                <ControlLabel>Target Lines:</ControlLabel>
                <FormControl componentClass="textarea" placeholder={this.state.corpusTarget} onChange={this.handleCorpusTargetChange} />
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col xs={6} md={4}>
              <FormGroup bsSize="small" controlId="sourceCorrections">
                <ControlLabel>Source Corrections:</ControlLabel>
                <FormControl componentClass="textarea" placeholder={this.state.correctionsSource} onChange={this.handleCorrectionsSourceChange} />
              </FormGroup>
            </Col>
            <Col xs={6} md={4}>
              <FormGroup bsSize="small" controlId="targetCorrections">
                <ControlLabel>Target Corrections:</ControlLabel>
                <FormControl componentClass="textarea" placeholder={this.state.correctionsTarget} onChange={this.handleCorrectionsTargetChange} />
              </FormGroup>
            </Col>
          </Row>
        </Grid>
        <FormGroup controlId="submit">
          <input type="submit" value="Submit" />
        </FormGroup>
        <FormGroup controlId="progress">
          <ControlLabel>Progress:</ControlLabel>
          <Progress training={this.state.trainingProgress} aligning={this.state.aligningProgress} />
        </FormGroup>
        <AlignmentsList alignments={this.state.alignments} />
      </form>
    );
  }
}
module.exports = CorpusForm;
