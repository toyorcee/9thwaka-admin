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
  placeholder = "", 
  className = "",
  helperText = "",
  ...props 
}) => {
  
  const handleInputChange = (e) => {
    let val = e.target.value;
    
    // 1. Force prevent negative
    val = preventNegative(val);
    
    // 2. If it's currency, we clean it and then format it if needed, 
    // but the parent usually stores the RAW number or the formatted string.
    // Based on existing patterns, pages use both. 
    // We will provide the cleaned raw value to the parent.
    
    if (isCurrency) {
      const raw = cleanAmount(val);
      onChange(raw);
    } else {
      onChange(val);
    }
  };

  const displayValue = isCurrency ? formatCurrency(value) : value;

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
