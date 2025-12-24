import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/nightwaka-dark.png';
import loginBg from '../assets/payout9thwaka.png';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user } = response.data;
      if (user) {
        await login(user);
      }
      navigate('/');
    } catch (err) {
      setError('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center p-4"
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      <div className="w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-gray-200">
          <div className="text-center mb-8">
            <img src={logo} alt="9thWaka Logo" className="w-48 mx-auto mb-4" />
            <p className="text-gray-600">Admin Dashboard Login</p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 p-3 mb-6 rounded-lg text-center">
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                Email Address
              </label>
              <input
                className="bg-white appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-accent-blue transition duration-300"
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  className="bg-white appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 pr-10 text-gray-800 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-accent-blue transition duration-300"
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="******************"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  disabled={loading}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700 disabled:opacity-50"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between pt-4">
              <button
                className="w-full bg-[#000029] hover:bg-[#2b72e1] text-white font-semibold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#157AFF] focus:ring-offset-2 focus:ring-offset-white transition duration-300 transform hover:scale-105 shadow-md disabled:opacity-70 disabled:hover:scale-100"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
