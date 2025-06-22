import React, { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Quote } from "lucide-react";
import { useAppStore } from '@/store/appStore';

interface EchoData {
  echo: string;
  createdAt: string;
  id: number;
}

const InnerEcho: React.FC = () => {
  const [echo, setEcho] = useState<EchoData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { userId, isLoggedIn } = useAppStore();

  useEffect(() => {
    if (!isLoggedIn || !userId) {
      setIsLoading(false);
      return;
    }

    const fetchEcho = async () => {
      try {
        const response = await fetch(`/api/echo?userId=${userId}`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        setEcho(data.echo ? data : null);
      } catch (error) {
        console.error('Failed to fetch echo:', error);
        setEcho(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEcho();
  }, [userId, isLoggedIn]);

  // Don't render anything if loading or no echo
  if (isLoading || !echo?.echo) {
    return null;
  }

  return (
    <Card className="mt-4 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 fade-in-slow">
      <CardContent className="p-6">
        <div className="text-center">
          <div className="flex justify-center mb-3">
            <Quote className="w-5 h-5 text-purple-600 opacity-60" />
          </div>
          
          <blockquote className="text-lg italic text-purple-800 font-medium leading-relaxed">
            "{echo.echo}"
          </blockquote>
          
          <div className="mt-4 text-xs text-purple-600 opacity-75">
            Inner Echo • {new Date(echo.createdAt).toLocaleDateString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InnerEcho;