import React from 'react';

const Loader = () => {
  return (
    <div className="fixed inset-0 bg-[#10173A] bg-opacity-90 flex flex-col justify-center items-center z-50">
      <div className="flex items-center space-x-4">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-blue-500"></div>
        <span className="text-white text-2xl font-semibold">9thWaka</span>
      </div>
      <p className="text-white text-lg mt-4">Loading, please wait...</p>
    </div>
  );
};

export default Loader;
