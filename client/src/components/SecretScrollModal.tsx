import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Scroll, Star, Sparkles, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SecretScrollProps {
  scroll: {
    title?: string;
    quote?: string;
    advice?: string;
    milestone?: number;
    scroll_text?: string;
  };
  isVisible: boolean;
  onClose: () => void;
}

export default function SecretScrollModal({ scroll, isVisible, onClose }: SecretScrollProps) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => setShowContent(true), 800);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  // Parse scroll text if it's a single string from AI
  let displayContent = scroll;
  if (scroll.scroll_text && !scroll.quote) {
    try {
      // Try to extract structured content from AI response
      const text = scroll.scroll_text;
      const lines = text.split('\n').filter(line => line.trim());
      
      displayContent = {
        title: `Milestone ${scroll.milestone}: Sacred Scroll`,
        quote: lines.find(line => line.includes('"') || line.toLowerCase().includes('quote')) || lines[0],
        advice: lines.find(line => line.toLowerCase().includes('advice') || line.toLowerCase().includes('wisdom')) || lines[lines.length - 1],
        milestone: scroll.milestone
      };
    } catch (error) {
      displayContent = {
        title: `Milestone ${scroll.milestone}: Sacred Scroll`,
        quote: scroll.scroll_text,
        advice: "Continue your journey with wisdom and compassion.",
        milestone: scroll.milestone
      };
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ scale: 0.5, opacity: 0, rotateY: -90 }}
          animate={{ scale: 1, opacity: 1, rotateY: 0 }}
          exit={{ scale: 0.5, opacity: 0, rotateY: 90 }}
          transition={{ 
            type: "spring", 
            stiffness: 100, 
            damping: 15,
            duration: 0.8 
          }}
          className="max-w-lg w-full"
        >
          <Card className="bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border-2 border-amber-200 shadow-2xl">
            <CardContent className="p-0 relative overflow-hidden">
              {/* Decorative background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 right-4">
                  <Sparkles className="w-8 h-8 text-amber-400" />
                </div>
                <div className="absolute bottom-4 left-4">
                  <Star className="w-6 h-6 text-yellow-400" />
                </div>
                <div className="absolute top-1/2 left-1/4">
                  <Star className="w-4 h-4 text-amber-300" />
                </div>
              </div>

              {/* Close button */}
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 z-10 text-amber-600 hover:bg-amber-100"
              >
                <X className="w-4 h-4" />
              </Button>

              <div className="p-8 text-center relative">
                {/* Scroll icon animation */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 120 }}
                  className="mb-6"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Scroll className="w-8 h-8 text-white" />
                  </div>
                </motion.div>

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 20 }}
                  transition={{ delay: 0.6 }}
                  className="text-2xl font-bold text-amber-800 mb-2"
                >
                  {displayContent.title || "Sacred Scroll Unlocked"}
                </motion.h2>

                {/* Milestone badge */}
                {displayContent.milestone && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: showContent ? 1 : 0, scale: showContent ? 1 : 0 }}
                    transition={{ delay: 0.8 }}
                    className="mb-6"
                  >
                    <div className="inline-flex items-center px-4 py-2 bg-amber-200 rounded-full">
                      <Star className="w-4 h-4 text-amber-600 mr-2" />
                      <span className="text-sm font-medium text-amber-800">
                        {displayContent.milestone} Entries Milestone
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Quote */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 30 }}
                  transition={{ delay: 1.0 }}
                  className="mb-6"
                >
                  <div className="p-4 bg-white/60 rounded-lg border border-amber-200 backdrop-blur-sm">
                    <p className="text-amber-900 italic font-medium leading-relaxed">
                      "{displayContent.quote || displayContent.scroll_text}"
                    </p>
                  </div>
                </motion.div>

                {/* Advice */}
                {displayContent.advice && (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 30 }}
                    transition={{ delay: 1.2 }}
                    className="mb-6"
                  >
                    <div className="p-4 bg-gradient-to-r from-amber-100 to-yellow-100 rounded-lg border border-amber-300">
                      <h4 className="text-sm font-semibold text-amber-800 mb-2 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Sacred Wisdom
                      </h4>
                      <p className="text-amber-800 text-sm leading-relaxed">
                        {displayContent.advice}
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Action button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 20 }}
                  transition={{ delay: 1.4 }}
                >
                  <Button
                    onClick={onClose}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-8 py-2 rounded-full shadow-lg"
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Continue Your Journey
                  </Button>
                </motion.div>

                {/* Floating particles animation */}
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ 
                        opacity: showContent ? [0, 1, 0] : 0,
                        scale: showContent ? [0, 1, 0] : 0,
                        y: showContent ? [0, -50, -100] : 0,
                        x: showContent ? [0, Math.random() * 40 - 20] : 0
                      }}
                      transition={{ 
                        delay: 1.5 + i * 0.2,
                        duration: 3,
                        repeat: Infinity,
                        repeatDelay: Math.random() * 2
                      }}
                      className="absolute"
                      style={{
                        left: `${20 + Math.random() * 60}%`,
                        top: `${30 + Math.random() * 40}%`
                      }}
                    >
                      <Sparkles className="w-3 h-3 text-amber-400" />
                    </motion.div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}