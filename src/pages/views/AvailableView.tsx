import { UpdateInfo } from '../UpdatePage';

interface AvailableViewProps {
  currentVersion: string;
  updateInfo: UpdateInfo;
  onUpdate: () => void;
  onLater: () => void;
}

export function AvailableView({
  currentVersion,
  updateInfo,
  onUpdate,
  onLater,
}: AvailableViewProps) {
  return (
    <div className="text-center animate-fade-in">
      <h2 className="text-xl font-medium mb-2 text-green-400">发现新版本</h2>
      
      {/* Version Info */}
      <div className="bg-white/5 rounded-lg p-4 mb-4">
        <div className="flex justify-between items-center mb-3">
          <span className="text-gray-400 text-sm">当前版本</span>
          <span className="text-gray-300 font-mono">{currentVersion}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">最新版本</span>
          <span className="text-blue-400 font-mono font-medium">{updateInfo.version}</span>
        </div>
      </div>

      {/* Release Notes */}
      <div className="bg-[#2a2a2a] rounded-lg p-4 mb-6 text-left max-h-48 overflow-y-auto">
        <h3 className="text-sm font-medium text-gray-300 mb-2">更新内容：</h3>
        <pre className="text-xs text-gray-400 whitespace-pre-wrap font-sans">
          {updateInfo.body}
        </pre>
      </div>

      {/* Actions */}
      <div className="flex justify-center space-x-3">
        <button
          onClick={onLater}
          className="px-5 py-2 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg transition-colors"
        >
          稍后
        </button>
        <button
          onClick={onUpdate}
          className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors shadow-md"
        >
          立即更新
        </button>
      </div>
    </div>
  );
}
