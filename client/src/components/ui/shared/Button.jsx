import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonVariants = {
  default: "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white",
  secondary: "bg-gray-200 hover:bg-gray-300 text-gray-900",
  ghost: "hover:bg-gray-100 text-gray-900",
  outline: "border border-gray-300 hover:bg-gray-50 text-gray-900",
  destructive: "bg-red-600 hover:bg-red-700 text-white",
  glow: "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white glow-button"
};

const sizeVariants = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4",
  lg: "h-12 px-6 text-lg",
  icon: "h-10 w-10"
};

export default function Button({ 
  children, 
  variant = "default", 
  size = "md", 
  className = "", 
  disabled = false,
  loading = false,
  onClick,
  type = "button",
  ...props 
}) {
  const buttonClass = cn(
    "inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
    buttonVariants[variant],
    sizeVariants[size],
    className
  );

  const motionProps = {
    whileTap: disabled ? {} : { scale: 0.95 },
    whileHover: disabled ? {} : { scale: 1.02 },
    transition: { type: "spring", stiffness: 400, damping: 25 }
  };

  return (
    <motion.button
      {...motionProps}
      type={type}
      className={buttonClass}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mr-2"
        >
          <Loader2 className="w-4 h-4 animate-spin" />
        </motion.div>
      )}
      {children}
    </motion.button>
  );
}