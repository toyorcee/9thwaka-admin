import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import {
  fetchCurrentUser,
  updateProfile as updateProfileApi,
  uploadProfilePicture as uploadProfilePictureApi,
} from '../services/profileApi';

const Profile = () => {
  const { login, user: authUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setError(null);
        const data = await fetchCurrentUser();
        const user = data?.user || data;
        if (user) {
          setProfile(user);
          setFullName(user.fullName || '');
          setEmail(user.email || '');
          setPhoneNumber(user.phoneNumber || '');
          setProfilePictureUrl(user.profilePicture || '');
          if (!authUser || authUser.id !== user.id) {
            login(user);
          }
        }
      } catch (err) {
        setError('Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  useEffect(() => {
    if (!successMessage) return;
    const timeout = setTimeout(() => {
      setSuccessMessage(null);
    }, 2000);
    return () => clearTimeout(timeout);
  }, [successMessage]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!fullName || !email) {
      setError('Name and email are required.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        fullName,
        email,
        phoneNumber,
      };
      const data = await updateProfileApi(payload);
      const updatedUser = data?.user || profile;
      if (updatedUser) {
        setProfile(updatedUser);
        setFullName(updatedUser.fullName || '');
        setEmail(updatedUser.email || '');
        setPhoneNumber(updatedUser.phoneNumber || '');
        login(updatedUser);
      }
      setSuccessMessage('Profile updated successfully.');
      toast.success('Profile updated successfully.');
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        'Failed to update profile.';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError(null);
    setSuccessMessage(null);

    try {
      setUploading(true);
      const data = await uploadProfilePictureApi(file);
      if (data?.profilePicture) {
        setProfilePictureUrl(data.profilePicture);
      }
      if (data?.user) {
        setProfile(data.user);
        setFullName(data.user.fullName || fullName);
        setEmail(data.user.email || email);
        setPhoneNumber(data.user.phoneNumber || phoneNumber);
        login(data.user);
      }
      setSuccessMessage('Profile picture updated successfully.');
      toast.success('Profile picture updated successfully.');
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        'Failed to upload profile picture.';
      setError(message);
      toast.error(message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const initials = () => {
    if (fullName && fullName.trim().length > 0) {
      const parts = fullName.trim().split(' ');
      if (parts.length === 1) {
        return parts[0].charAt(0).toUpperCase();
      }
      return (
        parts[0].charAt(0).toUpperCase() +
        parts[parts.length - 1].charAt(0).toUpperCase()
      );
    }
    if (email && email.trim().length > 0) {
      return email.charAt(0).toUpperCase();
    }
    return 'A';
  };

  const renderAvatar = () => {
    if (profilePictureUrl) {
      return (
        <img
          src={profilePictureUrl}
          alt="Profile"
          className="h-32 w-32 rounded-full object-cover"
        />
      );
    }
    return (
      <div className="h-32 w-32 rounded-full bg-gray-100 flex items-center justify-center text-3xl font-semibold text-gray-500">
        {initials()}
      </div>
    );
  };

  return (
    <div className="p-6 h-full flex flex-col items-center">
      <div className="w-full max-w-3xl">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">Profile</h1>
      </div>
      <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-3xl">
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
            {successMessage}
          </div>
        )}
        {loading ? (
          <div className="text-gray-600">Loading profile...</div>
        ) : (
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex flex-col items-center md:w-1/3">
              {renderAvatar()}
              <label className="mt-4 inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                <span>{uploading ? 'Uploading...' : 'Change picture'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={uploading}
                />
              </label>
            </div>
            <div className="md:w-2/3">
              <form onSubmit={handleProfileSave} className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Full name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full p-3 bg-gray-50 text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 bg-gray-50 text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue"
                    placeholder="Enter your email"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Phone number
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full p-3 bg-gray-50 text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue"
                    placeholder="Enter your phone number"
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
