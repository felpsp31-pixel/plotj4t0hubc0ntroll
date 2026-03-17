import { useState, useRef } from 'react';
import { Paperclip, Loader2, FileDown, X, Eye, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import FilePreviewModal from './FilePreviewModal';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface PdfAttachButtonProps {
  invoiceId: string;
  attachmentUrl?: string;
  attachmentName?: string;
  onAttached: (url: string, name: string) => void;
  onRemoved: () => void;
  variant?: 'icon' | 'full';
  className?: string;
}

const BUCKET = 'invoice-attachments';
const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const PdfAttachButton = ({
  invoiceId,
  attachmentUrl,
  attachmentName,
  onAttached,
  onRemoved,
  variant = 'icon',
  className = '',
}: PdfAttachButtonProps) => {
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Apenas PDF e imagens (JPG, PNG, GIF, WebP) são aceitos.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 10MB.');
      return;
    }

    setLoading(true);
    try {
      const filePath = `${invoiceId}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, file, { upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(filePath);

      onAttached(urlData.publicUrl, file.name);
      toast.success(`Anexo "${file.name}" adicionado.`);
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Erro ao anexar arquivo.');
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  };

  const handleRemove = () => {
    onRemoved();
    toast.success('Anexo removido.');
  };

  if (variant === 'full') {
    return (
      <div className={className}>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
          className="hidden"
          onChange={handleChange}
        />
        {attachmentUrl ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPreviewOpen(true)}
              className="flex items-center gap-1.5 text-sm text-primary hover:underline truncate flex-1 text-left"
            >
              <Paperclip className="h-4 w-4 shrink-0" />
              {attachmentName || 'Anexo'}
            </button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPreviewOpen(true)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive/80"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => inputRef.current?.click()}
            className={`w-full border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
              dragging
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Anexando...
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Arraste ou clique para anexar
                </span>
                <span className="text-xs text-muted-foreground/60">
                  PDF, JPG, PNG (máx. 10MB)
                </span>
              </div>
            )}
          </div>
        )}
        {attachmentUrl && (
          <FilePreviewModal
            open={previewOpen}
            onOpenChange={setPreviewOpen}
            url={attachmentUrl}
            name={attachmentName || 'Anexo'}
          />
        )}
      </div>
    );
  }

  // Icon variant for InvoiceCard
  return (
    <TooltipProvider>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
        className="hidden"
        onChange={handleChange}
      />
      {attachmentUrl ? (
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setPreviewOpen(true)}
                className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
              >
                <Eye className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Visualizar {attachmentName || 'anexo'}</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <a
                href={attachmentUrl}
                download={attachmentName}
                className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
              >
                <FileDown className="h-3.5 w-3.5" />
              </a>
            </TooltipTrigger>
            <TooltipContent>
              <p>Baixar {attachmentName || 'anexo'}</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleRemove}
                className="flex items-center text-xs text-destructive hover:text-destructive/80 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Remover anexo</p>
            </TooltipContent>
          </Tooltip>
          <FilePreviewModal
            open={previewOpen}
            onOpenChange={setPreviewOpen}
            url={attachmentUrl}
            name={attachmentName || 'Anexo'}
          />
        </div>
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => inputRef.current?.click()}
              disabled={loading}
              className={`flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 ${className}`}
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Paperclip className="h-3.5 w-3.5" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Anexar arquivo</p>
          </TooltipContent>
        </Tooltip>
      )}
    </TooltipProvider>
  );
};

export default PdfAttachButton;
