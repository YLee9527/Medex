import MediaGridContainer from '../containers/MediaGridContainer'
import ToolbarContainer from '../containers/ToolbarContainer'
import { useThemeContext } from '../contexts/ThemeContext'
import { useI18n } from '../contexts/I18nContext'

interface MainProps {
  onOpenViewer: (mediaId: string) => void
}

export default function Main({ onOpenViewer }: MainProps) {
  const { theme } = useThemeContext()
  const { t } = useI18n()

  return (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-medexMain p-6 text-medexText">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium">Media Grid</h2>
        <button
          type="button"
          onClick={() => window.location.reload()}
          title={t('toolbar.refreshButton')}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors"
          style={{
            backgroundColor: theme.buttonBg,
            borderColor: theme.borderLight,
            color: theme.text,
          }}
        >
          <svg
            className="icon h-5 w-5"
            viewBox="0 0 1024 1024"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            p-id="1651"
            fill={theme.text}
          >
            <path
              d="M347.648 841.376c42.24 19.392 89.248 30.208 138.752 30.208 183.808 0 332.8-148.992 332.8-332.8 0-68.096-20.448-131.424-55.552-184.16l73.504-73.504C890.24 353.248 921.6 442.368 921.6 538.784c0 240.352-194.848 435.2-435.2 435.2-67.424 0-131.264-15.328-188.224-42.688l7.328 27.392c7.328 27.328-8.896 55.392-36.192 62.72s-55.392-8.896-62.72-36.192l-39.744-148.352c-7.328-27.328 8.896-55.392 36.192-62.72L351.392 734.4c27.328-7.328 55.392 8.896 62.72 36.192s-8.896 55.392-36.192 62.72l-30.272 8.128zM589.28 115.84l-21.056-36.448c-14.144-24.48-5.76-55.808 18.752-69.952s55.808-5.76 69.952 18.752l76.8 133.024c14.144 24.48 5.76 55.808-18.752 69.952l-133.024 76.8c-24.48 14.144-55.808 5.76-69.952-18.752s-5.76-55.808 18.752-69.952l14.08-8.128a334.88 334.88 0 0 0-58.432-5.12c-183.808 0-332.8 148.992-332.8 332.8 0 40.64 7.296 79.616 20.64 115.616l-77.792 77.792C67.488 673.952 51.2 608.288 51.2 538.816c0-240.352 194.848-435.2 435.2-435.2 35.424 0 69.888 4.224 102.88 12.224z"
              p-id="1652"
            ></path>
          </svg>
          <span className="sr-only">{t('toolbar.refreshButton')}</span>
        </button>
      </header>

      <div className="mb-4">
        <ToolbarContainer />
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden rounded border border-dashed border-white/20 p-4">
        <MediaGridContainer onOpenViewer={onOpenViewer} />
      </div>
    </main>
  )
}
