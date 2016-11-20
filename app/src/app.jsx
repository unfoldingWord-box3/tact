
var React = require('react');
var ReactDOM = require('react-dom');
var localforage = require('localforage');
var tact = require('../../tact/tact.js');

function Alignment(props) {
  const alignment = props.alignment;
  const phrases = alignment.map((phrase, index) =>
    <ul key={index} className='phrase'>
      <li>{phrase[0]}</li>
      <li>{phrase[1]}</li>
      <li>{phrase[2]}</li>
    </ul>
  );
  return (
    <div className='segment'>{phrases}</div>
  );
}

function AlignmentsList(props) {
  const alignments = props.alignments;
  var i = 0;
  const listAlignment = alignments.map((alignment, index) =>
    <li className='alignment' key={index}><Alignment alignment={alignment} /></li>
  );
  return (
    <ul id='alignments'>{listAlignment}</ul>
  );
}

class CorpusForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
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
      Ὀζίας δὲ ἐγέννησεν τὸν Ἰωαθάμ, Ἰωαθὰμ δὲ ἐγέννησεν τὸν Ἄχαζ, Ἄχαζ δὲ ἐγέννησεν τὸν Ἑζεκίαν,`,
      target: `BLB - Berean Literal Bible
      The book of the genealogy of Jesus Christ, son of David, son of Abraham:
      Abraham begat Isaac, and Isaac begat Jacob, and Jacob begat Judah and his brothers.
      And Judah begat Perez and Zerah out of Tamar, and Perez begat Hezron, and Hezron begat Ram.
      And Ram begat Amminadab, and Amminadab begat Nahshon, and Nahshon begat Salmon.
      And Salmon begat Boaz out of Rahab, and Boaz begat Obed out of Ruth, and Obed begat Jesse,
      and Jesse begat David the king. Next: David begat Solomon, out of the wife of Uriah,
      and Solomon begat Rehoboam, and Rehoboam begat Abijah, and Abijah begat Asa.
      And Asa begat Jehoshaphat, and Jehoshaphat begat Joram, and Joram begat Uzziah.
      And Uzziah begat Jotham, and Jotham begat Ahaz, and Ahaz begat Hezekiah.`
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
      tact.training.train(corpus, corrections, progress, progress,
        function() { console.log('corpus complete'); },
        function() { console.log('corrections complete'); },
        function() {
          console.log('training complete');
          tact.aligning.align(corpus, progress, function(alignments) {
            console.log(alignments);
            _this.setState({alignments: alignments});
          });
        }
      );
    });
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
        <AlignmentsList alignments={this.state.alignments}/>
      </form>
    );
  }
}




ReactDOM.render(<CorpusForm />, document.getElementById('app'));
