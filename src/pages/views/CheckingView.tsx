export function CheckingView() {
  return (
    <div className="text-center animate-fade-in">
      {/* Spinner */}
      <div className="flex justify-center mb-4">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
      <h2 className="text-lg font-medium mb-2">正在检查更新...</h2>
      <p className="text-gray-400 text-sm">请稍候</p>
    </div>
  );
}
