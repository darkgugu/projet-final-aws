import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute
} from 'amazon-cognito-identity-js';

const POOL_DATA = {
  UserPoolId: 'eu-west-3_7vPJsbWka',
  ClientId: '3kko2id5mk9crti5rbrdblh4h4'
};

const userPool = new CognitoUserPool(POOL_DATA);

// --- Helpers ---

const decodeJwtPayload = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
};

const extractUserFromSession = (session) => {
  const idToken = session.getIdToken().getJwtToken();
  const payload = decodeJwtPayload(idToken);
  if (!payload) return null;

  const groups = payload['cognito:groups'] || [];
  const role = groups.includes('admin') ? 'admin' : 'client';

  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name || payload.email,
    role,
    groups
  };
};

// --- Public API ---

export const login = (email, password) => {
  return new Promise((resolve, reject) => {
    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool
    });

    const authDetails = new AuthenticationDetails({
      Username: email,
      Password: password
    });

    cognitoUser.authenticateUser(authDetails, {
      onSuccess: (session) => {
        const user = extractUserFromSession(session);
        localStorage.setItem('user', JSON.stringify(user));
        resolve({ user, token: session.getIdToken().getJwtToken() });
      },
      onFailure: (err) => {
        reject(err);
      },
      newPasswordRequired: () => {
        reject(new Error('NEW_PASSWORD_REQUIRED'));
      }
    });
  });
};

export const register = ({ givenName, familyName, email, password, birthdate, phoneNumber }) => {
  return new Promise((resolve, reject) => {
    const attributes = [
      new CognitoUserAttribute({ Name: 'email', Value: email }),
      new CognitoUserAttribute({ Name: 'name', Value: `${givenName} ${familyName}` }),
      new CognitoUserAttribute({ Name: 'given_name', Value: givenName }),
      new CognitoUserAttribute({ Name: 'family_name', Value: familyName }),
      new CognitoUserAttribute({ Name: 'birthdate', Value: birthdate }),
      new CognitoUserAttribute({ Name: 'phone_number', Value: phoneNumber })
    ];

    userPool.signUp(email, password, attributes, null, (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(result);
    });
  });
};

export const confirmAccount = (email, code) => {
  return new Promise((resolve, reject) => {
    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool
    });

    cognitoUser.confirmRegistration(code, true, (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(result);
    });
  });
};

export const logout = () => {
  const cognitoUser = userPool.getCurrentUser();
  if (cognitoUser) {
    cognitoUser.signOut();
  }
  localStorage.removeItem('user');
};

export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  return JSON.parse(userStr);
};

export const refreshSession = () => {
  return new Promise((resolve, reject) => {
    const cognitoUser = userPool.getCurrentUser();
    if (!cognitoUser) {
      resolve(null);
      return;
    }

    cognitoUser.getSession((err, session) => {
      if (err || !session || !session.isValid()) {
        localStorage.removeItem('user');
        resolve(null);
        return;
      }

      const user = extractUserFromSession(session);
      localStorage.setItem('user', JSON.stringify(user));
      resolve(user);
    });
  });
};

export const isAuthenticated = () => {
  return !!getCurrentUser();
};

export const isAdmin = () => {
  const user = getCurrentUser();
  return user?.role === 'admin';
};
