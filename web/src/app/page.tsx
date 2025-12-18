// @ts-nocheck
'use client';


import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js'; // Supabase 라이브러리
import { Shield, Target, MapPin, Crosshair, AlertTriangle, Lock, Navigation, Terminal, Key, Edit3, Save, RotateCcw, CheckSquare, Square, RefreshCw, Calendar, ChevronLeft, ChevronRight, Power, Database, Plus, Trash2, X, Download, Cloud } from 'lucide-react';

// ==============================================================================
// [환경 변수 설정]
// Vercel의 Environment Variables에 설정된 값을 불러옵니다.
// ==============================================================================
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const ADMIN_KEY_ENV = process.env.NEXT_PUBLIC_ADMIN_KEY || "1217"; // 설정 없으면 기본값 1217
// ==============================================================================

// Supabase 클라이언트 생성
// 환경 변수가 없으면 클라이언트가 생성되지 않도록 예외 처리
const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL.startsWith('http')) 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
  : null;

// --- 초기 데이터 정의 ---
// --- 초기 데이터 정의 ---
const GET_INITIAL_NODES = () => [
  // [초반부] 진입 및 외곽
  { id: 0, x: 50, y: 10, label: "휘도 부대 집결 장소", type: "start", desc: "신시 북쪽 방어선 최외곽." },
  { id: 1, x: 30, y: 20, label: "제1 자동 방벽 제어소", type: "normal", desc: "북서쪽 방벽 제어 시설." },
  { id: 2, x: 70, y: 20, label: "제2 자동 방벽 제어소", type: "normal", desc: "북동쪽 방벽 제어 시설." },
  { id: 17, x: 10, y: 20, label: "드론 관제실", type: "deadend", desc: "경비 드론 관리 시설." },
  
  // [중반부 진입] 자원 및 정보 확보
  { id: 3, x: 20, y: 30, label: "산업 지구", type: "normal", desc: "자동화 공장 지대." },
  { id: 4, x: 50, y: 25, label: "신시 외곽 지대", type: "normal", desc: "시민 거주 구역." },
  { id: 5, x: 80, y: 30, label: "폐기물 처리장", type: "normal", desc: "폐기물 및 안드로이드 잔해 처리." },
  { id: 6, x: 10, y: 40, label: "군수용 물류터미널", type: "deadend", desc: "무기 보급 시설." },
  { id: 9, x: 90, y: 40, label: "방송 송출 센터", type: "deadend", desc: "미디어 통제 시설." },
  { id: 16, x: 15, y: 50, label: "지하 수로", type: "normal", desc: "은밀한 침투 경로." },

  // [중반부 핵심] 요충지 진입 전
  { id: 7, x: 35, y: 40, label: "중앙 에너지 발전소", type: "normal", desc: "도시 전력 공급 시설." },
  { id: 8, x: 65, y: 40, label: "데이터 센터", type: "normal", desc: "네트워크 및 데이터 관리." },

  // [병목 지점 - 필수 경유]
  { id: 18, x: 50, y: 50, label: "부대 ‘알파’", type: "normal", desc: "신시의 허리를 담당하는 최정예 안드로이드 부대. 중앙 정부로 가기 위해 반드시 돌파해야 한다." },

  // [후반부] 심층부 구역 (다시 갈라짐)
  { id: 10, x: 20, y: 65, label: "신시 경찰청", type: "normal", desc: "치안 유지 시설." },
  { id: 11, x: 40, y: 65, label: "시들종합병원", type: "normal", desc: "의료 시설." },
  { id: 12, x: 60, y: 65, label: "연구 단지", type: "normal", desc: "첨단 기술 연구소." },
  { id: 13, x: 80, y: 65, label: "상업 지구", type: "normal", desc: "번화가." },
  { id: 19, x: 90, y: 75, label: "경경대학교", type: "normal", desc: "언덕 위의 대학." },

  // [최후반부] 결전
  { id: 14, x: 50, y: 75, label: "광장", type: "normal", desc: "정부 청사 앞 거대 광장." },
  { id: 15, x: 50, y: 90, label: "중앙 정부", type: "goal", desc: "최종 목표. 신시의 통제권을 탈취하라." },
];

