import React from 'react';

const Loader = () => {
  return (
    <div className="fixed inset-0 bg-white flex flex-col justify-center items-center z-50">
      <div className="flex items-center space-x-4">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-gray-800"></div>
        <span className="text-gray-800 text-2xl font-semibold">9thWaka</span>
      </div>
      <p className="text-gray-600 text-lg mt-4">Loading, please wait...</p>
    </div>
  );
};

export default Loader;
