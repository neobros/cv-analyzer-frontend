import React from "react";
import cx from "classnames";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import s from "./Sidebar.module.scss";
import LinksGroup from "./LinksGroup";

import { changeActiveSidebarItem } from "../../actions/navigation";
import HomeIcon from "../Icons/SidebarIcons/HomeIcon";
import TypographyIcon from "../Icons/SidebarIcons/TypographyIcon";
import TablesIcon from "../Icons/SidebarIcons/TablesIcon";
import NotificationsIcon from "../Icons/SidebarIcons/NotificationsIcon";

class Sidebar extends React.Component {
  static propTypes = {
    sidebarStatic: PropTypes.bool,
    sidebarOpened: PropTypes.bool,
    dispatch: PropTypes.func.isRequired,
    activeItem: PropTypes.string,
    location: PropTypes.shape({
      pathname: PropTypes.string
    }).isRequired
  };

  static defaultProps = {
    sidebarStatic: false,
    activeItem: ""
  };

  componentDidMount() {
    this.element.addEventListener("transitionend", () => {
      if (this.props.sidebarOpened) {
        this.element.classList.add(s.sidebarOpen);
      }
    }, false);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.sidebarOpened !== this.props.sidebarOpened) {
      if (nextProps.sidebarOpened) {
        this.element.style.height = `${this.element.scrollHeight}px`;
      } else {
        this.element.classList.remove(s.sidebarOpen);
        setTimeout(() => {
          this.element.style.height = "";
        }, 0);
      }
    }
  }

  render() {
    return (
      <nav
        className={cx(s.root)}
        ref={(nav) => {
          this.element = nav;
        }}
      >
        <header className={s.logo}>
          <a href="#/app/main/dashboard">CV <span className="fw-bold">Analyzer</span></a>
        </header>
        <ul className={s.nav}>
          <LinksGroup
            onActiveSidebarItemChange={(activeItem) => this.props.dispatch(changeActiveSidebarItem(activeItem))}
            activeItem={this.props.activeItem}
            header="Overview"
            isHeader
            iconName={<HomeIcon className={s.menuIcon} />}
            link="/app/main/dashboard"
            index="dashboard"
          />
          <LinksGroup
            onActiveSidebarItemChange={(activeItem) => this.props.dispatch(changeActiveSidebarItem(activeItem))}
            activeItem={this.props.activeItem}
            header="CV Analyzer"
            isHeader
            iconName={<TypographyIcon className={s.menuIcon} />}
            link="/app/main/analyzer"
            index="analyzer"
          />
          <LinksGroup
            onActiveSidebarItemChange={(activeItem) => this.props.dispatch(changeActiveSidebarItem(activeItem))}
            activeItem={this.props.activeItem}
            header="Country Coverage"
            isHeader
            iconName={<TablesIcon className={s.menuIcon} />}
            link="/app/main/country-coverage"
            index="country-coverage"
          />
          <LinksGroup
            onActiveSidebarItemChange={(activeItem) => this.props.dispatch(changeActiveSidebarItem(activeItem))}
            activeItem={this.props.activeItem}
            header="CV Queue"
            isHeader
            iconName={<NotificationsIcon className={s.menuIcon} />}
            link="/app/main/cv-queue"
            index="cv-queue"
          />
          <LinksGroup
            onActiveSidebarItemChange={(activeItem) => this.props.dispatch(changeActiveSidebarItem(activeItem))}
            activeItem={this.props.activeItem}
            header="Workers"
            isHeader
            iconName={<NotificationsIcon className={s.menuIcon} />}
            link="/app/main/admin"
            index="workers"
          />
          <LinksGroup
            onActiveSidebarItemChange={(activeItem) => this.props.dispatch(changeActiveSidebarItem(activeItem))}
            activeItem={this.props.activeItem}
            header="AI Settings"
            isHeader
            iconName={<NotificationsIcon className={s.menuIcon} />}
            link="/app/main/ai-settings"
            index="ai-settings"
          />
        </ul>
      </nav>
    );
  }
}

function mapStateToProps(store) {
  return {
    sidebarOpened: store.navigation.sidebarOpened,
    sidebarStatic: store.navigation.sidebarStatic,
    activeItem: store.navigation.activeItem
  };
}

export default withRouter(connect(mapStateToProps)(Sidebar));