const INITIAL_EDGES = [
  // 초반 진입
  [0, 1], [0, 2],
  [1, 17], [1, 3], [1, 4],
  [2, 4], [2, 5],
  [3, 6], [3, 7], [3, 16],
  [4, 7], [4, 8],
  [5, 8], [5, 9],
  [16, 7], // 수로 -> 발전소 연결 추가

  // 병목 지점으로 집결 (모든 길은 '알파'로 통한다)
  [7, 18], [8, 18],

  // '알파' 돌파 후 다시 확산
  [18, 10], [18, 11], [18, 12], [18, 13],

  // 후반부 연결
  [10, 14], [11, 14], [12, 14], [13, 14],
  [13, 19], // 대학교는 상업지구에서 빠짐

  // 최종 목적지
  [14, 15]
];

export default function SFCitySiege() {
  const [user, setUserState] = useState<User | null>(null);
  const [adminSessionKey, setAdminSessionKey] = useState<string | null>(null);
  
  // 상태 관리
  const [nodes, setNodes] = useState(GET_INITIAL_NODES());
  const [edges, setEdges] = useState(INITIAL_EDGES); 
  
  const [currentLocation, setCurrentLocation] = useState(0);
  const [capturedNodes, setCapturedNodes] = useState([0]);
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const [day, setDay] = useState(1);
  const [logs, setLogs] = useState<string[]>(["Day 1: 북부 외곽 게이트 도착"]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [adminTab, setAdminTab] = useState('map');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showRebootConfirm, setShowRebootConfirm] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  
  const [warningNodeId, setWarningNodeId] = useState<number | null>(null);
  const [warningText, setWarningText] = useState("");
  const [warningEditIndex, setWarningEditIndex] = useState<number | null>(null);

  const [isAdmin, setIsAdmin] = useState(false);
  const [inputKey, setInputKey] = useState("");
  const [authError, setAuthError] = useState("");

  const [isEdgeEditMode, setIsEdgeEditMode] = useState(false);

  const logsEndRef = useRef<HTMLDivElement>(null);
  const selectedNode = selectedNodeId !== null ? nodes.find(n => n.id === selectedNodeId) : null;

  // 1. 데이터 불러오기 (Supabase 직접 호출)
  const loadFromSupabase = async (isAuto = false) => {
    if (!supabase) {
      if (!isAuto) console.warn("Supabase 환경 변수가 설정되지 않았습니다.");
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('game_state')
        .select('data')
        .eq('id', 1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116: 데이터 없음(정상)

      if (data && data.data) {
        const saved = data.data;
        if (saved.nodes) setNodes(saved.nodes);
        if (saved.currentLocation !== undefined) setCurrentLocation(saved.currentLocation);
        if (saved.capturedNodes) setCapturedNodes(saved.capturedNodes);
        if (saved.day) setDay(saved.day);
        if (saved.logs) setLogs(saved.logs);
        if (!isAuto) alert("데이터 로드 완료!");
      }
    } catch (err: any) {
      console.error("Load Error:", err);
      if (!isAuto) alert("데이터 불러오기 실패: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 초기 로드
  useEffect(() => {
    loadFromSupabase(true);
  }, []);

  // 2. 데이터 저장하기 (Supabase 직접 호출)
  const saveToSupabase = async () => {
    if (!supabase) {
      alert("Supabase 설정이 환경 변수에 있는지 확인해주세요.");
      return;
    }
    if (!isAdmin) {
      alert("관리자 권한이 필요합니다.");
      return;
    }

    setIsLoading(true);
    try {
      const payload = { nodes, currentLocation, capturedNodes, day, logs };
      
      const { error } = await supabase
        .from('game_state')
        .upsert({ id: 1, data: payload });

      if (error) throw error;

      alert("서버에 저장되었습니다.");
    } catch (err: any) {
      console.error("Save Error:", err);
      alert("저장 실패: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

    useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const isConnected = (from: number, to: number) => edges.some(edge => (edge[0] === from && edge[1] === to) || (edge[0] === to && edge[1] === from));

  // 상태 확인 함수 (단순화: 필수 조건 제거)
  const getNodeStatus = (nodeId: number) => {
    if (currentLocation === nodeId) return 'current';
    if (capturedNodes.includes(nodeId)) return 'captured';
    
    const isCurrentLocationCaptured = capturedNodes.includes(currentLocation);
    
    // 현재 위치에서 연결되어 있고, 현재 위치가 점령된 상태라면 공격 가능
    if (isCurrentLocationCaptured && isConnected(currentLocation, nodeId) && !capturedNodes.includes(nodeId)) {
        return 'attackable';
    }
    return 'locked';
  };

  const handleNodeClick = (node: any) => {
    // 1. 관리자 엣지 편집 모드
    if (isAdmin && isEdgeEditMode) {
      if (selectedNodeId === null) {
        setSelectedNodeId(node.id);
      } else if (selectedNodeId === node.id) {
        setSelectedNodeId(null);
      } else {
        const node1 = selectedNodeId;
        const node2 = node.id;
        
        const existsIndex = edges.findIndex(e => 
            (e[0] === node1 && e[1] === node2) || (e[0] === node2 && e[1] === node1)
        );

        if (existsIndex >= 0) {
            setEdges(prev => prev.filter((_, idx) => idx !== existsIndex));
        } else {
            setEdges(prev => [...prev, [node1, node2]]);
        }
      }
      return;
    }

    // 2. 일반 모드
    setSelectedNodeId(node.id);
  };

  const performMove = (targetId: number) => {
    const targetNode = nodes.find(n => n.id === targetId);
    if (!targetNode) return;
    setCurrentLocation(targetId);
    setLogs(prev => [...prev, `Day ${day}: ${targetNode.label}로 이동 완료`]);
  };

  const toggleNodeCapturedStatus = () => {
    if (!selectedNode || !selectedNodeId) return;
    if (capturedNodes.includes(selectedNodeId)) {
      if (selectedNode.type === 'start') return;
      setCapturedNodes(prev => prev.filter(id => id !== selectedNodeId));
    } else {
      setCapturedNodes(prev => [...prev, selectedNodeId]);
      setLogs(prev => [...prev, `Day ${day}: [관리자] ${selectedNode.label} 점령 완료`]);
    }
  };

  const handleUpdateNode = (id: number, key: string, value: any) => {
    setNodes(nodes.map(n => n.id === id ? { ...n, [key]: value } : n));
  };

  const openWarningModal = (id: number, index: number | null = null, currentText = "") => {
    setWarningNodeId(id);
    setWarningEditIndex(index);
    setWarningText(currentText);
    setShowWarningModal(true);
  };
  const saveWarning = (e: React.FormEvent) => {
    e.preventDefault();
    if (!warningText.trim()) return;
    setNodes(nodes.map(n => {
      if (n.id === warningNodeId) {
        const current = n.customWarnings || [];
        const updated = warningEditIndex !== null 
          ? current.map((w: string, i: number) => i === warningEditIndex ? warningText : w)
          : [...current, warningText];
        return { ...n, customWarnings: updated };
      }
      return n;
    }));
    setShowWarningModal(false);
  };
  const handleRemoveWarning = (id: number, index: number) => {
    setNodes(nodes.map(n => {
      if (n.id === id && n.customWarnings) {
        return { ...n, customWarnings: n.customWarnings.filter((_: string, i: number) => i !== index) };
      }
      return n;
    }));
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputKey === ADMIN_KEY_ENV) {
      setAdminSessionKey(inputKey);
      setIsAdmin(true);
      setShowAuthModal(false);
      setInputKey("");
      setAdminTab('map');
    } else {
      setAuthError("액세스 거부");
    }
  };

  const changeDay = (val: number) => setDay(prev => Math.max(1, prev + val));
  const adminMoveUnit = () => selectedNode && performMove(selectedNode.id);

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden select-none animate-in fade-in duration-700">
      
      {/* Modals */}
      {showRebootConfirm && (
        <div className="absolute inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-red-950/50 border border-red-500 p-8 rounded-lg w-full max-w-sm shadow-2xl text-center">
             <AlertTriangle size={48} className="text-red-500 mx-auto mb-4 animate-pulse" />
             <h3 className="text-2xl font-bold text-white mb-2">SYSTEM REBOOT</h3>
             <p className="text-red-200 mb-6 text-sm">모든 데이터와 경로 설정이 초기화됩니다.</p>
             <div className="flex gap-3 justify-center">
               <button onClick={() => setShowRebootConfirm(false)} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 font-bold">취소</button>
               <button onClick={() => { handleReboot(); setShowRebootConfirm(false); }} className="px-6 py-2 bg-red-600 hover:bg-red-500 rounded text-white font-bold">재실행</button>
             </div>
          </div>
        </div>
      )}

      {showWarningModal && (
        <div className="absolute inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-600 p-6 rounded-lg w-full max-w-sm relative">
             <button onClick={() => setShowWarningModal(false)} className="absolute top-2 right-2 text-slate-500 hover:text-white">✕</button>
             <h3 className="text-lg font-bold text-white mb-4 text-center">{warningEditIndex !== null ? "EDIT WARNING" : "ADD WARNING"}</h3>
             <form onSubmit={saveWarning}>
               <input type="text" value={warningText} onChange={(e) => setWarningText(e.target.value)} placeholder="Warning message..." className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white mb-4" autoFocus />
               <button type="submit" className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-2 rounded">{warningEditIndex !== null ? "UPDATE" : "ADD"}</button>
             </form>
          </div>
        </div>
      )}

      {showAuthModal && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-600 p-6 rounded-lg w-full max-w-sm relative">
             <button onClick={() => setShowAuthModal(false)} className="absolute top-2 right-2 text-slate-500 hover:text-white">✕</button>
             <div className="flex flex-col items-center mb-6"><Shield size={48} className="text-red-500 mb-2" /><h3 className="text-xl font-bold text-white">SECURITY CLEARANCE</h3></div>
             <form onSubmit={handleAuthSubmit}>
               <input type="password" value={inputKey} onChange={(e) => setInputKey(e.target.value)} placeholder="Enter Key Code" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white mb-4 text-center tracking-widest" autoFocus />
               {authError && <p className="text-red-500 text-xs mt-2 text-center">{authError}</p>}
               <button type="submit" className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded">AUTHORIZE</button>
             </form>
          </div>
        </div>
      )}

      {/* Header */}
      <header className={`h-14 border-b flex items-center justify-between px-6 z-10 shrink-0 ${isAdmin ? 'bg-red-950/30 border-red-900/50' : 'bg-slate-900 border-slate-700'}`}>
        <div className="flex items-center gap-2">
          <Terminal className={isAdmin ? "text-red-400" : "text-blue-400"} size={20} />
          <h1 className={`text-lg font-bold tracking-wider ${isAdmin ? "text-red-400" : "text-blue-400"}`}>PARADIGM ZERO</h1>
          {isAdmin && <span className="text-xs bg-red-900/50 text-red-200 px-2 py-0.5 rounded ml-2">ADMIN MODE</span>}
        </div>
        <div className="flex items-center gap-2">
            {isAdmin && (
              <>
                <button 
                    onClick={() => { setIsEdgeEditMode(!isEdgeEditMode); setSelectedNodeId(null); }} 
                    className={`flex items-center gap-1 px-3 py-1 text-xs font-mono rounded border transition-all ${isEdgeEditMode ? 'bg-yellow-600 text-white border-yellow-500 animate-pulse' : 'bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700'}`}
                >
                    <Network size={14} /> {isEdgeEditMode ? "LINK EDIT ON" : "LINK EDIT"}
                </button>
                <div className="w-px h-4 bg-slate-700 mx-1"></div>
                <button onClick={() => setShowRebootConfirm(true)} className="p-2 border border-red-800 bg-red-950/50 text-red-400 rounded hover:bg-red-900"><Power size={14} /></button>
                <button onClick={() => loadFromFirebase(false)} disabled={isLoading} className="flex items-center gap-1 px-3 py-1 text-xs font-mono rounded border bg-blue-950/50 border-blue-800 text-blue-300 hover:bg-blue-900"><Download size={14} /> LOAD</button>
                <button onClick={saveToFirebase} disabled={isLoading} className="flex items-center gap-1 px-3 py-1 text-xs font-mono rounded border bg-emerald-950/50 border-emerald-800 text-emerald-300 hover:bg-emerald-900">
                  {isLoading ? <RefreshCw size={14} className="animate-spin"/> : <Cloud size={14} />} SAVE
                </button>
              </>
            )}
            <button onClick={() => { if (isAdmin) { setIsAdmin(false); setIsEdgeEditMode(false); } else setShowAuthModal(true); }} className={`flex items-center gap-2 text-xs font-mono px-3 py-1 rounded border ${isAdmin ? 'bg-red-600 text-white border-red-500' : 'bg-slate-800 border-slate-600 text-slate-400'}`}>
                {isAdmin ? <RotateCcw size={14} /> : <Lock size={14} />} {isAdmin ? "EXIT" : "OBSERVER"}
            </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left Panel: Map */}
        <div className={`flex-1 relative bg-black overflow-hidden ${isAdmin && adminTab === 'database' ? 'hidden md:block md:w-1/3 opacity-50 pointer-events-none' : ''}`}>
          <div className="absolute inset-0 opacity-10 bg-[linear-gradient(#334155_1px,transparent_1px),linear-gradient(90deg,#334155_1px,transparent_1px)] bg-[size:40px_40px]"></div>
          
          {isEdgeEditMode && (
              <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-yellow-600/90 text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg border border-yellow-400 backdrop-blur-sm pointer-events-none">
                  경로 편집 모드: 노드를 클릭하여 연결/해제
              </div>
          )}

          <div className="absolute inset-0 w-full h-full">
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {edges.map(([startId, endId], idx) => {
                const start = nodes.find(n => n.id === startId);
                const end = nodes.find(n => n.id === endId);
                if (!start || !end) return null;
                const visible = isAdmin || capturedNodes.includes(startId) || capturedNodes.includes(endId);
                if (!visible) return null;
                const active = capturedNodes.includes(startId) && capturedNodes.includes(endId);
                return <line key={idx} x1={`${start.x}%`} y1={`${start.y}%`} x2={`${end.x}%`} y2={`${end.y}%`} stroke={active ? "#10b981" : (isAdmin ? "#64748b" : "#475569")} strokeWidth={active ? 3 : 1} strokeDasharray={active ? "none" : "5,5"} className="transition-all duration-500" />;
              })}
            </svg>
            {nodes.map(node => {
                const status = getNodeStatus(node.id);
                const isEditSelected = isEdgeEditMode && selectedNodeId === node.id;

                return (
                  <button key={node.id} onClick={() => handleNodeClick(node)} style={{ left: `${node.x}%`, top: `${node.y}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all z-10 
                  ${isEditSelected ? 'bg-yellow-500 border-white scale-110 shadow-[0_0_20px_#fbbf24]' : ''}
                  ${!isEditSelected && status === 'current' ? 'bg-blue-500 border-blue-300 shadow-[0_0_15px_#3b82f6]' : ''}
                  ${!isEditSelected && status === 'captured' ? 'bg-emerald-500 border-emerald-300 shadow-[0_0_10px_#10b981]' : ''}
                  ${!isEditSelected && status === 'attackable' ? 'bg-yellow-500 border-yellow-300 animate-pulse' : ''}
                  ${!isEditSelected && status === 'locked' ? 'bg-gray-800 border-gray-600 opacity-60' : ''}
                  ${selectedNodeId === node.id && !isEdgeEditMode ? 'scale-125 ring-4 ring-white/20' : ''}`}>
                    {status === 'locked' ? <Lock size={12} className="text-gray-400" /> : (node.type === 'deadend' && (isAdmin || capturedNodes.includes(node.id)) ? <AlertTriangle size={16} /> : (node.type === 'start' ? <Navigation size={16} /> : (node.type === 'goal' ? <Target size={16} /> : <MapPin size={16} />)))}
                  </button>
                );
            })}
          </div>
          <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur border border-blue-500/30 p-3 rounded text-sm pointer-events-none">
            <div className="text-blue-400 text-xs mb-1">Current Position</div>
            <div className="font-bold text-white flex gap-2"><Navigation size={14}/>{nodes.find(n => n.id === currentLocation)?.label}</div>
            <div className="mt-2 pt-2 border-t border-slate-700/50 text-emerald-400 text-xs font-bold flex gap-2"><Calendar size={12}/> DAY {day}</div>
          </div>
        </div>

        <div className={`h-2/5 md:h-full md:w-96 bg-slate-900 border-t md:border-t-0 md:border-l border-slate-700 flex flex-col shadow-2xl z-20 ${isAdmin && adminTab === 'database' ? 'flex-1 md:w-2/3 md:border-l-0' : ''}`}>
          {isAdmin && (
            <div className="flex border-b border-slate-800">
               <button onClick={() => setAdminTab('map')} className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 ${adminTab === 'map' ? 'text-red-400 border-b-2 border-red-500' : 'text-slate-500'}`}><Crosshair size={14} /> TACTICAL</button>
               <button onClick={() => setAdminTab('database')} className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 ${adminTab === 'database' ? 'text-red-400 border-b-2 border-red-500' : 'text-slate-500'}`}><Database size={14} /> DATABASE</button>
            </div>
          )}

          {isAdmin && adminTab === 'database' ? (
             <div className="flex-1 overflow-y-auto p-4 bg-slate-925 space-y-4">
               {nodes.map(node => (
                 <div key={node.id} className="bg-slate-900 border border-slate-700 p-4 rounded">
                   <div className="flex items-center gap-2 mb-3">
                     <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold">{node.id}</div>
                     <input type="text" value={node.label} onChange={(e) => handleUpdateNode(node.id, 'label', e.target.value)} className="flex-1 bg-transparent border-b border-slate-700 text-white font-bold focus:outline-none"/>
                   </div>
                   {/* 좌표 수정 기능 추가 */}
                   <div className="flex gap-4 mb-3 p-2 bg-slate-950 rounded border border-slate-800">
                      <div className="flex items-center gap-2">
                        <Move size={12} className="text-slate-500"/>
                        <span className="text-xs text-slate-500 font-mono">X:</span>
                        <input type="number" value={node.x} onChange={(e) => handleUpdateNode(node.id, 'x', Number(e.target.value))} className="w-16 bg-slate-900 border border-slate-700 rounded px-1 text-xs text-blue-300"/>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-mono">Y:</span>
                        <input type="number" value={node.y} onChange={(e) => handleUpdateNode(node.id, 'y', Number(e.target.value))} className="w-16 bg-slate-900 border border-slate-700 rounded px-1 text-xs text-blue-300"/>
                      </div>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <textarea value={node.desc} onChange={(e) => handleUpdateNode(node.id, 'desc', e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-300 h-16 resize-none"/>
                     <div>
                        <div className="flex justify-between mb-1"><span className="text-[10px] text-orange-500 font-bold">WARNINGS</span><button onClick={() => openWarningModal(node.id)} className="text-[10px] bg-blue-900 px-2 rounded text-blue-300"><Plus size={10}/></button></div>
                        <div className="bg-slate-950 border border-slate-800 rounded p-2 min-h-[4rem] space-y-1">
                          {node.customWarnings?.map((w, i) => (
                            <div key={i} className="flex justify-between bg-red-900/20 px-2 py-1 rounded border border-red-900/30">
                              <span className="text-xs text-red-300 truncate cursor-pointer" onClick={() => openWarningModal(node.id, i, w)}>{w}</span>
                              <button onClick={() => handleRemoveWarning(node.id, i)} className="text-red-500"><X size={12}/></button>
                            </div>
                          ))}
                        </div>
                     </div>
                   </div>
                 </div>
               ))}
             </div>
          ) : (
            <div className="p-6 flex-1 overflow-y-auto">
              {isAdmin && (
                <div className="mb-6 bg-slate-950/50 p-3 rounded border border-slate-700 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400">OPERATION DAY</span>
                  <div className="flex gap-3 items-center">
                    <button onClick={() => changeDay(-1)} className="text-white"><ChevronLeft size={16}/></button>
                    <span className="text-emerald-400 font-bold">{day}</span>
                    <button onClick={() => changeDay(1)} className="text-white"><ChevronRight size={16}/></button>
                  </div>
                </div>
              )}
              {selectedNode ? (
                <div className="space-y-4">
                  <div>
                    {isAdmin ? <input value={selectedNode.label} onChange={(e) => handleUpdateNode(selectedNode.id, 'label', e.target.value)} className="bg-slate-800 border-slate-600 rounded p-2 text-lg text-white font-bold w-full"/> : <h3 className="text-2xl font-bold text-white">{selectedNode.label}</h3>}
                    <div className="mt-2 flex gap-2">
                        <span className="px-2 py-1 rounded text-xs font-bold uppercase inline-block bg-slate-800 text-slate-400">{getNodeStatus(selectedNode.id)}</span>
                    </div>
                  </div>
                  <div className="h-px bg-slate-700 w-full"/>
                  {isAdmin ? (
                    <>
                      <textarea value={selectedNode.desc} onChange={(e) => handleUpdateNode(selectedNode.id, 'desc', e.target.value)} className="w-full h-20 bg-slate-800 border-slate-600 rounded p-2 text-sm text-slate-300 resize-none"/>
                      <div className="flex justify-between items-center"><label className="text-xs text-red-500 font-bold">WARNINGS</label><button onClick={() => openWarningModal(selectedNode.id)} className="text-[10px] bg-slate-800 px-2 py-1 rounded text-white flex gap-1"><Plus size={10}/> Add</button></div>
                      {selectedNode.customWarnings?.map((w, i) => (
                        <div key={i} className="flex items-center gap-2 bg-slate-800 p-2 rounded border border-slate-700">
                          <span className="text-xs text-red-300 flex-1 cursor-pointer" onClick={() => openWarningModal(selectedNode.id, i, w)}>{w}</span>
                          <button onClick={() => handleRemoveWarning(selectedNode.id, i)}><Trash2 size={14} className="text-red-500"/></button>
                        </div>
                      ))}
                    </>
                  ) : (
                    <>
                      <p className="text-slate-300 text-sm">{selectedNode.type === 'deadend' && capturedNodes.includes(selectedNode.id) && selectedNode.revealDesc ? selectedNode.revealDesc : selectedNode.desc}</p>
                      {(isAdmin || capturedNodes.includes(selectedNode.id)) && selectedNode.customWarnings?.map((w, i) => <div key={i} className="flex items-center gap-2 text-red-400 bg-red-950/30 p-2 rounded border border-red-900/50"><AlertTriangle size={16}/><span className="text-xs font-bold">{w}</span></div>)}
                    </>
                  )}
                  <div className="mt-8 grid grid-cols-2 gap-2">
                    {isAdmin ? (
                      <>
                        <button onClick={toggleNodeCapturedStatus} className="py-3 font-bold rounded border text-xs bg-slate-800 text-slate-400 border-slate-600 hover:bg-slate-700">{capturedNodes.includes(selectedNode.id) ? "점령 해제" : "점령 설정"}</button>
                        <button onClick={adminMoveUnit} disabled={selectedNode.id === currentLocation} className="py-3 font-bold rounded border text-xs bg-blue-900/50 text-blue-400 border-blue-500 hover:bg-blue-900">부대 이동</button>
                      </>
                    ) : (
                      <>
                        {getNodeStatus(selectedNode.id) === 'attackable' && <div className="col-span-2 py-3 bg-slate-900 border border-yellow-700/50 text-yellow-600 rounded flex justify-center gap-2 opacity-70"><Lock size={20}/> 작전 승인 대기</div>}
                        {getNodeStatus(selectedNode.id) === 'captured' && selectedNode.id !== currentLocation && <div className="col-span-2 py-3 bg-slate-900 border border-emerald-700/50 text-emerald-600 rounded flex justify-center gap-2 opacity-70"><Shield size={20}/> 확보된 지역</div>}
                        {getNodeStatus(selectedNode.id) === 'locked' && <div className="col-span-2 py-3 bg-slate-900 text-slate-600 rounded flex justify-center gap-2 border border-slate-800">
                            <Lock size={16}/> 경로 미확보
                        </div>}
                      </>
                    )}
                  </div>
                </div>
              ) : <div className="text-slate-500 text-center py-10"><Target size={48} className="mb-4 opacity-20 mx-auto"/><p>지도에서 스팟을 선택하세요.</p></div>}
            </div>
          )}
          <div className="h-48 bg-black border-t border-slate-800 p-4 font-mono text-xs overflow-y-auto">
             <div className="flex flex-col gap-1">{logs.map((l, i) => <div key={i} className="pb-1 border-b border-slate-900/50 text-slate-500">{l}</div>)}<div ref={logsEndRef}/></div>
          </div>
        </div>
      </div>
    </div>
  );
}