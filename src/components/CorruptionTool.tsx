
import React, { useState, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Download, AlertTriangle, Info } from 'lucide-react';
import { corruptText, CorruptionSettings } from '@/utils/textCorruptor';
import { toast } from 'sonner';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import parse from 'html-react-parser';

interface CorruptionToolProps {
  initialContent: string;
  onCorruptedTextChange: (text: string) => void;
  candidateName?: string;
  assignmentName?: string;
}

const CorruptionTool: React.FC<CorruptionToolProps> = ({
  initialContent,
  onCorruptedTextChange,
  candidateName = '',
  assignmentName = ''
}) => {
  const [content, setContent] = useState<string>(initialContent);
  const [corruptionSettings, setCorruptionSettings] = useState<CorruptionSettings>({
    spelling: 3,
    punctuation: 2,
    missingText: 4
  });
  
  const [plainOutput, setPlainOutput] = useState<string>('');
  const [markedOutput, setMarkedOutput] = useState<string>('');
  const [errorCounts, setErrorCounts] = useState({
    spelling: 0,
    punctuation: 0,
    missingText: 0
  });
  
  const plainOutputRef = useRef<HTMLDivElement>(null);
  const markedOutputRef = useRef<HTMLDivElement>(null);

  const modules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'clean']
    ]
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'link'
  ];

  const handleCorruptText = () => {
    if (!content.trim()) {
      toast.error("Please paste some text first");
      return;
    }

    const result = corruptText(content, corruptionSettings);
    setPlainOutput(result.plainVersion);
    
    // Add the candidate name, assignment name, and error summary to the marked version
    let headerContent = '';
    if (candidateName || assignmentName) {
      headerContent = `<div class="mb-4 p-3 bg-gray-100 rounded-md">`;
      
      if (candidateName) {
        headerContent += `<div class="font-bold">Candidate: ${candidateName}</div>`;
      }
      
      if (assignmentName) {
        headerContent += `<div class="font-bold">Assignment: ${assignmentName}</div>`;
      }
      
      headerContent += `<div class="mt-2 text-sm">
        <div>Spelling Errors: ${result.errorCounts.spelling}</div>
        <div>Punctuation Errors: ${result.errorCounts.punctuation}</div>
        <div>Missing Text: ${result.errorCounts.missingText}</div>
      </div>`;
      
      headerContent += `</div>`;
    }
    
    setMarkedOutput(headerContent + result.markedVersion);
    setErrorCounts(result.errorCounts);
    onCorruptedTextChange(result.plainVersion);
    
    toast.success("Text successfully corrupted!");
  };

  const handleCopyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text.replace(/<[^>]*>/g, ''));
    toast.success(`${type} version copied to clipboard!`);
  };

  const downloadAsPDF = async (outputType: 'marked' | 'plain') => {
    const element = outputType === 'marked' ? markedOutputRef.current : plainOutputRef.current;
    if (!element) return;

    try {
      toast.info("Generating PDF...");
      
      // Create PDF with A4 dimensions
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15; // 15mm margins
      
      // Get the HTML content as text
      const htmlContent = element.innerHTML;
      
      // Clean up the HTML - remove unnecessary styling that might cause bloat
      const cleanedHtml = htmlContent
        //.replace(/style="[^"]*"/g, '') // Remove inline styles
       // .replace(/class="[^"]*"/g, '') // Remove classes
        //.replace(/<br>\s*<br>/g, '<br>'); // Remove double line breaks
      
      // Use the built-in HTML renderer from jsPDF
      pdf.html(cleanedHtml, {
        callback: function(pdf) {
          // Check if PDF has content
          if (pdf.internal.pages && Object.keys(pdf.internal.pages).length > 0) {
            // Save with a smaller file size (compression)
            const namePart = candidateName?.trim().replace(/\s+/g, '_') || 'Candidate';
const assignmentPart = assignmentName?.trim().replace(/\s+/g, '_') || 'Assignment';
const fileName = `${namePart}_${assignmentPart}.pdf`;
pdf.save(fileName);
            toast.success(`${outputType === 'marked' ? 'Marked' : 'Plain'} PDF downloaded successfully!`);
          } else {
            toast.error("Failed to generate PDF - No content");
          }
        },
        x: margin,
        y: margin,
        width: pageWidth - (margin * 2), 
        windowWidth: 800, // Control rendering quality
        autoPaging: true,
        margin: [margin, margin, margin, margin],
        html2canvas: {
          scale: 0.21, // Lower scale for better performance and smaller file size
          useCORS: true,
          logging: false, // Disable logging to improve performance
          imageTimeout: 5000 // Shorter timeout to prevent hanging
        }
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    }
  };

  return (
    <div className="container mx-auto px-4">
      <div className="grid gap-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-1">
            <Label htmlFor="textInput">Input Text</Label>
            <div className="flex items-center text-sm text-muted-foreground">
              <Info className="h-3.5 w-3.5 mr-1" />
              <span>Edit the text if needed</span>
            </div>
          </div>
          <ReactQuill 
            id="textInput"
            theme="snow"
            value={content}
            onChange={setContent}
            modules={modules}
            formats={formats}
            placeholder="Edit the text here..."
            className="react-quill"
          />
        </div>

        <div className="grid gap-4">
          <h3 className="text-lg font-medium">Corruption Settings</h3>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="spellingSlider">Spelling Errors: {corruptionSettings.spelling}%</Label>
              <div className="flex items-center text-sm text-amber-500">
                <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                <span>Word misspellings</span>
              </div>
            </div>
            <Slider
              id="spellingSlider"
              defaultValue={[corruptionSettings.spelling]}
              min={0}
              max={100}
              step={1}
              onValueChange={(value) => setCorruptionSettings(prev => ({ ...prev, spelling: value[0] }))}
              className="py-3"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="punctuationSlider">Punctuation Errors: {corruptionSettings.punctuation}%</Label>
              <div className="flex items-center text-sm text-amber-500">
                <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                <span>Incorrect or missing punctuation</span>
              </div>
            </div>
            <Slider
              id="punctuationSlider"
              defaultValue={[corruptionSettings.punctuation]}
              min={0}
              max={100}
              step={1}
              onValueChange={(value) => setCorruptionSettings(prev => ({ ...prev, punctuation: value[0] }))}
              className="py-3"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="missingTextSlider">Missing Text: {corruptionSettings.missingText}%</Label>
              <div className="flex items-center text-sm text-amber-500">
                <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                <span>Words or sentences removal</span>
              </div>
            </div>
            <Slider
              id="missingTextSlider"
              defaultValue={[corruptionSettings.missingText]}
              min={0}
              max={100}
              step={1}
              onValueChange={(value) => setCorruptionSettings(prev => ({ ...prev, missingText: value[0] }))}
              className="py-3"
            />
          </div>
        </div>

        <Button 
          onClick={handleCorruptText} 
          className="w-full"
          size="lg"
        >
          Corrupt Text
        </Button>

        {(plainOutput || markedOutput) && (
          <Tabs defaultValue="plain" className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="plain">Plain Version</TabsTrigger>
              <TabsTrigger value="marked">Marked Version</TabsTrigger>
            </TabsList>
            <TabsContent value="plain" className="mt-2">
              <div className="flex justify-between items-center mb-2">
                <Label>Plain Output (with errors)</Label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleCopyToClipboard(plainOutput, "Plain")}>
                    <Copy className="h-4 w-4 mr-1" /> Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => downloadAsPDF('plain')}>
                    <Download className="h-4 w-4 mr-1" /> PDF
                  </Button>
                </div>
              </div>
              <div 
                ref={plainOutputRef} 
                className="output-container"
                dangerouslySetInnerHTML={{ __html: plainOutput }} 
              />
            </TabsContent>
            <TabsContent value="marked" className="mt-2">
              <div className="flex justify-between items-center mb-2">
                <Label>Marked Output (with highlighted errors)</Label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleCopyToClipboard(markedOutput, "Marked")}>
                    <Copy className="h-4 w-4 mr-1" /> Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => downloadAsPDF('marked')}>
                    <Download className="h-4 w-4 mr-1" /> PDF
                  </Button>
                </div>
              </div>
              <div 
                ref={markedOutputRef}
                className="output-container"
              >
                {parse(markedOutput)}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default CorruptionTool;
