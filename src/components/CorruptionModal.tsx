
import React, { useState } from 'react';
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Loader, Save } from 'lucide-react';
import CorruptionTool from '@/components/CorruptionTool';

interface Assignment {
  id: string;
  user_id: string;
  assignment_id: string;
  content: string | null;
  status: string;
  user?: {
    name: string | null;
  } | null;
  assignment?: {
    name: string | null;
  } | null;
}

interface CorruptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment;
  onComplete: () => void;
}

export const CorruptionModal: React.FC<CorruptionModalProps> = ({ 
  isOpen, 
  onClose, 
  assignment, 
  onComplete 
}) => {
  const [corruptedText, setCorruptedText] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveCorruptedText = async () => {
    if (!corruptedText) {
      toast.error("No corrupted text to save");
      return;
    }

    setIsSaving(true);
    
    try {
      const { error } = await supabase
        .from('user_assignments')
        .update({ content: corruptedText })
        .eq('id', assignment.id);
      
      if (error) {
        throw error;
      }
      
      toast.success("Corrupted text saved successfully");
      onComplete();
    } catch (error) {
      console.error("Error saving corrupted text:", error);
      toast.error("Failed to save corrupted text");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Corrupt Assignment: {assignment.assignment?.name || 'Unnamed'} 
            {assignment.user?.name ? ` - ${assignment.user.name}` : ''}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-grow overflow-auto">
          <CorruptionTool 
            initialContent={assignment.content || ''} 
            onCorruptedTextChange={setCorruptedText}
            candidateName={assignment.user?.name || ''}
            assignmentName={assignment.assignment?.name || ''}
          />
        </div>
        
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveCorruptedText} 
            disabled={!corruptedText || isSaving}
            className="ml-2"
          >
            {isSaving ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save to Database
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
