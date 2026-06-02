import { useState, useEffect } from 'react';
import { useGoogleLogin, googleLogout } from '@react-oauth/google';
import { ReactFlow, Background, Controls, MiniMap } from '@xyflow/react';
import logo from './assets/Logo with Text.png';

import { CoreNode, CategoryNode, PlatformNode } from './CustomNodes';
import type { CustomNodeData } from './CustomNodes';

// 1. Import functions and types from utils.ts
import { generateNodesAndEdges } from './utils'; 
import type { DBFootprint } from './utils'; 

import '@xyflow/react/dist/style.css';

interface UserProfile {
  id: number;
  email: string;
  name: string | null;
}

const nodeTypes = {
  coreNode: CoreNode,
  categoryNode: CategoryNode,
  platformNode: PlatformNode,
};

function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [selectedNodeData, setSelectedNodeData] = useState<CustomNodeData | null>(null);
  
  const [dbFootprints, setDbFootprints] = useState<DBFootprint[]>([]);
  
  // 2. Automatic trigger pattern: Increment this to trigger map updates
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // 3. Synchronization effect: Fetch user footprints from the database
  useEffect(() => {
    let isMounted = true;

    if (user) {
      fetch(`/api/scan/footprints/${user.id}`)
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch');
          return res.json();
        })
        .then((data) => {
          if (isMounted) {
            setDbFootprints(data as DBFootprint[]);
          }
        })
        .catch((err) => console.error("Database radar error:", err));
    }

    return () => {
      isMounted = false;
    };
  }, [user, refreshKey]); // Re-run if user changes or refreshKey increments

  const userLabel = user ? (user.name || user.email) : 'USER';
  const { nodes, edges } = generateNodesAndEdges(userLabel, dbFootprints);

  const handleTriggerScan = async () => {
    if (!user) return;
    setIsScanning(true);
    try {
      const response = await fetch(`/api/scan/gmail/${user.id}`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Scan engine failed');
      
      const result = await response.json();
      alert(`SCAN COMPLETE: Scanned ${result.messages_scanned} emails. Found ${result.new_footprints_found} new platforms!`);
      
      // 4. Trigger refresh via key increment
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error(error);
      alert('Failed to run radar scanning.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: tokenResponse.access_token }),
        });
        if (!response.ok) throw new Error('Backend authentication failed');
        const data = await response.json();
        setUser(data.user);
      } catch (error) {
        console.error(error);
        alert('Failed to sync with backend server.');
      } finally {
        setIsLoading(false);
      }
    },
    scope: 'https://www.googleapis.com/auth/gmail.readonly',
    prompt: 'consent',
  });

  if (user) {
    return (
      <div className="h-screen bg-[#f4f0e6] font-mono text-black flex flex-col w-full overflow-hidden">
        {/* NAVBAR */}
        <nav className="flex justify-between items-center p-4 border-b-4 border-black bg-white w-full z-10 shrink-0">
          <img src={logo} alt="Logo" className="h-10 sm:h-12" />
          <div className="flex items-center gap-4">
            <span className="font-black border-2 border-black px-3 py-1 bg-yellow-300 text-xs sm:text-sm tracking-tight">
              OPERATOR: {user.name?.toUpperCase() || user.email.toUpperCase()}
            </span>
            <button 
              onClick={() => {
                 googleLogout();
                 setUser(null);
                 setSelectedNodeData(null);
                 setDbFootprints([]);
              }} 
              className="bg-black text-white font-black text-xs sm:text-sm border-2 border-black px-4 py-1 hover:bg-[#FF0000] transition-colors"
            >
              LOGOUT
            </button>
          </div>
        </nav>
        
        {/* CANVAS & SIDEBAR CONTROL */}
        <div className="flex flex-grow w-full overflow-hidden relative">
          <div className="flex-grow h-full bg-white relative">
            <ReactFlow
              nodes={nodes} 
              edges={edges} 
              nodeTypes={nodeTypes}
              fitView
              onNodeClick={(_, node) => {
                if (node.type === 'platformNode') {
                  setSelectedNodeData(node.data as CustomNodeData);
                } else {
                  setSelectedNodeData(null);
                }
              }}
            >
              <Background color="#000" gap={20} size={2} />
              <Controls className="!border-4 !border-black !shadow-[2px_2px_0_0_#000] !bg-white !rounded-none" />
              <MiniMap nodeColor="#FF0000" maskColor="rgba(244, 240, 230, 0.6)" className="!border-4 !border-black !shadow-[4px_4px_0_0_#000] !rounded-none" />
            </ReactFlow>

            {/* FLOATING ACTION CENTER */}
            <div className="absolute bottom-4 left-16 z-10">
              <button 
                onClick={handleTriggerScan}
                disabled={isScanning}
                className="bg-yellow-300 text-black font-black text-lg border-4 border-black px-6 py-3 shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] transition-all uppercase disabled:opacity-50"
              >
                {isScanning ? "RADAR SCANNING IN PROGRESS..." : "INITIALIZE GMAIL RADAR SCAN"}
              </button>
            </div>
          </div>

          {/* SIDEBAR DETAIL PANEL */}
          <div className={`w-full sm:w-[380px] bg-[#f4f0e6] border-l-4 border-black h-full p-6 transition-all duration-200 overflow-y-auto flex flex-col justify-between shrink-0 z-10 ${selectedNodeData ? 'translate-x-0' : 'absolute right-0 translate-x-full sm:relative sm:translate-x-0 sm:opacity-30 sm:pointer-events-none'}`}>
            {selectedNodeData ? (
              <div className="flex flex-col gap-6">
                <div className="border-b-4 border-black pb-4">
                  <span className="text-xs bg-black text-white px-2 py-0.5 font-bold uppercase tracking-widest">
                    INSIGHT_PANEL
                  </span>
                  <h2 className="text-4xl font-black uppercase mt-2 text-[#FF0000] leading-none">
                    {selectedNodeData.label}
                  </h2>
                </div>

                <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0_0_#000]">
                  <div className="font-black text-sm uppercase mb-1 text-gray-500">RISK ASSESSMENT:</div>
                  <div className="text-xl font-black uppercase border-b-2 border-black pb-1 mb-2">
                    {selectedNodeData.risk} RISK
                  </div>
                  <p className="font-bold text-sm leading-relaxed">{selectedNodeData.desc}</p>
                </div>

                <button className="w-full bg-[#FF0000] text-white font-black text-base border-4 border-black py-3 shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] transition-all uppercase">
                  REQUEST DATA DELETION
                </button>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-center text-gray-500 italic font-bold">
                SELECT A PLATFORM NODE TO INSPECT FOOTPRINT SECURITY DATA
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f0e6] font-mono text-black selection:bg-[#FF0000] selection:text-white flex flex-col w-full">
      <div className="w-full bg-[#FF0000] text-white py-3 border-b-4 border-black font-bold uppercase tracking-widest text-xs sm:text-sm overflow-hidden flex whitespace-nowrap">
        <span className="animate-pulse w-full text-center">
          WARNING: YOU MIGHT HAVE 100+ FORGOTTEN ACCOUNTS STORING YOUR DATA
        </span>
      </div>
      <nav className="flex justify-between items-center p-3 sm:p-6 border-b-4 border-black bg-white w-full gap-2">
        <img src={logo} alt="Logo" className="h-10 sm:h-20" />
        <button onClick={() => handleGoogleLogin()} disabled={isLoading} className="bg-[#FF0000] text-white font-black text-xs sm:text-lg border-[3px] sm:border-4 border-black px-3 py-2 sm:px-8 sm:py-3 shadow-[4px_4px_0_0_#000] uppercase">
          {isLoading ? "CONNECTING..." : "LOGIN WITH GOOGLE"}
        </button>
      </nav>
      <main className="p-4 sm:p-10 w-full flex-grow flex items-center justify-center">
        <div className="bg-[#FF0000] border-4 border-black p-8 sm:p-16 shadow-[12px_12px_0_0_#000] text-center max-w-4xl transform -rotate-1">
          <h1 className="text-5xl sm:text-7xl font-black text-white uppercase leading-tight mb-6" style={{ textShadow: '4px 4px 0px #000' }}>TRACK WHO HAS YOUR DATA.</h1>
          <button onClick={() => handleGoogleLogin()} className="bg-yellow-300 text-black font-black text-2xl border-4 border-black px-10 py-5 shadow-[8px_8px_0_0_#000] uppercase">START SCANNING NOW</button>
        </div>
      </main>
    </div>
  );
}

export default App;