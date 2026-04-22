import { connect } from "react-redux";
import React from "react";
import PropTypes from "prop-types";
import { withRouter } from "react-router";
import {
  Navbar,
  Nav,
  NavItem,
  NavLink,
  Badge
} from "reactstrap";
import PowerIcon from "../Icons/HeaderIcons/PowerIcon";
import BurgerIcon from "../Icons/HeaderIcons/BurgerIcon";

import { logoutUser } from "../../actions/user";
import {
  openSidebar,
  closeSidebar
} from "../../actions/navigation";

import s from "./Header.module.scss";
import "animate.css";

function formatRole(role) {
  if (!role) return "Account";

  return role
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getInitials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return "U";
  }

  return parts.map((part) => part.charAt(0).toUpperCase()).join("");
}

function getAvatarStyle(seed) {
  const palette = [
    ["#7cf7d5", "#2c77ff"],
    ["#8de7ff", "#7b61ff"],
    ["#ffd3a9", "#ff7a59"],
    ["#9bf7b1", "#1d9b6c"]
  ];
  const text = String(seed || "user");
  const hash = text.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const colors = palette[hash % palette.length];

  return {
    background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`
  };
}

class Header extends React.Component {
  static propTypes = {
    dispatch: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);

    this.doLogout = this.doLogout.bind(this);
    this.toggleSidebar = this.toggleSidebar.bind(this);
  }

  doLogout() {
    this.props.dispatch(logoutUser());
  }

  toggleSidebar() {
    this.props.isSidebarOpened
      ? this.props.dispatch(closeSidebar())
      : this.props.dispatch(openSidebar());
  }

  render() {
    const userName = (this.props.user && this.props.user.name) || "User";
    const userRole = formatRole(this.props.user && this.props.user.role);
    const userInitials = getInitials(userName);

    return (
      <Navbar className="d-print-none">
        <div className={s.burger}>
          <NavLink onClick={this.toggleSidebar} className={`d-md-none ${s.navItem} text-white`} href="#">
            <BurgerIcon className={s.headerIcon} />
          </NavLink>
        </div>
        <div className={`d-print-none ${s.root}`}>
          <Nav className="ml-md-0">
            <div className={s.accountToggle}>
              <span
                className={`${s.avatar} rounded-circle thumb-sm float-left`}
                style={getAvatarStyle(userName)}
                aria-label={`${userName} avatar`}
              >
                <span className={s.avatarText}>{userInitials}</span>
              </span>
              <span className={`small d-sm-down-none ${s.accountCheck}`}>{userName}</span>
              <Badge className={`d-sm-down-none ${s.badge}`} color="info">
                {userRole}
              </Badge>
            </div>
            <NavItem>
              <NavLink onClick={this.doLogout} className={`${s.navItem} text-white`} href="#">
                <PowerIcon className={s.headerIcon} />
              </NavLink>
            </NavItem>
          </Nav>
        </div>
      </Navbar>
    );
  }
}

function mapStateToProps(store) {
  return {
    isSidebarOpened: store.navigation.sidebarOpened,
    user: store.auth.user
  };
}

export default withRouter(connect(mapStateToProps)(Header));
