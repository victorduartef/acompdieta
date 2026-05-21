import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()

export function initAuth(callback) {
  onAuthStateChanged(auth, (user) => {
    callback(user || null)
  })
}

export async function loginWithGoogle() {
  try {
    // Tenta popup primeiro (funciona no PC e alguns mobiles)
    const result = await signInWithPopup(auth, googleProvider)
    return result.user
  } catch (e) {
    // Se popup falhar (bloqueado no mobile), usa redirect
    if (e.code === 'auth/popup-blocked' || e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') {
      await signInWithRedirect(auth, googleProvider)
    } else {
      throw e
    }
  }
}

export async function handleRedirectResult() {
  try {
    const result = await getRedirectResult(auth)
    return result?.user || null
  } catch (e) {
    console.error('Redirect result error:', e)
    return null
  }
}

export async function logout() {
  await signOut(auth)
}
