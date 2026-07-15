import { useEffect, useState } from 'react';
import * as api from './api';
import { AuthScreen } from './components/AuthScreen';
import { FloatingBar } from './components/FloatingBar';
import { Panel } from './components/Panel';
import { SideGrip } from './components/SideGrip';

function App() {
  const [initialized, setInitialized] = useState<boolean | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    api.checkInitialized().then((hasPassword) => {
      setInitialized(hasPassword);
      setUnlocked(!hasPassword);
      setExpanded(!hasPassword);
      if (hasPassword) {
        api.setCollapsedMode();
      } else {
        api.setExpandedMode();
      }
    });

    const unlistenPromise = api.onToggleExpand(() => {
      setExpanded((prev) => !prev);
    });

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, []);

  useEffect(() => {
    if (initialized === null) return;
    if (expanded) {
      api.setExpandedMode();
    } else {
      api.setCollapsedMode();
    }
  }, [expanded, initialized]);

  const handleSetup = async (password: string) => {
    await api.setupMasterPassword(password);
    setInitialized(true);
    setUnlocked(true);
    setExpanded(false);
  };

  const handleVerify = async (password: string) => {
    const valid = await api.verifyMasterPassword(password);
    if (valid) {
      setUnlocked(true);
    }
    return valid;
  };

  const handleLock = async () => {
    await api.lock();
    setUnlocked(false);
  };

  const handleToggle = () => {
    setExpanded((prev) => !prev);
  };

  if (initialized === null) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-cyber-bg">
        <div className="w-8 h-8 border-2 border-cyber-cyan border-t-transparent rounded-full animate-spin shadow-[0_0_10px_rgba(0,240,255,0.6)]" />
      </div>
    );
  }

  if (!expanded) {
    return <FloatingBar onExpand={() => setExpanded(true)} />;
  }

  return (
    <div className="h-full w-full flex overflow-hidden">
      <div className="w-12 h-full shrink-0">
        <SideGrip expanded={true} onToggle={handleToggle} />
      </div>
      <div className="flex-1 min-w-0 h-full overflow-hidden">
        {!initialized ? (
          <AuthScreen
            isSetup={true}
            onSuccess={() => {}}
            onSetup={handleSetup}
            onVerify={handleVerify}
          />
        ) : !unlocked ? (
          <AuthScreen
            isSetup={false}
            onSuccess={() => setUnlocked(true)}
            onSetup={handleSetup}
            onVerify={handleVerify}
          />
        ) : (
          <Panel
            onCollapse={() => setExpanded(false)}
            onLock={handleLock}
          />
        )}
      </div>
    </div>
  );
}

export default App;
