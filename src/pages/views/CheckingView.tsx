import { ThemeColors } from '../../theme/theme'
import { useI18n } from '../../contexts/I18nContext';

interface CheckingViewProps {
  theme: ThemeColors
}

export function CheckingView({ theme }: CheckingViewProps) {
  const { t } = useI18n();
  return (
    <div className="text-center animate-fade-in">
      {/* Spinner */}
      <div className="flex justify-center mb-4">
        <div
          className="w-12 h-12 border-4 border-t-blue-500 rounded-full animate-spin"
          style={{
            borderColor: `${theme.text}20`,
            borderTopColor: theme.highlight,
          }}
        />
      </div>
      <h2 className="text-lg font-medium mb-2" style={{ color: theme.text }}>
        {t('update.checking')}
      </h2>
      <p className="text-sm" style={{ color: theme.textSecondary }}>
        {t('update.pleaseWait')}
      </p>
    </div>
  )
}
