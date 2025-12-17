// @ts-nocheck
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Shield, Target, MapPin, Crosshair, AlertTriangle, Lock, Navigation, Terminal, EyeOff, Key, UserCheck, UserX, Edit3, Save, RotateCcw, CheckSquare, Square, RefreshCw, Calendar, ChevronLeft, ChevronRight, Power, Database, Plus, Trash2, X, PenTool, Cloud, Download } from 'lucide-react';

// --- 초기 데이터 정의 (도시 구조 및 노드 정보) ---
const GET_INITIAL_NODES = () => [
  // Depth 0
  { id: 0, x: 50, y: 5, label: "북부 외곽 게이트", type: "start", desc: "도시로 진입하는 유일한 북쪽 통로입니다. 센서가 작동 중이지만 진입 가능합니다." },
  
  // Depth 1
  { id: 1, x: 35, y: 15, label: "제1 방어선 (서)", type: "normal", desc: "외곽 방어 포탑이 배치된 구역입니다. 해킹이나 파괴가 필요합니다." },
  { id: 2, x: 65, y: 15, label: "제1 방어선 (동)", type: "normal", desc: "자동화 드론 격납고가 있습니다. 빠른 제압이 필요합니다." },
  { 
    id: 17, x: 10, y: 15, label: "임시 주둔지", type: "deadend", 
    desc: "버려진 군사 텐트들이 보입니다. 보급품이 남아있을 수 있습니다.",
    revealDesc: "[경고] 이미 약탈당한 곳입니다. 더 이상 이동할 곳이 없는 막다른 길입니다."
  },

  // Depth 2
  { id: 3, x: 20, y: 25, label: "빈민가 입구", type: "normal", desc: "오래된 구역으로 길이 복잡합니다. 매복에 주의하십시오." },
  { id: 4, x: 50, y: 20, label: "물류 창고", type: "normal", desc: "도시 전체로 물자가 이동하는 허브입니다. 자원을 확보할 수 있습니다." },
  { id: 5, x: 80, y: 25, label: "에너지 변환소", type: "normal", desc: "동쪽 구역의 전력을 담당합니다. 셧다운 시키면 유리합니다." },

  // Depth 3
  { 
    id: 6, x: 10, y: 35, label: "폐기물 처리장", type: "deadend", 
    desc: "오래된 처리 시설입니다. 지하 통로가 연결되어 있을 가능성이 높습니다.", 
    revealDesc: "[경고] 막다른 길입니다. 유독 가스로 인해 더 이상 전진할 수 없습니다. 돌아가야 합니다." 
  },
  { id: 7, x: 30, y: 35, label: "지하철 터미널", type: "normal", desc: "도심으로 향하는 지하 통로입니다. 가장 빠른 길일 수도 있습니다." },
  { id: 8, x: 70, y: 35, label: "상업 지구", type: "normal", desc: "네온 사인이 가득한 거리. 민간인 피해를 최소화하며 전진해야 합니다." },
  { 
    id: 9, x: 90, y: 30, label: "구형 송신탑", type: "deadend", 
    desc: "신호가 잡히는 높은 탑입니다. 주변 지형을 정찰하기 좋은 위치로 보입니다.", 
    revealDesc: "[경고] 더 이상 연결된 경로가 없습니다. 정보 수집 외에는 가치가 없는 막다른 곳입니다." 
  },
  { id: 16, x: 15, y: 45, label: "지하 수로", type: "normal", desc: "악취가 나지만 경비가 없는 비밀 통로입니다. 연구 단지로 직행할 수 있습니다." },

  // Depth 4
  { id: 10, x: 40, y: 45, label: "내부 검문소 A", type: "normal", desc: "중앙 구역으로 가는 마지막 관문 중 하나입니다. 중무장한 병력이 대기 중입니다." },
  { id: 11, x: 60, y: 45, label: "내부 검문소 B", type: "normal", desc: "레이저 장벽으로 보호받고 있는 검문소입니다." },
  { id: 18, x: 85, y: 40, label: "데이터 센터", type: "normal", desc: "도시의 네트워크 서버가 모여있는 곳입니다. 정보를 탈취하면 검문소를 우회할 단서를 얻을지도 모릅니다." },

  // Depth 5
  { id: 12, x: 30, y: 55, label: "연구 단지", type: "normal", desc: "정부의 비밀 실험이 자행되던 곳입니다. 중앙 청사의 우회로가 있을지도 모릅니다." },
  { id: 13, x: 70, y: 55, label: "엘리트 거주구", type: "normal", desc: "고위 관료들이 거주하는 구역. 사설 경호원들이 배치되어 있습니다." },
  { 
    id: 19, x: 90, y: 60, label: "스카이 라운지", type: "deadend", 
    desc: "도시 전경이 보이는 고급 시설입니다. VIP들이 모여있을 가능성이 있습니다.",
    revealDesc: "[경고] 적들의 함정 파티였습니다. 도주로가 차단된 막다른 곳입니다. 퇴각하십시오."
  },

  // Depth 6
  { id: 14, x: 50, y: 65, label: "청사 앞 광장", type: "normal", desc: "중앙 청사 바로 앞의 거대한 광장입니다. 최후의 저항이 예상됩니다." },

  // Depth 7
  { id: 15, x: 50, y: 50, label: "중앙 정부 청사", type: "goal", desc: "작전의 최종 목표입니다. 이 도시의 통제권을 탈취하십시오." },
];

