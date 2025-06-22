import React from 'react';
import { Link } from 'wouter';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Fallback404: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader>
          <CardTitle className="text-6xl font-bold text-purple-600 mb-4">404</CardTitle>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Page Not Found</h2>
          <p className="text-gray-600">
            The page you're looking for seems to have wandered off into the digital wilderness.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-500 mb-6">
            Don't worry, even the most mindful journeys sometimes take unexpected turns.
          </div>
          
          <div className="space-y-3">
            <Link href="/">
              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                <Home className="w-4 h-4 mr-2" />
                Return Home
              </Button>
            </Link>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
          
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-3">
              Need help finding something specific?
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link href="/community">
                <Button variant="ghost" size="sm" className="w-full">
                  Community
                </Button>
              </Link>
              <Link href="/progress">
                <Button variant="ghost" size="sm" className="w-full">
                  Progress
                </Button>
              </Link>
              <Link href="/dreams">
                <Button variant="ghost" size="sm" className="w-full">
                  Dreams
                </Button>
              </Link>
              <Link href="/settings">
                <Button variant="ghost" size="sm" className="w-full">
                  Settings
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Fallback404;