import React from 'react';
import { Switch, Route } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import SimpleLanding from "@/pages/SimpleLanding";
import SimpleHome from "@/pages/SimpleHome";
import NotFound from "@/pages/NotFound";

export default function SimpleAppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <Route path="/" component={SimpleLanding} />
      ) : (
        <>
          <Route path="/" component={SimpleHome} />
          <Route path="/home" component={SimpleHome} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}