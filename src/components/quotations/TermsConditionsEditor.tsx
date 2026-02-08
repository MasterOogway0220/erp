'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // For custom term number/category
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface Term {
  id: string;
  term_number: number;
  term_text: string;
  is_standard: boolean;
  category?: string;
  is_active: boolean;
}

interface SelectedQuotationTerm {
  term_id: string; // Refers to terms_conditions_library.id
  custom_text: string; // The text stored for this specific quotation
  display_order: number;
}

interface TermsConditionsEditorProps {
  initialSelectedTerms?: SelectedQuotationTerm[];
  onTermsChange: (terms: SelectedQuotationTerm[]) => void;
}

export function TermsConditionsEditor({ initialSelectedTerms, onTermsChange }: TermsConditionsEditorProps) {
  const [libraryTerms, setLibraryTerms] = useState<Term[]>([]);
  const [selectedTerms, setSelectedTerms] = useState<SelectedQuotationTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextCustomTermNumber, setNextCustomTermNumber] = useState(1); // For custom terms

  useEffect(() => {
    const fetchLibraryTerms = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/terms-conditions/library');
        const result = await response.json();
        if (response.ok) {
          setLibraryTerms(result.data);
        } else {
          setError(result.error || 'Failed to fetch terms library');
        }
      } catch (err: any) {
        setError('An error occurred while fetching terms library: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchLibraryTerms();
  }, []);

  useEffect(() => {
    if (libraryTerms.length > 0 && initialSelectedTerms) {
      // Initialize selectedTerms from initialSelectedTerms, ensuring we use libraryTerm's term_text if custom_text is empty
      const mergedTerms = initialSelectedTerms.map(initTerm => {
        const correspondingLibraryTerm = libraryTerms.find(lt => lt.id === initTerm.term_id);
        return {
          ...initTerm,
          custom_text: initTerm.custom_text || correspondingLibraryTerm?.term_text || '',
        };
      });
      setSelectedTerms(mergedTerms.sort((a,b) => a.display_order - b.display_order));
      // Find the max term number for custom terms if any are present
      const maxTermNum = Math.max(...libraryTerms.map(t => t.term_number), ...(initialSelectedTerms.map(t => t.display_order)));
      setNextCustomTermNumber(maxTermNum + 1);
    } else if (libraryTerms.length > 0) {
        // If no initial selected terms, default to empty, but set custom term number
        const maxTermNum = Math.max(...libraryTerms.map(t => t.term_number));
        setNextCustomTermNumber(maxTermNum + 1);
    }
  }, [libraryTerms, initialSelectedTerms]);

  // Notify parent component of changes
  useEffect(() => {
    onTermsChange(selectedTerms);
  }, [selectedTerms, onTermsChange]);


  const handleTermToggle = (termId: string, checked: boolean, libraryTerm?: Term) => {
    setSelectedTerms(prev => {
      let newTerms;
      if (checked) {
        // Add term
        const termText = libraryTerm ? libraryTerm.term_text : ''; // For custom, start with empty
        newTerms = [...prev, {
          term_id: termId,
          custom_text: termText,
          display_order: libraryTerm?.term_number || nextCustomTermNumber,
        }];
        if (!libraryTerm) setNextCustomTermNumber(prev => prev + 1); // Increment for next custom term
      } else {
        // Remove term
        newTerms = prev.filter(t => t.term_id !== termId);
      }
      return newTerms.sort((a,b) => a.display_order - b.display_order);
    });
  };

  const handleTermTextChange = (termId: string, text: string) => {
    setSelectedTerms(prev =>
      prev.map(t => (t.term_id === termId ? { ...t, custom_text: text } : t))
    );
  };

  const handleAddCustomTerm = useCallback(() => {
    const newCustomTermId = `custom-${Date.now()}`;
    const newTerm: Term = {
      id: newCustomTermId,
      term_number: nextCustomTermNumber,
      term_text: 'Enter your custom term here...',
      is_standard: false,
      is_active: true,
      category: 'Custom',
    };
    setLibraryTerms(prev => [...prev, newTerm]);
    handleTermToggle(newCustomTermId, true, newTerm); // Automatically select it
  }, [nextCustomTermNumber, handleTermToggle]);


  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading Terms & Conditions...</span>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  const allTermsForDisplay = [...libraryTerms].sort((a, b) => a.term_number - b.term_number);

  return (
    <div className="space-y-4">
      <h3>Select Terms & Conditions</h3>
      
      {allTermsForDisplay.map(libTerm => {
        const isSelected = selectedTerms.some(st => st.term_id === libTerm.id);
        const termToDisplay = selectedTerms.find(st => st.term_id === libTerm.id) || { custom_text: libTerm.term_text };

        return (
          <div key={libTerm.id} className="flex items-start gap-3 border-b pb-2 last:border-0">
            <Checkbox
              id={`term-${libTerm.id}`}
              checked={isSelected}
              onCheckedChange={(checked: boolean) => handleTermToggle(libTerm.id, checked, libTerm)}
            />
            
            <div className="flex-1">
              <Label htmlFor={`term-${libTerm.id}`} className="font-medium cursor-pointer">
                Term {libTerm.term_number}: {libTerm.category}
              </Label>
              
              <Textarea
                value={termToDisplay.custom_text}
                onChange={(e) => handleTermTextChange(libTerm.id, e.target.value)}
                disabled={!isSelected}
                className="mt-2 text-sm"
                rows={3}
                placeholder="Enter term text here"
              />
            </div>
          </div>
        );
      })}
      
      <Button onClick={handleAddCustomTerm}>
        + Add Custom Term
      </Button>
    </div>
  );
}
