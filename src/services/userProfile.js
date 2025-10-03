import { db } from '../config/firebase'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import api from './api'

/**
 * Creates a user profile in Firestore with available user information and geolocation data
 *
 * @param {Object} user - Firebase auth user object
 * @param {Object} additionalInfo - Any additional user information (e.g., from Google sign-in)
 * @returns {Promise} - Resolves when profile is created
 */
export async function createUserProfile(user, additionalInfo = {}) {
  if (!user || !user.uid) {
    throw new Error('User object is required to create profile')
  }

  try {
    // Get geolocation data from backend (IP-based)
    let geoData = {}
    try {
      const geoResponse = await api.get('/user-profile/geolocation')
      if (geoResponse && geoResponse.status === 'success') {
        geoData = {
          country: geoResponse.country || null,
          countryCode: geoResponse.countryCode || null,
          region: geoResponse.regionName || null,
          city: geoResponse.city || null,
          timezone: geoResponse.timezone || null,
          latitude: geoResponse.lat || null,
          longitude: geoResponse.lon || null,
          ip: geoResponse.ip || null
        }
      }
    } catch (geoError) {
      console.warn('Failed to fetch geolocation data:', geoError)
    }

    // Build profile data
    const profileData = {
      // User identification
      uid: user.uid,
      email: user.email,

      // User information from auth provider
      displayName: user.displayName || additionalInfo.displayName || null,
      photoURL: user.photoURL || additionalInfo.photoURL || null,
      phoneNumber: user.phoneNumber || additionalInfo.phoneNumber || null,

      // Authentication metadata
      emailVerified: user.emailVerified,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),

      // Geolocation data
      location: geoData,

      // User preferences and settings (empty for now, can be updated later)
      preferences: {
        notifications: true,
        theme: 'light',
        language: 'en'
      },

      // Learning progress tracking (initialize empty)
      progress: {
        diagnosticsTaken: 0,
        studyPlansCreated: 0,
        drillsCompleted: 0,
        totalStudyTime: 0
      },

      // Additional metadata
      metadata: {
        platform: navigator.platform || 'unknown',
        userAgent: navigator.userAgent || 'unknown',
        ...additionalInfo
      }
    }

    // Create document in Firestore
    const userRef = doc(db, 'users', user.uid)
    await setDoc(userRef, profileData)

    console.log('User profile created successfully:', user.uid)
    return profileData
  } catch (error) {
    console.error('Error creating user profile:', error)
    throw error
  }
}

/**
 * Gets a user profile from Firestore
 *
 * @param {string} uid - User ID
 * @returns {Promise<Object>} - User profile data
 */
export async function getUserProfile(uid) {
  if (!uid) {
    throw new Error('User ID is required to get profile')
  }

  try {
    const userRef = doc(db, 'users', uid)
    const userSnap = await getDoc(userRef)

    if (userSnap.exists()) {
      return userSnap.data()
    } else {
      return null
    }
  } catch (error) {
    console.error('Error getting user profile:', error)
    throw error
  }
}

/**
 * Updates user's last login timestamp and geolocation data
 *
 * @param {string} uid - User ID
 * @returns {Promise} - Resolves when update is complete
 */
export async function updateLastLogin(uid) {
  if (!uid) return

  try {
    // Get fresh geolocation data from IP
    let geoData = {}
    try {
      const geoResponse = await api.get('/user-profile/geolocation')
      if (geoResponse && geoResponse.status === 'success') {
        geoData = {
          country: geoResponse.country || null,
          countryCode: geoResponse.countryCode || null,
          region: geoResponse.regionName || null,
          city: geoResponse.city || null,
          timezone: geoResponse.timezone || null,
          latitude: geoResponse.lat || null,
          longitude: geoResponse.lon || null,
          ip: geoResponse.ip || null
        }
      }
    } catch (geoError) {
      console.warn('Failed to fetch geolocation data on login:', geoError)
    }

    const userRef = doc(db, 'users', uid)
    const updateData = {
      lastLogin: serverTimestamp()
    }

    // Only update location if we successfully fetched it
    if (Object.keys(geoData).length > 0) {
      updateData.location = geoData
    }

    await setDoc(userRef, updateData, { merge: true })
  } catch (error) {
    console.error('Error updating last login:', error)
    // Don't throw - this is not critical
  }
}
