import React, { createContext, useState, useContext, useEffect } from 'react';
import * as api from '../services/API';

// 1. Create the context
const AuthContext = createContext(null);

// 2. Create the provider
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false); // For login loading spinner
  const [error, setError] = useState(null); // To display login errors

  /**
   * login function:
   * Calls the API, sets the user, handles errors.
   */
  const login = async (username, password) => {
    try {
      setLoading(true);
      setError(null);
      const { token, user: userData } = await api.login(username, password);
      setUser(userData); // Set the user object (id, username, role, district)
    } catch (err) {
      console.error("Login failed:", err.response?.data?.error || err.message);
      setError(err.response?.data?.error || "An unknown error occurred.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * logout function:
   * Calls the API service to log out and clears the user state.
   */
  const logout = () => {
    api.logout(); // Clears the token from localStorage
    setUser(null); // Clears the user from React state
  };

  // 3. Provide all values to children
  return (
    <AuthContext.Provider value={{ user, login, logout, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

// 4. Create a simple hook to use this context easily
export const useAuth = () => {
  return useContext(AuthContext);
};