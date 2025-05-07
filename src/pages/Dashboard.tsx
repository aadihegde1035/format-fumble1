import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Table, TableBody, TableCaption, TableCell, 
  TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader } from "lucide-react";
import { toast } from "sonner";
import { CorruptionModal } from "@/components/CorruptionModal";
import Navigation from "@/components/Navigation";

interface Assignment {
  id: string;
  user_id: string;
  assignment_id: string;
  content: string | null;
  status: string;
  score_status: string;
  last_saved: string;
  submitted_at: string | null;
  score: number | null;
  user: {
    name: string | null;
    email: string | null;
  } | null;
  assignment: {
    name: string | null;
    assignment_id: string | null;
  } | null;
}

const Dashboard = () => {
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isCorruptionModalOpen, setIsCorruptionModalOpen] = useState(false);
  
  const { data: assignments, isLoading, error, refetch } = useQuery({
    queryKey: ['user_assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_assignments')
        .select(`
          *,
          user: regular_users(name, email),
          assignment: assignments(name, assignment_id)
        `)
        .order('last_saved', { ascending: false });
      
      if (error) {
        throw new Error(error.message);
      }
      return data as Assignment[];
    }
  });

  const handleCorruptText = (assignment: Assignment) => {
    if (!assignment.content) {
      toast.error("No content to corrupt in this assignment");
      return;
    }
    
    setSelectedAssignment(assignment);
    setIsCorruptionModalOpen(true);
  };

  const handleCorruptionComplete = () => {
    refetch();
    setIsCorruptionModalOpen(false);
    setSelectedAssignment(null);
  };

  if (error) {
    toast.error("Failed to load assignments");
    console.error("Error loading assignments:", error);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Assignments Dashboard</h1>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading assignments...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableCaption>List of all user assignments</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Assignment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments && assignments.length > 0 ? (
                  assignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell>{assignment.user?.name || 'Unknown'}</TableCell>
                      <TableCell>{assignment.assignment?.name || 'Unknown'}</TableCell>
                      <TableCell>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                          assignment.status === 'submitted' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {assignment.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        {assignment.score !== null ? (
                          assignment.score
                        ) : (
                          <span className="text-gray-400">Not scored</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(assignment.last_saved).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {assignment.submitted_at 
                          ? new Date(assignment.submitted_at).toLocaleDateString() 
                          : 'Not submitted'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCorruptText(assignment)}
                          disabled={!assignment.content}
                        >
                          Generate Corrupt
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No assignments found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {selectedAssignment && (
          <CorruptionModal
            isOpen={isCorruptionModalOpen}
            onClose={() => setIsCorruptionModalOpen(false)}
            assignment={selectedAssignment}
            onComplete={handleCorruptionComplete}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
