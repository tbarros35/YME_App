import React, { useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  X,
  Camera,
  Mail,
  User as UserIcon,
  Building2,
  Briefcase,
  Layers,
  Shield,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Info,
} from 'lucide-react';
import api from '@/lib/api';
import { RoleBadge } from '@/components/ui/Badge';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, updateUserAvatar } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('A imagem deve ter no máximo 10MB.');
      return;
    }

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage('Por favor seleciona uma imagem válida (JPEG, PNG ou WEBP).');
      return;
    }

    try {
      setIsUploading(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const formData = new FormData();
      formData.append('avatar', file);

      const response = await api.post('/users/profile/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const updatedAvatarUrl = response.data?.user?.avatarUrl;
      if (updatedAvatarUrl) {
        updateUserAvatar(updatedAvatarUrl);
        setSuccessMessage('Foto de perfil atualizada com sucesso!');
        setTimeout(() => setSuccessMessage(null), 3500);
      }
    } catch (err: any) {
      console.error('Erro ao carregar fotografia de perfil:', err);
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Não foi possível atualizar a foto de perfil.';
      setErrorMessage(msg);
    } finally {
      setIsUploading(false);
      // Reset input value so re-selecting same file triggers onChange
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const initials = user.fullName
    ? user.fullName
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'YM';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#151e33]/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Card */}
        <div className="relative bg-[#151e33] px-6 pt-6 pb-14 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#ff63f6]" />
              <h3 className="text-base sm:text-lg font-bold tracking-tight text-white">
                Perfil do Membro
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Avatar Section Floating Over Header */}
        <div className="px-6 sm:px-8 pb-6 -mt-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 pb-4 border-b border-slate-100">
            {/* Avatar Circle Container */}
            <div className="relative group shrink-0">
              <div
                onClick={handleAvatarClick}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white shadow-lg overflow-hidden bg-slate-100 cursor-pointer relative transition-transform duration-200 group-hover:scale-105"
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#151e33] flex items-center justify-center text-2xl font-black text-white">
                    {initials}
                  </div>
                )}

                {/* Hover Camera Overlay */}
                <div className="absolute inset-0 bg-black/40 backdrop-blur-2xs flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-6 h-6 mb-1" />
                  <span className="text-[10px] font-bold">Alterar</span>
                </div>

                {isUploading && (
                  <div className="absolute inset-0 bg-[#151e33]/70 backdrop-blur-xs flex flex-col items-center justify-center text-white">
                    <Loader2 className="w-6 h-6 animate-spin text-[#ff63f6]" />
                    <span className="text-[10px] font-bold mt-1">A carregar...</span>
                  </div>
                )}
              </div>

              {/* Camera Action Button */}
              <button
                type="button"
                onClick={handleAvatarClick}
                disabled={isUploading}
                title="Alterar Fotografia"
                className="absolute bottom-0 right-0 p-2 rounded-full bg-[#ff63f6] text-[#151e33] shadow-md border-2 border-white hover:bg-[#ff63f6]/90 transition-all cursor-pointer"
              >
                <Camera className="w-4 h-4" />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Name and Role */}
            <div className="text-center sm:text-left flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-[#151e33] truncate">
                  {user.fullName}
                </h2>
                <div>
                  <RoleBadge role={user.role} />
                </div>
              </div>
              <p className="text-xs text-[#151e33]/60 font-medium mt-0.5">
                {user.position} • {user.department?.name || 'YME'}
              </p>
              <button
                type="button"
                onClick={handleAvatarClick}
                disabled={isUploading}
                className="mt-2 text-xs font-bold text-[#ff63f6] hover:text-[#151e33] transition-colors inline-flex items-center gap-1"
              >
                <Camera className="w-3 h-3" />
                <span>{user.avatarUrl ? 'Alterar foto de perfil' : 'Carregar foto de perfil'}</span>
              </button>
            </div>
          </div>

          {/* Feedback messages */}
          {successMessage && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Member Profile Details List */}
          <div className="mt-5 space-y-3">
            {/* Email */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="p-2 rounded-xl bg-white shadow-xs text-[#151e33]/70">
                <Mail className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#151e33]/50">
                  Email Institucional
                </div>
                <div className="text-xs sm:text-sm font-semibold text-[#151e33] truncate">
                  {user.email}
                </div>
              </div>
            </div>

            {/* Department & Position */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="p-2 rounded-xl bg-white shadow-xs text-[#151e33]/70">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#151e33]/50">
                    Departamento
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-[#151e33] truncate">
                    {user.department?.name || 'Geral'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="p-2 rounded-xl bg-white shadow-xs text-[#151e33]/70">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#151e33]/50">
                    Cargo / Posição
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-[#151e33] truncate">
                    {user.position}
                  </div>
                </div>
              </div>
            </div>

            {/* Taskgroups */}
            {user.taskgroups && user.taskgroups.length > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="p-2 rounded-xl bg-white shadow-xs text-[#151e33]/70">
                  <Layers className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#151e33]/50">
                    Taskgroups
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {user.taskgroups.map((tg) => (
                      <span
                        key={tg}
                        className="px-2 py-0.5 text-[11px] font-bold bg-[#ff63f6]/15 text-[#151e33] rounded-lg border border-[#ff63f6]/30"
                      >
                        {tg}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Institutional Note */}
          <div className="mt-5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5 text-[11px] text-[#151e33]/70 leading-relaxed">
            <Info className="w-4 h-4 text-[#151e33]/50 shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#151e33]">Informação:</strong> Por motivos de segurança e integridade institucional, a alteração de dados de registo (cargo, departamento) ou a redefinição da palavra-passe só podem ser realizadas por um administrador.
            </div>
          </div>

          {/* Close button */}
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-[#151e33] hover:bg-[#151e33]/90 text-white text-xs font-bold transition-all shadow-xs"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
