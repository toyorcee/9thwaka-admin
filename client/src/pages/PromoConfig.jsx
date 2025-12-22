import React, { useState, useEffect } from 'react';
import { getPromoConfig, updatePromoConfig } from '../services/promoApi';

const PromoConfig = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await getPromoConfig();
        setConfig(response.data);
      } catch (err) {
        setError('Failed to fetch promo configuration.');
      }
      setLoading(false);
    };

    fetchConfig();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await updatePromoConfig(config);
      alert('Promo configuration updated successfully!');
    } catch (err) {
      alert('Failed to update promo configuration.');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConfig((prevConfig) => ({
      ...prevConfig,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Promo Configuration</h1>
      {config && (
        <form onSubmit={handleUpdate}>
          <div className="mb-4">
            <label className="block text-gray-700">Referral Bonus</label>
            <input
              type="number"
              name="referralBonus"
              value={config.referralBonus}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Sign-up Bonus</label>
            <input
              type="number"
              name="signupBonus"
              value={config.signupBonus}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <button type="submit" className="bg-blue-500 text-white p-2 rounded">
            Update Configuration
          </button>
        </form>
      )}
    </div>
  );
};

export default PromoConfig;