// 연결 정보
const EDGES = [
  [0, 1], [0, 2], [1, 17], [1, 3], [1, 4], [2, 4], [2, 5],
  [3, 6], [3, 7], [3, 16], [4, 7], [4, 8], [5, 8], [5, 9], [5, 18],
  [7, 10], [7, 12], [8, 11], [8, 13], [10, 14], [10, 15],
  [11, 14], [12, 14], [16, 12], [18, 11], [13, 14], [13, 19], [14, 15]
];

const ADMIN_KEY = "1217"; 

// --- 메인 게임 로직 ---
function GameContent({ onReboot }) {
  const [adminSessionKey, setAdminSessionKey] = useState(null); // 관리자 세션 키 (로그인 시 저장)
  const [nodes, setNodes] = useState(GET_INITIAL_NODES());
  const [currentLocation, setCurrentLocation] = useState(0);
  const [capturedNodes, setCapturedNodes] = useState([0]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [day, setDay] = useState(1);
  const [logs, setLogs] = useState(["Day 1: 북부 외곽 게이트 도착"]);
  
  // 로딩 상태
  const [isLoading, setIsLoading] = useState(false);

  // 탭 상태: 'map' | 'database'
  const [adminTab, setAdminTab] = useState('map');

  // 모달 상태
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showRebootConfirm, setShowRebootConfirm] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  
  // 경고 추가/수정용 상태
  const [warningNodeId, setWarningNodeId] = useState(null);
  const [warningText, setWarningText] = useState("");
  const [warningEditIndex, setWarningEditIndex] = useState(null);

  // 인증 상태
  const [isAdmin, setIsAdmin] = useState(false);
  const [inputKey, setInputKey] = useState("");
  const [authError, setAuthError] = useState("");

  const logsEndRef = useRef(null);
  const selectedNode = selectedNodeId !== null ? nodes.find(n => n.id === selectedNodeId) : null;

  // --- 서버 통신 로직 ---

  // 1. 데이터 불러오기 (Mount 시점)
  useEffect(() => {
    const loadFromServer = async () => {
      try {
        const res = await fetch('/api/admin/state'); // GET 요청
        if (!res.ok) throw new Error('Network response was not ok');
        
        const json = await res.json();
        if (json.ok && json.data) {
          const { nodes: savedNodes, currentLocation: savedLoc, capturedNodes: savedCap, day: savedDay, logs: savedLogs } = json.data;
          
          if (savedNodes) setNodes(savedNodes);
          if (savedLoc !== undefined) setCurrentLocation(savedLoc);
          if (savedCap) setCapturedNodes(savedCap);
          if (savedDay) setDay(savedDay);
          if (savedLogs) setLogs(savedLogs);
          // console.log("Data loaded from server");
        }
      } catch (err) {
        console.warn("Failed to load from server (Offline or First Run):", err);
      }
    };

    loadFromServer();
  }, []);

  // 2. 데이터 저장하기 (Supabase 연동 API 호출)
  const saveToServer = async () => {
    if (!isAdmin || !adminSessionKey) {
      alert("관리자 권한이 필요합니다.");
      return;
    }

    setIsLoading(true);
    try {
      const payload = { nodes, currentLocation, capturedNodes, day, logs };
      
      const res = await fetch('/api/admin/state', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminSessionKey, // 헤더에 키 포함
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (res.ok && json.ok) {
        setLogs(prev => [...prev, `[SYSTEM] 서버 데이터 저장 완료 (SYNCED)`]);
        alert("서버에 안전하게 저장되었습니다.");
      } else {
        throw new Error(json.error || "Save failed");
      }
    } catch (err) {
      console.error(err);
      setLogs(prev => [...prev, `[SYSTEM] 저장 실패: ${err.message}`]);
      alert("저장에 실패했습니다. 네트워크 상태나 관리자 키를 확인하세요.");
    } finally {
      setIsLoading(false);
    }
  };

  // 3. 서버 데이터 강제 로드 (관리자용)
  const manualLoad = async () => {
    setIsLoading(true);
    try {
        const res = await fetch('/api/admin/state');
        const json = await res.json();
        if (json.ok && json.data) {
            const { nodes: savedNodes, currentLocation: savedLoc, capturedNodes: savedCap, day: savedDay, logs: savedLogs } = json.data;
            if (savedNodes) setNodes(savedNodes);
            if (savedLoc !== undefined) setCurrentLocation(savedLoc);
            if (savedCap) setCapturedNodes(savedCap);
            if (savedDay) setDay(savedDay);
            if (savedLogs) setLogs(savedLogs);
            setLogs(prev => [...prev, `[SYSTEM] 서버 데이터 불러오기 완료`]);
        }
    } catch(e) {
        alert("불러오기 실패");
    } finally {
        setIsLoading(false);
    }
  }

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // -- 로직 함수들 --
  const isConnected = (from, to) => EDGES.some(edge => (edge[0] === from && edge[1] === to) || (edge[0] === to && edge[1] === from));

  const getNodeStatus = (nodeId) => {
    if (currentLocation === nodeId) return 'current';
    if (capturedNodes.includes(nodeId)) return 'captured';
    
    const isCurrentLocationCaptured = capturedNodes.includes(currentLocation);
    
    if (isCurrentLocationCaptured && isConnected(currentLocation, nodeId) && !capturedNodes.includes(nodeId)) {
      return 'attackable';
    }
    
    return 'locked';
  };

  const handleNodeClick = (node) => {
    setSelectedNodeId(node.id);
  };

  const performMove = (targetId) => {
    const targetNode = nodes.find(n => n.id === targetId);
    if (!targetNode) return;
    setCurrentLocation(targetId);
    setLogs(prev => [...prev, `Day ${day}: ${targetNode.label}로 이동 완료`]);
  };

  const toggleNodeCapturedStatus = () => {
    if (!selectedNode) return;
    if (capturedNodes.includes(selectedNode.id)) {
      if (selectedNode.type === 'start') return;
      setCapturedNodes(prev => prev.filter(id => id !== selectedNode.id));
    } else {
      setCapturedNodes(prev => [...prev, selectedNode.id]);
      setLogs(prev => [...prev, `Day ${day}: [관리자] ${selectedNode.label} 점령 완료`]);
    }
  };

  const handleUpdateNode = (id, key, value) => {
    const updatedNodes = nodes.map(n => 
      n.id === id ? { ...n, [key]: value } : n
    );
    setNodes(updatedNodes);
  };

  const openWarningModal = (id, index = null, currentText = "") => {
    setWarningNodeId(id);
    setWarningEditIndex(index);
    setWarningText(currentText);
    setShowWarningModal(true);
  };

  const saveWarning = (e) => {
    e.preventDefault();
    if (!warningText.trim()) return;

    setNodes(prev => prev.map(n => {
      if (n.id === warningNodeId) {
        const currentWarnings = n.customWarnings || [];
        let newWarnings;
        if (warningEditIndex !== null) {
          newWarnings = [...currentWarnings];
          newWarnings[warningEditIndex] = warningText;
        } else {
          newWarnings = [...currentWarnings, warningText];
        }
        return { ...n, customWarnings: newWarnings };
      }
      return n;
    }));
    setShowWarningModal(false);
  };

  const handleRemoveWarning = (id, index) => {
    setNodes(prev => prev.map(n => {
      if (n.id === id && n.customWarnings) {
        const newWarnings = n.customWarnings.filter((_, i) => i !== index);
        return { ...n, customWarnings: newWarnings };
      }
      return n;
    }));
  };

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    if (inputKey === ADMIN_KEY) {
      setAdminSessionKey(inputKey); // 세션 키 저장
      setIsAdmin(true);
      setShowAuthModal(false);
      setInputKey("");
      setAdminTab('map');
    } else {
      setAuthError("액세스 거부: 보안 코드가 일치하지 않습니다.");
    }
  };

  const changeDay = (increment) => {
    setDay(prev => Math.max(1, prev + increment));
  };

  const adminMoveUnit = () => {
    if (!selectedNode) return;
    performMove(selectedNode.id); 
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden select-none relative animate-in fade-in duration-700">
      
      {/* Reboot Confirm Modal */}
      {showRebootConfirm && (
        <div className="absolute inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-red-950/50 border border-red-500 p-8 rounded-lg w-full max-w-sm shadow-2xl text-center">
             <AlertTriangle size={48} className="text-red-500 mx-auto mb-4 animate-pulse" />
             <h3 className="text-2xl font-bold text-white mb-2">SYSTEM REBOOT</h3>
             <p className="text-red-200 mb-6 text-sm">
               모든 데이터와 진행 상황이 초기화됩니다.<br/>
               정말 실행하시겠습니까?
             </p>
             <div className="flex gap-3 justify-center">
               <button 
                 onClick={() => setShowRebootConfirm(false)}
                 className="px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 font-bold transition-colors"
               >
                 취소 (CANCEL)
               </button>
               <button 
                 onClick={() => {
                   onReboot();
                   setShowRebootConfirm(false);
                 }}
                 className="px-6 py-2 bg-red-600 hover:bg-red-500 rounded text-white font-bold transition-colors shadow-[0_0_15px_#dc2626]"
               >
                 재실행 (CONFIRM)
               </button>
             </div>
          </div>
        </div>
      )}

      {/* Warning Input Modal */}
      {showWarningModal && (
        <div className="absolute inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-600 p-6 rounded-lg w-full max-w-sm shadow-2xl relative">
             <button onClick={() => setShowWarningModal(false)} className="absolute top-2 right-2 text-slate-500 hover:text-white">✕</button>
             <div className="flex flex-col items-center mb-4">
               <AlertTriangle size={32} className="text-orange-500 mb-2" />
               <h3 className="text-lg font-bold text-white">
                 {warningEditIndex !== null ? "EDIT WARNING" : "ADD WARNING"}
               </h3>
             </div>
             <form onSubmit={saveWarning}>
               <div className="mb-4">
                 <input 
                   type="text" 
                   value={warningText} 
                   onChange={(e) => setWarningText(e.target.value)} 
                   placeholder="Enter warning message..." 
                   className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-orange-500 focus:outline-none" 
                   autoFocus 
                 />
               </div>
               <button type="submit" className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-2 rounded transition-colors flex items-center justify-center gap-2">
                 {warningEditIndex !== null ? "UPDATE" : "ADD WARNING"}
               </button>
             </form>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-600 p-6 rounded-lg w-full max-w-sm shadow-2xl relative">
             <button onClick={() => setShowAuthModal(false)} className="absolute top-2 right-2 text-slate-500 hover:text-white">✕</button>
             <div className="flex flex-col items-center mb-6">
               <Shield size={48} className="text-red-500 mb-2" />
               <h3 className="text-xl font-bold text-white">SECURITY CLEARANCE</h3>
               <p className="text-xs text-slate-400">RESTRICTED AREA: COMMANDER ACCESS ONLY</p>
             </div>
             <form onSubmit={handleAuthSubmit}>
               <div className="mb-4">
                 <input type="password" value={inputKey} onChange={(e) => setInputKey(e.target.value)} placeholder="Enter Key Code" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-red-500 focus:outline-none text-center tracking-[0.3em] font-mono" autoFocus />
                 {authError && <p className="text-red-500 text-xs mt-2 text-center animate-pulse">{authError}</p>}
               </div>
               <button type="submit" className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded transition-colors flex items-center justify-center gap-2"><Key size={16} /> AUTHORIZE</button>
             </form>
          </div>
        </div>
      )}

      {/* Header */}
      <header className={`h-14 border-b flex items-center justify-between px-6 z-10 shrink-0 transition-colors duration-500 ${isAdmin ? 'bg-red-950/30 border-red-900/50' : 'bg-slate-900 border-slate-700'}`}>
        <div className="flex items-center gap-2">
          <Terminal className={isAdmin ? "text-red-400" : "text-blue-400"} size={20} />
          <h1 className={`text-lg font-bold tracking-wider hidden md:block ${isAdmin ? "text-red-400" : "text-blue-400"}`}>
            PARADIGM ZERO <span className="text-xs text-slate-500 font-normal ml-2">{isAdmin ? "EDITOR MODE" : "TACTICAL MAP"}</span>
          </h1>
          <h1 className={`text-lg font-bold tracking-wider md:hidden ${isAdmin ? "text-red-400" : "text-blue-400"}`}>PARADIGM ZERO</h1>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
            {isAdmin && (
              <button 
                  onClick={() => setShowRebootConfirm(true)}
                  className="flex items-center gap-2 text-xs font-mono px-3 py-1 rounded border transition-all cursor-pointer bg-red-950/50 border-red-800 text-red-400 hover:bg-red-900"
              >
                  <Power size={14} />
                  <span className="hidden sm:inline">REBOOT</span>
              </button>
            )}
            
            {/* 저장/로드 버튼 (Supabase 연동) */}
            {isAdmin && (
              <div className="flex gap-2">
                <button
                    onClick={manualLoad}
                    className="flex items-center gap-2 text-xs font-mono px-3 py-1 rounded border transition-all cursor-pointer bg-blue-950/50 border-blue-800 text-blue-300 hover:bg-blue-900"
                    disabled={isLoading}
                >
                    <Download size={14} />
                    <span className="hidden sm:inline">LOAD</span>
                </button>
                <button
                    onClick={saveToServer}
                    className="flex items-center gap-2 text-xs font-mono px-3 py-1 rounded border transition-all cursor-pointer bg-emerald-950/50 border-emerald-800 text-emerald-300 hover:bg-emerald-900"
                    disabled={isLoading}
                >
                    {isLoading ? <RefreshCw size={14} className="animate-spin" /> : <Cloud size={14} />}
                    <span className="hidden sm:inline">SAVE</span>
                </button>
              </div>
            )}

            <button 
              onClick={() => { if (isAdmin) setIsAdmin(false); else setShowAuthModal(true); }}
              className={`flex items-center gap-2 text-xs font-mono px-3 py-1 rounded border transition-all cursor-pointer ${isAdmin ? 'bg-red-600 text-white border-red-500 hover:bg-red-500' : 'bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700'}`}
            >
                {isAdmin ? <RotateCcw size={14} /> : <Lock size={14} />}
                {isAdmin ? "EXIT EDIT MODE" : "OBSERVER"}
            </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left Panel: Map */}
        <div className={`flex-1 relative bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black overflow-hidden
             ${isAdmin && adminTab === 'database' ? 'hidden md:block md:w-1/3 md:flex-none opacity-50 pointer-events-none' : ''}`}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
          <div className="absolute inset-0 w-full h-full">
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {EDGES.map(([startId, endId], idx) => {
                const startNode = nodes.find(n => n.id === startId);
                const endNode = nodes.find(n => n.id === endId);
                const isVisible = isAdmin || capturedNodes.includes(startId) || capturedNodes.includes(endId);
                const isPathActive = capturedNodes.includes(startId) && capturedNodes.includes(endId);
                if (!isVisible) return null;
                return <line key={idx} x1={`${startNode.x}%`} y1={`${startNode.y}%`} x2={`${endNode.x}%`} y2={`${endNode.y}%`} stroke={isPathActive ? "#10b981" : (isAdmin ? "#64748b" : "#475569")} strokeWidth={isPathActive ? 3 : 1} strokeDasharray={isPathActive ? "none" : "5,5"} className="transition-all duration-500" />;
              })}
            </svg>
            {nodes.map((node) => {
              const status = getNodeStatus(node.id);
              return (
                <button
                  key={node.id}
                  onClick={() => handleNodeClick(node)}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 z-10 
                    ${status === 'current' ? 'bg-blue-500 shadow-[0_0_15px_#3b82f6] border-blue-300' : 
                      status === 'captured' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981] border-emerald-300' : 
                      status === 'attackable' ? 'bg-yellow-500 animate-pulse shadow-[0_0_15px_#eab308] border-yellow-300' : 
                      'bg-gray-800 border-gray-600 opacity-60'}
                    ${selectedNodeId === node.id ? 'scale-125 ring-4 ring-white/20' : 'hover:scale-110'}
                  `}
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                >
                  {status === 'locked' ? <Lock size={12} className="text-gray-400" /> : (node.type === 'deadend' && (isAdmin || capturedNodes.includes(node.id)) ? <AlertTriangle size={16} /> : (node.type === 'start' ? <Navigation size={16} /> : (node.type === 'goal' ? <Target size={16} /> : <MapPin size={16} />)))}
                </button>
              );
            })}
          </div>
          <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur border border-blue-500/30 p-3 rounded text-sm max-w-[200px]">
            <div className="text-blue-400 text-xs uppercase mb-1">Current Position</div>
            <div className="font-bold text-slate-100 flex items-center gap-2">
               <Navigation size={14} />
               {nodes.find(n => n.id === currentLocation)?.label}
            </div>
            <div className="mt-2 pt-2 border-t border-slate-700/50 text-slate-400 text-xs flex items-center gap-2">
              <Calendar size={12} className="text-emerald-500"/> 
              <span className="text-emerald-400 font-bold">DAY {day}</span>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className={`h-2/5 md:h-full md:w-96 bg-slate-900 border-t md:border-t-0 md:border-l border-slate-700 flex flex-col shadow-2xl z-20 
             ${isAdmin ? 'border-l-red-900/50' : ''} 
             ${isAdmin && adminTab === 'database' ? 'flex-1 md:w-2/3 md:border-l-0' : ''}`}>
          
          {isAdmin && (
            <div className="flex border-b border-slate-800">
               <button onClick={() => setAdminTab('map')} className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 transition-colors ${adminTab === 'map' ? 'bg-slate-800 text-red-400 border-b-2 border-red-500' : 'text-slate-500 hover:text-slate-300'}`}><Crosshair size={14} /> TACTICAL CONTROL</button>
               <button onClick={() => setAdminTab('database')} className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 transition-colors ${adminTab === 'database' ? 'bg-slate-800 text-red-400 border-b-2 border-red-500' : 'text-slate-500 hover:text-slate-300'}`}><Database size={14} /> NODE DATABASE</button>
            </div>
          )}

          {isAdmin && adminTab === 'database' ? (
             <div className="flex-1 overflow-y-auto p-4 bg-slate-925">
               <h3 className="text-slate-500 text-xs font-bold mb-4 flex items-center gap-2"><Database size={14} /> FULL NODE LIST ACCESS</h3>
               <div className="space-y-4">
                 {nodes.map(node => (
                   <div key={node.id} className="bg-slate-900 border border-slate-700 p-4 rounded hover:border-slate-600 transition-colors">
                     {/* ... Database Inputs (Same structure as before) ... */}
                     {/* Simplified for brevity in this response but maintains functionality */}
                     <div className="flex items-center gap-2 mb-3">
                       <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${node.type === 'deadend' ? 'bg-orange-900 text-orange-400' : 'bg-slate-800 text-slate-400'}`}>{node.id}</div>
                       <input type="text" value={node.label} onChange={(e) => handleUpdateNode(node.id, 'label', e.target.value)} className="flex-1 bg-transparent border-b border-slate-700 focus:border-red-500 outline-none text-white font-bold"/>
                       <span className="text-xs text-slate-600 uppercase">{node.type}</span>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div>
                          <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Description</label>
                          <textarea value={node.desc} onChange={(e) => handleUpdateNode(node.id, 'desc', e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-300 focus:border-red-500 outline-none resize-none h-16"/>
                       </div>
                       <div>
                          <label className="text-[10px] text-orange-500 uppercase font-bold block mb-1">Custom Warnings <button onClick={() => openWarningModal(node.id)} className="ml-2 px-2 py-0.5 bg-blue-900 text-blue-300 text-[10px] rounded hover:bg-blue-800 inline-flex items-center gap-1"><Plus size={10} /> Add</button></label>
                          <div className="w-full bg-slate-950 border border-slate-800 rounded p-2 min-h-[4rem] space-y-1">
                            {(!node.customWarnings || node.customWarnings.length === 0) && <span className="text-xs text-slate-600 italic">No warnings set</span>}
                            {node.customWarnings?.map((warning, idx) => (
                              <div key={idx} className="flex items-center justify-between bg-red-900/20 px-2 py-1 rounded border border-red-900/30">
                                <span className="text-xs text-red-300 truncate mr-2 cursor-pointer hover:underline" onClick={() => openWarningModal(node.id, idx, warning)}>{warning}</span>
                                <div className="flex items-center gap-1">
                                  <button onClick={() => openWarningModal(node.id, idx, warning)} className="text-slate-500 hover:text-white"><Edit3 size={12} /></button>
                                  <button onClick={() => handleRemoveWarning(node.id, idx)} className="text-slate-500 hover:text-red-400"><Trash2 size={14} /></button>
                                </div>
                              </div>
                            ))}
                          </div>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
          ) : (
            <>
              <div className="p-6 flex-1 overflow-y-auto">
                <h2 className={`text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 ${isAdmin ? 'text-red-500' : 'text-slate-500'}`}>
                   {isAdmin ? <Edit3 size={12}/> : <Target size={12}/>}
                   {isAdmin ? "CONTROL PANEL" : "TARGET ANALYSIS"}
                </h2>
                
                {isAdmin && (
                  <div className="mb-6 bg-slate-950/50 p-3 rounded border border-slate-700 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 flex items-center gap-2"><Calendar size={14} /> OPERATION DAY</span>
                    <div className="flex items-center gap-3">
                      <button onClick={() => changeDay(-1)} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"><ChevronLeft size={16}/></button>
                      <span className="text-lg font-bold text-emerald-400 w-10 text-center">{day}</span>
                      <button onClick={() => changeDay(1)} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"><ChevronRight size={16}/></button>
                    </div>
                  </div>
                )}
                
                {selectedNode ? (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex flex-col gap-2">
                      {isAdmin ? (
                        <input type="text" value={selectedNode.label} onChange={(e) => handleUpdateNode(selectedNode.id, 'label', e.target.value)} className="bg-slate-800 border border-slate-600 rounded p-2 text-lg font-bold text-white focus:border-red-500 focus:outline-none"/>
                      ) : (
                        <h3 className="text-2xl font-bold text-white">{selectedNode.label}</h3>
                      )}
                      <div className={`px-2 py-1 rounded text-xs font-bold uppercase self-start ${getNodeStatus(selectedNode.id) === 'captured' ? 'bg-emerald-900 text-emerald-400' : getNodeStatus(selectedNode.id) === 'attackable' ? 'bg-yellow-900 text-yellow-400' : getNodeStatus(selectedNode.id) === 'current' ? 'bg-blue-900 text-blue-400' : 'bg-red-900 text-red-400'}`}>
                        {getNodeStatus(selectedNode.id) === 'current' ? 'LOCATED' : getNodeStatus(selectedNode.id).toUpperCase()}
                      </div>
                    </div>
                    <div className="h-px bg-slate-700 w-full my-2"></div>
                    
                    {/* Public Description & Warnings */}
                    <div className="space-y-2">
                       {isAdmin ? (
                         <>
                           <div>
                              <label className="text-xs text-slate-500 font-bold block mb-1">DESCRIPTION (PUBLIC)</label>
                              <textarea value={selectedNode.desc} onChange={(e) => handleUpdateNode(selectedNode.id, 'desc', e.target.value)} className="w-full h-20 bg-slate-800 border border-slate-600 rounded p-2 text-sm text-slate-300 focus:border-red-500 focus:outline-none resize-none"/>
                           </div>
                           <div>
                              <div className="flex items-center justify-between mb-1">
                                  <label className="text-xs text-red-500 font-bold">CUSTOM WARNINGS</label>
                                  <button onClick={() => openWarningModal(selectedNode.id)} className="text-[10px] bg-slate-800 px-2 py-1 rounded hover:bg-slate-700 text-white flex items-center gap-1"><Plus size={10} /> Add New</button>
                              </div>
                              <div className="space-y-2">
                                  {selectedNode.customWarnings?.map((warning, idx) => (
                                      <div key={idx} className="flex items-center gap-2 bg-slate-800 p-2 rounded border border-slate-700">
                                          <AlertTriangle size={14} className="text-red-500 shrink-0" />
                                          <span className="text-xs text-red-300 flex-1 cursor-pointer hover:underline" onClick={() => openWarningModal(selectedNode.id, idx, warning)}>{warning}</span>
                                          <div className="flex items-center gap-1">
                                            <button onClick={() => openWarningModal(selectedNode.id, idx, warning)} className="text-slate-500 hover:text-white"><Edit3 size={12} /></button>
                                            <button onClick={() => handleRemoveWarning(selectedNode.id, idx)} className="text-slate-500 hover:text-red-400"><Trash2 size={14} /></button>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                           </div>
                           {selectedNode.type === 'deadend' && (
                              <div className="mt-2">
                                <label className="text-xs text-orange-500 font-bold block mb-1">REVEAL DESC (AFTER CAPTURE)</label>
                                <textarea value={selectedNode.revealDesc} onChange={(e) => handleUpdateNode(selectedNode.id, 'revealDesc', e.target.value)} className="w-full h-20 bg-slate-800 border border-orange-900/50 rounded p-2 text-sm text-orange-300 focus:border-orange-500 focus:outline-none resize-none"/>
                              </div>
                           )}
                         </>
                       ) : (
                         <p className="text-slate-300 leading-relaxed text-sm">
                           {selectedNode.type === 'deadend' && capturedNodes.includes(selectedNode.id) && selectedNode.revealDesc ? selectedNode.revealDesc : selectedNode.desc}
                         </p>
                       )}
                       
                       {(isAdmin || capturedNodes.includes(selectedNode.id)) && selectedNode.customWarnings?.map((warning, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-red-400 bg-red-950/30 p-2 rounded border border-red-900/50 animate-in fade-in slide-in-from-bottom-1">
                            <AlertTriangle size={16} className="shrink-0" />
                            <span className="text-xs font-bold">{warning}</span>
                          </div>
                       ))}
                    </div>

                    <div className="mt-8 space-y-2">
                       {isAdmin ? (
                         <>
                           <div className="grid grid-cols-2 gap-2">
                              <button onClick={toggleNodeCapturedStatus} className={`py-3 font-bold rounded flex flex-col items-center justify-center gap-1 transition-colors border text-xs ${capturedNodes.includes(selectedNode.id) ? 'bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700' : 'bg-emerald-900/50 border-emerald-500 text-emerald-400 hover:bg-emerald-900'}`}>
                                  {capturedNodes.includes(selectedNode.id) ? <Square size={16} /> : <CheckSquare size={16} />}
                                  {capturedNodes.includes(selectedNode.id) ? "점령 해제" : "점령 설정"}
                              </button>
                              <button onClick={adminMoveUnit} disabled={selectedNode.id === currentLocation} className={`py-3 font-bold rounded flex flex-col items-center justify-center gap-1 transition-colors border text-xs ${selectedNode.id === currentLocation ? 'bg-slate-800 border-slate-700 text-slate-600 cursor-not-allowed' : 'bg-blue-900/50 border-blue-500 text-blue-400 hover:bg-blue-900'}`}>
                                  <Navigation size={16} />
                                  부대 이동
                              </button>
                           </div>
                         </>
                       ) : (
                         <>
                            {getNodeStatus(selectedNode.id) === 'attackable' && <div className="w-full py-3 bg-slate-900 border border-yellow-700/50 text-yellow-600 rounded flex items-center justify-center gap-2 cursor-default opacity-70"><Lock size={20} />작전 승인 대기 (PENDING)</div>}
                            {getNodeStatus(selectedNode.id) === 'captured' && selectedNode.id !== currentLocation && <div className="w-full py-3 bg-slate-900 border border-emerald-700/50 text-emerald-600 rounded flex items-center justify-center gap-2 cursor-default opacity-70"><Shield size={20} />확보된 지역 (SECURED)</div>}
                            {getNodeStatus(selectedNode.id) === 'current' && <div className="w-full py-3 bg-blue-900/20 border border-blue-500/30 text-blue-400 rounded flex items-center justify-center gap-2 cursor-default"><MapPin size={20} />현재 주둔지 (CURRENT LOCATION)</div>}
                            {getNodeStatus(selectedNode.id) === 'locked' && <div className="w-full py-3 bg-slate-900 text-slate-600 rounded flex items-center justify-center gap-2 cursor-default border border-slate-800"><Lock size={16} />경로 미확보 (LOCKED)</div>}
                         </>
                       )}
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-500 text-center py-10 flex flex-col items-center">
                    <Target size={48} className="mb-4 opacity-20" />
                    <p>지도에서 스팟을 선택하여 정보를 확인하십시오.</p>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="h-48 md:h-1/3 bg-black border-t border-slate-800 p-4 font-mono text-xs overflow-y-auto">
             <h4 className={`mb-2 flex items-center gap-2 ${isAdmin ? 'text-red-500' : 'text-slate-500'}`}>
               <Terminal size={12} /> MISSION LOGS
             </h4>
             <div className="flex flex-col gap-1">
               {logs.map((log, i) => (
                 <div key={i} className={`pb-1 border-b border-slate-900/50 ${i === logs.length - 1 ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
                   {log}
                 </div>
               ))}
               <div ref={logsEndRef} />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- 최상위 앱 컴포넌트 (리셋 관리) ---
export default function SFCitySiegeWrapper() {
  const [gameKey, setGameKey] = useState(0);

  const handleReboot = () => {
    // 키값을 변경하여 하위 컴포넌트(GameContent)를 완전히 새로 생성(Unmount -> Mount)
    setGameKey(prev => prev + 1);
  };

  return <GameContent key={gameKey} onReboot={handleReboot} />;
}