import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, User, KeyRound } from 'lucide-react';

/**
 * LoginPage Component (Real)
 *
 * This is now a real login form. It takes username and password,
 * calls the login function from our AuthContext, and displays
 * loading or error messages.
 */
function LoginPage() {
  const { login, loading, error } = useAuth(); // Get new state from context
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent form from reloading page
    if (!loading) {
      login(username, password);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900">
      <form
        onSubmit={handleSubmit}
        className="p-8 bg-slate-800 rounded-lg shadow-2xl w-full max-w-md"
      >
        
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-blue-600 rounded-full">
            <Shield className="w-16 h-16 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-center text-white mb-2">
          Odisha Police
        </h1>
        <h2 className="text-xl text-center text-blue-400 mb-8">
          Strategic Command Dashboard
        </h2>

        {/* Username Input */}
        <div className="mb-4 relative">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Username
          </label>
          <User className="absolute left-3 top-10 text-slate-400" size={20} />
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g., dgp_odisha"
            className="w-full p-3 pl-11 bg-slate-700 text-white rounded-md border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Password Input */}
        <div className="mb-6 relative">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Password
          </label>
          <KeyRound className="absolute left-3 top-10 text-slate-400" size={20} />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="●●●●●●●●"
            className="w-full p-3 pl-11 bg-slate-700 text-white rounded-md border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-800/50 border border-red-700 text-red-300 rounded-md text-center">
            {error}
          </div>
        )}

        {/* Login Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full p-3 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 transition-colors disabled:bg-slate-500 disabled:cursor-not-allowed"
        >
          {loading ? 'Authenticating...' : 'Login'}
        </button>
        
        <div className="mt-4 text-center text-xs text-slate-500">
          <p>Login with your assigned credentials.</p>
          <p>(Demo User: sp_khordha / sp123)</p>
        </div>

      </form>
    </div>
  );
}

export default LoginPage;