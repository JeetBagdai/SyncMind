// src/services/auth.js
// Auth utility — get current user token for API calls

import { auth } from '../firebase'

export const getToken = async () => {
  const user = auth.currentUser
  if (!user) return null
  return user.getIdToken()
}
