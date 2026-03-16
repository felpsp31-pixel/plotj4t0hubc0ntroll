import { useState, useRef } from 'react';
import { Paperclip, Loader2, FileDown, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
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
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      toast.error('Apenas arquivos PDF são aceitos.');
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
          accept=".pdf"
          className="hidden"
          onChange={handleChange}
        />
        {attachmentUrl ? (
          <div className="flex items-center gap-2">
            <a
              href={attachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-primary hover:underline truncate flex-1"
            >
              <Paperclip className="h-4 w-4 shrink-0" />
              {attachmentName || 'Anexo.pdf'}
            </a>
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
          <Button
            type="button"
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Paperclip className="h-4 w-4 mr-2" />
            )}
            {loading ? 'Anexando...' : 'Anexar PDF'}
          </Button>
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
        accept=".pdf"
        className="hidden"
        onChange={handleChange}
      />
      {attachmentUrl ? (
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <a
                href={attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
              >
                <FileDown className="h-3.5 w-3.5" />
              </a>
            </TooltipTrigger>
            <TooltipContent>
              <p>{attachmentName || 'Baixar anexo'}</p>
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
            <p>Anexar PDF</p>
          </TooltipContent>
        </Tooltip>
      )}
    </TooltipProvider>
  );
};

export default PdfAttachButton;
