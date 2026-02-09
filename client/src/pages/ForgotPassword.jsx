import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  adminForgotPassword,
  adminVerifyResetCode,
  adminResetPassword,
} from "../services/authApi";
import logo from "../assets/nightwaka-dark.png";
import forgotBg from "../assets/payout9thwaka.png";
import {
  ArrowLeftIcon,
  EyeIcon,
  EyeSlashIcon,
  EnvelopeIcon,
  KeyIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRequestResetCode = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const response = await adminForgotPassword(email);
      if (response.success) {
        setSuccess("Reset code sent! Check your inbox.");
        setTimeout(() => {
            setSuccess("");
            setStep(2);
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send reset code.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyResetCode = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const response = await adminVerifyResetCode(email, resetCode);
      if (response.success) {
        setSuccess("Code verified! Set your new password.");
        setTimeout(() => {
            setSuccess("");
            setStep(3);
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Invalid reset code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const response = await adminResetPassword(email, resetCode, newPassword);
      if (response.success) {
        setSuccess("Password reset successful! Redirecting...");
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center p-4 relative overflow-hidden"
      style={{ backgroundImage: `url(${forgotBg})` }}
    >
      {/* Dark Overlay for better text contrast */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/95 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-white/20">
            <div className="absolute top-4 left-4">
                <Link to="/login" className="text-gray-500 hover:text-gray-800 transition-colors p-2 rounded-full hover:bg-gray-100/50 block">
                    <ArrowLeftIcon className="h-6 w-6" />
                </Link>
            </div>

          <div className="text-center mb-8">
            <img 
                src={logo} 
                alt="9thWaka Logo" 
                className="w-32 mx-auto mb-4" 
            />
            <h2 className="text-2xl font-bold text-gray-800">
              {step === 1 && "Forgot Password?"}
              {step === 2 && "Verify Code"}
              {step === 3 && "Reset Password"}
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              {step === 1 && "Enter your email to receive a reset code."}
              {step === 2 && `Enter the 6-digit code sent to ${email}`}
              {step === 3 && "Create a new strong password."}
            </p>
          </div>

          <div>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 mb-6 rounded text-sm flex items-start">
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-3 mb-6 rounded text-sm flex items-center gap-2">
                <CheckCircleIcon className="h-5 w-5" />
                <span>{success}</span>
              </div>
            )}
          </div>

          {/* Form Step 1 */}
          {step === 1 && (
            <form
                onSubmit={handleRequestResetCode}
                className="space-y-5"
            >
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Email Address</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-3 transition-colors"
                      type="email"
                      placeholder="admin@9thwaka.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                </div>
              </div>
              <button
                className="w-full bg-[#000029] hover:bg-[#1a1a40] text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                type="submit"
                disabled={loading}
              >
                {loading ? "Sending Code..." : "Send Reset Code"}
              </button>
            </form>
          )}

          {/* Form Step 2 */}
          {step === 2 && (
             <form
                onSubmit={handleVerifyResetCode}
                className="space-y-5"
            >
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">6-Digit Code</label>
                <div className="relative">
                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <KeyIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-2xl tracking-[0.5em] font-mono text-center rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-3 transition-colors"
                      type="text"
                      placeholder="000000"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      required
                      maxLength={6}
                      disabled={loading}
                    />
                </div>
              </div>
              <button
                className="w-full bg-[#000029] hover:bg-[#1a1a40] text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-70"
                type="submit"
                disabled={loading || resetCode.length !== 6}
              >
                {loading ? "Verifying..." : "Verify Code"}
              </button>
              
              <button 
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-sm text-gray-500 hover:text-blue-600 font-medium transition-colors"
                disabled={loading}
              >
                Change Email / Resend
              </button>
            </form>
          )}

          {/* Form Step 3 */}
          {step === 3 && (
             <form
                onSubmit={handleResetPassword}
                className="space-y-5"
            >
               <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">New Password</label>
                   <div className="relative">
                    <input
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-3 pr-10 transition-colors"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                
                 <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Confirm Password</label>
                   <div className="relative">
                    <input
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-3 transition-colors"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      disabled={loading}
                    />
                  </div>
                </div>

              <button
                className="w-full bg-[#000029] hover:bg-[#1a1a40] text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-70"
                type="submit"
                disabled={loading}
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
