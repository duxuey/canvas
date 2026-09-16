import { useHashRouter } from './hooks/useHashRouter';
import Designer from './views/Designer';
import Templates from './views/Templates';
import ElementManager from './views/ElementManager';
import ComponentManager from './views/ComponentManager';
import AIPageGenerator from './views/AIPageGenerator';
import SystemManager from './views/SystemManager';
import CanvasBrowser from './views/CanvasBrowser';
import Header from './components/layout/Header';
import AIAssistant from './components/ai/AIAssistant';
import Toast from './components/common/Toast';

export default function App() {
  const { route, navigate } = useHashRouter();

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#eef1f6' }}>
      <Header route={route} navigate={navigate} />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {route.view === 'designer' && <Designer />}
        {route.view === 'templates' && <Templates />}
        {route.view === 'elements' && <ElementManager />}
        {route.view === 'components' && <ComponentManager />}
        {route.view === 'system' && <SystemManager />}
        {route.view === 'canvases' && <CanvasBrowser />}
        {route.view === 'pageGenerator' && <AIPageGenerator />}
      </div>
      {/* 全局 AI 助手 + Toast —— 所有页面可用 */}
      <AIAssistant />
      <Toast />
    </div>
  );
}
