import Sidebar from './components/Sidebar';
import Main from './components/Main';
import Inspector from './components/Inspector';

export default function App() {
  return (
    <div className="flex min-h-screen min-w-[1200px] bg-medexMain text-medexText">
      <Sidebar />
      <Main />
      <Inspector />
    </div>
  );
}
