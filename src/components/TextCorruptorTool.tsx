
import React, { useState, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Download, AlertTriangle, Info } from 'lucide-react';
import { corruptText } from '@/utils/textCorruptor';
import { toast } from 'sonner';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import parse from 'html-react-parser';

const TextCorruptorTool: React.FC = () => {
  const [content, setContent] = useState<string>('');
  const [corruptionSettings, setCorruptionSettings] = useState({
    spelling: 30,
    punctuation: 30,
    missingText: 30
  });
  const [plainOutput, setPlainOutput] = useState<string>('');
  const [markedOutput, setMarkedOutput] = useState<string>('');
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

    const { plainVersion, markedVersion } = corruptText(content, corruptionSettings);
    setPlainOutput(plainVersion);
    setMarkedOutput(markedVersion);
    toast.success("Text successfully corrupted!");
  };

  const handleCopyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text.replace(/<[^>]*>/g, ''));
    toast.success(`${type} version copied to clipboard!`);
  };

  const downloadAsPDF = async () => {
    if (!markedOutputRef.current) return;

    try {
      toast.info("Generating PDF...");
      
      const element = markedOutputRef.current;
      const contentWidth = element.scrollWidth;
      const contentHeight = element.scrollHeight;
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10; // 10mm margins
      const usableWidth = pageWidth - (margin * 2);
      const usableHeight = pageHeight - (margin * 2);
      
      // Clone the element to manipulate it without affecting the visible one
      const clonedElement = element.cloneNode(true) as HTMLElement;
      clonedElement.style.width = `${usableWidth}mm`;
      document.body.appendChild(clonedElement);
      
      // Measure content after setting width to PDF usable width
      const scaledHeight = clonedElement.scrollHeight;
      const pageCount = Math.ceil(scaledHeight / usableHeight);
      
      // Process each page
      for (let i = 0; i < pageCount; i++) {
        if (i > 0) {
          pdf.addPage();
        }
        
        // Create a div that will show only the content for this page
        const pageDiv = document.createElement('div');
        pageDiv.style.position = 'absolute';
        pageDiv.style.top = '0';
        pageDiv.style.left = '0';
        pageDiv.style.width = `${usableWidth}mm`;
        pageDiv.style.height = `${usableHeight}mm`;
        pageDiv.style.overflow = 'hidden';
        
        // Clone content for this page
        const contentClone = clonedElement.cloneNode(true) as HTMLElement;
        contentClone.style.position = 'absolute';
        contentClone.style.top = `${-i * usableHeight}mm`;
        pageDiv.appendChild(contentClone);
        document.body.appendChild(pageDiv);
        
        // Convert this page to an image
        const imgData = await toPng(pageDiv, {
          backgroundColor: '#ffffff',
          pixelRatio: 2,
          quality: 1
        });
        
        // Add the image to the PDF
        pdf.addImage(imgData, 'PNG', margin, margin, usableWidth, usableHeight);
        
        // Clean up
        document.body.removeChild(pageDiv);
      }
      
      // Final clean up
      document.body.removeChild(clonedElement);
      
      pdf.save('corrupted-text.pdf');
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    }
  };

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2 text-primary">Text Corruption Tool</h1>
        <p className="text-muted-foreground">
          Paste your formatted text and introduce intentional errors while preserving formatting
        </p>
      </header>

      <div className="grid gap-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-1">
            <Label htmlFor="textInput">Input Text</Label>
            <div className="flex items-center text-sm text-muted-foreground">
              <Info className="h-3.5 w-3.5 mr-1" />
              <span>Paste your formatted text here</span>
            </div>
          </div>
          <ReactQuill 
            id="textInput"
            theme="snow"
            value={content}
            onChange={setContent}
            modules={modules}
            formats={formats}
            placeholder="Paste your formatted text here..."
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
                <Button variant="outline" size="sm" onClick={() => handleCopyToClipboard(plainOutput, "Plain")}>
                  <Copy className="h-4 w-4 mr-1" /> Copy
                </Button>
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
                  <Button variant="outline" size="sm" onClick={downloadAsPDF}>
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

export default TextCorruptorTool;
