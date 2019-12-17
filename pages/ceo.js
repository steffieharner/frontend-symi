/* eslint-disable react/prop-types */
/* eslint-disable react/no-unescaped-entities */
//components
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import Dashboard from '../components/ceoPage/Dashboard';
import Assignments from '../components/Assignments';
import Polls from '../components/Polls';
import News from '../components/News';
import Invites from '../components/Invites';
import About from '../components/About';

//styles
import '../styles/CEO.css';

//utils
import axios from 'axios';

//context API
import { CeoProvider } from '../contextApi/CeoContext';

//sweet alert
import swal from '@sweetalert/with-react';
import '../assets/sweetalert.min.js';

// dummy data
import { topEmployees } from '../assets/dummyData';

export default class Ceo extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentlyShown: 'dashboard',
      topEmployees: null,
      topDepartments: [
        { name: 'Engineering', points: 5500 },
        { name: 'Operations', points: 7000 },
        { name: 'Admin', points: 200 },
        { name: 'Marketing', points: 2300 },
        { name: 'Sales', points: 5000 },
        { name: 'QA', points: 5000 },
        { name: 'Part-Time', points: 5000 }
      ],
      topEmployeeFeedbacks: null,
      goodFeedbacks: null,
      mehFeedbacks: null,
      sadFeedbacks: null,
      feedbacksByFeelingRatio: null,
      news: null,
      userType: 'CEO',
      userId: '',
      token: ''
    };
  }

  componentDidMount() {
    //make an API call to db to get top employees data for dashboard
    //make an API call to get all feedbacks
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    this.setState({ token, userId }, () => {
      //API call to get all feedbacks
      this.getFeedbacks();

      //API call to db to get top employees data for dashboard
      this.getTopEmployees();

      this.getPositiveFeedbacks();

      this.getNews();
    });
  }

  //////////////////////// NEWS
  getNews = async () => {
    const res = await axios.get('https://symi-be.herokuapp.com/auth/news',{ headers: { token: this.state.token } });

    const news = res.data;

    this.setState({news});
  }

  //////////////////////// TOP RATED EMPLOYEES
  getTopEmployees = async () => {


    const res = await axios.get(
      'https://symi-be.herokuapp.com/auth/points',
      { headers: { token: this.state.token } }
    );
    const topEmployees = res.data;

    console.log({ topEmployees });

    this.setState({
      topEmployees
    });
  };

getPositiveFeedbacks = async () => {
  const res = await axios.get('https://symi-be.herokuapp.com/auth/feedbacks?feeling=good', { headers: { token: this.state.token } });
  const topEmployeeFeedbacks = res.data;

  console.log({topEmployeeFeedbacks});

  this.setState({topEmployeeFeedbacks});
}

  //////////////////////// OVERALL SENTIMENT
  getFeedbacks = async () => {
    //good fb
    const responseGood = await axios.get(
      'https://symi-be.herokuapp.com/auth/feedbacks?feeling=good',
      { headers: { token: this.state.token } }
    );
    //meh fb
    const responseMeh = await axios.get(
      'https://symi-be.herokuapp.com/auth/feedbacks?feeling=meh',
      { headers: { token: this.state.token } }
    );
    //sad fb
    const responseSad = await axios.get(
      'https://symi-be.herokuapp.com/auth/feedbacks?feeling=sad',
      { headers: { token: this.state.token } }
    );

    //create feedbacks ratio by feelings
    const feedbacksByFeelingRatio = [
      { name: '😊', value: 0, feeling: 'good' },
      { name: '😐', value: 0, feeling: 'meh' },
      { name: '😞', value: 0, feeling: 'sad' }
    ];

    feedbacksByFeelingRatio[0].value = responseGood.data.length;
    feedbacksByFeelingRatio[1].value = responseMeh.data.length;
    feedbacksByFeelingRatio[2].value = responseSad.data.length;

    console.log(feedbacksByFeelingRatio);

    this.setState({
      feedbacksByFeelingRatio,
      goodFeedbacks: responseGood.data,
      mehFeedbacks: responseMeh.data,
      sadFeedbacks: responseSad.data
    });
  };

  handleGetKeywords = async feeling => {
    let notes;
    switch (feeling) {
    case 'good':
      notes = this.state.goodFeedbacks.map(feedback => feedback.note);
      break;
    case 'meh':
      notes = this.state.mehFeedbacks.map(feedback => feedback.note);
      break;
    default:
      notes = this.state.sadFeedbacks.map(feedback => feedback.note);
      break;
    }
    const requestBody = {
      input_data: notes,
      input_type: 'text',
      N: 10
    };
    const response = await axios.post(
      'https://unfound-keywords-extraction-v1.p.rapidapi.com/extraction/keywords',
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-rapidapi-host': 'unfound-keywords-extraction-v1.p.rapidapi.com',
          'x-rapidapi-key': '0fcf27c58cmsh752c22710d8ecb1p13fbc9jsnc1a867c65634'
        }
      }
    );
    swal({
      title: feeling === 'good' ? 'Positive Feedback' : 'Negative Feedback',
      button: true,
      content: (
        <div>
          {response.data.result.join(', ')}
        </div>
      )
    });
    // .then((val) => {
    //   return axios.patch('https://symi-be.herokuapp.com/feedbacks/status');
    // });
  };

  //decide which component to render
  handleComponentView = view => {
    this.setState({
      currentlyShown: view
    });
  };

  handleSendInvitation = invitationObj => {
    //make an API call to create an invitation
    console.log(invitationObj, ' invitation was sent');
  };

  renderSwitchView = param => {
    switch (param) {
    case 'news':
      return <News />;
    case 'dashboard':
      return <Dashboard
      />;
    case 'assignments':
      return <Assignments /> ;
    case 'polls':
      return <Polls /> ;
    case 'invites':
      return <Invites /> ;
    case 'about':
      return <About /> ;
    default:
      null;
    }
  };

  render() {
    return (
      <CeoProvider value={{ userType: this.state.userType,
        news: this.state.news,
        assignments: true,
        polls: true,
        dashboard: true,
        invites: true,
        topEmployeeFeedbacks: this.state.topEmployeeFeedbacks,
        topEmployees: this.state.topEmployees,
        overallSentiment: this.state.feedbacksByFeelingRatio,
        topDepartments: this.state.topDepartments,
        handleCeoComponentView: this.handleComponentView,
        handleSendInvitation: this.handleSendInvitation,
        handleGetKeywords: this.handleGetKeywords
      }}>
        <div className="layout">
          <Navbar />
          <Sidebar
          />
          <div id="page">{this.renderSwitchView(this.state.currentlyShown)}</div>
        </div>
      </CeoProvider>
    );
  }
}
