import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb, MessageCircle } from "lucide-react";

interface SimpleReflectionDisplayProps {
  insight: string;
  followUpPrompt: string;
  className?: string;
}

const SimpleReflectionDisplay: React.FC<SimpleReflectionDisplayProps> = ({
  insight,
  followUpPrompt,
  className = ""
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Insight Display */}
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <Lightbulb className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-blue-800 mb-2 text-sm">
                Reflection Insight
              </h4>
              <p className="text-gray-800 leading-relaxed">
                {insight}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Follow-up Question */}
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="bg-purple-100 p-2 rounded-full">
              <MessageCircle className="w-4 h-4 text-purple-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-purple-800 mb-2 text-sm">
                Deeper Question
              </h4>
              <p className="text-gray-800 leading-relaxed font-medium italic">
                {followUpPrompt}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleReflectionDisplay;