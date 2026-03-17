import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink } from 'lucide-react';

interface FilePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  name: string;
}

const FilePreviewModal = ({ open, onOpenChange, url, name }: FilePreviewModalProps) => {
  const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(name);
  const isPdf = /\.pdf$/i.test(name) || url.includes('.pdf');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="truncate pr-4">{name}</DialogTitle>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" asChild>
              <a href={url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-1" />
                Abrir
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={url} download={name}>
                <Download className="h-4 w-4 mr-1" />
                Baixar
              </a>
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-auto rounded-lg border border-border bg-secondary/30">
          {isPdf ? (
            <iframe
              src={url}
              className="w-full h-[70vh] rounded-lg"
              title={name}
            />
          ) : isImage ? (
            <div className="flex items-center justify-center p-4">
              <img src={url} alt={name} className="max-w-full max-h-[65vh] object-contain rounded" />
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              Pré-visualização não disponível para este tipo de arquivo.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FilePreviewModal;
