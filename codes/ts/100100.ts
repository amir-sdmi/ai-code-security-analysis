import '#auth-utils';

declare module '#auth-utils' {
  interface User {
    id: string;
    email?: string;
    username?: string;
    authMethod?: 'password' | 'webauthn' | 'oauth'; // What is 'magic-link' suggested by chatgpt?
  }

  declare interface UserSession {
    loggedInAt: ReturnType<typeof Date.now>;
  }

  // interface SecureSessionData {
  //   // Add your own fields
  // }
}

export {};
