import Main from './components/Main';
import SidebarContainer from './containers/SidebarContainer';
import InspectorContainer from './containers/InspectorContainer';

export default function App() {
  return (
    <div className="flex h-screen min-w-[1200px] overflow-hidden bg-medexMain text-medexText">
      <SidebarContainer />
      <Main />
      <InspectorContainer />
    </div>
  );
}
