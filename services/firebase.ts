import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

// Debug: Log environment variables (remove in production)
console.log("Firebase Config Debug:", {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "✓ Set" : "✗ Missing",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? "✓ Set" : "✗ Missing",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? "✓ Set" : "✗ Missing",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? "✓ Set" : "✗ Missing",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? "✓ Set" : "✗ Missing",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? "✓ Set" : "✗ Missing",
})

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

// Validate required fields
const requiredFields = ["apiKey", "authDomain", "projectId", "appId"]
const missingFields = requiredFields.filter((field) => !firebaseConfig[field as keyof typeof firebaseConfig])

if (missingFields.length > 0) {
  console.error("Missing Firebase configuration fields:", missingFields)
  console.error("Current config:", firebaseConfig)
  console.error("Make sure your .env.local file is in the root directory and restart the dev server")
  throw new Error(`Missing Firebase configuration: ${missingFields.join(", ")}`)
}

// Initialize Firebase
let app: any = null
let auth: any = null
let db: any = null
let storage: any = null

try {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = getFirestore(app)
  storage = getStorage(app)
  console.log("✅ Firebase initialized successfully")
} catch (error) {
  console.error("❌ Firebase initialization failed:", error)
  throw error
}

export { auth, db, storage }
export default app
