import axios from 'axios';
import { BASE_URL, USER_TOKEN_NAME } from './base';
import Cookies from 'js-cookie';
import { BasicDataResponse, GetAdviseesResponse, LoginResponse, RegisterResponse } from '../../../server/typings/user';

/**
 * Register a user. Also stores the user's token in a cookie.
 * 
 * @param email The user's email.
 * @param name The user's name.
 * @param password The user's password. This should already be confirmed with a confirm password field.
 */
async function register(email: string, name: string, password: string): Promise<RegisterResponse> {
  const { data } = await axios.post<RegisterResponse>(BASE_URL + '/user/register', { email, name, password });
  Cookies.set(USER_TOKEN_NAME, data.token, { expires: 30 });
  return data;
}

/**
 * Login to an account. Also stores the user's token in a cookie.
 * 
 * @param email The user's provided email.
 * @param password The user's password.
 * @throws {AxiosError} If the username or password is invalid, or if the server errors.
 */
async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await axios.post<LoginResponse>(BASE_URL + '/user/login', { email, password });
  Cookies.set(USER_TOKEN_NAME, data.token, { expires: 30 });
  return data;
}

/**
 * Log the user out if one is logged in (by deleting the cookie). Does nothing if a user is not currently logged in.
 */
function logout(): void {
  Cookies.remove(USER_TOKEN_NAME);
}

/**
 * Checks if the user is already logged in (they have a cookie set).
 * 
 * @param [checkServer=true] True if the function should check in with the server to determine if the token is valid (defaults to true).
 * @returns True if the user has a valid token.
 */
async function isLoggedIn(checkServer = true): Promise<boolean> {
  const token = Cookies.get(USER_TOKEN_NAME);
  if (!token) {
    return false;
  }

  if (checkServer && !await isTokenValid(token)) {
    Cookies.remove(USER_TOKEN_NAME);
    return false;
  }

  return true;
}

/**
 * Check with the server to see if a token is valid.
 * 
 * @param token The token to check for validity.
 * @returns True if the token is valid, or false otherwise.
 */
async function isTokenValid(token: string): Promise<boolean> {
  try {
    await axios.get(BASE_URL + '/user/isTokenValid', {
      headers: {
        'Authorization': token
      }
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get all of the advisees of the currently logged in faculty member.
 * 
 * @returns All of the advisees of the faculty.
 * @throws {AxiosError} If an error is recieved from the server, if the user is not a faculty, or if the user is not logged in.
 */
async function getAdvisees(): Promise<GetAdviseesResponse> {
  if (!await isLoggedIn(false)) {
    throw new Error('User not logged in');
  }

  const response = await axios.get<GetAdviseesResponse>(BASE_URL + '/user/getAdvisees', {
    headers: {
      'Authorization': Cookies.get(USER_TOKEN_NAME)
    }
  });

  return response.data;
}

/**
 * Get the basic data of the currently logged in user.
 * 
 * @returns The user's basic data.
 * @throws {AxiosError} If an error is recieved from the server, if the user is not a faculty, or if the user is not logged in.
 */
async function basicData(): Promise<BasicDataResponse> {
  if (!await isLoggedIn(false)) {
    throw new Error('User not logged in');
  }

  const response = await axios.get<BasicDataResponse>(BASE_URL + '/user/basicData', {
    headers: {
      'Authorization': Cookies.get(USER_TOKEN_NAME)
    }
  });

  return response.data;
}

const userApi = {
  register,
  login,
  logout,
  isLoggedIn,
  isTokenValid,
  getAdvisees,
  basicData
};

export default userApi;