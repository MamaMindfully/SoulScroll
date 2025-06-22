import React from 'react';
import { useAppStore } from '@/store/appStore';
import { Link } from 'wouter';

const SubscriptionExample: React.FC = () => {
  const isLoggedIn = useAppStore(state => state.isLoggedIn);
  const featureAccess = useAppStore(state => state.featureAccess);

  if (!isLoggedIn) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <p>Please log in to access features</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-lg font-semibold">Feature Access</h3>
      
      {featureAccess.community ? (
        <Link to="/community">
          <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Go to Community
          </button>
        </Link>
      ) : (
        <div className="p-3 bg-yellow-100 rounded border">
          <p>Subscribe to unlock Community</p>
          <Link to="/premium">
            <button className="mt-2 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600">
              Upgrade Now
            </button>
          </Link>
        </div>
      )}

      {featureAccess.dream ? (
        <Link to="/dreams">
          <button className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600">
            Explore Dreams
          </button>
        </Link>
      ) : (
        <div className="p-3 bg-yellow-100 rounded border">
          <p>Subscribe to unlock Dream Mode</p>
          <Link to="/premium">
            <button className="mt-2 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600">
              Upgrade Now
            </button>
          </Link>
        </div>
      )}

      {featureAccess.progress ? (
        <Link to="/progress">
          <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
            View Progress
          </button>
        </Link>
      ) : (
        <div className="p-3 bg-yellow-100 rounded border">
          <p>Subscribe to unlock Progress Tracking</p>
        </div>
      )}
    </div>
  );
};

export default SubscriptionExample;