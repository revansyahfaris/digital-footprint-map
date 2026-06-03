import { useState, useEffect } from 'react';
import { useGoogleLogin, googleLogout } from '@react-oauth/google';
import { ReactFlow, Background, Controls, MiniMap } from '@xyflow/react';
import logo from './assets/Logo with Text.png';

import { CoreNode, CategoryNode, PlatformNode } from './CustomNodes';
import type { CustomNodeData } from './CustomNodes';

import { generateNodesAndEdges } from './utils'; 
import type { DBFootprint } from './utils'; 

import '@xyflow/react/dist/style.css';

interface UserProfile {
  email: string;
  name: string | null;
}

const nodeTypes = {
  coreNode: CoreNode,
  categoryNode: CategoryNode,
  platformNode: PlatformNode,
};

function App() {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const savedUser = localStorage.getItem('user_data');
    const savedToken = localStorage.getItem('session_token');
    return (savedUser && savedToken) ? JSON.parse(savedUser) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [selectedNodeData, setSelectedNodeData] = useState<CustomNodeData | null>(null);
  
  const [dbFootprints, setDbFootprints] = useState<DBFootprint[]>([]);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    const token = localStorage.getItem('session_token');

    if (user && token) {
      fetch('/api/scan/footprints', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
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
  }, [user, refreshKey]);

  const userLabel = user ? (user.name || user.email) : 'USER';
  const { nodes, edges } = generateNodesAndEdges(userLabel, dbFootprints);

  const handleTriggerScan = async () => {
    const token = localStorage.getItem('session_token');
    if (!user || !token) return;
    
    setIsScanning(true);
    try {
      const response = await fetch('/api/scan/gmail', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Scan engine failed');
      
      const result = await response.json();
      alert(`SCAN COMPLETE: Scanned ${result.messages_scanned} emails. Found ${result.new_footprints_found} new platforms!`);
      
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
        
        if (data.access_token) {
          localStorage.setItem('session_token', data.access_token);
          localStorage.setItem('user_data', JSON.stringify(data.user));
          setUser(data.user);
        }
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
          <img src={logo} alt="Logo" className="h-8 sm:h-12" />
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="font-black border-2 border-black px-2 py-1 bg-yellow-300 text-[10px] sm:text-sm tracking-tight truncate max-w-[140px] sm:max-w-none">
              OP: {user.name?.toUpperCase() || user.email.toUpperCase()}
            </span>
            <button 
              onClick={() => {
                 googleLogout();
                 localStorage.removeItem('session_token');
                 localStorage.removeItem('user_data');
                 setUser(null);
                 setSelectedNodeData(null);
                 setDbFootprints([]);
              }} 
              className="bg-black text-white font-black text-[10px] sm:text-sm border-2 border-black px-3 py-1 hover:bg-[#FF0000] transition-colors"
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
              <MiniMap nodeColor="#FF0000" maskColor="rgba(244, 240, 230, 0.6)" className="hidden sm:block !border-4 !border-black !shadow-[4px_4px_0_0_#000] !rounded-none" />
            </ReactFlow>

            {/* FLOATING ACTION CENTER (RESPONSIF MOBILE-FRIENDLY) */}
            <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:left-16 z-10 text-center sm:text-left">
              <button 
                onClick={handleTriggerScan}
                disabled={isScanning}
                className="w-full sm:w-auto bg-yellow-300 text-black font-black text-sm sm:text-lg border-2 sm:border-4 border-black px-4 py-2 sm:px-6 sm:py-3 shadow-[3px_3px_0_0_#000] sm:shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_0_#000] transition-all uppercase disabled:opacity-50"
              >
                {/* Trik CSS: Sembunyikan teks panjang di HP, ganti dengan teks padat */}
                <span className="block sm:hidden">
                  {isScanning ? "SCANNING INBOX..." : "⚡ START SCAN RADAR"}
                </span>
                <span className="hidden sm:block">
                  {isScanning ? "RADAR SCANNING IN PROGRESS..." : "INITIALIZE GMAIL RADAR SCAN"}
                </span>
              </button>
            </div>
          </div>

          {/* SIDEBAR DETAIL PANEL (MENGGUNAKAN LAYER FLYOUT OVERLAY PADA MOBILE) */}
          <div className={`absolute right-0 top-0 bottom-0 z-20 w-full sm:w-[380px] bg-[#f4f0e6] border-l-4 border-black h-full p-6 transition-all duration-200 overflow-y-auto flex flex-col justify-between shrink-0 sm:relative ${selectedNodeData ? 'translate-x-0' : 'translate-x-full sm:translate-x-0 sm:opacity-30 sm:pointer-events-none'}`}>
            {selectedNodeData ? (
              <div className="flex flex-col gap-6">
                {/* DETAIL HEADER DENGAN TOMBOL CLOSE */}
                <div className="border-b-4 border-black pb-4 flex justify-between items-start gap-2">
                  <div>
                    <span className="text-[10px] bg-black text-white px-2 py-0.5 font-bold uppercase tracking-widest">
                      INSIGHT_PANEL
                    </span>
                    <h2
                      className="text-2xl sm:text-4xl font-black uppercase mt-2 text-[#FF0000] leading-none break-words"
                      style={{ color: '#ffffff', textShadow: '2px 2px 0px #000' }}>
                      {selectedNodeData.label}
                    </h2>
                  </div>
                  
                  {/* TOMBOL PENUTUP SAKTI UNTUK MENGHILANGKAN PANEL DETAIL */}
                  <button 
                    onClick={() => setSelectedNodeData(null)}
                    className="bg-black text-white font-black text-xs px-2 py-1 border-2 border-black hover:bg-[#FF0000] transition-colors uppercase shrink-0"
                  >
                    CLOSE [X]
                  </button>
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
      <div className="w-full bg-[#FF0000] text-white py-3 border-b-4 border-black font-bold uppercase tracking-widest text-[10px] sm:text-sm overflow-hidden flex whitespace-nowrap">
        <span className="animate-pulse w-full text-center">
          WARNING: YOU MIGHT HAVE 100+ FORGOTTEN ACCOUNTS STORING YOUR DATA
        </span>
      </div>
      <nav className="flex justify-between items-center p-3 sm:p-6 border-b-4 border-black bg-white w-full gap-2">
        <img src={logo} alt="Logo" className="h-8 sm:h-20" />
        <button onClick={() => handleGoogleLogin()} disabled={isLoading} className="bg-[#FF0000] text-white font-black text-xs sm:text-lg border-[3px] sm:border-4 border-black px-3 py-2 sm:px-8 sm:py-3 shadow-[4px_4px_0_0_#000] uppercase">
          {isLoading ? "CONNECTING..." : "LOGIN WITH GOOGLE"}
        </button>
      </nav>
      <main className="p-4 sm:p-10 w-full flex-grow flex items-center justify-center">
        <div className="bg-[#FF0000] border-4 border-black p-6 sm:p-16 shadow-[8px_8px_0_0_#000] sm:shadow-[12px_12px_0_0_#000] text-center max-w-4xl transform -rotate-1">
          <h1 className="text-3xl sm:text-7xl font-black text-white uppercase leading-tight mb-6" style={{ textShadow: '4px 4px 0px #000' }}>TRACK WHO HAS YOUR DATA.</h1>
          <button onClick={() => handleGoogleLogin()} className="bg-yellow-300 text-black font-black text-lg sm:text-2xl border-4 border-black px-6 py-3 sm:px-10 sm:py-5 shadow-[4px_4px_0_0_#000] sm:shadow-[8px_8px_0_0_#000] uppercase">START SCANNING NOW</button>
        </div>
      </main>
    </div>
  );
}

export default App;