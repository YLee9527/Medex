import { UpdateInfo } from '../UpdatePage';
import { ThemeColors } from '../../theme/theme';
import { useI18n } from '../../contexts/I18nContext';

interface AvailableViewProps {
  currentVersion: string;
  updateInfo: UpdateInfo;
  onUpdate: () => void;
  onLater: () => void;
  theme: ThemeColors;
}

export function AvailableView({
  currentVersion,
  updateInfo,
  onUpdate,
  onLater,
  theme,
}: AvailableViewProps) {
  const { t } = useI18n();
  return (
    <div className="text-center animate-fade-in">
      <h2 className="text-xl font-medium mb-2" style={{ color: theme.highlight }}>{t('update.foundNew')}</h2>
      
      {/* Version Info */}
      <div 
        className="rounded-lg p-4 mb-4"
        style={{ backgroundColor: `${theme.text}08` }}
      >
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm" style={{ color: theme.textSecondary }}>当前版本</span>
          <span className="font-mono" style={{ color: theme.text }}>{currentVersion}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm" style={{ color: theme.textSecondary }}>最新版本</span>
          <span className="font-mono font-medium" style={{ color: '#3B82F6' }}>{updateInfo.version}</span>
        </div>
      </div>

      {/* Release Notes */}
      <div 
        className="rounded-lg p-4 mb-6 text-left max-h-48 overflow-y-auto"
        style={{ backgroundColor: theme.tagBg }}
      >
        <h3 className="text-sm font-medium mb-2" style={{ color: theme.text }}>{t('update.releaseNotesTitle')}</h3>
        <pre className="text-xs whitespace-pre-wrap font-sans" style={{ color: theme.textSecondary }}>
          {updateInfo.body}
        </pre>
      </div>

      {/* Actions */}
      <div className="flex justify-center space-x-3">
        <button
          onClick={onLater}
          className="px-5 py-2 rounded-lg transition-colors"
          style={{ 
            backgroundColor: `${theme.text}18`,
            color: theme.textSecondary
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = `${theme.text}30`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = `${theme.text}18`;
          }}
        >
          稍后
        </button>
        <button
          onClick={onUpdate}
          className="px-5 py-2 rounded-lg transition-colors shadow-md"
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
          立即更新
        </button>
      </div>
    </div>
  );
}
