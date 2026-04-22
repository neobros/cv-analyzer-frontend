import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Switch, Route, withRouter, Redirect } from "react-router";
import { TransitionGroup, CSSTransition } from "react-transition-group";
import Hammer from "rc-hammerjs";

import Dashboard from "../../pages/dashboard";
import Analyzer from "../../pages/analyzer/Analyzer";
import CountryCoverage from "../../pages/countryCoverage/CountryCoverage";
import TablesStatic from "../../pages/tables/static";
import UINotifications from "../../pages/notifications";
import Charts from "../../pages/components/charts/Charts";

import Header from "../Header";
import Sidebar from "../Sidebar";
import BreadcrumbHistory from "../BreadcrumbHistory";
import DottedSurface from "../DottedSurface/DottedSurface";
import { openSidebar, closeSidebar } from "../../actions/navigation";
import s from "./Layout.module.scss";

class Layout extends React.Component {
  static propTypes = {
    sidebarStatic: PropTypes.bool,
    sidebarOpened: PropTypes.bool,
    dispatch: PropTypes.func.isRequired
  };

  static defaultProps = {
    sidebarStatic: false,
    sidebarOpened: false
  };

  constructor(props) {
    super(props);

    this.state = {
      chatOpen: false
    };

    this.handleSwipe = this.handleSwipe.bind(this);
  }

  handleSwipe(e) {
    if ("ontouchstart" in window) {
      if (e.direction === 4 && !this.state.chatOpen) {
        this.props.dispatch(openSidebar());
        return;
      }

      if (e.direction === 2 && this.props.sidebarOpened) {
        this.props.dispatch(closeSidebar());
        return;
      }

      this.setState({ chatOpen: e.direction === 2 });
    }
  }

  render() {
    return (
      <div
        className={[
          s.root,
          "sidebar-" + this.props.sidebarPosition,
          "sidebar-" + this.props.sidebarVisibility
        ].join(" ")}
      >
        <div className={s.appBackground} aria-hidden="true">
          <DottedSurface className={s.dottedSurface} />
          <div className={s.surfaceGlow} />
        </div>
        <div className={s.wrap}>
          <Header />
          <Sidebar />
          <Hammer onSwipe={this.handleSwipe}>
            <main className={s.content}>
              <BreadcrumbHistory url={this.props.location.pathname} />
              <TransitionGroup>
                <CSSTransition key={this.props.location.key} classNames="fade" timeout={200}>
                  <Switch>
                    <Route path="/app/main" exact render={() => <Redirect to="/app/main/dashboard" />} />
                    <Route path="/app/main/dashboard" exact component={Dashboard} />
                    <Route path="/app/main/analyzer/:analysisId" exact component={Analyzer} />
                    <Route path="/app/main/analyzer" exact component={Analyzer} />
                    <Route path="/app/main/country-coverage" exact component={CountryCoverage} />
                    <Route path="/app/main/cv-queue" exact component={TablesStatic} />
                    <Route path="/app/main/admin" exact component={UINotifications} />
                    <Route path="/app/main/ai-settings" exact component={Charts} />
                  </Switch>
                </CSSTransition>
              </TransitionGroup>
              <footer className={s.contentFooter}>
                CV Analyzer workspace for student migration teams
              </footer>
            </main>
          </Hammer>
        </div>
      </div>
    );
  }
}

function mapStateToProps(store) {
  return {
    sidebarOpened: store.navigation.sidebarOpened,
    sidebarPosition: store.navigation.sidebarPosition,
    sidebarVisibility: store.navigation.sidebarVisibility
  };
}

export default withRouter(connect(mapStateToProps)(Layout));
