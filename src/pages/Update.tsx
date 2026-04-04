import { useEffect, useState } from 'react';
import { check } from '@tauri-apps/plugin-updater';

type UpdateStatus = 'checking' | 'latest' | 'available' | 'downloading' | 'completed' | 'error';

interface UpdateManifest {
  version: string;
  notes?: string;
  pub_date?: string;
}

export default function Update() {
  const [status, setStatus] = useState<UpdateStatus>('checking');
  const [info, setInfo] = useState<UpdateManifest | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    checkUpdate();
  }, []);

  async function checkUpdate() {
    try {
      const update = await check();

      if (update) {
        setStatus('available');
        setInfo({
          version: update.version,
          notes: update.body,
          pub_date: update.date,
        });
      } else {
        setStatus('latest');
      }
    } catch (err) {
      console.error('Update check failed:', err);
      setStatus('error');
      setError(err instanceof Error ? err.message : '检查更新失败');
    }
  }

  async function installUpdate() {
    try {
      setStatus('downloading');
      const update = await check();

      if (update) {
        // 模拟下载进度
        const interval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 100) {
              clearInterval(interval);
              return 100;
            }
            return prev + 10;
          });
        }, 200);

        await update.downloadAndInstall();
        setStatus('completed');
      }
    } catch (err) {
      console.error('Update install failed:', err);
      setStatus('error');
      setError(err instanceof Error ? err.message : '安装更新失败');
    }
  }

  function handleRestart() {
    window.location.reload();
  }

  return (
    <div className="flex flex-col h-screen bg-[#1e1e1e] text-[#e0e0e0] items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
        </div>

        {/* Status */}
        <div className="text-center mb-6">
          {status === 'checking' && (
            <>
              <h2 className="text-lg font-medium mb-2">正在检查更新...</h2>
              <p className="text-sm text-gray-400">请稍候</p>
            </>
          )}

          {status === 'latest' && (
            <>
              <h2 className="text-lg font-medium mb-2">已是最新版本</h2>
              <p className="text-sm text-gray-400">当前版本：0.1.0</p>
            </>
          )}

          {status === 'available' && info && (
            <>
              <h2 className="text-lg font-medium mb-2">发现新版本</h2>
              <p className="text-sm text-gray-400 mb-4">版本 {info.version}</p>
              {info.notes && (
                <div className="bg-[#2a2a2a] rounded p-3 mb-4 text-left">
                  <p className="text-xs text-gray-300 whitespace-pre-wrap">{info.notes}</p>
                </div>
              )}
            </>
          )}

          {status === 'downloading' && (
            <>
              <h2 className="text-lg font-medium mb-2">正在下载更新...</h2>
              <div className="w-full bg-[#2a2a2a] rounded-full h-2 mb-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-400">{progress}%</p>
            </>
          )}

          {status === 'completed' && (
            <>
              <h2 className="text-lg font-medium mb-2">更新已准备就绪</h2>
              <p className="text-sm text-gray-400 mb-4">需要重启应用以完成更新</p>
            </>
          )}

          {status === 'error' && (
            <>
              <h2 className="text-lg font-medium mb-2">更新失败</h2>
              <p className="text-sm text-gray-400 mb-4">{error}</p>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-center space-x-3">
          {status === 'available' && (
            <>
              <button
                onClick={() => setStatus('latest')}
                className="px-4 py-2 bg-[#333] hover:bg-[#444] rounded text-sm transition-colors"
              >
                稍后
              </button>
              <button
                onClick={installUpdate}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
              >
                更新
              </button>
            </>
          )}

          {status === 'completed' && (
            <button
              onClick={handleRestart}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
            >
              立即重启
            </button>
          )}

          {status === 'error' && (
            <button
              onClick={checkUpdate}
              className="px-4 py-2 bg-[#333] hover:bg-[#444] rounded text-sm transition-colors"
            >
              重试
            </button>
          )}

          {status === 'latest' && (
            <button
              onClick={() => window.close()}
              className="px-4 py-2 bg-[#333] hover:bg-[#444] rounded text-sm transition-colors"
            >
              关闭
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
