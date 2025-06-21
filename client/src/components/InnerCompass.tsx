import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { InnerCompassEngine } from '@/engines/innerCompass';
import { Compass } from 'lucide-react';

interface InnerCompassProps {
  className?: string;
}

const InnerCompass: React.FC<InnerCompassProps> = ({ className = '' }) => {
  const compass = InnerCompassEngine.getTodaysTheme();

  const getColorClasses = (color: string) => {
    // Map hex colors to Tailwind classes
    const colorMap: { [key: string]: string } = {
      '#3B82F6': 'from-blue-100 to-sky-100 border-blue-300 text-blue-800',
      '#10B981': 'from-emerald-100 to-green-100 border-emerald-300 text-emerald-800',
      '#F59E0B': 'from-amber-100 to-yellow-100 border-amber-300 text-amber-800',
      '#EF4444': 'from-red-100 to-rose-100 border-red-300 text-red-800',
      '#8B5CF6': 'from-violet-100 to-purple-100 border-violet-300 text-violet-800',
      '#6366F1': 'from-indigo-100 to-blue-100 border-indigo-300 text-indigo-800',
      '#F97316': 'from-orange-100 to-amber-100 border-orange-300 text-orange-800',
      '#06B6D4': 'from-cyan-100 to-teal-100 border-cyan-300 text-cyan-800',
      '#059669': 'from-emerald-100 to-green-100 border-emerald-300 text-emerald-800',
      '#DC2626': 'from-red-100 to-pink-100 border-red-300 text-red-800'
    };
    return colorMap[color] || 'from-blue-100 to-sky-100 border-blue-300 text-blue-800';
  };

  return (
    <Card className={`bg-gradient-to-r ${getColorClasses(compass.color)} border-l-4 shadow-lg ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center space-x-3 mb-3">
          <Compass className="w-5 h-5" />
          <h3 className="text-lg font-semibold">
            Your Inner Compass: {compass.keyword}
          </h3>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">{compass.archetype}</p>
          <p className="italic leading-relaxed text-sm">{compass.description}</p>
          <p className="font-medium text-sm">"{compass.affirmation}"</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default InnerCompass;