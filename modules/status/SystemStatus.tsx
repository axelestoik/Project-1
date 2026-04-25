
import React, { useState, useEffect } from 'react';
import { checkApiConnection } from '@/core/services/geminiService';
import { useTranslation } from '@/core/i18n/I18nContext';

type Status = 'checking' | 'ok' | 'error';

const StatusIndicator: React.FC<{ status: Status }> = ({ status }) => {
  const { t } = useTranslation();
  const styles = {
    checking: {
      dot: 'bg-yellow-400 animate-pulse',
      text: 'text-yellow-500',
      message: t('status.checking'),
    },
    ok: {
      dot: 'bg-emerald-500',
      text: 'text-emerald-600',
      message: t('status.operational'),
    },
    error: {
      dot: 'bg-red-500',
      text: 'text-red-600',
      message: t('status.error_detected'),
    },
  };

  const current = styles[status];

  return (
    <div className="flex items-center gap-3">
      <div className={`w-3 h-3 rounded-full ${current.dot}`}></div>
      <span className={`font-black text-sm uppercase tracking-widest ${current.text}`}>
        {current.message}
      </span>
    </div>
  );
};

const SystemStatus: React.FC = () => {
  const { t } = useTranslation();
  const [apiKeyStatus, setApiKeyStatus] = useState<Status>('checking');
  const [apiConnectionStatus, setApiConnectionStatus] = useState<Status>('checking');

  useEffect(() => {
    // Check 1: API Key Presence
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 10) {
      setApiKeyStatus('ok');
    } else {
      setApiKeyStatus('error');
    }

    // Check 2: API Connectivity
    const verifyConnection = async () => {
      const correlationId = crypto.randomUUID();
      const isConnected = await checkApiConnection(correlationId);
      setApiConnectionStatus(isConnected ? 'ok' : 'error');
    };
    
    verifyConnection();
  }, []);

  return (
    <>
      <div className="space-y-8 animate-fadeIn">
        <div>
          <h2 className="text-4xl font-black text-slate-500 tracking-tight">{t('status.title')}</h2>
          <p className="text-slate-400 font-medium">{t('status.subtitle')}</p>
        </div>
        
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-10 space-y-8">
          {/* API Key Check */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 bg-slate-50 rounded-2xl">
            <div>
              <h3 className="font-bold text-slate-600">{t('status.env_config')}</h3>
              <p className="text-sm text-slate-400 mt-1">
                {t('status.env_config_desc')}
              </p>
            </div>
            <StatusIndicator status={apiKeyStatus} />
          </div>

          {/* API Connection Check */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 bg-slate-50 rounded-2xl">
            <div>
              <h3 className="font-bold text-slate-600">{t('status.gemini_connectivity')}</h3>
              <p className="text-sm text-slate-400 mt-1">
                {t('status.gemini_connectivity_desc')}
              </p>
            </div>
            <StatusIndicator status={apiConnectionStatus} />
          </div>

        </div>
      </div>
    </>
  );
};

export default SystemStatus;
