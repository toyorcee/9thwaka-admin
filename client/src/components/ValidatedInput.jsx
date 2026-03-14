import React from 'react';
import { preventNegative, formatCurrency, cleanAmount } from '../utils/formatters';

/**
 * ValidatedInput Component
 * 
 * Features:
 * - Prevents negative values automatically
 * - Supports currency/thousand separator formatting
 * - Maintain cursor position (optional)
 * - Custom styling consistent with Admin UI
 */
const ValidatedInput = ({ 
  label, 
  value, 
  onChange, 
  type = "text", 
  isCurrency = false, 
  allowNegative = false,
  placeholder = "", 
  className = "",
  helperText = "",
  ...props 
}) => {
  
  const handleInputChange = (e) => {
    let val = e.target.value;
    
    // 1. Force prevent negative if not allowed
    if (!allowNegative) {
      val = preventNegative(val);
    }
    
    if (isCurrency) {
      const raw = cleanAmount(val, allowNegative);
      onChange(raw);
    } else {
      onChange(val);
    }
  };

  const displayValue = isCurrency ? formatCurrency(value, allowNegative) : value;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <input
        type={type === "number" ? "number" : "text"}
        value={displayValue}
        onChange={handleInputChange}
        className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${className}`}
        placeholder={placeholder}
        {...props}
      />
      {helperText && (
        <p className="text-xs text-gray-500 mt-1">{helperText}</p>
      )}
    </div>
  );
};

export default ValidatedInput;
