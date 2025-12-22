import React from 'react';
import Skeleton from './Skeleton';

const Table = ({ columns, data, loading, renderRow }) => {
  if (loading) {
    return (
      <div>
        {[...Array(10)].map((_, i) => (
          <Skeleton key={i} className="h-12 mb-2" />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.accessor}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {col.Header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((row, i) => renderRow(row, i))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;