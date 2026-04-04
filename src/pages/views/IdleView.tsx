interface IdleViewProps {
  onCheck: () => void;
}

export function IdleView({ onCheck }: IdleViewProps) {
  return (
    <div className="text-center animate-fade-in">
      <h2 className="text-xl font-medium mb-2">检查更新</h2>
      <p className="text-gray-400 mb-6">当前版本：1.0.0</p>
      <button
        onClick={onCheck}
        className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors shadow-md"
      >
        检查更新
      </button>
    </div>
  );
}
