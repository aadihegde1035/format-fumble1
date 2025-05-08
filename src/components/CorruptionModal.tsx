
import React, { useState } from 'react';
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Loader, Save, Download } from 'lucide-react';
import CorruptionTool from '@/components/CorruptionTool';

interface Assignment {
  id: string;
  user_id: string;
  assignment_id: string;
  content: string | null;
  status: string;
  regular_users: {
    name: string | null;

  } | null;
  assignments: {
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
  const [markedText, setMarkedText] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveCorruptedText = async () => {
    if (!corruptedText) {
      toast.error("No corrupted text to save");
      return;
    }

    setIsSaving(true);
    
    try {
      // Only update the content field, not the last_saved field
      const { error } = await supabase
        .from('user_assignments')
        .update({ 
          content: corruptedText 
        })
        .eq('id', assignment.id);
      console.log(assignment.id);
      console.log('Saving content for assignment ID:', assignment.id);

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

  const downloadTextFile = (content: string, fileType: 'corrupted' | 'marked') => {
    const studentName = assignment.regular_users?.name || 'unknown';
    const assignmentName = assignment.assignments?.name || 'unknown';
    const fileName = `${studentName}-${assignmentName}-${fileType}-${new Date().toISOString().slice(0, 10)}.txt`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Corrupt Assignment: {assignment.assignments?.name || 'Unnamed'} 
            {assignment.regular_users?.name ? ` - ${assignment.regular_users.name}` : ''}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-grow overflow-auto">
          <CorruptionTool 
            initialContent={assignment.content || ''} 
            onCorruptedTextChange={setCorruptedText}
            onMarkedTextChange={setMarkedText}
            candidateName={assignment.regular_users?.name || ''}
            assignmentName={assignment.assignments?.name || ''}
          />
        </div>
        
        <DialogFooter className="mt-4 flex flex-wrap gap-2 justify-end">
          <Button 
            variant="outline" 
            onClick={() => downloadTextFile(corruptedText, 'corrupted')}
            disabled={!corruptedText}
            className="flex items-center"
          >
            <Download className="mr-1 h-4 w-4" />
            Download Corrupted Text
          </Button>
          <Button 
            variant="outline" 
            onClick={() => downloadTextFile(markedText, 'marked')}
            disabled={!markedText}
            className="flex items-center"
          >
            <Download className="mr-1 h-4 w-4" />
            Download Marked Text
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveCorruptedText} 
            disabled={!corruptedText || isSaving}
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
