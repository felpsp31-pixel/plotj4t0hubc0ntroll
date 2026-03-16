import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { toast } from 'sonner';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SettingsModal = ({ open, onOpenChange }: SettingsModalProps) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleSave = () => {
    if (!currentPassword || !newPassword) {
      toast.error('Preencha todos os campos.');
      return;
    }
    toast.success('Senha atualizada com sucesso!');
    setCurrentPassword('');
    setNewPassword('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configurações</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="current-pw">Senha atual</Label>
            <Input
              id="current-pw"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-pw">Nova senha</Label>
            <Input
              id="new-pw"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <Button onClick={handleSave} className="w-full">
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
