import Main from './components/Main';
import Inspector from './components/Inspector';
import SidebarContainer from './containers/SidebarContainer';

export default function App() {
  return (
    <div className="flex min-h-screen min-w-[1200px] bg-medexMain text-medexText">
      <SidebarContainer />
      <Main />
      <Inspector />
    </div>
  );
}
