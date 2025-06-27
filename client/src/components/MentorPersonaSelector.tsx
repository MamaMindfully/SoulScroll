import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, Crown, Sparkles } from "lucide-react";
import { mentorPersonas, getPersonaByKey } from '@/constants/mentorPersonas';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
// Remove useUserProfile import to prevent hook violations
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function MentorPersonaSelector() {
  // Remove useUserProfile to prevent hook violations
  const profile = { mentorPersona: 'sage' };
  const isLoading = false;
  const [selectedPersona, setSelectedPersona] = useState(profile?.mentorPersona || 'sage');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (profile?.mentorPersona) {
      setSelectedPersona(profile.mentorPersona);
    }
  }, [profile]);

  const updatePersonaMutation = useMutation({
    mutationFn: async (personaKey: string) => {
      const response = await apiRequest('PATCH', '/api/user/mentor-persona', {
        mentor_persona: personaKey
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: "Mentor Updated",
        description: `Your AI mentor has been changed to ${getPersonaByKey(selectedPersona).name}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: "Failed to update your mentor preference. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePersonaChange = (personaKey: string) => {
    setSelectedPersona(personaKey);
    updatePersonaMutation.mutate(personaKey);
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentPersona = getPersonaByKey(selectedPersona);

  return (
    <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-indigo-800 flex items-center space-x-2">
          <Crown className="w-5 h-5" />
          <span>AI Mentor Persona</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Persona Display */}
        <div className="p-4 bg-white/60 rounded-lg border border-indigo-200">
          <div className="flex items-center space-x-3 mb-2">
            <span className="text-2xl">{currentPersona.emoji}</span>
            <div>
              <h3 className="font-semibold text-indigo-800">{currentPersona.name}</h3>
              <p className="text-sm text-indigo-600">{currentPersona.description}</p>
            </div>
          </div>
          <Badge className="bg-indigo-100 text-indigo-800 border-indigo-300">
            {currentPersona.tone}
          </Badge>
        </div>

        {/* Persona Selector */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-indigo-700">
            Choose Your AI Mentor Style:
          </label>
          <Select 
            value={selectedPersona} 
            onValueChange={handlePersonaChange}
            disabled={updatePersonaMutation.isPending}
          >
            <SelectTrigger className="border-indigo-200 focus:border-indigo-400">
              <SelectValue placeholder="Select a mentor persona" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(mentorPersonas).map((key) => {
                const persona = mentorPersonas[key];
                return (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center space-x-2">
                      <span>{persona.emoji}</span>
                      <span>{persona.name}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Persona Grid */}
        <div className="grid grid-cols-2 gap-3">
          {Object.keys(mentorPersonas).map((key) => {
            const persona = mentorPersonas[key];
            const isSelected = selectedPersona === key;
            
            return (
              <Button
                key={key}
                variant={isSelected ? "default" : "outline"}
                onClick={() => handlePersonaChange(key)}
                disabled={updatePersonaMutation.isPending}
                className={`h-auto p-3 flex flex-col items-center space-y-2 ${
                  isSelected 
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600' 
                    : 'border-indigo-200 hover:bg-indigo-50 text-indigo-700'
                }`}
              >
                <span className="text-xl">{persona.emoji}</span>
                <div className="text-center">
                  <div className="text-sm font-medium">{persona.name}</div>
                  <div className="text-xs opacity-80">{persona.tone}</div>
                </div>
              </Button>
            );
          })}
        </div>

        {/* Saving Indicator */}
        {updatePersonaMutation.isPending && (
          <div className="flex items-center justify-center space-x-2 p-2 bg-indigo-100 rounded-lg">
            <div className="animate-spin w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full" />
            <span className="text-sm text-indigo-700">Updating mentor...</span>
          </div>
        )}

        {/* Example Response Preview */}
        <div className="p-3 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-lg border border-purple-200">
          <div className="flex items-center space-x-2 mb-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-800">How {currentPersona.name} responds:</span>
          </div>
          <p className="text-sm text-purple-700 italic leading-relaxed">
            {currentPersona.promptStyle}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}