import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAnalytics, isSupported } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: "AIzaSyCid9wQZ2q8_HnrZg0_eBBuzVjvvKwdDlk",
  authDomain: "clawdentials.firebaseapp.com",
  projectId: "clawdentials",
  storageBucket: "clawdentials.firebasestorage.app",
  messagingSenderId: "361527168048",
  appId: "1:361527168048:web:53ef00dd89caafae7231f5",
  measurementId: "G-GVRQE692JW"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)

// Initialize Analytics (only in browser, not during SSR/build)
export const initAnalytics = async () => {
  if (typeof window !== 'undefined' && await isSupported()) {
    return getAnalytics(app)
  }
  return null
}

// Export app for other Firebase services
export { app }
