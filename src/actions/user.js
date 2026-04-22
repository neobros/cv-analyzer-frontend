import { clearStoredAuth, loginRequest, setStoredAuth } from '../api';

export const LOGIN_SUCCESS = 'LOGIN_SUCCESS';
export const LOGIN_FAILURE = 'LOGIN_FAILURE';
export const LOGIN_REQUEST = 'LOGIN_REQUEST';
export const LOGOUT_REQUEST = 'LOGOUT_REQUEST';
export const LOGOUT_SUCCESS = 'LOGOUT_SUCCESS';

function requestLogin() {
    return {
        type: LOGIN_REQUEST,
    };
}

export function receiveLogin(payload) {
    return {
        type: LOGIN_SUCCESS,
        payload,
    };
}

function loginError(payload) {
    return {
        type: LOGIN_FAILURE,
        payload,
    };
}

function requestLogout() {
    return {
        type: LOGOUT_REQUEST,
    };
}

export function receiveLogout() {
    return {
        type: LOGOUT_SUCCESS,
    };
}

// Logs the user out
export function logoutUser() {
    return (dispatch) => {
        dispatch(requestLogout());
        clearStoredAuth();
        dispatch(receiveLogout());
    };
}

export function loginUser(creds) {
    return async (dispatch) => {
        dispatch(requestLogin());
        try {
            const data = await loginRequest(creds);
            setStoredAuth(data);
            dispatch(receiveLogin(data.user));
        } catch (error) {
            dispatch(loginError(error.message || 'Something was wrong. Try again'));
        }
    };
}
