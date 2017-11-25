import React from 'react';
import axios from 'axios';
import { Redirect } from 'react-router';
import PropTypes from 'prop-types';

class CreateThread extends React.Component {
  constructor(props) {
    super(props);
    //  Expects username to be handed down from props
    //  Added flag to state that flips upon form submission
    this.state = {
      threadTitle: '1-line summary of your problem',
      threadDescription: 'Please provide more details here',
      isFormSubmitted: false,
    };

    this.submitThread = this.submitThread.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
  }

  submitThread(e) {
    e.preventDefault();
    axios
      .post('/Threads', {
        creator: this.props.username,
        description: this.state.threadDescription,
        title: this.state.threadTitle,
        date: Date.now(),
      })
      .then(() => this.setState({ isFormSubmitted: true }, () => { this.props.refreshData(); }))
      .catch(err => console.error(err));
  }
  //  One method that dynamically handles multiple input forms, depending on their name attribute
  handleInputChange(e) {
    this.setState({ [e.target.name]: e.target.value });
  }

  //  Conditionally redirects to root route when form is submitted
  render() {
    if (this.state.isFormSubmitted) {
      return (
        <Redirect to="/" />
      );
    }
    return (
      <div>
        <form onSubmit={this.submitThread}>
          Enter thread title.
          <input
            type="textbox"
            value={this.state.threadTitle}
            name="threadTitle"
            onChange={this.handleInputChange}
          />
          <br />
          Enter thread description.
          <input
            type="textbox"
            value={this.state.threadDescription}
            name="threadDescription"
            onChange={this.handleInputChange}
          />
          <br />
          <button type="submit">
            Create thread
          </button>
        </form>
      </div>
    );
  }
}

CreateThread.propTypes = {
  username: PropTypes.string.isRequired,
  refreshData: PropTypes.func,
};

CreateThread.defaultProps = {
  refreshData: () => {},
};

export default CreateThread;
