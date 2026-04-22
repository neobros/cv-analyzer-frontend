import React from "react";
import PropTypes from "prop-types";
import { withRouter, Redirect } from "react-router-dom";
import { connect } from "react-redux";
import {
  Container,
  Alert,
  Button,
  FormGroup,
  Label,
  InputGroup,
  InputGroupAddon,
  Input,
  InputGroupText
} from "reactstrap";
import { loginUser } from "../../actions/user";
import { getStoredToken } from "../../api";
import DottedSurface from "../../components/DottedSurface/DottedSurface";
import s from "./Login.module.scss";

class Login extends React.Component {
  static propTypes = {
    dispatch: PropTypes.func.isRequired
  };

  static isAuthenticated(token) {
    if (token) return true;
    return false;
  }

  constructor(props) {
    super(props);

    this.state = {
      email: "",
      password: ""
    };
    this.doLogin = this.doLogin.bind(this);
    this.changeEmail = this.changeEmail.bind(this);
    this.changePassword = this.changePassword.bind(this);
  }

  changeEmail(event) {
    this.setState({ email: event.target.value });
  }

  changePassword(event) {
    this.setState({ password: event.target.value });
  }

  doLogin(e) {
    e.preventDefault();
    this.props.dispatch(loginUser({ email: this.state.email, password: this.state.password }));
  }

  render() {
    const { from } = this.props.location.state || { from: { pathname: "/app" } };

    if (Login.isAuthenticated(getStoredToken())) {
      return <Redirect to={from} />;
    }

    return (
      <div className={s.page}>
        <div className={s.background}>
          <DottedSurface className={s.dottedSurface} />
          <div className={s.surfaceGlow} />
          <div className={s.grid} />
          <div className={s.orbOne} />
          <div className={s.orbTwo} />
          <div className={s.orbThree} />
          <div className={s.rings}>
            <span />
            <span />
            <span />
          </div>
          <div className={s.dataStream}>
            <span>AI MATCH</span>
            <span>CV SCORE</span>
            <span>UNI FINDER</span>
            <span>VISA FIT</span>
          </div>
        </div>
        <Container className={s.content}>
          <div className={s.heroPanel}>
            <div className={s.heroCopy}>
              <div className={s.eyebrow}>AI-Powered Study Migration Platform</div>
              <h1 className={s.title}>
                <span className={s.titleKicker}>AI</span>
                Smart
                <span className={s.titleAccent}> Student Matching</span>
              </h1>
              <div className={s.titleSignal}>
                <span className={s.signalDot} />
                Intelligent profile analysis and university matching
              </div>
            </div>
            <div className={s.loginCard}>
              <div className={s.cardGlow} />
              <div className={s.cardBadge}>Secure Workspace Access</div>
              <h3 className={s.cardTitle}>Login to CV Analyzer</h3>
              <p className={s.cardText}>
                Sign in with your company account to continue.
              </p>
              <form onSubmit={this.doLogin}>
              {this.props.errorMessage && (
                <Alert className={s.alertBox} color="danger">
                  {this.props.errorMessage}
                </Alert>
              )}
              <FormGroup className={s.formGroup}>
                <Label for="email">Email</Label>
                <InputGroup className={s.inputGroup}>
                  <InputGroupAddon addonType="prepend">
                    <InputGroupText className={s.inputIcon}>
                      <i className="la la-user" />
                    </InputGroupText>
                  </InputGroupAddon>
                  <Input
                    id="email"
                    className={s.input}
                    value={this.state.email}
                    onChange={this.changeEmail}
                    type="email"
                    required
                    name="email"
                    placeholder="Email"
                  />
                </InputGroup>
              </FormGroup>
              <FormGroup className={s.formGroup}>
                <Label for="password">Password</Label>
                <InputGroup className={s.inputGroup}>
                  <InputGroupAddon addonType="prepend">
                    <InputGroupText className={s.inputIcon}>
                      <i className="la la-lock" />
                    </InputGroupText>
                  </InputGroupAddon>
                  <Input
                    id="password"
                    className={s.input}
                    value={this.state.password}
                    onChange={this.changePassword}
                    type="password"
                    required
                    name="password"
                    placeholder="Password"
                  />
                </InputGroup>
              </FormGroup>
              <div className={s.footerArea}>
                <Button type="submit" color="danger" className={s.submitButton}>
                  <span className={s.submitIcon}>
                    <i className="la la-caret-right" />
                  </span>
                  {this.props.isFetching ? "Loading..." : "Login"}
                </Button>
                <div className={s.securityLine}>
                  <span className={s.securityDot} />
                  Super admin and worker access
                </div>
              </div>
            </form>
            </div>
          </div>
        </Container>
        <footer className={s.footer}>
          {new Date().getFullYear()} &copy; CV Analyzer for student migration teams.
        </footer>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    isFetching: state.auth.isFetching,
    isAuthenticated: state.auth.isAuthenticated,
    errorMessage: state.auth.errorMessage
  };
}

export default withRouter(connect(mapStateToProps)(Login));
