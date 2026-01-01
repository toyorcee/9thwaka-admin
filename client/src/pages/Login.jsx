import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import {
  adminForgotPassword,
  adminVerifyResetCode,
  adminResetPassword,
} from "../services/authApi";
import { useNavigate } from "react-router-dom";
import logo from "../assets/nightwaka-dark.png";
import loginBg from "../assets/payout9thwaka.png";
import {
  EyeIcon,
  EyeSlashIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const [forgotPasswordStep, setForgotPasswordStep] = useState(1);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordError, setForgotPasswordError] = useState("");
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await api.post("/auth/login", { email, password });
      const { user } = response.data;
      if (user) {
        await login(user);
      }
      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.error || "Invalid credentials. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Forgot password handlers
  const handleRequestResetCode = async (e) => {
    e.preventDefault();
    setForgotPasswordError("");
    setForgotPasswordSuccess("");
    setForgotPasswordLoading(true);
    try {
      const response = await adminForgotPassword(forgotPasswordEmail);
      if (response.success) {
        setForgotPasswordSuccess(
          "Reset code has been sent to your email. Please check your inbox."
        );
        setForgotPasswordStep(2);
      }
    } catch (err) {
      setForgotPasswordError(
        err.response?.data?.error ||
          "Failed to send reset code. Please try again."
      );
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleVerifyResetCode = async (e) => {
    e.preventDefault();
    setForgotPasswordError("");
    setForgotPasswordSuccess("");
    setForgotPasswordLoading(true);
    try {
      const response = await adminVerifyResetCode(
        forgotPasswordEmail,
        resetCode
      );
      if (response.success) {
        setForgotPasswordSuccess(
          "Code verified successfully. Please enter your new password."
        );
        setForgotPasswordStep(3);
      }
    } catch (err) {
      setForgotPasswordError(
        err.response?.data?.error ||
          "Invalid or expired reset code. Please try again."
      );
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotPasswordError("");
    setForgotPasswordSuccess("");

    if (newPassword !== confirmPassword) {
      setForgotPasswordError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setForgotPasswordError("Password must be at least 6 characters.");
      return;
    }

    setForgotPasswordLoading(true);
    try {
      const response = await adminResetPassword(
        forgotPasswordEmail,
        resetCode,
        newPassword
      );
      if (response.success) {
        setForgotPasswordSuccess(
          "Password reset successful! Redirecting to login..."
        );
        setTimeout(() => {
          setShowForgotPassword(false);
          setForgotPasswordStep(1);
          setForgotPasswordEmail("");
          setResetCode("");
          setNewPassword("");
          setConfirmPassword("");
          setForgotPasswordError("");
          setForgotPasswordSuccess("");
        }, 2000);
      }
    } catch (err) {
      setForgotPasswordError(
        err.response?.data?.error ||
          "Failed to reset password. Please try again."
      );
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setForgotPasswordStep(1);
    setForgotPasswordEmail("");
    setResetCode("");
    setNewPassword("");
    setConfirmPassword("");
    setForgotPasswordError("");
    setForgotPasswordSuccess("");
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
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="email"
              >
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
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="password"
              >
                Password
              </label>
              <div className="relative">
                <input
                  className="bg-white appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 pr-10 text-gray-800 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-accent-blue transition duration-300"
                  id="password"
                  type={showPassword ? "text" : "password"}
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
                  "Sign In"
                )}
              </button>
            </div>
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1"
                disabled={loading}
              >
                Forgot Password?
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-white bg-opacity-90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md p-8 relative">
            <button
              onClick={handleBackToLogin}
              className="absolute top-4 left-4 text-gray-500 hover:text-gray-700"
            >
              <ArrowLeftIcon className="h-6 w-6" />
            </button>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Reset Password
              </h2>
            </div>

            {forgotPasswordError && (
              <div className="bg-red-100 border border-red-400 text-red-700 p-3 mb-4 rounded-lg text-sm">
                {forgotPasswordError}
              </div>
            )}

            {forgotPasswordSuccess && (
              <div className="bg-green-100 border border-green-400 text-green-700 p-3 mb-4 rounded-lg text-sm">
                {forgotPasswordSuccess}
              </div>
            )}

            {/* Step 1: Request Reset Code */}
            {forgotPasswordStep === 1 && (
              <form onSubmit={handleRequestResetCode} className="space-y-4">
                <div>
                  <label
                    className="block text-gray-700 text-sm font-bold mb-2"
                    htmlFor="forgotEmail"
                  >
                    Email Address
                  </label>
                  <input
                    className="bg-white appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-accent-blue transition duration-300"
                    id="forgotEmail"
                    type="email"
                    placeholder="you@example.com"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    disabled={forgotPasswordLoading}
                    required
                  />
                </div>
                <button
                  className="w-full bg-[#000029] hover:bg-[#2b72e1] text-white font-semibold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#157AFF] transition duration-300 disabled:opacity-70"
                  type="submit"
                  disabled={forgotPasswordLoading}
                >
                  {forgotPasswordLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sending...</span>
                    </div>
                  ) : (
                    "Send Reset Code"
                  )}
                </button>
              </form>
            )}

            {/* Step 2: Verify Reset Code */}
            {forgotPasswordStep === 2 && (
              <form onSubmit={handleVerifyResetCode} className="space-y-4">
                <div>
                  <label
                    className="block text-gray-700 text-sm font-bold mb-2"
                    htmlFor="resetCode"
                  >
                    6-Digit Reset Code
                  </label>
                  <input
                    className="bg-white appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-accent-blue transition duration-300 text-center text-2xl tracking-widest"
                    id="resetCode"
                    type="text"
                    placeholder="000000"
                    value={resetCode}
                    onChange={(e) =>
                      setResetCode(
                        e.target.value.replace(/\D/g, "").slice(0, 6)
                      )
                    }
                    disabled={forgotPasswordLoading}
                    required
                    maxLength={6}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Enter the 6-digit code sent to your email
                  </p>
                </div>
                <button
                  className="w-full bg-[#000029] hover:bg-[#2b72e1] text-white font-semibold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#157AFF] transition duration-300 disabled:opacity-70"
                  type="submit"
                  disabled={forgotPasswordLoading || resetCode.length !== 6}
                >
                  {forgotPasswordLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verifying...</span>
                    </div>
                  ) : (
                    "Verify Code"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setForgotPasswordStep(1);
                    setResetCode("");
                    setForgotPasswordError("");
                  }}
                  className="w-full text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1"
                  disabled={forgotPasswordLoading}
                >
                  Resend Code
                </button>
              </form>
            )}

            {/* Step 3: Reset Password */}
            {forgotPasswordStep === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label
                    className="block text-gray-700 text-sm font-bold mb-2"
                    htmlFor="newPassword"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      className="bg-white appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 pr-10 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-accent-blue transition duration-300"
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={forgotPasswordLoading}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      disabled={forgotPasswordLoading}
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
                <div>
                  <label
                    className="block text-gray-700 text-sm font-bold mb-2"
                    htmlFor="confirmPassword"
                  >
                    Confirm Password
                  </label>
                  <input
                    className="bg-white appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-accent-blue transition duration-300"
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={forgotPasswordLoading}
                    required
                    minLength={6}
                  />
                </div>
                <button
                  className="w-full bg-[#000029] hover:bg-[#2b72e1] text-white font-semibold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#157AFF] transition duration-300 disabled:opacity-70"
                  type="submit"
                  disabled={forgotPasswordLoading}
                >
                  {forgotPasswordLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Resetting...</span>
                    </div>
                  ) : (
                    "Reset Password"
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
