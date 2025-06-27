import React from 'react';
import { motion } from 'framer-motion';

export default function Loader({ 
  size = "md", 
  variant = "spinner", 
  text, 
  progress,
  className = "" 
}) {
  const sizeMap = {
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48
  };

  const loaderSize = sizeMap[size];

  if (variant === "progress" && typeof progress === "number") {
    return (
      <div className={`flex flex-col items-center space-y-3 ${className}`}>
        <div className="w-full max-w-xs bg-gray-700 rounded-full h-2 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        {text && (
          <motion.p 
            className="text-sm text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {text}
          </motion.p>
        )}
        <div className="text-xs text-gray-500">
          {Math.round(progress)}%
        </div>
      </div>
    );
  }

  if (variant === "dots") {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-purple-500 rounded-full"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2
            }}
          />
        ))}
        {text && <span className="ml-3 text-sm text-gray-400">{text}</span>}
      </div>
    );
  }

  if (variant === "pulse") {
    return (
      <div className={`flex flex-col items-center space-y-3 ${className}`}>
        <motion.div
          className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
          style={{ width: loaderSize, height: loaderSize }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        {text && (
          <motion.p 
            className="text-sm text-gray-400"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {text}
          </motion.p>
        )}
      </div>
    );
  }

  // Default spinner variant
  return (
    <div className={`flex flex-col items-center space-y-3 ${className}`}>
      <motion.div
        className="border-2 border-purple-500/30 border-t-purple-500 rounded-full"
        style={{ width: loaderSize, height: loaderSize }}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      {text && (
        <motion.p 
          className="text-sm text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
}

// Specialized loaders for different contexts
export function PageLoader({ text = "Loading..." }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900">
      <Loader variant="pulse" size="xl" text={text} />
    </div>
  );
}

export function InlineLoader({ text }) {
  return (
    <div className="flex items-center justify-center py-8">
      <Loader variant="dots" text={text} />
    </div>
  );
}

export function ButtonLoader() {
  return <Loader size="sm" className="mr-2" />;
}