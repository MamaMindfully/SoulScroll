import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { getDailyCompass } from '@/engines/innerCompass';
import { Compass } from 'lucide-react';

interface InnerCompassProps {
  className?: string;
}

const InnerCompass: React.FC<InnerCompassProps> = ({ className = '' }) => {
  const compass = getDailyCompass();

  const getColorClasses = (color: string) => {
    const colorMap: { [key: string]: string } = {
      blue: 'from-blue-100 to-sky-100 border-blue-300 text-blue-800',
      pink: 'from-pink-100 to-rose-100 border-pink-300 text-pink-800',
      green: 'from-green-100 to-emerald-100 border-green-300 text-green-800',
      purple: 'from-purple-100 to-violet-100 border-purple-300 text-purple-800',
      indigo: 'from-indigo-100 to-blue-100 border-indigo-300 text-indigo-800',
      orange: 'from-orange-100 to-amber-100 border-orange-300 text-orange-800',
      teal: 'from-teal-100 to-cyan-100 border-teal-300 text-teal-800',
      gray: 'from-gray-100 to-slate-100 border-gray-300 text-gray-800',
      yellow: 'from-yellow-100 to-amber-100 border-yellow-300 text-yellow-800',
      rose: 'from-rose-100 to-pink-100 border-rose-300 text-rose-800'
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <Card className={`bg-gradient-to-r ${getColorClasses(compass.color)} border-l-4 shadow-lg ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center space-x-3 mb-3">
          <Compass className="w-5 h-5" />
          <h3 className="text-lg font-semibold">
            {compass.icon} Your Inner Compass: {compass.theme}
          </h3>
        </div>
        <p className="italic leading-relaxed">
          {compass.prompt}
        </p>
      </CardContent>
    </Card>
  );
};

export default InnerCompass;