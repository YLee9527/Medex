import Main from './components/Main';
import SidebarContainer from './containers/SidebarContainer';
import InspectorContainer from './containers/InspectorContainer';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import TagDragOverlay from './components/TagDragOverlay';

export default function App() {
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-screen min-w-[1200px] overflow-hidden bg-medexMain text-medexText">
        <SidebarContainer />
        <Main />
        <InspectorContainer />
      </div>
      <TagDragOverlay />
    </DndProvider>
  );
}
