import { useState, FormEvent, ChangeEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { CheckCircle } from 'lucide-react';

interface PurchaseRequestFormProps {
  onSuccess: () => void;
}

export default function PurchaseRequestForm({ onSuccess }: PurchaseRequestFormProps) {
  const { profile } = useAuth();
  const [formData, setFormData] = useState({
    equipmentName: '',
    reason: '',
    referenceLink1: '',
    referenceLink2: '',
    referenceLink3: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      if (!profile) throw new Error('Usuário não autenticado');

      if (!validateUrl(formData.referenceLink1) || !validateUrl(formData.referenceLink2) || !validateUrl(formData.referenceLink3)) {
        throw new Error('Todos os links de referência devem ser URLs válidas');
      }

      const { error: insertError } = await supabase
        .from('purchase_requests')
        .insert([
          {
            user_id: profile.id,
            equipment_name: formData.equipmentName,
            reason: formData.reason,
            reference_link_1: formData.referenceLink1,
            reference_link_2: formData.referenceLink2,
            reference_link_3: formData.referenceLink3,
            status: 'pendente',
          },
        ]);

      if (insertError) throw insertError;

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar solicitação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-8">
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-green-800 text-sm">
            Solicitação enviada com sucesso! A equipe analisará sua requisição.
          </p>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          Solicitar Compra de Equipamento
        </h3>
        <p className="text-slate-600 text-sm">
          Preencha as informações abaixo para solicitar a compra de um novo equipamento para a equipe.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Nome do Equipamento *
          </label>
          <input
            type="text"
            name="equipmentName"
            value={formData.equipmentName}
            onChange={handleInputChange}
            placeholder="Ex: Câmera Sony A7 III, Microfone Rode NT1-A"
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Motivo da Solicitação *
          </label>
          <textarea
            name="reason"
            value={formData.reason}
            onChange={handleInputChange}
            rows={4}
            placeholder="Explique por que este equipamento é necessário e como será utilizado pela equipe"
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
            required
          />
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Link de Referência 1 *
            </label>
            <input
              type="url"
              name="referenceLink1"
              value={formData.referenceLink1}
              onChange={handleInputChange}
              placeholder="https://exemplo.com/produto"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              required
            />
            <p className="mt-1 text-xs text-slate-500">
              Cole o link de um site onde o equipamento pode ser comprado
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Link de Referência 2 *
            </label>
            <input
              type="url"
              name="referenceLink2"
              value={formData.referenceLink2}
              onChange={handleInputChange}
              placeholder="https://exemplo.com/produto"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Link de Referência 3 *
            </label>
            <input
              type="url"
              name="referenceLink3"
              value={formData.referenceLink3}
              onChange={handleInputChange}
              placeholder="https://exemplo.com/produto"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              required
            />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 text-sm">
            <span className="font-semibold">Dica:</span> Forneça links de diferentes fornecedores para facilitar a comparação de preços e disponibilidade.
          </p>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading || success}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Enviando...' : success ? 'Enviada!' : 'Enviar Solicitação'}
          </button>
          <button
            type="button"
            onClick={onSuccess}
            className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
