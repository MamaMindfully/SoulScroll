import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function InputField({
  type = "text",
  label,
  placeholder,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  className = "",
  showPasswordToggle = false,
  autoComplete,
  maxLength,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputType = type === "password" && showPassword ? "text" : type;

  const inputClass = cn(
    "w-full px-4 py-3 rounded-lg border transition-all duration-200 bg-white/5 backdrop-blur-sm",
    "focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500",
    "placeholder-gray-400 text-white",
    error 
      ? "border-red-500 focus:ring-red-500/50 focus:border-red-500" 
      : "border-gray-600 hover:border-gray-500",
    disabled && "opacity-50 cursor-not-allowed",
    className
  );

  const labelClass = cn(
    "block text-sm font-medium mb-2 transition-colors duration-200",
    error ? "text-red-400" : "text-gray-300",
    isFocused && !error && "text-purple-400"
  );

  return (
    <motion.div 
      className="space-y-2"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {label && (
        <label className={labelClass}>
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <motion.input
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          maxLength={maxLength}
          className={inputClass}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          whileFocus={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          {...props}
        />
        
        {/* Password toggle */}
        {type === "password" && showPasswordToggle && (
          <motion.button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
            whileTap={{ scale: 0.9 }}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </motion.button>
        )}
        
        {/* Character count */}
        {maxLength && value && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
            {value.length}/{maxLength}
          </div>
        )}
      </div>
      
      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="flex items-center space-x-1 text-red-400 text-sm"
        >
          <AlertCircle size={16} />
          <span>{error}</span>
        </motion.div>
      )}
      
      {/* Focus indicator */}
      <motion.div
        className="h-0.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
        initial={{ width: 0 }}
        animate={{ width: isFocused ? "100%" : 0 }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
}