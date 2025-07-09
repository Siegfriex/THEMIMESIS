'use client';

import { useState, useRef, useMemo, type DragEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { analyzeFileAction } from '@/app/actions';
import { cn } from '@/lib/utils';
import { UploadCloud, File as FileIcon, Trash2, Loader2, Wand2, RefreshCw } from 'lucide-react';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = ['image/png', 'image/jpeg', 'application/x-figma'];
const ACCEPTED_FILE_EXTENSIONS = '.png, .jpg, .jpeg, .fig';

type Status = 'idle' | 'file-selected' | 'loading' | 'success' | 'error';

export function MimesisApp() {
  const [status, setStatus] = useState<Status>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const isImage = useMemo(() => file?.type.startsWith('image/'), [file]);

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile) return;

    if (selectedFile.size > MAX_FILE_SIZE) {
      toast({ variant: 'destructive', title: 'Error', description: 'File is too large. Maximum size is 10MB.' });
      return;
    }
    
    // Custom check for .fig extension as MIME type can be inconsistent
    const isFigFile = selectedFile.name.toLowerCase().endsWith('.fig');
    if (!ACCEPTED_FILE_TYPES.includes(selectedFile.type) && !isFigFile) {
      toast({ variant: 'destructive', title: 'Error', description: 'Invalid file type. Please upload a PNG, JPG, or FIG file.' });
      return;
    }

    setFile(selectedFile);
    if (selectedFile.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
    setStatus('file-selected');
  };
  
  const handleDrag = (e: DragEvent<HTMLDivElement>, dragging: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(dragging);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    handleDrag(e, false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  const handleRemoveFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setAnalysis(null);
    setStatus('idle');
  };

  const handleReset = () => {
    handleRemoveFile();
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setStatus('loading');
    setAnalysis(null);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64 = reader.result as string;
      const result = await analyzeFileAction(base64);

      if (result.success) {
        setAnalysis(result.data);
        setStatus('success');
      } else {
        toast({ variant: 'destructive', title: 'Analysis Failed', description: result.error });
        setStatus('error');
      }
    };
    reader.onerror = () => {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to read file.' });
      setStatus('error');
    };
  };

  return (
    <Card className="w-full max-w-2xl shadow-2xl shadow-primary/10 rounded-2xl overflow-hidden transition-all duration-500">
      <CardHeader className="text-center p-8 bg-card/50">
        <h1 className="font-headline text-5xl font-bold text-primary tracking-wider">MIMESIS</h1>
        <CardDescription className="font-body text-lg mt-2">
          Upload your creative work to discover its essence and audience connection.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8">
        <AnimatePresence mode="wait">
          {status === 'loading' ? (
            <motion.div key="loading" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex flex-col items-center justify-center space-y-4 h-64">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <p className="font-headline text-2xl text-muted-foreground">Analyzing your file...</p>
              <p className="font-body text-center">Our AI is delving into the depths of your creation.</p>
            </motion.div>
          ) : status === 'success' && analysis ? (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
              <div className="flex items-center gap-3">
                <Wand2 className="h-8 w-8 text-accent" />
                <h2 className="font-headline text-3xl font-bold">Analysis Complete</h2>
              </div>
              <p className="font-body text-lg whitespace-pre-wrap leading-relaxed bg-primary/5 p-4 rounded-lg border border-primary/20">{analysis}</p>
            </motion.div>
          ) : (
            <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {!file ? (
                <div
                  onDragEnter={(e) => handleDrag(e, true)} onDragLeave={(e) => handleDrag(e, false)}
                  onDragOver={(e) => handleDrag(e, true)} onDrop={handleDrop}
                  onClick={() => inputRef.current?.click()}
                  className={cn(
                    "relative flex flex-col items-center justify-center w-full h-64 rounded-xl border-2 border-dashed border-muted-foreground/30 text-center cursor-pointer transition-all duration-300 hover:border-primary hover:bg-primary/5",
                    { "border-primary bg-primary/10": isDragging }
                  )}
                >
                  <input ref={inputRef} type="file" className="hidden" onChange={(e) => handleFileSelect(e.target.files?.[0] as File)} accept={ACCEPTED_FILE_EXTENSIONS} />
                  <UploadCloud className={cn("h-16 w-16 text-muted-foreground/50 transition-transform duration-300", {"scale-110 text-primary": isDragging})} />
                  <p className="mt-4 font-headline text-2xl">
                    {isDragging ? "Drop your file here" : "Drag & Drop or Click to Upload"}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">Accepted: PNG, JPG, FIG (Max 10MB)</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center w-full h-64 rounded-xl border border-border bg-secondary/30 p-4 relative overflow-hidden">
                    <button onClick={handleRemoveFile} className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-background/50 text-muted-foreground hover:bg-destructive/80 hover:text-destructive-foreground transition-colors">
                        <Trash2 className="h-5 w-5" />
                    </button>
                    {isImage && previewUrl ? (
                      <img src={previewUrl} alt="File preview" className="max-h-full max-w-full object-contain rounded-lg shadow-md" />
                    ) : (
                      <div className="flex flex-col items-center text-muted-foreground">
                        <FileIcon className="h-20 w-20" />
                        <p className="mt-4 font-semibold text-lg truncate max-w-xs">{file.name}</p>
                      </div>
                    )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
      <CardFooter className="bg-card/50 p-6 flex justify-center">
        {status === 'file-selected' || status === 'error' ? (
          <Button size="lg" onClick={handleAnalyze} className="font-headline text-xl px-12 py-7 rounded-full shadow-lg hover:shadow-xl transition-shadow">
            <Wand2 className="mr-3 h-6 w-6" />
            분석 시작
          </Button>
        ) : status === 'success' ? (
          <Button size="lg" variant="outline" onClick={handleReset} className="font-headline text-xl px-12 py-7 rounded-full">
            <RefreshCw className="mr-3 h-5 w-5" />
            Analyze Another
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  );
}
