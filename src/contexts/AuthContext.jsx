import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth'
import { auth } from '../config/firebase'
import { createUserProfile, getUserProfile, updateLastLogin } from '../services/userProfile'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

// Check if dev mode is enabled
const isDevMode = import.meta.env.VITE_DEV_MODE === 'true'

// Mock user for dev mode
const mockDevUser = {
  uid: 'dev-user-mock-id',
  email: 'dev@example.com',
  displayName: 'Dev User',
  emailVerified: true,
  photoURL: null,
  providerId: 'dev-mode',
  metadata: {
    creationTime: new Date().toISOString(),
    lastSignInTime: new Date().toISOString()
  }
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // If dev mode is enabled, immediately set mock user
  useEffect(() => {
    if (isDevMode) {
      console.log('🔧 DEV MODE: Authentication bypassed with mock user')
      setCurrentUser(mockDevUser)
      setLoading(false)
    }
  }, [])

  async function signup(email, password) {
    if (isDevMode) {
      console.log('🔧 DEV MODE: Signup bypassed')
      return { user: mockDevUser }
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password)

    // Create user profile in Firestore
    try {
      await createUserProfile(userCredential.user)
    } catch (error) {
      console.error('Error creating user profile:', error)
      // Don't throw - allow signup to succeed even if profile creation fails
    }

    return userCredential
  }

  async function login(email, password) {
    if (isDevMode) {
      console.log('🔧 DEV MODE: Login bypassed')
      return { user: mockDevUser }
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password)

    // Update last login timestamp
    try {
      await updateLastLogin(userCredential.user.uid)
    } catch (error) {
      console.error('Error updating last login:', error)
    }

    return userCredential
  }

  function logout() {
    if (isDevMode) {
      console.log('🔧 DEV MODE: Logout bypassed')
      return Promise.resolve()
    }
    return signOut(auth)
  }

  async function loginWithGoogle() {
    if (isDevMode) {
      console.log('🔧 DEV MODE: Google login bypassed')
      return { user: mockDevUser }
    }

    const provider = new GoogleAuthProvider()
    const userCredential = await signInWithPopup(auth, provider)

    // Check if this is a new user or existing user
    try {
      const existingProfile = await getUserProfile(userCredential.user.uid)

      if (!existingProfile) {
        // New user - create profile with Google info
        const additionalInfo = {
          provider: 'google',
          googleProfile: {
            name: userCredential.user.displayName,
            email: userCredential.user.email,
            photoURL: userCredential.user.photoURL
          }
        }
        await createUserProfile(userCredential.user, additionalInfo)
      } else {
        // Existing user - just update last login
        await updateLastLogin(userCredential.user.uid)
      }
    } catch (error) {
      console.error('Error handling Google sign-in profile:', error)
    }

    return userCredential
  }

  useEffect(() => {
    // Skip Firebase auth state listener in dev mode
    if (isDevMode) {
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  async function getAuthHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    }

    // Skip token in dev mode
    if (isDevMode) {
      return headers
    }

    // Get Firebase ID token if user is logged in
    if (currentUser && typeof currentUser.getIdToken === 'function') {
      try {
        const idToken = await currentUser.getIdToken()
        headers['Authorization'] = `Bearer ${idToken}`
      } catch (error) {
        console.warn('Failed to get Firebase ID token:', error)
      }
    }

    return headers
  }

  const value = {
    currentUser,
    signup,
    login,
    logout,
    loginWithGoogle,
    getAuthHeaders
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}