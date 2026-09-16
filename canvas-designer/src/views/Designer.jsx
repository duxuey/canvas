import { useUiStore } from '../store/uiStore';
import Sidebar from '../components/layout/Sidebar';
import TabBar from '../components/layout/TabBar';
import CanvasArea from '../components/canvas/CanvasArea';
import CanvasPreview from '../components/canvas/CanvasPreview';
import PropertyPanel from '../components/properties/PropertyPanel';
import TemplatePicker from '../components/dialogs/TemplatePicker';

export default function Designer() {
  const ui = useUiStore();

  // Full-screen preview — no sidebar, preview fills entire space
  if (ui.previewOpen) {
    return (
      <div style={{ height: '100%', position: 'relative' }}>
        <CanvasPreview />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      <TabBar />
      <div style={{ flex: 1, display: 'flex', minHeight: 0, position: 'relative' }}>
        <Sidebar />
        <CanvasArea />
        <PropertyPanel />
        {ui.templatePickerOpen && <TemplatePicker onClose={ui.closeTemplatePicker} />}
      </div>
    </div>
  );
}
