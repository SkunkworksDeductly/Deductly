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

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  async function signup(email, password) {
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
    return signOut(auth)
  }

  async function loginWithGoogle() {
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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value = {
    currentUser,
    signup,
    login,
    logout,
    loginWithGoogle
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}