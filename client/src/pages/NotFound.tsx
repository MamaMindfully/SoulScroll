import React from 'react';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';

export default function NotFound() {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-6">
      <motion.div 
        className="text-center max-w-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* 404 Animation */}
        <motion.div
          className="text-8xl font-bold text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text mb-6"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          404
        </motion.div>

        <motion.h1 
          className="text-3xl font-bold text-white mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          This page drifted off into the void
        </motion.h1>

        <motion.p 
          className="text-gray-400 text-lg mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          The page you're looking for doesn't exist or has been moved to another dimension.
        </motion.p>

        {/* Show the attempted path */}
        {location !== '/' && (
          <motion.div 
            className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <p className="text-red-300 text-sm">
              Attempted path: <code className="bg-red-900/40 px-2 py-1 rounded">{location}</code>
            </p>
          </motion.div>
        )}

        {/* Action buttons */}
        <motion.div 
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          <Link href="/">
            <a className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg transition-colors font-medium">
              <Home className="w-5 h-5" />
              Return Home
            </a>
          </Link>

          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </motion.div>

        {/* Helpful links */}
        <motion.div 
          className="mt-12 pt-8 border-t border-gray-800"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <p className="text-gray-500 text-sm mb-4">Or explore these sections:</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/journal">
              <a className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors">
                Journal
              </a>
            </Link>
            <Link href="/insights">
              <a className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors">
                Insights
              </a>
            </Link>
            <Link href="/progress">
              <a className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors">
                Progress
              </a>
            </Link>
            <Link href="/emotional-intelligence">
              <a className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors">
                Emotional Intelligence
              </a>
            </Link>
          </div>
        </motion.div>

        {/* Decorative elements */}
        <motion.div 
          className="absolute top-20 left-20 w-32 h-32 bg-indigo-500/10 rounded-full blur-xl"
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
          className="absolute bottom-20 right-20 w-24 h-24 bg-purple-500/10 rounded-full blur-xl"
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