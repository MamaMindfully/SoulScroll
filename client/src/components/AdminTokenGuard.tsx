import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Clock, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AdminTokenGuardProps {
  children: React.ReactNode;
  requiredLevel?: 'admin' | 'super_admin';
}

const TOKEN_KEY = "soul_admin_token";
const TOKEN_EXPIRY_KEY = "soul_admin_token_expiry";
const EXPIRY_MS = 1000 * 60 * 60; // 1 hour
const VALID_TOKEN = process.env.REACT_APP_ADMIN_TOKEN || "scrollmaster2025";
const SUPER_ADMIN_TOKEN = process.env.REACT_APP_SUPER_ADMIN_TOKEN || "soulscroll_super_2025";

export const AdminTokenGuard: React.FC<AdminTokenGuardProps> = ({ 
  children, 
  requiredLevel = 'admin' 
}) => {
  const [accessGranted, setAccessGranted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const { toast } = useToast();

  const checkAdminAccess = () => {
    const token = localStorage.getItem(TOKEN_KEY);
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    const now = Date.now();

    if (token && expiry && now < parseInt(expiry, 10)) {
      // Check if token level matches requirement
      const isValidToken = (requiredLevel === 'admin' && 
        (token === VALID_TOKEN || token === SUPER_ADMIN_TOKEN)) ||
        (requiredLevel === 'super_admin' && token === SUPER_ADMIN_TOKEN);

      if (isValidToken) {
        setAccessGranted(true);
        setRemainingTime(parseInt(expiry, 10) - now);
        setLoading(false);
        return;
      }
    }

    // Token invalid or expired
    clearStoredToken();
    setShowTokenInput(true);
    setLoading(false);
  };

  const clearStoredToken = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    setAccessGranted(false);
    setRemainingTime(null);
  };

  const validateAndStoreToken = (inputToken: string) => {
    const isValidAdmin = inputToken === VALID_TOKEN;
    const isValidSuperAdmin = inputToken === SUPER_ADMIN_TOKEN;
    
    if ((requiredLevel === 'admin' && (isValidAdmin || isValidSuperAdmin)) ||
        (requiredLevel === 'super_admin' && isValidSuperAdmin)) {
      
      const expiryTime = Date.now() + EXPIRY_MS;
      localStorage.setItem(TOKEN_KEY, inputToken);
      localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
      
      setAccessGranted(true);
      setShowTokenInput(false);
      setTokenInput('');
      setRemainingTime(EXPIRY_MS);
      
      toast({
        title: "Access Granted",
        description: `${requiredLevel === 'super_admin' ? 'Super Admin' : 'Admin'} access granted for 1 hour`,
      });
      
      return true;
    }
    
    return false;
  };

  const handleTokenSubmit = () => {
    if (!validateAndStoreToken(tokenInput)) {
      toast({
        title: "Access Denied",
        description: "Invalid admin token",
        variant: "destructive"
      });
      setTokenInput('');
    }
  };

  const handleLogout = () => {
    clearStoredToken();
    setShowTokenInput(true);
    toast({
      title: "Logged Out",
      description: "Admin session ended"
    });
  };

  // Update remaining time every minute
  useEffect(() => {
    if (!remainingTime) return;

    const interval = setInterval(() => {
      const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
      if (expiry) {
        const remaining = parseInt(expiry, 10) - Date.now();
        if (remaining <= 0) {
          clearStoredToken();
          setShowTokenInput(true);
          toast({
            title: "Session Expired",
            description: "Admin token has expired. Please re-authenticate.",
            variant: "destructive"
          });
        } else {
          setRemainingTime(remaining);
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [remainingTime, toast]);

  useEffect(() => {
    checkAdminAccess();
  }, [requiredLevel]);

  const formatTimeRemaining = (ms: number): string => {
    const minutes = Math.floor(ms / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!accessGranted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 text-primary" />
            <CardTitle>
              {requiredLevel === 'super_admin' ? 'Super Admin' : 'Admin'} Access Required
            </CardTitle>
            <CardDescription>
              Enter your {requiredLevel === 'super_admin' ? 'super admin' : 'admin'} token to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Enter admin token"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleTokenSubmit()}
                className="text-center"
              />
            </div>
            <Button 
              onClick={handleTokenSubmit} 
              className="w-full"
              disabled={!tokenInput.trim()}
            >
              Verify Access
            </Button>
            <div className="flex items-center justify-center text-sm text-muted-foreground">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Tokens expire after 1 hour
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      {/* Admin status bar */}
      <div className="bg-primary/10 border-b border-primary/20 px-4 py-2">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-2 text-sm">
            <Shield className="w-4 h-4 text-primary" />
            <span className="font-medium">
              {requiredLevel === 'super_admin' ? 'Super Admin' : 'Admin'} Mode
            </span>
          </div>
          <div className="flex items-center space-x-4">
            {remainingTime && (
              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{formatTimeRemaining(remainingTime)} remaining</span>
              </div>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="text-xs"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
};

export default AdminTokenGuard;