import React, { useEffect, useState } from 'react';
import { AlertTriangle, Filter, Clock, User, Code } from 'lucide-react';

export default function AdminErrors() {
  const [errors, setErrors] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchErrors();
  }, [filter]);

  const fetchErrors = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.append('type', filter);
      }
      
      const response = await fetch(`/api/error-logs?${params}`);
      const data = await response.json();
      
      setErrors(data.errors || []);
    } catch (error) {
      console.error('Failed to fetch errors:', error);
    } finally {
      setLoading(false);
    }
  };

  const getErrorIcon = (type) => {
    switch (type) {
      case 'frontend':
      case 'react_error':
      case 'javascript_error':
        return <Code className="w-5 h-5 text-blue-400" />;
      case 'backend':
      case 'server_error':
        return <AlertTriangle className="w-5 h-5 text-red-400" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
    }
  };

  const getErrorColor = (type) => {
    switch (type) {
      case 'frontend':
      case 'react_error':
      case 'javascript_error':
        return 'border-blue-500/30 bg-blue-900/20';
      case 'backend':
      case 'server_error':
        return 'border-red-500/30 bg-red-900/20';
      default:
        return 'border-yellow-500/30 bg-yellow-900/20';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-red-400" />
            <div>
              <h1 className="text-3xl font-bold">Error Dashboard</h1>
              <p className="text-gray-400">Monitor application errors and issues</p>
            </div>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="all">All Errors</option>
              <option value="frontend">Frontend</option>
              <option value="backend">Backend</option>
              <option value="react_error">React Errors</option>
              <option value="javascript_error">JavaScript Errors</option>
              <option value="api_error">API Errors</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <h3 className="text-sm text-gray-400 mb-1">Total Errors</h3>
            <p className="text-2xl font-bold text-white">{errors.length}</p>
          </div>
          <div className="bg-red-900/20 rounded-xl p-4 border border-red-500/30">
            <h3 className="text-sm text-red-300 mb-1">Backend Errors</h3>
            <p className="text-2xl font-bold text-red-400">
              {errors.filter(e => e.type === 'backend' || e.type === 'server_error').length}
            </p>
          </div>
          <div className="bg-blue-900/20 rounded-xl p-4 border border-blue-500/30">
            <h3 className="text-sm text-blue-300 mb-1">Frontend Errors</h3>
            <p className="text-2xl font-bold text-blue-400">
              {errors.filter(e => ['frontend', 'react_error', 'javascript_error'].includes(e.type)).length}
            </p>
          </div>
          <div className="bg-yellow-900/20 rounded-xl p-4 border border-yellow-500/30">
            <h3 className="text-sm text-yellow-300 mb-1">API Errors</h3>
            <p className="text-2xl font-bold text-yellow-400">
              {errors.filter(e => e.type === 'api_error').length}
            </p>
          </div>
        </div>

        {/* Error List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {errors.length === 0 ? (
              <div className="text-center py-12">
                <AlertTriangle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No errors found</p>
              </div>
            ) : (
              errors.map((error) => (
                <div
                  key={error.id}
                  className={`rounded-xl p-6 border ${getErrorColor(error.type)}`}
                >
                  <div className="flex items-start gap-4">
                    {getErrorIcon(error.type)}
                    
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium bg-gray-700 px-2 py-1 rounded">
                            {error.type}
                          </span>
                          {error.userId && (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {error.userId.substring(0, 8)}...
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          {new Date(error.createdAt).toLocaleString()}
                        </div>
                      </div>

                      {/* Message */}
                      <p className="text-white font-medium mb-2">
                        {error.message || 'Unknown error'}
                      </p>

                      {/* Path */}
                      {error.path && (
                        <p className="text-sm text-gray-400 mb-3">
                          Path: <code className="bg-gray-800 px-1 rounded">{error.path}</code>
                        </p>
                      )}

                      {/* Stack Trace */}
                      {error.stack && (
                        <details className="text-sm">
                          <summary className="cursor-pointer text-gray-300 hover:text-white mb-2">
                            View Stack Trace
                          </summary>
                          <pre className="bg-black/50 p-3 rounded overflow-x-auto text-xs text-gray-300 whitespace-pre-wrap">
                            {error.stack}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}