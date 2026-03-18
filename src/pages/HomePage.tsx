import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Lock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

const HomePage = () => {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleFinanceiroAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === import.meta.env.VITE_FINANCIAL_PASSWORD) {
      sessionStorage.setItem('financial_auth', 'true');
      setModalOpen(false);
      navigate('/financeiro');
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <div className="flex flex-col items-center mb-10">
        <img
          src="/logo.png"
          alt="Logo da empresa"
          className="h-24 w-auto object-contain"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl w-full">
        <Card className="flex flex-col items-center text-center">
          <CardHeader>
            <FileText className="mx-auto h-10 w-10 text-primary" />
            <CardTitle className="text-lg">Emissão Recibos</CardTitle>
            <CardDescription>Emissão de recibos, clientes e serviços</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate('/recibos')}>Acessar</Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col items-center text-center">
          <CardHeader>
            <Lock className="mx-auto h-10 w-10 text-primary" />
            <CardTitle className="text-lg">Área Financeira</CardTitle>
            <CardDescription>Faturamento geral, notas fiscais e relatórios financeiros</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => setModalOpen(true)}>Acessar</Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Área Financeira</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFinanceiroAuth} className="space-y-4">
            <Input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(false); }}
            />
            {error && <p className="text-sm text-destructive">Senha incorreta</p>}
            <Button type="submit" className="w-full">Entrar</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HomePage;
