
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Table, TableBody, TableCaption, TableCell, 
  TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader, Search } from "lucide-react";
import { toast } from "sonner";
import { CorruptionModal } from "@/components/CorruptionModal";
import Navigation from "@/components/Navigation";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

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
  created_at: string | null;
  user: {
    name: string | null;
    email: string | null;
  } | null;
  assignment: {
    name: string | null;
    assignment_id: string | null;
  } | null;
}

// Sample data to use if no data is returned from Supabase
const sampleAssignments: Assignment[] = [
  {
    id: "1",
    user_id: "user1",
    assignment_id: "assignment1",
    content: "This is a sample assignment content.",
    status: "pending",
    score_status: "pending",
    last_saved: "2025-05-01T12:00:00Z",
    submitted_at: null,
    score: null,
    created_at: "2025-04-29T16:32:27.329455Z",
    user: {
      name: "John Doe",
      email: "john@example.com"
    },
    assignment: {
      name: "Introduction to Programming",
      assignment_id: "PROG101"
    }
  },
  {
    id: "2",
    user_id: "user2",
    assignment_id: "assignment2",
    content: "Another sample assignment content.",
    status: "submitted",
    score_status: "graded",
    last_saved: "2025-05-02T14:30:00Z",
    submitted_at: "2025-05-02T14:30:00Z",
    score: 85,
    created_at: "2025-04-28T10:15:00Z",
    user: {
      name: "Jane Smith",
      email: "jane@example.com"
    },
    assignment: {
      name: "Data Structures",
      assignment_id: "CS202"
    }
  }
];

const Dashboard = () => {
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isCorruptionModalOpen, setIsCorruptionModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [useRealData, setUseRealData] = useState(true);
  
  const { data: fetchedAssignments, isLoading, error, refetch } = useQuery({
    queryKey: ['user_assignments'],
    queryFn: async () => {
      console.log("Fetching assignments from Supabase...");
      try {
        const { data, error } = await supabase
          .from('user_assignments')
          .select(`
            *,
            user: regular_users(name, email),
            assignment: assignments(name, assignment_id)
          `)
          .order('last_saved', { ascending: false });
        
        if (error) {
          console.error("Supabase error:", error);
          throw new Error(error.message);
        }
        
        console.log("Assignments from Supabase:", data);
        
        if (!data || data.length === 0) {
          console.log("No assignments found in database, suggesting to use sample data");
          setUseRealData(false);
        } else {
          setUseRealData(true);
        }
        
        return data as Assignment[];
      } catch (error) {
        console.error("Error in fetching assignments:", error);
        setUseRealData(false);
        throw error;
      }
    },
  });

  // Determine which data to use - real or sample
  const assignments = useRealData ? fetchedAssignments : (fetchedAssignments?.length ? fetchedAssignments : sampleAssignments);

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

  // Format date to "DD MMM" format
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not available';
    try {
      return format(new Date(dateString), 'dd MMM');
    } catch (e) {
      console.error("Error formatting date:", e);
      return 'Invalid date';
    }
  };

  // Filter assignments based on search term
  const filteredAssignments = assignments?.filter(assignment => {
    const studentName = assignment.user?.name?.toLowerCase() || '';
    return studentName.includes(searchTerm.toLowerCase());
  });

  // Add debug button to toggle between real and sample data
  const toggleDataSource = () => {
    setUseRealData(!useRealData);
    toast.info(`Using ${!useRealData ? 'real' : 'sample'} data`);
  };

  if (error) {
    console.error("Error loading assignments:", error);
    toast.error("Failed to load assignments. Check console for details.");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Assignments Dashboard</h1>
          <Button variant="outline" size="sm" onClick={toggleDataSource}>
            {useRealData ? "Use Sample Data" : "Use Real Data"}
          </Button>
        </div>
        
        <div className="mb-4 relative">
          <div className="flex items-center">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input 
              placeholder="Search by student name" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full md:max-w-xs"
            />
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading assignments...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableCaption>
                {!useRealData && 
                  <div className="text-amber-600 font-medium mb-2">
                    Showing sample data since no assignments were found in the database
                  </div>
                }
                List of all user assignments
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Assignment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments && filteredAssignments.length > 0 ? (
                  filteredAssignments.map((assignment) => (
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
                        {formatDate(assignment.last_saved)}
                      </TableCell>
                      <TableCell>
                        {formatDate(assignment.created_at)}
                      </TableCell>
                      <TableCell>
                        {assignment.submitted_at 
                          ? formatDate(assignment.submitted_at) 
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
                    <TableCell colSpan={8} className="text-center py-8">
                      {searchTerm ? "No assignments found with that student name" : "No assignments found"}
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
