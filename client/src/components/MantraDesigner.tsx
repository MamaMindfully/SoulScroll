import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Flower2, Plus, Trash2, Heart, Sparkles, Circle } from "lucide-react";
import { isPremiumUser } from '../utils/SubscriptionEngine';

interface Mantra {
  id: string;
  text: string;
  category: string;
  createdAt: string;
  isActive: boolean;
}

const MantraDesigner = () => {
  const [newMantra, setNewMantra] = useState('');
  const [mantraList, setMantraList] = useState<Mantra[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('personal');
  const [isAdding, setIsAdding] = useState(false);
  const isPremium = isPremiumUser();

  const categories = [
    { id: 'personal', label: 'Personal Growth', icon: Heart, color: 'bg-rose-100 text-rose-800' },
    { id: 'spiritual', label: 'Spiritual', icon: Circle, color: 'bg-purple-100 text-purple-800' },
    { id: 'healing', label: 'Healing', icon: Sparkles, color: 'bg-blue-100 text-blue-800' },
    { id: 'abundance', label: 'Abundance', icon: Flower2, color: 'bg-green-100 text-green-800' }
  ];

  const mantraTemplates = [
    "I am becoming what I admire.",
    "My heart is open to receiving abundance.",
    "I trust the wisdom of my inner voice.",
    "Every breath brings me closer to peace.",
    "I am worthy of love and compassion.",
    "My soul knows the way forward.",
    "I embrace change as my teacher.",
    "Love flows through me effortlessly."
  ];

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('soulscroll-mantras') || '[]');
    setMantraList(stored);
  }, []);

  const handleAdd = () => {
    if (!newMantra.trim()) return;
    
    setIsAdding(true);
    
    const newMantraObj: Mantra = {
      id: Date.now().toString(),
      text: newMantra.trim(),
      category: selectedCategory,
      createdAt: new Date().toISOString(),
      isActive: true
    };

    const updated = [newMantraObj, ...mantraList];
    setMantraList(updated);
    localStorage.setItem('soulscroll-mantras', JSON.stringify(updated));
    setNewMantra('');
    
    setTimeout(() => setIsAdding(false), 500);
  };

  const handleRemove = (id: string) => {
    const updated = mantraList.filter(m => m.id !== id);
    setMantraList(updated);
    localStorage.setItem('soulscroll-mantras', JSON.stringify(updated));
  };

  const toggleActive = (id: string) => {
    const updated = mantraList.map(m => 
      m.id === id ? { ...m, isActive: !m.isActive } : m
    );
    setMantraList(updated);
    localStorage.setItem('soulscroll-mantras', JSON.stringify(updated));
  };

  const addTemplate = (template: string) => {
    setNewMantra(template);
  };

  const activeMantras = mantraList.filter(m => m.isActive);
  const categoryCount = mantraList.reduce((acc, mantra) => {
    acc[mantra.category] = (acc[mantra.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (!isPremium) {
    return (
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-purple-800">
            <Flower2 className="w-6 h-6" />
            <span>🌸 Mantra Designer</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Circle className="w-12 h-12 mx-auto mb-4 text-purple-400" />
            <h3 className="text-lg font-semibold text-purple-800 mb-2">Premium Feature</h3>
            <p className="text-purple-600 mb-4">
              Create personalized mantras and affirmations for your spiritual practice
            </p>
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              Upgrade to Premium
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-rose-50 to-pink-50 border-rose-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-rose-600">{mantraList.length}</div>
            <div className="text-xs text-rose-600">Total Mantras</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{activeMantras.length}</div>
            <div className="text-xs text-purple-600">Active Practice</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{Object.keys(categoryCount).length}</div>
            <div className="text-xs text-blue-600">Categories</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {mantraList.length > 0 ? Math.ceil(mantraList.length / 7) : 0}
            </div>
            <div className="text-xs text-green-600">Weeks Active</div>
          </CardContent>
        </Card>
      </div>

      {/* Mantra Creator */}
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-purple-800">
            <Flower2 className="w-6 h-6" />
            <span>Create New Mantra</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Category Selection */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Category</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const IconComponent = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all ${
                      selectedCategory === category.id
                        ? `${category.color} border-current`
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span className="text-sm">{category.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mantra Input */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Your Mantra</label>
            <Textarea
              value={newMantra}
              onChange={(e) => setNewMantra(e.target.value)}
              placeholder="Type your personal mantra... e.g. 'I am becoming what I admire.'"
              className="min-h-[100px] border-purple-200 focus:border-purple-400"
            />
          </div>

          <Button 
            onClick={handleAdd}
            disabled={!newMantra.trim() || isAdding}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white"
          >
            {isAdding ? (
              <>
                <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add Mantra
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Mantra Templates */}
      <Card className="border-indigo-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-indigo-800">
            <Sparkles className="w-5 h-5" />
            <span>Inspiration Templates</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {mantraTemplates.slice(0, 4).map((template, index) => (
              <button
                key={index}
                onClick={() => addTemplate(template)}
                className="text-left p-3 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors"
              >
                <span className="text-sm text-indigo-700 italic">"{template}"</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Mantra Collection */}
      <Card className="border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Circle className="w-5 h-5 text-purple-600" />
              <span>Your Mantra Collection</span>
            </div>
            <Badge variant="outline" className="border-purple-300 text-purple-700">
              {mantraList.length} mantras
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mantraList.length === 0 ? (
            <div className="text-center py-8">
              <Flower2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 mb-2">No mantras yet</p>
              <p className="text-sm text-gray-400">Begin your practice by creating your first mantra above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {mantraList.map((mantra) => {
                const category = categories.find(c => c.id === mantra.category);
                const IconComponent = category?.icon || Flower2;
                
                return (
                  <div 
                    key={mantra.id}
                    className={`p-4 rounded-lg border transition-all ${
                      mantra.isActive 
                        ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200' 
                        : 'bg-gray-50 border-gray-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-2">
                          <IconComponent className="w-4 h-4 text-purple-600" />
                          <Badge 
                            variant="outline" 
                            className={category?.color || 'bg-gray-100 text-gray-800'}
                          >
                            {category?.label || 'Personal'}
                          </Badge>
                          {mantra.isActive && (
                            <Badge className="bg-green-100 text-green-800 border-green-300">
                              Active
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-gray-800 leading-relaxed italic">
                          "🌀 {mantra.text}"
                        </p>
                        
                        <div className="text-xs text-gray-500">
                          Created {new Date(mantra.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <div className="flex flex-col space-y-2 ml-4">
                        <Button
                          onClick={() => toggleActive(mantra.id)}
                          variant="outline"
                          size="sm"
                          className={mantra.isActive ? 'border-purple-300 text-purple-700' : 'border-gray-300'}
                        >
                          {mantra.isActive ? 'Pause' : 'Activate'}
                        </Button>
                        
                        <Button
                          onClick={() => handleRemove(mantra.id)}
                          variant="outline"
                          size="sm"
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MantraDesigner;