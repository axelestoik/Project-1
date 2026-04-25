
import React from 'react';
import { useAuth } from '@/core/auth/AuthContext';
import { useTranslation } from '@/core/i18n/I18nContext';
import { USER_ROLES } from '@/core/auth/roles';
import ProtectedContent from '@/shared/ui/ProtectedContent';

import OrganizationSettings from './OrganizationSettings';

const Settings: React.FC = () => {
  const { locale, setLocale, t } = useTranslation();

  return (
    <div className="space-y-12 animate-fadeIn pb-20">
      <div>
        <h2 className="text-4xl font-black text-slate-500 tracking-tight">{t('settings.title')}</h2>
        <p className="text-slate-400 font-medium">{t('settings.description')}</p>
      </div>
      
      <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-10 space-y-12">
        
        {/* Language Selection */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 bg-slate-50 rounded-2xl">
          <div>
            <h3 className="font-bold text-slate-600">{t('settings.language')}</h3>
            <p className="text-sm text-slate-400 mt-1">
              Select your preferred language for the user interface.
            </p>
          </div>
          <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-slate-200">
            <button 
              onClick={() => setLocale('en')}
              className={`px-6 py-2 font-black text-xs uppercase tracking-widest rounded-xl transition-all ${
                locale === 'en' ? 'bg-[#87a3a3] text-white shadow-sm' : 'text-slate-400 hover:bg-slate-100'
              }`}>
              English
            </button>
            <button 
              onClick={() => setLocale('es')}
              className={`px-6 py-2 font-black text-xs uppercase tracking-widest rounded-xl transition-all ${
                locale === 'es' ? 'bg-[#87a3a3] text-white shadow-sm' : 'text-slate-400 hover:bg-slate-100'
              }`}>
              Español
            </button>
          </div>
        </div>

        <div className="h-px bg-slate-100 w-full" />

        {/* Organization Management */}
        <ProtectedContent roles={[USER_ROLES.Admin, USER_ROLES.Staff]}>
          <OrganizationSettings />
        </ProtectedContent>

        {/* RBAC Demonstration */}
        <ProtectedContent roles={[USER_ROLES.Admin]}>
          <div className="border-2 border-dashed border-red-200 bg-red-50 p-8 rounded-3xl animate-fadeIn">
            <h3 className="text-lg font-black text-red-500">{t('settings.admin_panel_title')}</h3>
            <p className="text-sm text-red-400 mt-1 mb-6">
              {t('settings.admin_panel_desc')}
            </p>
            <button className="px-6 py-3 bg-red-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all">
              {t('settings.admin_panel_button')}
            </button>
          </div>
        </ProtectedContent>

      </div>
    </div>
  );
};

export default Settings;
