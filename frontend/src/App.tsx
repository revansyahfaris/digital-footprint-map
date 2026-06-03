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

interface ToastMessage {
  text: string;
  type: 'SUCCESS' | 'ERROR' | 'INFO';
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
  const [toast, setToast] = useState<ToastMessage | null>(null);
  
  const [dbFootprints, setDbFootprints] = useState<DBFootprint[]>([]);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Helper untuk memicu Modern Brutalist Toast Notification
  const triggerToast = (text: string, type: 'SUCCESS' | 'ERROR' | 'INFO' = 'INFO') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    let isMounted = true;
    const token = localStorage.getItem('session_token');

    if (user && token) {
      fetch('/api/scan/footprints', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch');
          return res.json();
        })
        .then((data) => {
          if (isMounted) setDbFootprints(data as DBFootprint[]);
        })
        .catch((err) => console.error("Database radar error:", err));
    }
    return () => { isMounted = false; };
  }, [user, refreshKey]);

  const userLabel = user ? (user.name || user.email) : 'USER';
  const { nodes, edges } = generateNodesAndEdges(userLabel, dbFootprints);

  const handleTriggerScan = async () => {
    const token = localStorage.getItem('session_token');
    if (!user || !token) return;
    
    setIsScanning(true);
    triggerToast("COMMENCING METADATA SCAN HARVESTER...", "INFO");
    try {
      const response = await fetch('/api/scan/gmail', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Scan engine failed');
      
      const result = await response.json();
      triggerToast(`RADAR SUCCESS: Found ${result.new_footprints_found} new footprint links across ${result.messages_scanned} emails!`, "SUCCESS");
      
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error(error);
      triggerToast("RADAR CRASHED: Verification timed out or Google API rejected response.", "ERROR");
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
          triggerToast(`WELCOME OPERATOR: SECURE SESSION INITIALIZED.`, "SUCCESS");
        }
      } catch (error) {
        console.error(error);
        triggerToast("AUTHENTICATION ERROR: Handshake rejected by database tunnel.", "ERROR");
      } finally {
        setIsLoading(false);
      }
    },
    scope: 'https://www.googleapis.com/auth/gmail.readonly',
    prompt: 'consent',
  });

  return (
    // PENGGUNAAN dvh UTK MENGATASI MASALAH CUT-OFF DI HP
    <div className="h-[100dvh] w-full bg-[#f4f0e6] font-mono text-black flex flex-col overflow-hidden relative selection:bg-[#FF0000] selection:text-white">
      
      {/* 1. BRUTALIST TOAST NOTIFICATION CONTAINER */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[90%] sm:w-auto min-w-[320px] max-w-md border-4 border-black p-4 shadow-[4px_4px_0_0_#000] animate-bounce flex flex-col gap-1 text-xs font-black tracking-wide bg-white">
          <div className={`text-[10px] px-2 py-0.5 w-fit border border-black ${toast.type === 'SUCCESS' ? 'bg-green-400' : toast.type === 'ERROR' ? 'bg-[#FF0000] text-white' : 'bg-yellow-300'}`}>
            STATUS_LOG // {toast.type}
          </div>
          <p className="uppercase leading-tight text-sm">{toast.text}</p>
        </div>
      )}

      {/* 4. GROOVY INTERACTIVE LOADING POP-UP OVERLAY */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-yellow-300 border-4 border-black p-6 sm:p-10 max-w-sm w-full shadow-[8px_8px_0_0_#000] text-center transform -rotate-1 flex flex-col gap-4 animate-pulse">
            <div className="border-2 border-black bg-black text-white py-1 font-black text-xs tracking-widest uppercase">
               INCOMING HANDSHAKE 
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tighter">DECRYPTING SESSION...</h3>
            <div className="flex justify-center gap-2 my-2">
              <span className="w-4 h-4 bg-black rounded-none animate-ping"></span>
              <span className="w-4 h-4 bg-black rounded-none animate-ping [animation-delay:0.2s]"></span>
              <span className="w-4 h-4 bg-black rounded-none animate-ping [animation-delay:0.4s]"></span>
            </div>
            <p className="text-xs font-bold uppercase leading-relaxed text-gray-800">
              Establishing end-to-end fernet cryptographic link with serverless database tunnel.
            </p>
          </div>
        </div>
      )}

      {/* APP HEADER */}
      <nav className="flex justify-between items-center p-3 sm:p-4 border-b-4 border-black bg-white w-full z-10 shrink-0 gap-2">
        <img src={logo} alt="Logo" className="h-8 sm:h-12" />
        {user ? (
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="font-black border-2 border-black px-2 py-1 bg-yellow-300 text-[9px] sm:text-sm tracking-tight truncate max-w-[110px] sm:max-w-none">
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
                 triggerToast("SESSION TERMINATED.", "INFO");
              }} 
              className="bg-black text-white font-black text-[10px] sm:text-sm border-2 border-black px-2.5 py-1 hover:bg-[#FF0000] transition-colors"
            >
              LOGOUT
            </button>
          </div>
        ) : (
          <button onClick={() => handleGoogleLogin()} className="bg-[#FF0000] text-white font-black text-xs sm:text-base border-2 sm:border-4 border-black px-3 py-1 sm:px-6 sm:py-2 shadow-[3px_3px_0_0_#000] uppercase">
            CONNECT RADAR
          </button>
        )}
      </nav>

      {/* MAIN VIEW CONTROLLER */}
      {user ? (
        <div className="flex flex-grow w-full overflow-hidden relative">
          {/* MAP CANVAS PANEL */}
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
              {/* 3. RELOKASI POSISI CONTROLS AGAR TIDAK DITABRAK TOMBOL SCAN */}
              <Controls position="top-right" className="!border-4 !border-black !shadow-[2px_2px_0_0_#000] !bg-white !rounded-none !m-4" />
              <MiniMap nodeColor="#FF0000" maskColor="rgba(244, 240, 230, 0.6)" className="hidden md:block !border-4 !border-black !shadow-[4px_4px_0_0_#000] !rounded-none" />
            </ReactFlow>

            {/* 3. TOMBOL RADAR SAKTI YANG RINGKAS & PADAT */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-6 z-10 w-[90%] sm:w-auto">
              <button 
                onClick={handleTriggerScan}
                disabled={isScanning}
                className="w-full sm:w-auto bg-yellow-300 text-black font-black text-xs sm:text-sm border-2 sm:border-4 border-black px-4 py-3 sm:px-5 sm:py-2.5 shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] transition-all uppercase disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isScanning ? (
                  <>
                    <span className="w-2 h-2 bg-black animate-ping"></span>
                    <span>PULSING RADAR ENGINE...</span>
                  </>
                ) : (
                  <span>INITIALIZE RADAR SCAN</span>
                )}
              </button>
            </div>
          </div>

          {/* RIGHT INSIGHT PANEL DRAWER */}
          <div className={`absolute right-0 top-0 bottom-0 z-20 w-full sm:w-[380px] bg-[#f4f0e6] border-l-4 border-black h-full p-6 transition-all duration-200 overflow-y-auto flex flex-col justify-between shrink-0 sm:relative ${selectedNodeData ? 'translate-x-0' : 'translate-x-full sm:translate-x-0 sm:opacity-30 sm:pointer-events-none'}`}>
            {selectedNodeData ? (
              <div className="flex flex-col gap-6">
                <div className="border-b-4 border-black pb-4 flex justify-between items-start gap-2">
                  <div>
                    <span className="text-[10px] bg-black text-white px-2 py-0.5 font-bold uppercase tracking-widest">INSIGHT_PANEL</span>
                    <h2 className="text-2xl sm:text-4xl font-black uppercase mt-2 text-white leading-none break-words" style={{ textShadow: '2px 2px 0px #000' }}>
                      {selectedNodeData.label}
                    </h2>
                  </div>
                  <button onClick={() => setSelectedNodeData(null)} className="bg-black text-white font-black text-xs px-2 py-1 border-2 border-black hover:bg-[#FF0000] transition-colors uppercase shrink-0">
                    CLOSE [X]
                  </button>
                </div>
                <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0_0_#000]">
                  <div className="font-black text-sm uppercase mb-1 text-gray-500">RISK ASSESSMENT:</div>
                  <div className="text-xl font-black uppercase border-b-2 border-black pb-1 mb-2">{selectedNodeData.risk} RISK</div>
                  <p className="font-bold text-sm leading-relaxed">{selectedNodeData.desc}</p>
                </div>
                <button className="w-full bg-[#FF0000] text-white font-black text-base border-4 border-black py-3 shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] transition-all uppercase">
                  REQUEST DATA DELETION
                </button>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-center text-gray-500 italic font-bold text-sm">
                SELECT A PLATFORM NODE TO INSPECT FOOTPRINT SECURITY DATA
              </div>
            )}
          </div>
        </div>
      ) : (
        /* LANDING PAGE ROUTE CONTAINER (SCROLLABLE FOR HOW IT WORKS) */
        <div className="flex-grow w-full overflow-y-auto flex flex-col justify-between">
          <div className="w-full bg-[#FF0000] text-white py-2 border-b-4 border-black font-bold uppercase tracking-widest text-[9px] sm:text-xs overflow-hidden flex whitespace-nowrap shrink-0">
            <span className="animate-pulse w-full text-center">
              WARNING: YOU MIGHT HAVE 100+ FORGOTTEN ACCOUNTS STORING YOUR DATA PRIVATELY
            </span>
          </div>

          {/* HERO SECTION */}
          <main className="p-4 sm:p-10 w-full flex-grow flex flex-col items-center justify-center min-h-[70vh]">
            <div className="bg-[#FF0000] border-4 border-black p-6 sm:p-14 shadow-[8px_8px_0_0_#000] sm:shadow-[12px_12px_0_0_#000] text-center max-w-4xl transform -rotate-1 flex flex-col items-center gap-6">
              <h1 className="text-3xl sm:text-7xl font-black text-white uppercase leading-tight" style={{ textShadow: '4px 4px 0px #000' }}>
                TRACK WHO HAS YOUR DATA.
              </h1>
              <p className="text-white text-xs sm:text-base font-bold bg-black px-4 py-1.5 uppercase tracking-wide border border-white max-w-xl">
                Map your hidden digital footprint instantly by indexing historical authorization logs.
              </p>
              <button onClick={() => handleGoogleLogin()} className="bg-yellow-300 text-black font-black text-lg sm:text-2xl border-4 border-black px-6 py-3 sm:px-10 sm:py-4 shadow-[4px_4px_0_0_#000] sm:shadow-[8px_8px_0_0_#000] uppercase hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] transition-all">
                START SCANNING NOW
              </button>
            </div>
          </main>

          {/* 5. BRAND NEW "HOW IT WORKS" CORE PIPELINE PROTOCOL */}
          <section className="w-full bg-white border-t-4 border-black p-6 sm:p-12 flex flex-col gap-8 shrink-0">
            <div className="text-center sm:text-left">
              <span className="bg-black text-white text-[10px] font-black px-2 py-0.5 uppercase tracking-widest">
                SYSTEM_PIPELINE
              </span>
              <h2 className="text-3xl sm:text-5xl font-black uppercase mt-2 tracking-tighter">
                HOW THE RADAR SECURITY WORKS
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* STEP 1 */}
              <div className="border-4 border-black p-5 bg-[#f4f0e6] shadow-[4px_4px_0_0_#000] flex flex-col gap-3">
                <div className="bg-black text-white w-8 h-8 flex items-center justify-center font-black text-lg">01</div>
                <h4 className="text-xl font-black uppercase tracking-tight">SECURE OAUTH HANDSHAKE</h4>
                <p className="text-xs font-bold leading-relaxed text-gray-700 uppercase">
                  You log in securely using Google OAuth. Your authorization tokens are immediately isolated and heavily encrypted using industrial Fernet cryptography on our NeonDB database servers.
                </p>
              </div>

              {/* STEP 2 */}
              <div className="border-4 border-black p-5 bg-[#f4f0e6] shadow-[4px_4px_0_0_#000] flex flex-col gap-3">
                <div className="bg-black text-white w-8 h-8 flex items-center justify-center font-black text-lg">02</div>
                <h4 className="text-xl font-black uppercase tracking-tight">METADATA EXTRACTION</h4>
                <p className="text-xs font-bold leading-relaxed text-gray-700 uppercase">
                  Our high-concurrency parallel backend parser reads only the email headers (the "From" field) of the last 100 registration records. We <strong>never</strong> open, read, or harvest your private message bodies.
                </p>
              </div>

              {/* STEP 3 */}
              <div className="border-4 border-black p-5 bg-[#f4f0e6] shadow-[4px_4px_0_0_#000] flex flex-col gap-3">
                <div className="bg-black text-white w-8 h-8 flex items-center justify-center font-black text-lg">03</div>
                <h4 className="text-xl font-black uppercase tracking-tight">NETWORK TOPOLOGY MAP</h4>
                <p className="text-xs font-bold leading-relaxed text-gray-700 uppercase">
                  The parsed companies are compiled into an interactive graph network. You can visually inspect risk assessment metrics for each platform and launch immediate requests for data deletion.
                </p>
              </div>
            </div>

            {/* STATIC DISCLOSURE FOOTER */}
            <div className="border-2 border-dashed border-black p-4 text-center text-[10px] font-black text-gray-600 uppercase tracking-wider">
              Educational Project - Computer Engineering 2024 Cohort • Diponegoro University • Secure Sandbox Deployment
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;