'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { AnimationConfig, getAnimationsByCategory, getAvailableCategories } from '@/lib/animations/animations';
import { Player } from '@lottiefiles/react-lottie-player';

interface AnimationPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (animation: AnimationConfig | null) => void;
  selectedAnimationId?: string;
  eventCategory?: string;
}

export function AnimationPicker({
  open,
  onOpenChange,
  onSelect,
  selectedAnimationId,
  eventCategory
}: AnimationPickerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(selectedAnimationId || null);
  const [activeCategory, setActiveCategory] = useState<string>(eventCategory || getAvailableCategories()[0]);

  // Update selectedId when selectedAnimationId changes
  useEffect(() => {
    setSelectedId(selectedAnimationId || null);
  }, [selectedAnimationId]);

  const handleSelect = () => {
    if (!selectedId) {
      onSelect(null);
      onOpenChange(false);
      return;
    }

    // Find the selected animation
    const selected = getAnimationsByCategory(activeCategory)
      .find(anim => anim.id === selectedId);
    
    if (selected) {
      onSelect(selected);
    }
    onOpenChange(false);
  };

  const categories = getAvailableCategories();
  const animations = getAnimationsByCategory(activeCategory);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select an Animation</DialogTitle>
        </DialogHeader>
        
        <Tabs 
          value={activeCategory} 
          onValueChange={setActiveCategory}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="w-full overflow-x-auto justify-start">
            {categories.map(category => (
              <TabsTrigger key={category} value={category}>
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value={activeCategory} className="flex-1 overflow-auto mt-4">
            {animations.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-2">
                <div 
                  className={`border-2 rounded-lg p-2 cursor-pointer transition-colors relative ${
                    selectedId === null 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-transparent hover:border-gray-200'
                  }`}
                  onClick={() => setSelectedId(null)}
                >
                  <div className="aspect-video bg-gray-100 rounded overflow-hidden">
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-gray-500 text-sm">No Animation</span>
                    </div>
                  </div>
                </div>
                
                {animations.map(animation => (
                  <div 
                    key={animation.id}
                    className={`border-2 rounded-lg p-2 cursor-pointer transition-colors relative ${
                      selectedId === animation.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-transparent hover:border-gray-200'
                    }`}
                    onClick={() => setSelectedId(animation.id)}
                  >
                    <div className="aspect-video bg-gray-100 rounded overflow-hidden">
                      {selectedId === animation.id && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                          <Player
                            autoplay
                            loop
                            src={animation.source}
                            style={{ width: '100%', height: '100%' }}
                          />
                        </div>
                      )}
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-gray-500 text-sm">Preview</span>
                      </div>
                    </div>
                    <div className="mt-2 text-sm font-medium text-center">
                      {animation.name}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-gray-500">
                No animations found for this category.
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSelect}>
            Select Animation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
