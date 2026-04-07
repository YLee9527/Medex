import { ThemeColors } from '../../theme/theme';
import { useI18n } from '../../contexts/I18nContext';

interface IdleViewProps {
  onCheck: () => void;
  theme: ThemeColors;
}

export function IdleView({ onCheck, theme }: IdleViewProps) {
  const { t } = useI18n();
  return (
    <div className="text-center animate-fade-in">
      <h2 className="text-xl font-medium mb-2" style={{ color: theme.text }}>{t('update.checking')}</h2>
      <p className="mb-6" style={{ color: theme.textSecondary }}>{t('update.currentVersionLabel')}: 1.0.0</p>
      <button
        onClick={onCheck}
        className="px-6 py-2 rounded-lg transition-colors shadow-md"
        style={{ 
          backgroundColor: '#3B82F6',
          color: '#FFFFFF'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#2563EB';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#3B82F6';
        }}
      >
        {t('update.recheck')}
      </button>
    </div>
  );
}
