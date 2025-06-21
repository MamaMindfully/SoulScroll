import React from 'react';
import TimelineChart from '@/components/TimelineChart';
import AppHeader from '@/components/AppHeader';
import BottomNavigation from '@/components/BottomNavigation';

export default function Timeline() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      <AppHeader />
      <div className="container mx-auto px-4 py-6 pb-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-purple-800 mb-6">Emotional Timeline</h1>
          <TimelineChart />
        </div>
      </div>
      <BottomNavigation />
    </div>
  );
}