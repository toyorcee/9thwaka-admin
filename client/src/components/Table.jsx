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
                key={typeof col.accessor === 'string' ? col.accessor : col.header || col.Header}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {col.header || col.Header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((row, rowIndex) => (
            renderRow ? renderRow(row, rowIndex) : (
              <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
                {columns.map((col, colIndex) => (
                  <td 
                    key={colIndex} 
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-700"
                  >
                    {typeof col.accessor === 'function' 
                      ? col.accessor(row) 
                      : row[col.accessor]}
                  </td>
                ))}
              </tr>
            )
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;