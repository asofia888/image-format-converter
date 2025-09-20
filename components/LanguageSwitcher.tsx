import React from 'react';
import { useTranslation } from '../hooks/useTranslation';
import Icon from './Icon';

const LanguageSwitcher: React.FC = () => {
  const { locale, setLocale } = useTranslation();

  const handleLanguageChange = (lang: 'en' | 'ja') => {
    setLocale(lang);
  };

  return (
    <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <Icon name="language" className="w-6 h-6 text-slate-400" />
        <button
            onClick={() => handleLanguageChange('en')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
            locale === 'en' ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
            aria-pressed={locale === 'en'}
        >
            EN
        </button>
        <button
            onClick={() => handleLanguageChange('ja')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
            locale === 'ja' ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
            aria-pressed={locale === 'ja'}
        >
            JA
        </button>
    </div>
  );
};

export default LanguageSwitcher;
