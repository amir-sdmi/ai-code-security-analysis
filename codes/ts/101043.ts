// A large portion of this code was written by chatgpt
import { auth } from './firebase';

const challenge = Uint8Array.from(window.crypto.getRandomValues(new Uint8Array(32)));

export interface Credential {
  userHandle: string;
  credentialId: string;
}

export async function register(): Promise<Credential | null> {
  try {
    const userHandle = Uint8Array.from(window.crypto.getRandomValues(new Uint8Array(32)));
    const currentUser = auth.currentUser;
    const publicKey: PublicKeyCredentialCreationOptions = {
      challenge, // Not really necessary since this is 100% local
      rp: {
        name: 'Factor',
      },
      user: {
        id: userHandle, // This is both our userid, but also our encryption secret
        name: currentUser?.email || 'user@email.com',
        displayName: currentUser?.displayName || 'User',
      },

      pubKeyCredParams: [{ type: 'public-key', alg: -7 }],

      authenticatorSelection: {
        requireResidentKey: true,
      },
    };

    const credential = (await navigator.credentials.create({ publicKey })) as PublicKeyCredential;

    return { userHandle: arrayBufferToBase64(userHandle), credentialId: arrayBufferToBase64(credential.rawId) };
  } catch (error) {
    console.error('Error registering credential:', error);
  }

  return null;
}

export async function authenticate(credentialId: string): Promise<string | null> {
  try {
    const id = base64ToArrayBuffer(credentialId);
    const publicKey: PublicKeyCredentialRequestOptions = {
      challenge,
      allowCredentials: [{ type: 'public-key', id }],
    };

    const credential = (await navigator.credentials.get({ publicKey })) as PublicKeyCredential;

    if (credential?.response) {
      return arrayBufferToBase64((credential.response as any).userHandle);
    }
  } catch (error) {
    console.error('Error authenticating:', error);
  }

  return null;
}

function arrayBufferToString(buffer: ArrayBuffer): string {
  const uint8Array = new Uint8Array(buffer);
  const array = Array.from(uint8Array);
  return String.fromCharCode.apply(null, array);
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return btoa(arrayBufferToString(buffer));
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const length = binaryString.length;
  const buffer = new ArrayBuffer(length);
  const bufferView = new Uint8Array(buffer);
  for (let i = 0; i < length; i++) {
    bufferView[i] = binaryString.charCodeAt(i);
  }
  return buffer;
}
