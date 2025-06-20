import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, PenTool, Heart, Moon, Sparkles, X } from "lucide-react";

interface FloatingActionButtonProps {
  onNewEntry?: () => void;
  onMamaMindfully?: () => void;
  onDreamMode?: () => void;
  onQuickNote?: () => void;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onNewEntry,
  onMamaMindfully,
  onDreamMode,
  onQuickNote
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const actions = [
    {
      icon: PenTool,
      label: "New Entry",
      action: onNewEntry || (() => window.location.href = '/'),
      color: "bg-blue-500 hover:bg-blue-600",
      delay: "0ms"
    },
    {
      icon: Heart,
      label: "Mama Mindfully",
      action: onMamaMindfully || (() => window.location.href = '/mama-mindfully'),
      color: "bg-pink-500 hover:bg-pink-600",
      delay: "50ms"
    },
    {
      icon: Moon,
      label: "Dream Mode",
      action: onDreamMode || (() => window.location.href = '/dreams'),
      color: "bg-purple-500 hover:bg-purple-600",
      delay: "100ms"
    },
    {
      icon: Sparkles,
      label: "Quick Note",
      action: onQuickNote || (() => {
        // Quick note functionality - could open a modal or navigate
        const note = prompt("Quick note:");
        if (note) {
          // Save quick note to localStorage or handle as needed
          localStorage.setItem(`quick-note-${Date.now()}`, note);
        }
      }),
      color: "bg-green-500 hover:bg-green-600",
      delay: "150ms"
    }
  ];

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      {/* Overlay when expanded */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-20 z-40"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Floating Action Button */}
      <div className="fixed bottom-20 right-4 z-50">
        {/* Action Menu */}
        {isExpanded && (
          <div className="absolute bottom-16 right-0 space-y-3 mb-2">
            {actions.map((action, index) => {
              const IconComponent = action.icon;
              return (
                <div
                  key={index}
                  className="flex items-center space-x-3 animate-in slide-in-from-right duration-200"
                  style={{ animationDelay: action.delay }}
                >
                  <Card className="bg-white shadow-lg border-0">
                    <CardContent className="p-2">
                      <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                        {action.label}
                      </span>
                    </CardContent>
                  </Card>
                  
                  <Button
                    onClick={() => {
                      action.action();
                      setIsExpanded(false);
                    }}
                    className={`w-12 h-12 rounded-full ${action.color} text-white shadow-lg border-0 p-0`}
                  >
                    <IconComponent className="w-5 h-5" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {/* Main FAB */}
        <Button
          onClick={toggleExpanded}
          className={`fab w-14 h-14 rounded-full shadow-lg border-0 p-0 transition-all duration-300 ${
            isExpanded 
              ? 'bg-red-500 hover:bg-red-600 rotate-45' 
              : 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:scale-110'
          }`}
        >
          {isExpanded ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <Plus className="w-6 h-6 text-white" />
          )}
        </Button>
      </div>
    </>
  );
};

export default FloatingActionButton;