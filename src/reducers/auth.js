import {
     LOGIN_SUCCESS, LOGIN_FAILURE, LOGOUT_SUCCESS, LOGIN_REQUEST,
} from '../actions/user';
import { getStoredToken, getStoredUser } from '../api';

const token = getStoredToken();
const user = getStoredUser();
export default function auth(state = {
    isFetching: false,
    isAuthenticated: !!token,
    user,
}, action) {
    switch (action.type) {
        case LOGIN_REQUEST:
            return Object.assign({}, state, {
                isFetching: true,
                errorMessage: '',
            });
        case LOGIN_SUCCESS:
            return Object.assign({}, state, {
                isFetching: false,
                isAuthenticated: true,
                errorMessage: '',
                user: action.payload,
            });
        case LOGIN_FAILURE:
            return Object.assign({}, state, {
                isFetching: false,
                isAuthenticated: false,
                errorMessage: action.payload,
                user: null,
            });
        case LOGOUT_SUCCESS:
            return Object.assign({}, state, {
                isAuthenticated: false,
                user: null,
            });
        default:
            return state;
    }
}
