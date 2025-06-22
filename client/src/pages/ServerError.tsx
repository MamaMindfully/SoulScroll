import React from 'react';
import { Home, RefreshCw, Mail } from 'lucide-react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';

export default function ServerError() {
  const handleRefresh = () => {
    window.location.reload();
  };

  const handleReportIssue = () => {
    const subject = encodeURIComponent('SoulScroll - Server Error Report');
    const body = encodeURIComponent(`I encountered a server error on SoulScroll.

URL: ${window.location.href}
Time: ${new Date().toISOString()}
User Agent: ${navigator.userAgent}

Please describe what you were doing when this error occurred:
`);
    
    window.open(`mailto:support@example.com?subject=${subject}&body=${body}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-6">
      <motion.div 
        className="text-center max-w-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* 500 Animation */}
        <motion.div
          className="text-8xl font-bold text-transparent bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text mb-6"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          500
        </motion.div>

        <motion.h1 
          className="text-3xl font-bold text-white mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Something went wrong in the stars
        </motion.h1>

        <motion.p 
          className="text-gray-400 text-lg mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          Our servers encountered an unexpected error. We're working on fixing this issue.
        </motion.p>

        {/* Status message */}
        <motion.div 
          className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <p className="text-orange-300 text-sm">
            The error has been automatically logged and our team has been notified.
          </p>
        </motion.div>

        {/* Action buttons */}
        <motion.div 
          className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </button>

          <Link href="/">
            <a className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors font-medium">
              <Home className="w-5 h-5" />
              Return Home
            </a>
          </Link>
        </motion.div>

        {/* Report issue */}
        <motion.div 
          className="border-t border-gray-800 pt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <p className="text-gray-500 text-sm mb-4">
            If this problem persists, please let us know:
          </p>
          
          <button
            onClick={handleReportIssue}
            className="flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors text-sm mx-auto"
          >
            <Mail className="w-4 h-4" />
            Report Issue
          </button>
        </motion.div>

        {/* What you can try */}
        <motion.div 
          className="mt-8 text-left bg-gray-900/50 rounded-lg p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
        >
          <h3 className="text-white font-semibold mb-3">What you can try:</h3>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li>• Wait a few minutes and refresh the page</li>
            <li>• Check your internet connection</li>
            <li>• Clear your browser cache and cookies</li>
            <li>• Try accessing the site in incognito/private mode</li>
          </ul>
        </motion.div>

        {/* Decorative elements */}
        <motion.div 
          className="absolute top-20 left-20 w-32 h-32 bg-orange-500/10 rounded-full blur-xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        <motion.div 
          className="absolute bottom-20 right-20 w-24 h-24 bg-red-500/10 rounded-full blur-xl"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5]
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
      </motion.div>
    </div>
  );
}