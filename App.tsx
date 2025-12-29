import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Zap, Play, Settings, 
  BookOpen, Upload, Volume2, VolumeX, Smartphone, BarChart3, 
  ChevronRight, Check, FileJson, RotateCcw, Award, Globe, Music, Power, RotateCw, Menu, Grip,
  Lightbulb, FastForward, Waves, Copy, Send, ClipboardCopy, Clock, PieChart, RefreshCw
} from 'lucide-react';

// --- 字体样式 ---
const FontStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap');
    .font-led { font-family: 'VT323', monospace; }
    .font-pixel { font-family: 'Press Start 2P', cursive; } 
    @font-face {
      font-family: 'PixelFallback';
      src: local('Courier New'), monospace;
    }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `}</style>
);

// --- 核心数据定义 ---

export interface Compound {
  formula: string;
  zh: { name: string };
  en: { name: string };
}

export interface Reaction {
  chapter: string;
  from: string;
  to: string;
  type: string;
  cond: { zh: string; en: string };
}

export const COMPOUNDS_CORE: Record<string, Compound> = {
  "CH4":{formula:"CH₄",zh:{name:"甲烷"},en:{name:"Methane"}},
  "C2H6":{formula:"CH₃CH₃",zh:{name:"乙烷"},en:{name:"Ethane"}},
  "C2H4":{formula:"CH₂=CH₂",zh:{name:"乙烯"},en:{name:"Ethene"}},
  "C2H2":{formula:"HC≡CH",zh:{name:"乙炔"},en:{name:"Ethyne"}},
  "Bz":{formula:"C₆H₆",zh:{name:"苯"},en:{name:"Benzene"}},
  "Toluene":{formula:"C₆H₅CH₃",zh:{name:"甲苯"},en:{name:"Toluene"}},
  "Styrene":{formula:"C₆H₅CH=CH₂",zh:{name:"苯乙烯"},en:{name:"Styrene"}},
  "Cyclohexane":{formula:"C₆H₁₂",zh:{name:"环己烷"},en:{name:"Cyclohexane"}},
  "13Butadiene":{formula:"C₄H₆",zh:{name:"1,3-丁二烯"},en:{name:"1,3-Butadiene"}},
  "CH3Cl":{formula:"CH₃Cl",zh:{name:"一氯甲烷"},en:{name:"Chloromethane"}},
  "C2H5Cl":{formula:"CH₃CH₂Cl",zh:{name:"氯乙烷"},en:{name:"Chloroethane"}},
  "C2H5Br":{formula:"CH₃CH₂Br",zh:{name:"溴乙烷"},en:{name:"Bromoethane"}},
  "12Dibromo":{formula:"CH₂BrCH₂Br",zh:{name:"1,2-二溴乙烷"},en:{name:"1,2-Dibromoethane"}},
  "BzBr":{formula:"C₆H₅Br",zh:{name:"溴苯"},en:{name:"Bromobenzene"}},
  "PVC_m":{formula:"CH₂=CHCl",zh:{name:"氯乙烯"},en:{name:"Vinyl Chloride"}},
  "EtOH":{formula:"C₂H₅OH",zh:{name:"乙醇"},en:{name:"Ethanol"}},
  "Glycol":{formula:"HOCH₂CH₂OH",zh:{name:"乙二醇"},en:{name:"Ethylene Glycol"}},
  "Phenol":{formula:"C₆H₅OH",zh:{name:"苯酚"},en:{name:"Phenol"}},
  "TribromoPh":{formula:"C₆H₂Br₃OH",zh:{name:"三溴苯酚"},en:{name:"Tribromophenol"}},
  "NaPhenolate":{formula:"C₆H₅ONa",zh:{name:"苯酚钠"},en:{name:"Sodium Phenoxide"}},
  "HCHO":{formula:"HCHO",zh:{name:"甲醛"},en:{name:"Methanal"}},
  "CH3CHO":{formula:"CH₃CHO",zh:{name:"乙醛"},en:{name:"Ethanal"}},
  "Glyoxal":{formula:"OHC-CHO",zh:{name:"乙二醛"},en:{name:"Glyoxal"}},
  "Acetone":{formula:"CH₃COCH₃",zh:{name:"丙酮"},en:{name:"Acetone"}},
  "BzCHO":{formula:"C₆H₅CHO",zh:{name:"苯甲醛"},en:{name:"Benzaldehyde"}},
  "HCOOH":{formula:"HCOOH",zh:{name:"甲酸"},en:{name:"Formic Acid"}},
  "AcOH":{formula:"CH₃COOH",zh:{name:"乙酸"},en:{name:"Acetic Acid"}},
  "OxalicAcid":{formula:"HOOC-COOH",zh:{name:"乙二酸"},en:{name:"Oxalic Acid"}},
  "BzOH":{formula:"C₆H₅COOH",zh:{name:"苯甲酸"},en:{name:"Benzoic Acid"}},
  "EtOAc":{formula:"CH₃COOC₂H₅",zh:{name:"乙酸乙酯"},en:{name:"Ethyl Acetate"}},
  "MeMethacrylate":{formula:"C₅H₈O₂",zh:{name:"MMA"},en:{name:"MMA"}},
  "SalicylicAcid":{formula:"C₇H₆O₃",zh:{name:"水杨酸"},en:{name:"Salicylic Acid"}},
  "Aspirin":{formula:"C₉H₈O₄",zh:{name:"阿司匹林"},en:{name:"Aspirin"}},
  "NitroBz":{formula:"C₆H₅NO₂",zh:{name:"硝基苯"},en:{name:"Nitrobenzene"}},
  "Aniline":{formula:"C₆H₅NH₂",zh:{name:"苯胺"},en:{name:"Aniline"}},
  "Acetanilide":{formula:"C₈H₉NO",zh:{name:"乙酰苯胺"},en:{name:"Acetanilide"}},
  "TNT":{formula:"TNT",zh:{name:"TNT"},en:{name:"TNT"}},
  "TribromoAniline":{formula:"C₆H₂Br₃NH₂",zh:{name:"三溴苯胺"},en:{name:"Tribromoaniline"}},
  "PE":{formula:"[CH₂-CH₂]n",zh:{name:"聚乙烯"},en:{name:"PE"}},
  "PVC":{formula:"[CH₂-CHCl]n",zh:{name:"聚氯乙烯"},en:{name:"PVC"}},
  "PS":{formula:"[CH₂-CHPh]n",zh:{name:"聚苯乙烯"},en:{name:"PS"}},
  "PMMA":{formula:"[PMMA]n",zh:{name:"有机玻璃"},en:{name:"PMMA"}},
  "PhenolicResin":{formula:"Resin",zh:{name:"酚醛树脂"},en:{name:"Phenolic Resin"}},
  "PET":{formula:"PET",zh:{name:"PET酯"},en:{name:"PET"}},
  "Rubber":{formula:"[Rubber]n",zh:{name:"顺丁橡胶"},en:{name:"Rubber"}},
  "CO2":{formula:"CO₂",zh:{name:"二氧化碳"},en:{name:"CO2"}},
  "H2O":{formula:"H₂O",zh:{name:"水"},en:{name:"Water"}},
};

export const REACTIONS_CORE: Reaction[] = [
  {chapter:"hydrocarbon",from:"CH4",to:"CH3Cl",type:"Substitution",cond:{zh:"Cl₂, 光照",en:"Cl₂, Light"}},
  {chapter:"hydrocarbon",from:"C2H4",to:"C2H6",type:"Addition",cond:{zh:"H₂, Ni, 加热",en:"H₂, Ni, Heat"}},
  {chapter:"hydrocarbon",from:"C2H4",to:"12Dibromo",type:"Addition",cond:{zh:"Br₂ (CCl₄)",en:"Br₂ (CCl₄)"}},
  {chapter:"hydrocarbon",from:"C2H4",to:"PE",type:"Polymerisation",cond:{zh:"催化剂, 高温高压",en:"Cat., High P"}},
  {chapter:"hydrocarbon",from:"C2H2",to:"C2H4",type:"Addition",cond:{zh:"H₂, 催化剂(控制)",en:"H₂, Cat(ctrl)"}},
  {chapter:"hydrocarbon",from:"Bz",to:"Cyclohexane",type:"Addition",cond:{zh:"3H₂, Ni, 加热",en:"3H₂, Ni, Heat"}},
  {chapter:"hydrocarbon",from:"Bz",to:"BzBr",type:"Substitution",cond:{zh:"液溴, FeBr₃",en:"Liq. Br₂, FeBr₃"}},
  {chapter:"halogen",from:"C2H4",to:"C2H5Br",type:"Addition",cond:{zh:"HBr",en:"HBr"}},
  {chapter:"halogen",from:"C2H5Br",to:"EtOH",type:"Substitution",cond:{zh:"NaOH 水溶液, 加热",en:"NaOH(aq), Heat"}},
  {chapter:"halogen",from:"C2H5Br",to:"C2H4",type:"Elimination",cond:{zh:"NaOH 醇溶液, 加热",en:"NaOH(alc), Heat"}},
  {chapter:"halogen",from:"12Dibromo",to:"Glycol",type:"Substitution",cond:{zh:"NaOH 水溶液, 加热",en:"NaOH(aq), Heat"}},
  {chapter:"halogen",from:"12Dibromo",to:"C2H2",type:"Elimination",cond:{zh:"NaOH 醇溶液, 加热",en:"NaOH(alc), Heat"}},
  {chapter:"halogen",from:"C2H2",to:"PVC_m",type:"Addition",cond:{zh:"HCl, 催化剂",en:"HCl, Cat."}},
  {chapter:"alcohol_phenol",from:"C2H4",to:"EtOH",type:"Addition",cond:{zh:"H₂O, 催化剂",en:"H₂O, Cat."}},
  {chapter:"alcohol_phenol",from:"EtOH",to:"C2H4",type:"Elimination",cond:{zh:"浓H₂SO₄, 170℃",en:"H₂SO₄, 170℃"}},
  {chapter:"alcohol_phenol",from:"EtOH",to:"CH3CHO",type:"Oxidation",cond:{zh:"O₂, Cu, 加热",en:"O₂, Cu, Heat"}},
  {chapter:"alcohol_phenol",from:"Phenol",to:"TribromoPh",type:"Substitution",cond:{zh:"浓溴水",en:"Conc. Br₂"}},
  {chapter:"alcohol_phenol",from:"Phenol",to:"NaPhenolate",type:"Acid-Base",cond:{zh:"NaOH 或 Na",en:"NaOH/Na"}},
  {chapter:"alcohol_phenol",from:"NaPhenolate",to:"Phenol",type:"Acid-Base",cond:{zh:"CO₂ + H₂O",en:"CO₂ + H₂O"}},
  {chapter:"alcohol_phenol",from:"BzBr",to:"NaPhenolate",type:"Substitution",cond:{zh:"NaOH, 高温高压",en:"NaOH, High P"}},
  {chapter:"aldehyde",from:"EtOH",to:"CH3CHO",type:"Oxidation",cond:{zh:"O₂, Cu, 加热",en:"O₂, Cu"}},
  {chapter:"aldehyde",from:"CH3CHO",to:"EtOH",type:"Reduction",cond:{zh:"H₂, Ni, 加热",en:"H₂, Ni"}},
  {chapter:"aldehyde",from:"CH3CHO",to:"AcOH",type:"Oxidation",cond:{zh:"酸性 KMnO₄",en:"Acidic KMnO₄"}},
  {chapter:"aldehyde",from:"CH3CHO",to:"AcOH",type:"Oxidation",cond:{zh:"银氨溶液 (银镜)",en:"Tollens'"}},
  {chapter:"aldehyde",from:"Glycol",to:"Glyoxal",type:"Oxidation",cond:{zh:"O₂, Cu, 加热",en:"O₂, Cu"}},
  {chapter:"aldehyde",from:"Glyoxal",to:"OxalicAcid",type:"Oxidation",cond:{zh:"O₂, 催化剂",en:"O₂, Cat."}},
  {chapter:"aldehyde",from:"Acetone",to:"Isopropanol",type:"Reduction",cond:{zh:"H₂, Ni",en:"H₂, Ni"}},
  {chapter:"acid_ester",from:"AcOH",to:"EtOAc",type:"Esterification",cond:{zh:"EtOH, 浓H₂SO₄",en:"EtOH, H₂SO₄"}},
  {chapter:"acid_ester",from:"EtOAc",to:"AcOH",type:"Hydrolysis",cond:{zh:"稀H₂SO₄, 加热",en:"Dilute H₂SO₄"}},
  {chapter:"acid_ester",from:"EtOAc",to:"EtOH",type:"Hydrolysis",cond:{zh:"NaOH 溶液, 加热",en:"NaOH(aq)"}},
  {chapter:"acid_ester",from:"Toluene",to:"BzOH",type:"Oxidation",cond:{zh:"酸性 KMnO₄",en:"Acidic KMnO₄"}},
  {chapter:"acid_ester",from:"SalicylicAcid",to:"Aspirin",type:"Esterification",cond:{zh:"乙酸酐",en:"Ac₂O"}},
  {chapter:"acid_ester",from:"Glycol",to:"PET",type:"Polycondensation",cond:{zh:"对苯二甲酸",en:"Terephthalic Acid"}},
  {chapter:"nitrogen",from:"Bz",to:"NitroBz",type:"Substitution",cond:{zh:"浓HNO₃/H₂SO₄",en:"Conc. HNO₃"}},
  {chapter:"nitrogen",from:"Toluene",to:"TNT",type:"Substitution",cond:{zh:"浓HNO₃, 加热",en:"Conc. HNO₃"}},
  {chapter:"nitrogen",from:"NitroBz",to:"Aniline",type:"Reduction",cond:{zh:"Fe / HCl",en:"Fe / HCl"}},
  {chapter:"nitrogen",from:"Aniline",to:"Acetanilide",type:"Substitution",cond:{zh:"乙酸酐/乙酰氯",en:"Ac₂O/AcCl"}},
  {chapter:"nitrogen",from:"Aniline",to:"TribromoAniline",type:"Substitution",cond:{zh:"浓溴水",en:"Conc. Br₂"}},
  {chapter:"polymer",from:"C2H4",to:"PE",type:"Polymerisation",cond:{zh:"催化剂, 高温高压",en:"Cat., High P"}},
  {chapter:"polymer",from:"Styrene",to:"PS",type:"Polymerisation",cond:{zh:"催化剂",en:"Catalyst"}},
  {chapter:"polymer",from:"PVC_m",to:"PVC",type:"Polymerisation",cond:{zh:"引发剂",en:"Initiator"}},
  {chapter:"polymer",from:"MeMethacrylate",to:"PMMA",type:"Polymerisation",cond:{zh:"引发剂",en:"Initiator"}},
  {chapter:"polymer",from:"Phenol",to:"PhenolicResin",type:"Polycondensation",cond:{zh:"HCHO, 催化剂",en:"HCHO, Cat."}},
  {chapter:"polymer",from:"13Butadiene",to:"Rubber",type:"Polymerisation",cond:{zh:"Na (催化)",en:"Na"}},
];

// --- 游戏配置常量 ---
type Point = { x: number; y: number };
type GameState = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAMEOVER' | 'IMPORT_MODAL' | 'REPORT' | 'QUIT_CONFIRM' | 'RESET_CONFIRM';
type MenuPage = 'MAIN' | 'CHAPTERS' | 'DIFFICULTY' | 'SETTINGS';
type GameMode = 'product' | 'cond';
type Difficulty = 'EASY' | 'NORMAL' | 'HARD' | 'INSANE';
type Language = 'zh' | 'en';

type FoodItem = { id: number; x: number; y: number; val: string; isCorrect: boolean; kind: GameMode };
type FloatText = { id: number; x: number; y: number; text: string; color: string; life: number; fontSize?: number };
type Particle = { id: number; x: number; y: number; vx: number; vy: number; color: string; life: number; size: number };

type HistoryRecord = {
  id: number;
  question: string;
  answer: string;
  expected: string;
  correct: boolean;
  chapter: string;
  type: string;     
  duration: number; 
  timestamp: number;
};

interface GameSettings {
  sound: boolean;
  music: boolean;
  vibration: boolean;
  difficulty: Difficulty;
  selectedChapters: string[];
  language: Language;
}

const DIFFICULTY_CONFIG: Record<Difficulty, { speed: number; options: number; penalty: number }> = {
  EASY: { speed: 4.0, options: 4, penalty: 1 },    
  NORMAL: { speed: 6.5, options: 4, penalty: 1 },  
  HARD: { speed: 9.0, options: 4, penalty: 1 },    
  INSANE: { speed: 13.0, options: 4, penalty: 1 }    
};

const RXN_TYPES: Record<string, {zh: string, en: string}> = {
  "Substitution": {zh: "取代反应", en: "Substitution"},
  "Addition": {zh: "加成反应", en: "Addition"},
  "Polymerisation": {zh: "聚合反应", en: "Polymerization"},
  "Elimination": {zh: "消去反应", en: "Elimination"},
  "Oxidation": {zh: "氧化反应", en: "Oxidation"},
  "Reduction": {zh: "还原反应", en: "Reduction"},
  "Esterification": {zh: "酯化反应", en: "Esterification"},
  "Hydrolysis": {zh: "水解反应", en: "Hydrolysis"},
  "Acid-Base": {zh: "酸碱反应", en: "Acid-Base"},
  "Polycondensation": {zh: "缩聚反应", en: "Polycondensation"}
};

const CHAPTER_ORDER = [
  'hydrocarbon', 'halogen', 'alcohol_phenol', 'aldehyde', 'acid_ester', 'nitrogen', 'polymer'
];

const AUDIO_PATHS = {
  bgm: './assets/bgm.mp3',
  move: './assets/click.mp3',
  eat: './assets/eat.mp3',
  wrong: './assets/die.mp3',
  die: './assets/die.mp3',
  select: './assets/click.mp3',
  boost: './assets/click.mp3',
  back: './assets/click.mp3',
  hint: './assets/win.mp3',
};

const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
let audioCtx: AudioContext | null = null;

const playSynthTone = (freq: number, type: OscillatorType, duration: number) => {
  if (!audioCtx) audioCtx = new AudioContextClass();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
};

const getLocalizedUI = (key: string, lang: Language) => {
  const dict: Record<string, {zh: string, en: string}> = {
    SCORE: {zh: '分数', en: 'SCORE'},
    BEST: {zh: '最佳', en: 'BEST'},
    START: {zh: '开始游戏', en: 'START GAME'},
    CHAPTERS: {zh: '章节选择', en: 'CHAPTERS'},
    DIFFICULTY_OPT: {zh: '难度设置', en: 'DIFFICULTY'},
    IMPORT: {zh: '导入题库', en: 'IMPORT DATA'},
    SETTINGS: {zh: '系统设置', en: 'SETTINGS'},
    DIFFICULTY: {zh: '难度选择', en: 'DIFFICULTY'},
    SFX: {zh: '音效', en: 'SFX'},
    MUSIC: {zh: '音乐', en: 'MUSIC'},
    VIBE: {zh: '震动', en: 'VIBE'},
    LANG: {zh: '语言', en: 'LANGUAGE'},
    PAUSED: {zh: '暂停', en: 'PAUSED'},
    GAMEOVER: {zh: '游戏结束', en: 'GAME OVER'},
    COMPLETED: {zh: '章节完成', en: 'CHAPTER CLEAR'},
    REPORT: {zh: '学习报告', en: 'REPORT'},
    RETRY: {zh: '重试 [A]', en: 'RETRY [A]'},
    VIEW_REPORT: {zh: '查看报告 [B]', en: 'REPORT [B]'},
    SEND: {zh: '发送', en: 'SEND'},
    COPY: {zh: '复制报告', en: 'COPY REPORT'},
    NAME: {zh: '姓名', en: 'Name'},
    ID: {zh: '学号', en: 'ID'},
    WEAKNESS: {zh: '薄弱环节', en: 'Weakness'},
    ACCURACY: {zh: '准确率', en: 'Accuracy'},
    TOTAL_Q: {zh: '答题数', en: 'Questions'},
    MAX_COMBO: {zh: '最大连击', en: 'Max Combo'},
    GRADE: {zh: '评级', en: 'Grade'},
    RESET: {zh: '重置', en: 'RESET'},
    HINT: {zh: '提示', en: 'HINT'},
    BOOST: {zh: '加速', en: 'BOOST'},
    RESUME: {zh: '继续游戏', en: 'RESUME'},
    QUIT: {zh: '退出游戏', en: 'QUIT GAME'},
    ALL: {zh: '🔥 综合训练 (ALL)', en: '🔥 Comprehensive (ALL)'},
    ALL_SHORT: {zh: '综合训练', en: 'ALL'},
    ON: {zh: '开启', en: 'ON'},
    OFF: {zh: '关闭', en: 'OFF'},
    BACK_CMD: {zh: '返回', en: 'BACK'},
    NO_DATA: {zh: '暂无数据', en: 'NO DATA'},
    DATA_UPLOAD: {zh: '导入数据', en: 'DATA UPLOAD'},
    TAP_UPLOAD: {zh: '点击上传 .JSON 文件', en: 'TAP TO UPLOAD .JSON'},
    PASTE_JSON: {zh: '在此粘贴 JSON 内容...', en: 'Paste JSON here...'},
    CANCEL: {zh: '取消', en: 'CANCEL'},
    LOAD: {zh: '加载', en: 'LOAD'},
    CONFIRM_RESET: {zh: '停止并重置游戏？', en: 'Stop and Reset Game?'},
    CONFIRM_MENU: {zh: '返回主菜单？', en: 'Return to Main Menu?'},
    ALERT_NO_Q: {zh: '没有可用题目！', en: 'No questions available!'},
    ALERT_JSON_ERR: {zh: '错误：无效的 JSON', en: 'Error: Invalid JSON'},
    ALERT_LOADED: {zh: '加载成功！', en: 'Loaded!'},
    ALERT_FILE_LOADED: {zh: '文件加载成功！', en: 'File Loaded!'},
    ALERT_ENTER_INFO: {zh: '请输入姓名和学号', en: 'Please enter Name and Student ID'},
    ALERT_COPIED: {zh: '报告已复制到剪贴板', en: 'Report copied to clipboard'},
    ALERT_COPY_FAIL: {zh: '复制失败', en: 'Failed to copy'},
    ANALYSIS: {zh: '详细分析', en: 'ANALYSIS'},
    AVG_TIME_OK: {zh: '平均耗时(对)', en: 'Avg Time (OK)'},
    AVG_TIME_X: {zh: '平均耗时(错)', en: 'Avg Time (X)'},
    MOST_FREQ: {zh: '最常遇到', en: 'Most Frequent'},
    HISTORY_LOG: {zh: '答题记录', en: 'HISTORY LOG'},
    DIFF_EASY: {zh: '简单', en: 'EASY'},
    DIFF_NORMAL: {zh: '普通', en: 'NORMAL'},
    DIFF_HARD: {zh: '困难', en: 'HARD'},
    DIFF_INSANE: {zh: '极速', en: 'INSANE'},
    BTN_OK: {zh: '确定', en: 'OK'},
    BTN_BACK: {zh: '返回', en: 'BACK'},
    BTN_BST: {zh: '加速', en: 'BST'},
    BTN_VIBE: {zh: '震动', en: 'VIBE'},
    BTN_MUTE: {zh: '静音', en: 'MUTE'},
    BTN_PAUSE: {zh: '暂停', en: 'PAUSE'},
    BTN_MENU: {zh: '菜单', en: 'MENU'},
    BTN_RESET: {zh: '重置', en: 'RESET'},
    REALLY_QUIT: {zh: '确认退出？', en: 'REALLY QUIT?'},
    YES: {zh: '是', en: 'YES'},
    NO: {zh: '否', en: 'NO'},
    NO_FILE: {zh: '未选择文件', en: 'No file selected'},
  };
  return dict[key] ? dict[key][lang] : key;
};

// --- Retro Components ---

// 1. Retro D-Pad (优化万向手感)
const AnalogStick: React.FC<{ onMove: (dx: number, dy: number) => void; active?: boolean }> = React.memo(({ onMove, active = true }) => {
  const stickRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const lastVec = useRef({ x: 0, y: 0 });

  // 修复：组件卸载或重置时，强制重置输入向量，防止卡死
  useEffect(() => {
    return () => onMove(0, 0);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!active) return;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    handlePointerMove(e);
    if (navigator.vibrate) navigator.vibrate(5);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !stickRef.current) return;
    const rect = stickRef.current.getBoundingClientRect();
    if (rect.width === 0) return; // 避免隐藏时计算错误

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    let dx = e.clientX - centerX;
    let dy = e.clientY - centerY;
    
    const maxDist = rect.width / 2 - 12;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > maxDist) {
      const ratio = maxDist / dist;
      dx *= ratio;
      dy *= ratio;
    }
    setPos({ x: dx, y: dy });

    const normalizedX = maxDist > 0 ? dx / maxDist : 0;
    const normalizedY = maxDist > 0 ? dy / maxDist : 0;
    lastVec.current = { x: normalizedX, y: normalizedY };
    onMove(normalizedX, normalizedY);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setPos({ x: 0, y: 0 });
    lastVec.current = { x: 0, y: 0 };
    onMove(0, 0);
  };

  return (
    <div 
      ref={stickRef}
      className={`relative w-28 h-28 md:w-32 md:h-32 rounded-full bg-[#e0e0d1] shadow-[inset_0_2px_5px_rgba(0,0,0,0.2),0_1px_1px_rgba(255,255,255,0.8)] flex items-center justify-center border border-[#b0b0a0] ${!active ? 'opacity-50 pointer-events-none' : ''}`}
      style={{ touchAction: 'none' }} // 强制禁止浏览器默认行为
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <div className="absolute w-24 h-24 md:w-28 md:h-28 rounded-full bg-[#d0d0c0] shadow-[inset_0_2px_5px_rgba(0,0,0,0.1)] pointer-events-none"></div>
      <div 
        className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#333] shadow-[0_4px_6px_rgba(0,0,0,0.4),inset_0_2px_4px_rgba(255,255,255,0.2)] absolute z-10 flex items-center justify-center transition-transform duration-75 ease-out pointer-events-none"
        style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
      >
        <div className="w-8 h-8 rounded-full border-2 border-[#222] bg-[radial-gradient(circle,#444_2px,transparent_2.5px)] bg-[length:6px_6px] opacity-50"></div>
      </div>
      <div className="absolute w-full h-[2px] bg-[#b0b0a0] top-1/2 -translate-y-1/2 opacity-30 pointer-events-none"></div>
      <div className="absolute h-full w-[2px] bg-[#b0b0a0] left-1/2 -translate-x-1/2 opacity-30 pointer-events-none"></div>
    </div>
  );
});

// 2. Retro Action Button
const ActionButton = ({ label, color, size = 'md', onClick, icon: Icon, active, holding, onPointerDown, onPointerUp }: any) => {
  const sizeClass = size === 'lg' ? 'w-14 h-14 text-xl' : 'w-12 h-12 text-lg';
  const colorMap: any = {
      red: 'bg-[#dd2222] border-[#990000]',
      yellow: 'bg-[#f0c000] border-[#b08000]',
      blue: 'bg-[#2266dd] border-[#003399]',
      green: 'bg-[#22cc44] border-[#008822]',
      gray: 'bg-[#888888] border-[#555555]'
  };
  const baseColor = colorMap[color] || colorMap.red;
  const isPressed = active || holding;

  return (
    <div className={`${sizeClass} rounded-full relative ${isPressed ? 'translate-y-1' : ''} transition-transform duration-75`}>
        <div className={`absolute inset-0 rounded-full bg-black/40 translate-y-1 ${isPressed ? 'hidden' : ''}`}></div>
        <button
          className={`absolute inset-0 rounded-full ${baseColor} border-b-4 flex items-center justify-center text-white font-pixel shadow-[inset_0_-2px_6px_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.4)] ${isPressed ? 'border-b-0 translate-y-1 brightness-90 shadow-inner' : ''}`}
          onPointerDown={(e) => { 
            e.preventDefault(); 
            if(navigator.vibrate) navigator.vibrate(15);
            if(onPointerDown) onPointerDown(e); 
            else onClick(e); 
          }}
          onPointerUp={(e) => { 
            e.preventDefault(); 
            if(onPointerUp) onPointerUp(e); 
          }}
          onPointerLeave={(e) => { if(onPointerUp) onPointerUp(e); }}
          onContextMenu={(e) => e.preventDefault()}
        >
          {Icon ? <Icon size={size === 'lg' ? 24 : 18} strokeWidth={3} className="drop-shadow-md" /> : <span className="drop-shadow-md">{label}</span>}
          <div className="absolute top-[10%] left-[15%] w-[35%] h-[20%] bg-white/40 rounded-full blur-[1px]"></div>
        </button>
    </div>
  );
};

// 3. Pill Button
const PillButton = ({ label, onClick, holding }: any) => {
    return (
        <div className="flex flex-col items-center gap-1 transform rotate-12">
            <button 
                className={`w-12 h-3 md:w-14 md:h-5 rounded-full border border-[#555] shadow-[0_2px_0_#444] transition-all ${holding ? 'bg-[#555] translate-y-[2px] shadow-none' : 'bg-[#777]'}`}
                onPointerDown={(e) => { 
                    e.preventDefault(); 
                    if(navigator.vibrate) navigator.vibrate(10);
                    onClick(e); 
                }}
            ></button>
            <span className="text-[#57534e] font-bold text-[10px] md:text-[11px] tracking-widest uppercase font-sans whitespace-nowrap">{label}</span>
        </div>
    );
};

// 4. Speaker Grill
const SpeakerGrill = () => (
    <div className="flex gap-1.5 opacity-30 transform -rotate-12">
        <div className="w-1.5 h-10 bg-black rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]"></div>
        <div className="w-1.5 h-10 bg-black rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]"></div>
        <div className="w-1.5 h-10 bg-black rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]"></div>
        <div className="w-1.5 h-10 bg-black rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]"></div>
    </div>
);

const CHAPTER_COLORS: Record<string, string[]> = {
  hydrocarbon: ['#1e293b', '#0f172a'],
  halogen: ['#0f392b', '#022c22'],
  alcohol_phenol: ['#3b0764', '#1e1a4f'],
  aldehyde: ['#431407', '#270a04'],
  acid_ester: ['#450a0a', '#280505'],
  nitrogen: ['#172554', '#0f152e'],
  polymer: ['#1c1917', '#0c0a09'],
  default: ['#0f172a', '#020617']
};

const CHAPTER_TRANS: Record<string, {zh: string, en: string}> = {
  hydrocarbon: { zh: 'CH.1 烃类基础', en: 'CH.1 Hydrocarbons' },
  halogen: { zh: 'CH.2 卤代烃', en: 'CH.2 Halogens' },
  alcohol_phenol: { zh: 'CH.3 醇与酚', en: 'CH.3 Alcohols & Phenols' },
  aldehyde: { zh: 'CH.4 醛与酮', en: 'CH.4 Aldehydes & Ketones' },
  acid_ester: { zh: 'CH.5 酸与酯', en: 'CH.5 Acids & Esters' },
  nitrogen: { zh: 'CH.6 含氮化合物', en: 'CH.6 Nitrogen Comp.' },
  polymer: { zh: 'CH.7 高分子与合成', en: 'CH.7 Polymers' },
  default: { zh: '综合', en: 'General' }
};

const getChapterName = (id: string, lang: Language) => {
  return CHAPTER_TRANS[id] ? CHAPTER_TRANS[id][lang] : id;
};

// --- Main App ---

const App = () => {
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [menuPage, setMenuPage] = useState<MenuPage>('MAIN');
  const [menuIndex, setMenuIndex] = useState(0);
  const [isLandscape, setIsLandscape] = useState(false);
  const [isWin, setIsWin] = useState(false);
  
  const [grid, setGrid] = useState({ w: 15, h: 20 });
  const gridRef = useRef({ w: 15, h: 20 });
  
  const [settings, setSettings] = useState<GameSettings>({
    sound: true, music: true, vibration: true, difficulty: 'NORMAL', selectedChapters: [], language: 'zh'
  });
  
  const [dbCompounds, setDbCompounds] = useState<Record<string, Compound>>({ ...COMPOUNDS_CORE });
  const [dbReactions, setDbReactions] = useState<Reaction[]>([ ...REACTIONS_CORE ]);

  const [snake, setSnake] = useState<Point[]>([{ x: 7, y: 15 }]);
  const [direction, setDirection] = useState<Point>({ x: 0, y: -1 }); // 现在是单位向量
  const [nextDir, setNextDir] = useState<Point>({ x: 0, y: -1 });
  const [food, setFood] = useState<FoodItem[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [currentRxn, setCurrentRxn] = useState<Reaction | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>('product');
  const [isBoosting, setIsBoosting] = useState(false);
  
  const [shake, setShake] = useState(0);
  const [flash, setFlash] = useState<{color: string, opacity: number} | null>(null);

  const floatsRef = useRef<FloatText[]>([]);
  const particlesRef = useRef<Particle[]>([]);

  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  
  const questionStartTimeRef = useRef<number>(0);
  const [tempImportText, setTempImportText] = useState('');
  const [importFileName, setImportFileName] = useState('');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const menuListRef = useRef<HTMLDivElement>(null); 
  const reportScrollRef = useRef<HTMLDivElement>(null);

  const reqRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  
  const lastInputTime = useRef<number>(0);
  const lastRepeatTime = useRef<number>(0);
  const stickInput = useRef({ x: 0, y: 0 }); 
  
  // 新增：记录上一次震动时的方向角度，用于实现摇杆转动时的齿轮感
  const lastDirAngle = useRef<number>(0);

  const availableChapters = useMemo(() => {
      const caps = Array.from(new Set([...dbReactions].map(r => r.chapter)));
      return caps.sort((a, b) => {
          const idxA = CHAPTER_ORDER.indexOf(a);
          const idxB = CHAPTER_ORDER.indexOf(b);
          if (idxA === -1) return 1; 
          if (idxB === -1) return -1;
          return idxA - idxB;
      });
  }, [dbReactions]);

  const stateRef = useRef({ 
      snake, direction, nextDir, food, gameState, settings, score, combo, maxCombo, 
      currentRxn, gameMode, history, grid: gridRef.current,
      menuPage, menuIndex, availableChapters 
  });

  const getComp = useCallback((id: string, lang: Language) => {
    const c = dbCompounds[id];
    if (!c) return { name: id, formula: id };
    const loc = lang === 'zh' ? c.zh : c.en;
    return { name: loc.name, formula: c.formula };
  }, [dbCompounds]);

  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  useEffect(() => {
    Object.entries(AUDIO_PATHS).forEach(([key, path]) => {
      const audio = new Audio(path);
      audio.preload = 'auto';
      if (key === 'bgm') audio.loop = true;
      audioRefs.current[key] = audio;
    });

    const checkOrientation = () => setIsLandscape(window.innerWidth > window.innerHeight);
    checkOrientation();
    window.addEventListener('resize', checkOrientation);

    const handleVisibilityChange = () => {
        if (document.hidden) {
            const bgm = audioRefs.current.bgm;
            if (bgm) bgm.pause();
            if (stateRef.current.gameState === 'PLAYING') {
                setGameState('PAUSED');
            }
        } else {
            if (stateRef.current.gameState === 'PLAYING' && stateRef.current.settings.music) {
                const bgm = audioRefs.current.bgm;
                if (bgm) bgm.play().catch(()=>{});
            }
        }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
        window.removeEventListener('resize', checkOrientation);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (gameState === 'MENU' && menuListRef.current) {
        let childIndex = menuIndex;
        if (menuPage === 'CHAPTERS') childIndex += 1; 
        if (menuListRef.current.children && menuListRef.current.children[childIndex]) {
            const child = menuListRef.current.children[childIndex] as HTMLElement;
            // 增加安全检查，防止 child 不存在时报错
            if (child && child.scrollIntoView) {
                child.scrollIntoView({ block: 'nearest', behavior: 'auto' });
            }
        }
    }
  }, [menuIndex, menuPage, gameState]);

  useEffect(() => {
      const handleResize = () => {
          if (!canvasContainerRef.current) return;
          const rect = canvasContainerRef.current.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) return;

          const minDim = Math.min(rect.width, rect.height);
          const targetDensity = 17; 
          const rawCellSize = minDim / targetDensity;
          const cellSize = Math.max(Math.floor(rawCellSize), 12); 

          const w = Math.floor(rect.width / cellSize);
          const h = Math.floor(rect.height / cellSize);
          
          if (w !== gridRef.current.w || h !== gridRef.current.h) {
              gridRef.current = { w, h };
              setGrid({ w, h });
              if (canvasRef.current) {
                const dpr = window.devicePixelRatio || 1;
                canvasRef.current.width = rect.width * dpr;
                canvasRef.current.height = rect.height * dpr;
              }
          }
      };
      handleResize();
      const observer = new ResizeObserver(() => handleResize());
      if (canvasContainerRef.current) observer.observe(canvasContainerRef.current);
      return () => observer.disconnect();
  }, []);

  // 修复：每次状态切换时重置摇杆输入计时器
  useEffect(() => {
      lastInputTime.current = 0;
      lastRepeatTime.current = 0;
  }, [gameState]);

  useEffect(() => {
    const bgm = audioRefs.current.bgm;
    if (bgm) {
      if (gameState === 'PLAYING' && settings.music) {
         bgm.play().catch(() => {});
         bgm.volume = 0.5;
      } else {
         bgm.pause();
      }
    }
  }, [gameState, settings.music]);

  useEffect(() => {
    stateRef.current = { 
        snake, direction, nextDir, food, gameState, settings, score, combo, maxCombo, 
        currentRxn, gameMode, history, grid: gridRef.current,
        menuPage, menuIndex, availableChapters
    };
  }, [snake, direction, nextDir, food, gameState, settings, score, combo, maxCombo, currentRxn, gameMode, history, grid, menuPage, menuIndex, availableChapters]);

  useEffect(() => {
    let interval: number;
    if (isBoosting && gameState === 'PLAYING' && settings.vibration) {
      interval = window.setInterval(() => {
         // 修改：调用增强后的 vibrate 函数，而不是直接调用 navigator.vibrate
         // 这样手柄在加速时也会有持续的微震动
         vibrate(15); 
      }, 80);
    }
    return () => clearInterval(interval);
  }, [isBoosting, gameState, settings.vibration]);

  useEffect(() => {
     if (shake > 0) {
         const timer = requestAnimationFrame(() => setShake(s => Math.max(0, s - 1)));
         return () => cancelAnimationFrame(timer);
     }
  }, [shake]);

  useEffect(() => {
     if (flash && flash.opacity > 0) {
         const timer = requestAnimationFrame(() => setFlash(f => f ? {...f, opacity: Math.max(0, f.opacity - 0.05)} : null));
         return () => cancelAnimationFrame(timer);
     }
  }, [flash]);

  const vibrate = (pattern: number | number[]) => {
    if (!settings.vibration) return;

    // 1. 移动端/浏览器原生震动
    if (navigator.vibrate) navigator.vibrate(pattern);

    // 2. 手柄震动 (Xbox/PS Dual-Rumble)
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const gp of gamepads) {
        if (gp && (gp as any).vibrationActuator) {
            const duration = Array.isArray(pattern) ? pattern.reduce((a, b) => a + b, 0) : pattern;
            const first = Array.isArray(pattern) ? pattern[0] : pattern;
            
            // 震动强度映射逻辑 (Rich Vibration Mapping)
            let weak = 0, strong = 0;
            if (first <= 20) { 
                weak = 0.2; strong = 0.0; // 轻微: 菜单移动/加速引擎声
            } else if (first <= 50) { 
                weak = 0.5; strong = 0.1; // 中等: 确认/普通操作
            } else if (first <= 100) { 
                weak = 0.7; strong = 0.3; // 较强: 吃到食物
            } else { 
                weak = 1.0; strong = 1.0; // 剧烈: 撞墙/游戏结束
            }

            (gp as any).vibrationActuator.playEffect('dual-rumble', {
                startDelay: 0,
                duration: duration,
                weakMagnitude: weak,
                strongMagnitude: strong
            }).catch(() => {}); // 忽略不支持或未激活的错误
        }
    }
  };
  
  const play = (key: keyof typeof AUDIO_PATHS) => {
    if (!settings.sound && key !== 'bgm') return;
    const audio = audioRefs.current[key];
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
  };

  const spawnParticles = (x: number, y: number, color: string, count: number) => {
      for(let i=0; i<count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 0.5 + 0.2;
          particlesRef.current.push({
              id: Math.random(),
              x: x,
              y: y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              color: color,
              life: 30 + Math.random() * 20,
              size: Math.random() * 0.4 + 0.2
          });
      }
  };

  const getFilteredReactions = useCallback(() => {
    const all = dbReactions;
    if (settings.selectedChapters.length === 0) return all;
    return all.filter(r => settings.selectedChapters.includes(r.chapter));
  }, [dbReactions, settings.selectedChapters]);

  const findSafeSpot = (excludeSnake: Point[], excludeFood: Point[]) => {
     const { w, h } = gridRef.current;
     if (w <= 0 || h <= 0) return null; 
     let attempts = 0;
     const pad = 2; 
     while (attempts < 200) {
        // 保持食物在网格中心，方便对齐，但蛇可以自由移动
        const x = Math.floor(Math.random() * (w - 2 * pad)) + pad + 0.5;
        const y = Math.floor(Math.random() * (h - 2 * pad)) + pad + 0.5;
        // 增加碰撞判定半径
        const onSnake = excludeSnake.some(s => Math.hypot(s.x - x, s.y - y) < 2.0);
        const onFood = excludeFood.some(f => Math.hypot(f.x - x, f.y - y) < 2.0);
        if (!onSnake && !onFood) return { x, y };
        attempts++;
     }
     return null;
  };

  const nextQuestion = (pool = getFilteredReactions()) => {
    if (!pool || pool.length === 0) {
        pool = dbReactions;
        if (!pool || pool.length === 0) return; 
    }

    // 章节通关判定逻辑
    if (settings.selectedChapters.length > 0) {
       // 找出已经回答正确的题目签名
       const solvedSigs = new Set(history.filter(h => h.correct).map(h => h.question + '_' + h.type));
       
       // 筛选出剩余的题目
       const remaining = pool.filter(r => {
           // 构建与 history 兼容的签名
           const formula = getComp(r.from, settings.language).formula;
           return !solvedSigs.has(formula + '_' + r.type);
       });

       // 如果没有剩余题目，则胜利
       if (remaining.length === 0) {
           handleGameOver(true);
           return;
       }
       pool = remaining;
    }

    let rxn = pool[Math.floor(Math.random() * pool.length)];
    let attempts = 0;
    if (stateRef.current.currentRxn && pool.length > 1) {
       while(rxn === stateRef.current.currentRxn && attempts < 20) {
           rxn = pool[Math.floor(Math.random() * pool.length)];
           attempts++;
       }
    }
    setCurrentRxn(rxn);
    stateRef.current.currentRxn = rxn;

    const mode: GameMode = Math.random() < 0.5 ? 'product' : 'cond';
    setGameMode(mode);
    const correctVal = mode === 'product' ? rxn.to : rxn.cond.zh;
    const diff = stateRef.current.settings.difficulty;
    const { options: targetCount } = DIFFICULTY_CONFIG[diff];
    const opts = [correctVal];
    const allCompounds = Object.keys(dbCompounds).filter(k => k !== rxn.from && k !== rxn.to);
    const allConds = [...new Set(dbReactions.map(r => r.cond.zh))].filter(c => c !== correctVal);
    const distPool = mode === 'product' ? allCompounds : allConds;

    let optAttempts = 0;
    while (opts.length < targetCount && distPool.length > 0 && optAttempts < 50) {
      const rand = distPool[Math.floor(Math.random() * distPool.length)];
      if (!opts.includes(rand)) opts.push(rand);
      optAttempts++;
    }
    const newFood: FoodItem[] = [];
    opts.forEach((val, i) => {
      const pos = findSafeSpot(stateRef.current.snake, newFood);
      if (pos) newFood.push({ id: Date.now() + i, ...pos, val, isCorrect: val === correctVal, kind: mode });
    });
    setFood(newFood);
    stateRef.current.food = newFood;
    questionStartTimeRef.current = Date.now();
  };

  const spawnDistractors = (count: number) => {
    const rxn = stateRef.current.currentRxn;
    if (!rxn) return;
    const mode = stateRef.current.gameMode;
    const allCompounds = Object.keys(dbCompounds).filter(k => k !== rxn.from && k !== rxn.to);
    const correctVal = mode === 'product' ? rxn.to : rxn.cond.zh;
    const allConds = [...new Set(dbReactions.map(r => r.cond.zh))].filter(c => c !== correctVal);
    const distPool = mode === 'product' ? allCompounds : allConds;

    setFood(prev => {
        const nextFood = [...prev];
        let attempts = 0;
        for (let i = 0; i < count; i++) {
             if (attempts > 50) break;
             const val = distPool[Math.floor(Math.random() * distPool.length)];
             const pos = findSafeSpot(stateRef.current.snake, nextFood); 
             if (pos) {
                 nextFood.push({ id: Date.now() + i, ...pos, val, isCorrect: false, kind: mode });
             } else {
                 attempts++;
                 i--; 
             }
        }
        return nextFood;
    });
  };

  const initGame = useCallback(() => {
    if (reqRef.current) cancelAnimationFrame(reqRef.current);
    const pool = getFilteredReactions();
    if (pool.length === 0) { alert(getLocalizedUI('ALERT_NO_Q', settings.language)); return; }
    const { w, h } = gridRef.current;
    if (w <= 0 || h <= 0) return;
    const startX = Math.floor(w / 2) + 0.5;
    const startY = Math.floor(h / 2) + 2.5;
    // 初始化蛇身体，浮点坐标
    const initialSnake = [{ x: startX, y: startY }, { x: startX, y: startY + 1 }, { x: startX, y: startY + 2 }];
    stateRef.current = {
        snake: initialSnake,
        direction: { x: 0, y: -1 },
        nextDir: { x: 0, y: -1 },
        food: [],
        gameState: 'PLAYING',
        settings: settings,
        score: 0,
        combo: 0,
        maxCombo: 0,
        currentRxn: null,
        gameMode: 'product',
        history: [],
        grid: gridRef.current,
        menuPage: 'MAIN',
        menuIndex: 0,
        availableChapters: availableChapters
    };
    lastTimeRef.current = performance.now();
    lastDirAngle.current = Math.atan2(-1, 0); // 重置角度
    setSnake(initialSnake);
    setDirection({ x: 0, y: -1 });
    setNextDir({ x: 0, y: -1 });
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setIsWin(false); // 重置胜利状态
    floatsRef.current = []; 
    particlesRef.current = []; 
    setHistory([]);
    setGameState('PLAYING'); 
    nextQuestion(pool);
    play('select');
    
    // 修复1：启动时立即震动，消除延迟感
    // 使用 setTimeout 确保在 UI 渲染帧之后触发，解决部分设备因主线程繁忙导致的震动丢失
    setTimeout(() => {
        if (settings.vibration && navigator.vibrate) navigator.vibrate([50, 30, 50]);
    }, 10);
    
    reqRef.current = requestAnimationFrame(gameLoop);
  }, [settings.selectedChapters, dbReactions, settings.language, getFilteredReactions, settings.vibration, settings.sound]);

  // Game Loop
  const gameLoop = (time: number) => {
    // 增加全局 try-catch 防止循环崩溃
    try {
        const delta = time - lastTimeRef.current;
        lastTimeRef.current = time;

        const state = stateRef.current; 

        // --- 滚动修复：学习报告滚动逻辑 ---
        if (state.gameState === 'REPORT') {
            const { y } = stickInput.current;
            if (Math.abs(y) > 0.3 && reportScrollRef.current) {
                reportScrollRef.current.scrollTop += y * 18; 
            }
        }

        // --- 菜单控制逻辑 (摇杆) ---
        if (state.gameState === 'MENU') {
            const { y } = stickInput.current;
            // 降低阈值，提高响应灵敏度
            if (Math.abs(y) > 0.4) { 
                const now = Date.now();
                const startDelay = 400; 
                const repeatRate = 180; 

                if (lastInputTime.current === 0) {
                    lastInputTime.current = now;
                    lastRepeatTime.current = now;
                    triggerMenuMove(y > 0 ? 1 : -1);
                } else {
                    const elapsedSinceStart = now - lastInputTime.current;
                    const elapsedSinceLastRepeat = now - lastRepeatTime.current;
                    if (elapsedSinceStart >= startDelay && elapsedSinceLastRepeat >= repeatRate) {
                        lastRepeatTime.current = now;
                        triggerMenuMove(y > 0 ? 1 : -1);
                    }
                }
            } else {
                lastInputTime.current = 0;
                lastRepeatTime.current = 0;
            }
        }
        
        // --- PLAYING LOGIC (万向平滑移动) ---
        if (state.gameState === 'PLAYING') {
            const config = DIFFICULTY_CONFIG[state.settings.difficulty];
            // 速度计算：基准速度 * (加速 ? 2 : 1) * delta时间(秒)
            let moveSpeed = config.speed * (isBoosting ? 2.5 : 1.0) * (delta / 1000);
            
            if (isBoosting && time % 150 < 20) play('boost');

            // 1. 更新方向 (如果有输入，平滑转向或直接转向)
            // 简单实现：直接采用摇杆方向作为目标方向，如果摇杆归零则保持当前方向
            if (Math.abs(state.nextDir.x) > 0.1 || Math.abs(state.nextDir.y) > 0.1) {
                // 归一化输入向量
                const len = Math.sqrt(state.nextDir.x**2 + state.nextDir.y**2);
                if (len > 0.1) {
                    const ndx = state.nextDir.x / len;
                    const ndy = state.nextDir.y / len;
                    setDirection({ x: ndx, y: ndy });

                    // 修复3：摇杆方向变化时的震动反馈 (齿轮感)
                    if (state.settings.vibration && navigator.vibrate) {
                        const currentAngle = Math.atan2(ndy, ndx);
                        let angleDiff = Math.abs(currentAngle - lastDirAngle.current);
                        // 处理角度跨越 PI/-PI 的情况
                        if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
                        
                        // 调整为0.5弧度 (~28度)，震动时间加到15ms，更带感
                        if (angleDiff > 0.5) {
                            navigator.vibrate(15); 
                            lastDirAngle.current = currentAngle;
                        }
                    }
                }
            }

            // 2. 移动蛇头
            const head = state.snake[0];
            let newX = head.x + state.direction.x * moveSpeed;
            let newY = head.y + state.direction.y * moveSpeed;

            // 边界处理 (穿墙)
            if (newX < 0) newX += state.grid.w;
            if (newX >= state.grid.w) newX -= state.grid.w;
            if (newY < 0) newY += state.grid.h;
            if (newY >= state.grid.h) newY -= state.grid.h;

            const newHead = { x: newX, y: newY };
            const newSnake = [newHead];

            // 3. 拖动身体 (Rope Logic)
            // 每个节点根据距离被前一个节点“拉”着走，保持间距 ~1.0
            const segmentDist = 1.0; 
            for (let i = 1; i < state.snake.length; i++) {
                let curr = state.snake[i];
                const prev = newSnake[i-1];

                // 计算考虑穿墙的最短向量
                let dx = prev.x - curr.x;
                let dy = prev.y - curr.y;

                // 修正穿墙后的距离计算
                if (dx > state.grid.w / 2) dx -= state.grid.w;
                else if (dx < -state.grid.w / 2) dx += state.grid.w;
                if (dy > state.grid.h / 2) dy -= state.grid.h;
                else if (dy < -state.grid.h / 2) dy += state.grid.h;

                const dist = Math.sqrt(dx*dx + dy*dy);
                
                if (dist > segmentDist) {
                    // 如果距离过大，拉近
                    const ratio = (dist - segmentDist) / dist;
                    let moveX = dx * ratio;
                    let moveY = dy * ratio;
                    
                    let nextX = curr.x + moveX;
                    let nextY = curr.y + moveY;

                    // 边界规范化
                    if (nextX < 0) nextX += state.grid.w;
                    if (nextX >= state.grid.w) nextX -= state.grid.w;
                    if (nextY < 0) nextY += state.grid.h;
                    if (nextY >= state.grid.h) nextY -= state.grid.h;
                    
                    newSnake.push({ x: nextX, y: nextY });
                } else {
                    newSnake.push(curr);
                }
            }

            // 4. 自身碰撞 (忽略头部附近几节)
            let hitSelf = false;
            // 只有当蛇移动了一定距离才检测，防止静止时抖动误判，这里简化为一直检测但忽略前5节
            for (let i = 5; i < newSnake.length; i++) {
                // 简单的距离碰撞
                let dx = Math.abs(newHead.x - newSnake[i].x);
                let dy = Math.abs(newHead.y - newSnake[i].y);
                if (dx > state.grid.w / 2) dx = state.grid.w - dx;
                if (dy > state.grid.h / 2) dy = state.grid.h - dy;
                
                if (dx*dx + dy*dy < 0.25) { // 0.5 * 0.5 距离过近
                    hitSelf = true;
                    break;
                }
            }

            if (hitSelf) {
                handleGameOver();
            } else {
                // 5. 食物碰撞 (基于距离)
                // 只要“碰到”就算吃到，范围设大一点 (1.2)
                const eatRadius = 1.2;
                let ateIdx = -1;
                
                for(let i=0; i<state.food.length; i++) {
                    let f = state.food[i];
                    let dx = Math.abs(newHead.x - f.x);
                    let dy = Math.abs(newHead.y - f.y);
                    // 同样需要处理穿墙距离
                    if (dx > state.grid.w/2) dx = state.grid.w - dx;
                    if (dy > state.grid.h/2) dy = state.grid.h - dy;

                    if (dx*dx + dy*dy < eatRadius * eatRadius) {
                        ateIdx = i;
                        break;
                    }
                }

                if (ateIdx !== -1) {
                const foodItem = state.food[ateIdx];
                const rxn = state.currentRxn;
                const mode = state.gameMode;
                
                if (rxn) {
                    const correctRaw = mode === 'product' ? rxn.to : (state.settings.language === 'zh' ? rxn.cond.zh : rxn.cond.en);
                    const expectedStr = mode === 'product' ? getComp(correctRaw, state.settings.language).formula : correctRaw;
                    const duration = Date.now() - questionStartTimeRef.current;
                    const record: HistoryRecord = {
                    id: Date.now(),
                    timestamp: Date.now(),
                    question: `${getComp(rxn.from, settings.language).formula}`,
                    answer: foodItem.kind === 'product' ? getComp(foodItem.val, settings.language).formula : foodItem.val,
                    expected: expectedStr,
                    correct: foodItem.isCorrect,
                    chapter: rxn.chapter,
                    type: rxn.type,
                    duration: duration
                    };
                    setHistory(prev => [...prev, record]);

                    if (foodItem.isCorrect) {
                    play('eat');
                    vibrate([80, 50, 80]); 
                    spawnParticles(foodItem.x, foodItem.y, '#fbbf24', 12);
                    setShake(5); 
                    setFlash({color: '#22c55e', opacity: 0.2});
                    const gain = 10 + state.combo * 2;
                    setScore(s => s + gain);
                    setCombo(c => {
                        const next = c + 1;
                        setMaxCombo(m => Math.max(m, next));
                        return next;
                    });
                    floatsRef.current.push(
                        { id: Date.now(), x: foodItem.x, y: foodItem.y, text: `+${gain}`, color: '#fbbf24', life: 60, fontSize: 16 },
                        { id: Date.now() + 1, x: foodItem.x, y: foodItem.y - 1, text: settings.language === 'zh' ? (RXN_TYPES[rxn.type]?.zh || rxn.type) : (RXN_TYPES[rxn.type]?.en || rxn.type), color: '#22d3ee', life: 80, fontSize: 12 }
                    );
                    nextQuestion(getFilteredReactions());
                    // 吃到正确食物增加一节
                    const tail = newSnake[newSnake.length-1];
                    newSnake.push({...tail});
                    } else {
                    play('wrong');
                    vibrate([400]); 
                    spawnParticles(foodItem.x, foodItem.y, '#ef4444', 16);
                    setShake(20); 
                    setFlash({color: '#ef4444', opacity: 0.4});
                    setCombo(0);
                    setScore(s => s - 5); 
                    
                    // 修正：难度调整，错误只减少一节，避免惩罚过重
                    newSnake.pop(); 

                    if (newSnake.length === 0) { 
                        handleGameOver();
                        return;
                    }
                    
                    floatsRef.current.push(
                        { id: Date.now(), x: foodItem.x, y: foodItem.y, text: '-5', color: '#ef4444', life: 40, fontSize: 20 },
                        { id: Date.now()+1, x: foodItem.x, y: foodItem.y - 1, text: settings.language === 'zh' ? '错误' : 'WRONG', color: '#ef4444', life: 40, fontSize: 14 }
                    );
                    const nextFood = [...state.food];
                    nextFood.splice(ateIdx, 1);
                    setFood(nextFood);
                    const { penalty } = DIFFICULTY_CONFIG[state.settings.difficulty];
                    spawnDistractors(penalty);
                    }
                }
            }
            setSnake(newSnake);
            stateRef.current.snake = newSnake;
            }
        }
        
        draw();
    } catch (e) {
        console.error("Game Loop Error (Recovered):", e);
    }
    reqRef.current = requestAnimationFrame(gameLoop);
  };

  function triggerMenuMove(yDir: number) {
        play('move');
        let max = 5;
        if (stateRef.current.menuPage === 'CHAPTERS') max = stateRef.current.availableChapters.length + 1; 
        if (stateRef.current.menuPage === 'DIFFICULTY') max = 4;
        if (stateRef.current.menuPage === 'SETTINGS') max = 4;
        setMenuIndex(i => (i + yDir + max) % max);
        // 修复2补充：菜单摇杆导航也应遵循震动设置
        if(stateRef.current.settings.vibration && navigator.vibrate) navigator.vibrate(10);
  }

  const handleGameOver = (win: boolean = false) => {
    play(win ? 'hint' : 'die');
    vibrate(win ? [100, 50, 100, 50, 100] : [500, 100, 500, 100, 1000]); 
    setIsWin(win);
    setGameState('GAMEOVER');
    setShake(win ? 10 : 30);
    setFlash({color: win ? '#22c55e' : '#ef4444', opacity: 0.6});
    if (score > highScore) setHighScore(score);
  };

  const analysis = useMemo(() => {
    if (history.length === 0) return null;
    const typeStats: Record<string, { total: number; correct: number; time: number }> = {};
    let totalTimeCorrect = 0;
    let correctCount = 0;
    let totalTimeIncorrect = 0;
    let incorrectCount = 0;

    history.forEach(h => {
        if (!typeStats[h.type]) typeStats[h.type] = { total: 0, correct: 0, time: 0 };
        typeStats[h.type].total += 1;
        typeStats[h.type].time += h.duration;
        if (h.correct) {
            typeStats[h.type].correct += 1;
            totalTimeCorrect += h.duration;
            correctCount++;
        } else {
            totalTimeIncorrect += h.duration;
            incorrectCount++;
        }
    });

    const sortedTypes = Object.entries(typeStats).sort((a, b) => b[1].total - a[1].total);
    return {
        typeStats: sortedTypes,
        avgTimeCorrect: correctCount ? Math.round(totalTimeCorrect / correctCount / 1000 * 10) / 10 : 0,
        avgTimeIncorrect: incorrectCount ? Math.round(totalTimeIncorrect / incorrectCount / 1000 * 10) / 10 : 0,
        mostFrequent: sortedTypes.length > 0 ? sortedTypes[0][0] : ''
    };
  }, [history]);

  const generateReportText = () => {
      const correctCount = history.filter(h => h.correct).length;
      const accuracy = history.length > 0 ? Math.round((correctCount / history.length) * 100) : 0;
      let report = `CHEM-SNAKE REPORT CARD\nPlayer: ${studentName || 'Student'} (${studentId || 'N/A'})\nScore: ${score}\nMax Combo: ${maxCombo}\nAccuracy: ${accuracy}%`;

      if (analysis) {
        report += `\n\n[Analysis]\nAvg Time (OK): ${analysis.avgTimeCorrect}s\nAvg Time (X): ${analysis.avgTimeIncorrect}s\nMost Freq: ${analysis.mostFrequent}`;
        report += `\n\n[Type Stats]`;
        analysis.typeStats.forEach(([type, stats]) => {
           report += `\n${type}: ${stats.correct}/${stats.total} (${Math.round(stats.correct/stats.total*100)}%)`;
        });
      }

      report += `\n\n[History]\n${history.map((h, i) => `${i+1}. [${h.correct ? 'OK' : 'X'}] ${h.question} -> ${h.answer} ${!h.correct ? `(Exp: ${h.expected})` : ''} (${(h.duration/1000).toFixed(1)}s)`).join('\n')}`;
      return report;
  };

  const sendReport = () => {
    if (!studentName || !studentId) {
      alert(getLocalizedUI('ALERT_ENTER_INFO', settings.language));
      return;
    }
    const body = generateReportText();
    window.location.href = `mailto:?subject=${encodeURIComponent("ChemSnake Report")}&body=${encodeURIComponent(body)}`;
  };

  const fallbackCopyTextToClipboard = (text: string) => {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        const successful = document.execCommand('copy');
        if (successful) alert(getLocalizedUI('ALERT_COPIED', settings.language));
        else alert(getLocalizedUI('ALERT_COPY_FAIL', settings.language));
      } catch (err) {
        alert(getLocalizedUI('ALERT_COPY_FAIL', settings.language));
      }
      document.body.removeChild(textArea);
  }

  const copyReport = () => {
      if (!studentName || !studentId) {
        alert(getLocalizedUI('ALERT_ENTER_INFO', settings.language));
        return;
      }
      const body = generateReportText();
      if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(body)
            .then(() => alert(getLocalizedUI('ALERT_COPIED', settings.language)))
            .catch(err => fallbackCopyTextToClipboard(body));
      } else {
          fallbackCopyTextToClipboard(body);
      }
  };

  // 修复：添加 gameState 和 settings 到依赖数组，确保游戏循环在状态改变时重新绑定，防止闭包陈旧导致的逻辑失效
  useEffect(() => {
    reqRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(reqRef.current!);
  }, [isBoosting, gameState, settings]);

  const getHudFontSize = (text: string) => {
     if (!text) return 'text-xl';
     if (text.length > 12) return 'text-xs md:text-sm'; 
     if (text.length > 8) return 'text-sm md:text-base';
     return 'text-xl';
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (!stateRef.current.snake || stateRef.current.snake.length === 0) return;
    const { w: gridW, h: gridH } = stateRef.current.grid;
    const dpr = window.devicePixelRatio || 1;
    const maxCellW = canvas.width / gridW;
    const maxCellH = canvas.height / gridH;
    const cellSize = Math.floor(Math.min(maxCellW, maxCellH));
    const gridPixelW = cellSize * gridW;
    const gridPixelH = cellSize * gridH;
    const offsetX = Math.floor((canvas.width - gridPixelW) / 2);
    const offsetY = Math.floor((canvas.height - gridPixelH) / 2);
    const chapter = stateRef.current.currentRxn?.chapter || 'default';
    const bgColors = CHAPTER_COLORS[chapter] || CHAPTER_COLORS.default;
    
    // 背景
    ctx.fillStyle = '#020402'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const bgGrad = ctx.createLinearGradient(offsetX, offsetY, offsetX, offsetY + gridPixelH);
    bgGrad.addColorStop(0, bgColors[0]);
    bgGrad.addColorStop(1, bgColors[1]);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(offsetX, offsetY, gridPixelW, gridPixelH);
    
    // 网格线
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'; 
    ctx.lineWidth = 1;
    for (let x = 0; x <= gridW; x++) { 
        ctx.beginPath(); ctx.moveTo(offsetX + x * cellSize, offsetY); ctx.lineTo(offsetX + x * cellSize, offsetY + gridPixelH); ctx.stroke(); 
    }
    for (let y = 0; y <= gridH; y++) { 
        ctx.beginPath(); ctx.moveTo(offsetX, offsetY + y * cellSize); ctx.lineTo(offsetX + gridPixelW, offsetY + y * cellSize); ctx.stroke(); 
    }
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.strokeRect(offsetX, offsetY, gridPixelW, gridPixelH);

    // 绘制蛇 (浮点坐标支持)
    // 为了平滑效果，我们让方块中心对齐坐标点
    const halfCell = cellSize / 2;
    
    // 先画身体
    for (let i = stateRef.current.snake.length - 1; i >= 0; i--) {
        const s = stateRef.current.snake[i];
        // 坐标修正：s.x 是网格坐标 (0~15)，需要转为像素
        // 浮点坐标，所以绘制时要减去半个格子宽度让其居中
        const x = offsetX + s.x * cellSize - halfCell; 
        const y = offsetY + s.y * cellSize - halfCell;
        
        const grad = ctx.createLinearGradient(x, y, x + cellSize, y + cellSize);
        grad.addColorStop(0, i === 0 ? '#60a5fa' : '#3b82f6');
        grad.addColorStop(1, i === 0 ? '#3b82f6' : '#2563eb');
        
        ctx.fillStyle = grad;
        ctx.shadowColor = i === 0 ? '#60a5fa' : 'transparent';
        ctx.shadowBlur = i === 0 ? 15 : 0;
        
        ctx.beginPath(); 
        // 稍微缩小一点点以显示节段感，或者连在一起更像蛇
        ctx.roundRect(x + 1, y + 1, cellSize - 2, cellSize - 2, 4 * dpr); 
        ctx.fill();

        // 眼睛
        if (i === 0) {
            ctx.fillStyle = '#fff';
            // 根据当前真实方向 direction 绘制眼睛
            const dir = stateRef.current.direction;
            // 简单的眼睛定位逻辑：垂直于运动方向的偏移
            // 向量旋转90度: (x, y) -> (-y, x)
            const eyeOffset = 0.3 * cellSize;
            const centerX = x + halfCell;
            const centerY = y + halfCell;
            
            // 左眼
            const lx = centerX + dir.x * 0.2 * cellSize - dir.y * eyeOffset;
            const ly = centerY + dir.y * 0.2 * cellSize + dir.x * eyeOffset;
            // 右眼
            const rx = centerX + dir.x * 0.2 * cellSize + dir.y * eyeOffset;
            const ry = centerY + dir.y * 0.2 * cellSize - dir.x * eyeOffset;

            ctx.beginPath(); ctx.arc(lx, ly, 2.5 * dpr, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(rx, ry, 2.5 * dpr, 0, Math.PI * 2); ctx.fill();
        }
    }

    // 绘制食物
    const bubbles = stateRef.current.food.map(f => {
      // 食物坐标也减去半个格子居中
      const x = offsetX + f.x * cellSize - halfCell;
      const y = offsetY + f.y * cellSize - halfCell;
      const cx = x + cellSize / 2;
      let label = '';
      let nameLabel = '';
      if (f.kind === 'cond') {
         label = settings.language==='zh'?f.val:dbReactions.find(r=>r.cond.zh===f.val)?.cond.en||f.val;
         nameLabel = ''; 
      } else {
         const c = getComp(f.val, settings.language);
         label = c.formula;
         nameLabel = c.name;
      }
      const isCompact = canvas.width / dpr < 500; 
      const labelFontSize = isCompact ? 11 : 14; 
      const nameFontSize = isCompact ? 8 : 10;  
      ctx.font = `900 ${labelFontSize * dpr}px "VT323", monospace`; 
      const labelMetrics = ctx.measureText(label);
      ctx.font = `bold ${nameFontSize * dpr}px "VT323", monospace`; 
      const nameMetrics = ctx.measureText(nameLabel);
      const paddingX = (isCompact ? 3 : 6) * dpr;
      const paddingY = (isCompact ? 2 : 3) * dpr;
      const lineGap = (isCompact ? 1 : 2) * dpr;
      const bubbleW = Math.max(labelMetrics.width, nameMetrics.width) + paddingX * 2;
      const bubbleH = (labelFontSize * dpr) + (nameLabel ? (nameFontSize * dpr) + lineGap : 0) + paddingY * 2;
      let bubbleY = y - bubbleH / 2 - (2 * dpr); 
      if (bubbleY < offsetY + bubbleH/2) bubbleY = y + cellSize + bubbleH/2 + 2*dpr;
      let bubbleX = cx;
      const halfW = bubbleW / 2;
      if (bubbleX - halfW < offsetX) bubbleX = offsetX + halfW;
      if (bubbleX + halfW > offsetX + gridPixelW) bubbleX = offsetX + gridPixelW - halfW;
      return { 
          ...f, pixelX: x, pixelY: y, cellSize, 
          bubbleX, bubbleY, bubbleW, bubbleH, 
          label, nameLabel, labelFontSize, nameFontSize,
          paddingY, lineGap, renderY: bubbleY 
      };
    });

    // 气泡避让算法
    for(let k=0; k<5; k++) {
        for(let i=0; i<bubbles.length; i++) {
            for(let j=i+1; j<bubbles.length; j++) {
                const a = bubbles[i];
                const b = bubbles[j];
                const dx = Math.abs(a.bubbleX - b.bubbleX);
                const dy = Math.abs(a.renderY - b.renderY);
                const minW = (a.bubbleW + b.bubbleW)/2;
                const minH = (a.bubbleH + b.bubbleH)/2;
                if (dx < minW && dy < minH) {
                    const overlapY = minH - dy;
                    const push = overlapY / 2 + 1;
                    if (a.renderY < b.renderY) { a.renderY -= push; b.renderY += push; } 
                    else { a.renderY += push; b.renderY -= push; }
                }
            }
        }
    }

    bubbles.forEach(b => {
      const boxPadding = 3 * dpr;
      const boxSize = b.cellSize - boxPadding;
      const px = b.pixelX; 
      const py = b.pixelY;
      const glowColor = '#fbbf24';
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 10;
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = 2 * dpr;
      ctx.fillStyle = 'rgba(251, 191, 36, 0.4)'; 
      ctx.beginPath();
      // 食物主体
      ctx.roundRect(px + boxPadding/2, py + boxPadding/2, boxSize, boxSize, 6 * dpr);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      const halfW = b.bubbleW / 2;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.5 * dpr;
      ctx.beginPath();
      ctx.roundRect(b.bubbleX - halfW, b.renderY - b.bubbleH/2, b.bubbleW, b.bubbleH, 4 * dpr);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center'; 
      ctx.textBaseline = 'top'; 
      ctx.font = `900 ${b.labelFontSize * dpr}px "VT323", monospace`; 
      let textY = b.renderY - b.bubbleH/2 + b.paddingY;
      ctx.fillText(b.label, b.bubbleX, textY);
      if (b.nameLabel) {
          ctx.font = `bold ${b.nameFontSize * dpr}px "VT323", monospace`; 
          ctx.fillStyle = '#fbbf24'; 
          textY += (b.labelFontSize * dpr) + b.lineGap;
          ctx.fillText(b.nameLabel, b.bubbleX, textY);
      }
    });

    floatsRef.current.forEach(f => {
       const x = offsetX + f.x * cellSize; 
       const y = offsetY + f.y * cellSize;
       const fSize = (f.fontSize || 16) * dpr;
       ctx.font = `bold ${fSize}px "VT323", monospace`;
       ctx.fillStyle = f.color; 
       ctx.strokeStyle = 'black'; ctx.lineWidth = 3;
       ctx.strokeText(f.text, x, y); 
       ctx.fillText(f.text, x, y);
       f.y -= 0.05; 
       f.life -= 1;
    });

    particlesRef.current.forEach(p => {
        const x = offsetX + p.x * cellSize;
        const y = offsetY + p.y * cellSize;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        const pxSize = p.size * cellSize;
        ctx.rect(x, y, pxSize, pxSize);
        ctx.fill();
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 1;
        p.size *= 0.95;
    });
    floatsRef.current = floatsRef.current.filter(f => f.life > 0);
    particlesRef.current = particlesRef.current.filter(p => p.life > 0 && p.size > 0.05);
  };

  const handleStick = useCallback((x: number, y: number) => {
    stickInput.current = { x, y };
    if (stateRef.current.gameState === 'PLAYING') {
       // 万向：直接将摇杆向量存入 nextDir，在 GameLoop 中处理平滑转向
       setNextDir({ x, y });
    }
  }, []);

  const handleAction = (btn: 'A' | 'B' | 'X' | 'Y' | 'START' | 'SELECT' | 'RESET' | 'MENU', fromMenu: boolean = false) => {
    // 修复：如果来自菜单点击，不要重复震动（已经在点击事件中处理了），但保留其他震动源
    if (!fromMenu) vibrate(20); 
    
    if (btn === 'SELECT') {
        const newState = !settings.sound;
        setSettings(prev => ({ ...prev, sound: newState, music: newState }));
        return;
    }
    if (btn === 'RESET') {
        if (gameState === 'PLAYING' || gameState === 'PAUSED' || gameState === 'GAMEOVER') {
             setGameState('RESET_CONFIRM');
        }
        return;
    }
    if (btn === 'MENU') {
        if (gameState === 'PLAYING' || gameState === 'PAUSED') {
            setGameState('QUIT_CONFIRM');
        } else {
            setGameState('MENU');
            setMenuPage('MAIN');
            setMenuIndex(0);
        }
        return;
    }
    if (gameState === 'PLAYING') {
       if (btn === 'START' || btn === 'B') setGameState('PAUSED');
       if (btn === 'X') setSettings(s => ({ ...s, vibration: !s.vibration }));
       return;
    }
    if (gameState === 'PAUSED') {
       if (btn === 'START' || btn === 'A') setGameState('PLAYING');
       if (btn === 'B') setGameState('QUIT_CONFIRM');
       return;
    }
    if (gameState === 'QUIT_CONFIRM') {
        if (btn === 'A') {
            setGameState('MENU');
            setMenuPage('MAIN');
            setMenuIndex(0);
        }
        if (btn === 'B') setGameState('PAUSED');
        return;
    }
    if (gameState === 'RESET_CONFIRM') {
        if (btn === 'A') initGame();
        if (btn === 'B') setGameState('PLAYING');
        return;
    }
    if (gameState === 'GAMEOVER') {
       if (btn === 'A' || btn === 'START') initGame();
       if (btn === 'B') setGameState('REPORT');
       return;
    }
    if (gameState === 'REPORT') {
        if (btn === 'B') {
            // 修复1：强制失焦，解决移动端虚拟键盘或焦点残留导致的输入卡顿
            if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
            }
            // 修复2：重置状态和计时器
            setGameState('MENU');
            setMenuPage('MAIN');
            setMenuIndex(0);
            
            // 关键修复：不要重置 stickInput.current，否则用户如果正按着摇杆，值会被清零导致无法操作直到抬起重按
            // 我们只重置计时器，这样循环中的 "if (Math.abs(y) > 0.4)" 就会立即触发一次（如果用户正按着的话）
            lastInputTime.current = 0;
            lastRepeatTime.current = 0;
            // 修复3：显式归零摇杆输入，防止退出报告时立刻误触菜单
            stickInput.current = { x: 0, y: 0 };
        }
    }
    if (gameState === 'MENU') {
       // 修复：在菜单界面允许使用蓝色按钮(X)切换震动开关
       if (btn === 'X') {
           const newVibe = !settings.vibration;
           setSettings(s => ({ ...s, vibration: newVibe }));
           if (newVibe && navigator.vibrate) navigator.vibrate(50); // 震动反馈
           return;
       }

       if (btn === 'B') {
          if (menuPage !== 'MAIN') { 
              if (menuPage === 'CHAPTERS') setMenuIndex(1);
              else if (menuPage === 'DIFFICULTY') setMenuIndex(2);
              else if (menuPage === 'SETTINGS') setMenuIndex(4);
              else setMenuIndex(0);
              setMenuPage('MAIN'); 
              play('back'); 
          }
          return;
       }
       if (btn === 'A') {
          // 修复：避免双重播放声音
          if (!fromMenu) play('select');
          if (menuPage === 'MAIN') {
             if (menuIndex === 0) initGame();
             if (menuIndex === 1) { setMenuPage('CHAPTERS'); setMenuIndex(0); }
             if (menuIndex === 2) { setMenuPage('DIFFICULTY'); setMenuIndex(0); }
             if (menuIndex === 3) { setGameState('IMPORT_MODAL'); }
             if (menuIndex === 4) { setMenuPage('SETTINGS'); setMenuIndex(0); }
          } else if (menuPage === 'CHAPTERS') {
             if (menuIndex === 0) {
                 setSettings(s => ({ ...s, selectedChapters: [] }));
             } else {
                 const chap = availableChapters[menuIndex - 1];
                 setSettings(s => ({ ...s, selectedChapters: s.selectedChapters.includes(chap) ? s.selectedChapters.filter(c=>c!==chap) : [...s.selectedChapters, chap] }));
             }
          } else if (menuPage === 'DIFFICULTY') {
             const lvls: Difficulty[] = ['EASY', 'NORMAL', 'HARD', 'INSANE'];
             setSettings(s => ({ ...s, difficulty: lvls[menuIndex] }));
          } else if (menuPage === 'SETTINGS') {
             if (menuIndex === 0) setSettings(s => ({ ...s, sound: !s.sound }));
             if (menuIndex === 1) setSettings(s => ({ ...s, music: !s.music }));
             // 修复2：在菜单中开启震动时，立即给予反馈
             if (menuIndex === 2) {
                 const newVibeState = !settings.vibration;
                 setSettings(s => ({ ...s, vibration: newVibeState }));
                 if (newVibeState && navigator.vibrate) {
                     navigator.vibrate(50); // 立即震动以确认开启
                 }
             }
             if (menuIndex === 3) setSettings(s => ({ ...s, language: s.language === 'zh' ? 'en' : 'zh' }));
          }
       }
    }
  };

  const handleMenuClick = (index: number) => {
      setMenuIndex(index);
      
      // 修复：在此处立即触发震动和声音，而不是等待 setTimeout，确保用户交互不被浏览器阻止
      // 同时解决“点按没有反应”的问题，因为 setTimeout 可能会导致用户手势失效
      if (settings.vibration && navigator.vibrate) navigator.vibrate(20);
      play('select');

      // 移除了 setTimeout，直接执行逻辑，提高响应速度
      handleAction('A', true);
  };

  const handleImportText = () => {
    try {
      const data = JSON.parse(tempImportText);
      if (data.compounds && data.reactions) {
          setDbCompounds(data.compounds);
          setDbReactions(data.reactions);
          alert(getLocalizedUI('ALERT_LOADED', settings.language)); 
          setGameState('MENU');
      } else if (Array.isArray(data)) { 
          setDbReactions(data); 
          alert(getLocalizedUI('ALERT_LOADED', settings.language)); 
          setGameState('MENU'); 
      } else {
          alert(getLocalizedUI('ALERT_JSON_ERR', settings.language));
      }
    } catch { alert(getLocalizedUI('ALERT_JSON_ERR', settings.language)); }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const data = JSON.parse(text);
        if (data.compounds && data.reactions) {
            setDbCompounds(data.compounds);
            setDbReactions(data.reactions);
            alert(getLocalizedUI('ALERT_FILE_LOADED', settings.language)); 
            setGameState('MENU');
        } else if (Array.isArray(data)) { 
            setDbReactions(data); 
            alert(getLocalizedUI('ALERT_FILE_LOADED', settings.language)); 
            setGameState('MENU'); 
        } else {
            alert(getLocalizedUI('ALERT_JSON_ERR', settings.language));
        }
      } catch (err) { 
          alert(getLocalizedUI('ALERT_JSON_ERR', settings.language)); 
      }
    };
    reader.readAsText(file);
  };

  // 修改：增加 onFocus 属性，支持触摸即选中
  const MenuItem = ({ active, label, value, icon: Icon, onClick, onFocus }: any) => (
    <div 
        onPointerDown={onFocus} // 触摸按下即更新焦点
        onPointerEnter={(e) => { if(e.pointerType === 'mouse') onFocus(); }} // 鼠标悬停更新焦点
        onClick={onClick}
        className={`flex items-center justify-between p-2 mb-1 rounded font-led uppercase tracking-wider text-base cursor-pointer active:scale-[0.98] transition-all ${active ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}
    >
       <div className="flex items-center gap-2 pointer-events-none">
          {active && <ChevronRight size={14}/>}
          {Icon && <Icon size={14} />}
          <span>{label}</span>
       </div>
       {value && <span className="pointer-events-none">{value}</span>}
    </div>
  );

  const fromComp = currentRxn ? getComp(currentRxn.from, settings.language) : {formula: '?', name: ''};
  const toComp = currentRxn ? getComp(currentRxn.to, settings.language) : {formula: '?', name: ''};
  const condText = gameMode==='product' ? (settings.language==='zh'?currentRxn?.cond.zh:currentRxn?.cond.en) : '???';
  const shakeX = Math.random() * shake - shake/2;
  const shakeY = Math.random() * shake - shake/2;
  const chapterTitle = gameState === 'MENU' 
    ? getLocalizedUI('MENU', settings.language) 
    : (currentRxn ? getChapterName(currentRxn.chapter, settings.language) : '');

  // --- PC & Gamepad Control Hooks ---
  
  // 1. Maintain a ref to the action handler so we can call it from event listeners without stale closures
  const actionRef = useRef(handleAction);
  useEffect(() => { actionRef.current = handleAction; });

  // 2. Keyboard Support
  useEffect(() => {
    const keysPressed = {
      up: false, down: false, left: false, right: false
    };

    const updateStickFromKeys = () => {
        let dx = 0;
        let dy = 0;
        if (keysPressed.up) dy -= 1;
        if (keysPressed.down) dy += 1;
        if (keysPressed.left) dx -= 1;
        if (keysPressed.right) dx += 1;
        
        // Normalize for diagonal movement to match stick feel
        if (dx !== 0 && dy !== 0) {
            const len = Math.sqrt(dx*dx + dy*dy);
            dx /= len;
            dy /= len;
        }
        
        // Only update if keys are pressed, allowing touch/gamepad to take over if keys are released
        if (dx !== 0 || dy !== 0 || (keysPressed.up || keysPressed.down || keysPressed.left || keysPressed.right)) {
             stickInput.current = { x: dx, y: dy };
             // Also update nextDir directly for immediate response in game loop
             if (stateRef.current.gameState === 'PLAYING') {
                 setNextDir({ x: dx, y: dy });
             }
        }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.repeat) return;
        const k = e.key.toLowerCase();
        
        // Movement
        if (['w', 'arrowup'].includes(k)) keysPressed.up = true;
        if (['s', 'arrowdown'].includes(k)) keysPressed.down = true;
        if (['a', 'arrowleft'].includes(k)) keysPressed.left = true;
        if (['d', 'arrowright'].includes(k)) keysPressed.right = true;
        updateStickFromKeys();

        // Actions
        if (['j', 'enter'].includes(k)) actionRef.current('A');
        if (['k', 'escape'].includes(k)) actionRef.current('B');
        if (['u', 'shift'].includes(k)) actionRef.current('X');
        if (['i', ' '].includes(k)) { 
            actionRef.current('Y'); // Trigger
            setIsBoosting(true);    // Hold
        }
        if (['p'].includes(k)) actionRef.current('START');
        if (['o', 'tab'].includes(k)) { e.preventDefault(); actionRef.current('SELECT'); }
        if (['m'].includes(k)) actionRef.current('MENU');
        if (['r'].includes(k)) actionRef.current('RESET');
    };

    const handleKeyUp = (e: KeyboardEvent) => {
        const k = e.key.toLowerCase();
        if (['w', 'arrowup'].includes(k)) keysPressed.up = false;
        if (['s', 'arrowdown'].includes(k)) keysPressed.down = false;
        if (['a', 'arrowleft'].includes(k)) keysPressed.left = false;
        if (['d', 'arrowright'].includes(k)) keysPressed.right = false;
        updateStickFromKeys();

        if (['i', ' '].includes(k)) setIsBoosting(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // 3. Gamepad Support (Xbox Controller Standard Mapping)
  useEffect(() => {
      let rafId: number;
      const prevButtons = new Array(17).fill(false);
      
      const pollGamepad = () => {
          const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
          const gp = gamepads[0]; // Use first controller
          
          if (gp) {
              // Stick (Deadzone check)
              const deadzone = 0.1;
              let lx = gp.axes[0];
              let ly = gp.axes[1];
              if (Math.abs(lx) < deadzone) lx = 0;
              if (Math.abs(ly) < deadzone) ly = 0;
              
              if (Math.abs(lx) > deadzone || Math.abs(ly) > deadzone) {
                  stickInput.current = { x: lx, y: ly };
                  if (stateRef.current.gameState === 'PLAYING') {
                      setNextDir({ x: lx, y: ly });
                  }
              }

              // Buttons (Debounced "Just Pressed" check)
              // Standard mapping: 0:A, 1:B, 2:X, 3:Y, 9:Start, 8:Select
              const checkButton = (index: number, action: 'A'|'B'|'X'|'Y'|'START'|'SELECT') => {
                  const pressed = gp.buttons[index]?.pressed;
                  if (pressed && !prevButtons[index]) {
                      actionRef.current(action);
                  }
                  if (index === 3) setIsBoosting(pressed); // Y is continuous hold
                  prevButtons[index] = pressed;
              };

              checkButton(0, 'A');
              checkButton(1, 'B');
              checkButton(2, 'X');
              checkButton(3, 'Y');
              checkButton(9, 'START');
              checkButton(8, 'SELECT');
          }
          rafId = requestAnimationFrame(pollGamepad);
      };
      
      pollGamepad();
      return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div className={`fixed inset-0 flex flex-col items-center justify-center font-sans select-none overflow-hidden touch-none bg-[#0f380f] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] h-[100dvh]`} style={{touchAction: 'none'}}>
        <FontStyles />
        <div className="absolute inset-0 bg-[radial-gradient(#306230_1px,transparent_1px)] [background-size:20px_20px] opacity-20 pointer-events-none"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.4),transparent,rgba(0,0,0,0.4))] pointer-events-none"></div>
      
      <div className={`relative transition-all duration-300 ${isLandscape ? 'flex flex-row items-center justify-center gap-2 p-2 w-full h-full max-w-7xl' : 'flex flex-col w-full h-full max-w-[480px] md:max-w-3xl p-2'}`}>
        
        {isLandscape && (
           <div className="h-full flex flex-col justify-center items-center gap-12 shrink-0 w-28 relative">
               {/* 删除左侧蓝色装饰线 */}
               <div className="text-slate-700/50 font-black italic tracking-widest text-xs transform -rotate-90 absolute left-2 top-1/2 -translate-y-1/2 whitespace-nowrap shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_1px_0_rgba(0,0,0,0.5)]">
                   MODEL-CJ-01
               </div>
               <AnalogStick onMove={handleStick} active={true} />
               <SpeakerGrill />
           </div>
        )}

        <div className={`relative flex flex-col bg-[#e0e0d1] rounded-t-lg rounded-b-[1.2rem] shadow-[inset_0_2px_5px_rgba(255,255,255,0.4),0_10px_20px_rgba(0,0,0,0.3)] border-2 border-[#b0b0a0] p-1 mx-auto z-10 ${isLandscape ? 'h-full flex-1' : 'w-full flex-1 mb-1 min-h-0'}`}>
            <div className="flex justify-between items-center mb-0.5 px-2 border-b border-[#c0c0b0] pb-0.5">
                <div className="text-[9px] text-[#888] font-bold tracking-widest flex items-center gap-1.5 font-pixel">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 shadow-[0_0_8px_red] animate-pulse"></span>
                    BATTERY
                </div>
                <div className="text-[9px] text-[#aaa] italic hidden sm:block font-pixel">DOT MATRIX</div>
            </div>

            <div className="flex-1 bg-[#0f1510] shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] border-[2px] border-[#333] relative overflow-hidden flex flex-col rounded-sm">
               <div className="bg-[#0f2e15] text-[#4ade80] p-1 border-b border-[#14532d] z-20 shrink-0 min-h-[50px] flex flex-col gap-0.5 shadow-md font-pixel tracking-wide">
                    <div className="flex justify-between items-center text-xs md:text-sm leading-none border-b border-[#14532d]/50 pb-0.5 text-[#22c55e]">
                        <div className="uppercase font-bold flex-1 min-w-0 truncate mr-2">
                            {chapterTitle}
                        </div>
                        <div className="flex gap-3 items-center shrink-0">
                             {settings.sound && <Volume2 size={10} />}
                             {settings.vibration && <Smartphone size={10} />}
                             <span className="text-sm">{score.toString().padStart(5,'0')}</span>
                        </div>
                    </div>

                    {(gameState === 'PLAYING' || gameState === 'PAUSED' || gameState === 'QUIT_CONFIRM' || gameState === 'RESET_CONFIRM') && (
                       <div className="flex items-center justify-between gap-1 flex-1 px-1 h-full relative font-led">
                          <div className="flex-1 flex justify-end min-w-0">
                              <div className="flex flex-col items-center max-w-full">
                                 <div className={`font-bold font-led text-[#4ade80] drop-shadow-[0_0_5px_rgba(74,222,128,0.5)] whitespace-nowrap overflow-visible ${getHudFontSize(fromComp.formula)}`}>
                                    {fromComp.formula}
                                 </div>
                                 <div className="text-[10px] text-[#22c55e] opacity-80 font-bold leading-tight truncate max-w-full">{fromComp.name}</div>
                              </div>
                          </div>
                          <div className="flex flex-col items-center justify-center px-1 mx-2 shrink-0">
                             <div className="text-sm text-center whitespace-nowrap text-[#a3e635] bg-[#0f2e15] border border-[#14532d] px-2 py-0.5 rounded z-10 font-led shadow-lg mb-[1px]">
                                {condText}
                             </div>
                             <div className="w-full h-[2px] bg-[#4ade80] relative mt-0 shadow-[0_0_5px_rgba(74,222,128,0.8)]">
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[4px] border-t-transparent border-l-[6px] border-l-[#4ade80] border-b-[4px] border-b-transparent"></div>
                             </div>
                          </div>
                          <div className="flex-1 flex justify-start min-w-0">
                             <div className="flex flex-col items-center max-w-full">
                                 <div className={`font-bold font-led whitespace-nowrap overflow-visible ${gameMode === 'product' ? 'text-[#4ade80] drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]' : 'text-[#22c55e]'} ${getHudFontSize(gameMode === 'product' ? '???' : toComp.formula)}`}>
                                    {gameMode === 'product' ? '???' : toComp.formula}
                                 </div>
                                 <div className="text-[10px] text-[#22c55e] opacity-80 font-bold leading-tight truncate max-w-full">{gameMode === 'product' ? '???' : toComp.name}</div>
                              </div>
                          </div>
                       </div>
                    )}
               </div>

               <div className="flex-1 relative bg-[#0f1510] min-h-0 w-full h-full overflow-hidden" ref={canvasContainerRef}>
                 <div style={{transform: `translate(${shakeX}px, ${shakeY}px)`}} className="w-full h-full">
                    <canvas ref={canvasRef} className={`w-full h-full block object-contain ${gameState !== 'PLAYING' ? 'opacity-30 blur-sm' : ''}`} />
                 </div>
                 {flash && <div className="absolute inset-0 pointer-events-none z-10" style={{backgroundColor: flash.color, opacity: flash.opacity}}></div>}
                  {gameState === 'PAUSED' && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-30 font-led text-[#4ade80]">
                          <div className="text-4xl font-pixel text-yellow-400 tracking-widest mb-8 animate-pulse">PAUSED</div>
                          <div className="flex flex-col gap-4 text-center">
                              <div className="text-xl">[A] {getLocalizedUI('RESUME', settings.language)}</div>
                              <div className="text-xl text-red-400">[B] {getLocalizedUI('QUIT', settings.language)}</div>
                          </div>
                      </div>
                  )}
                  {gameState === 'QUIT_CONFIRM' && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-40 font-led text-white">
                          <div className="text-2xl font-pixel text-red-500 mb-6 text-center px-4 leading-relaxed tracking-widest">{getLocalizedUI('REALLY_QUIT', settings.language)}</div>
                          <div className="flex flex-col gap-4 text-xl text-center">
                              <div className="text-green-400 animate-pulse">[A] {getLocalizedUI('YES', settings.language)}</div>
                              <div className="text-yellow-400">[B] {getLocalizedUI('NO', settings.language)}</div>
                          </div>
                      </div>
                  )}
                  {gameState === 'RESET_CONFIRM' && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-40 font-led text-white">
                          <div className="text-2xl font-pixel text-yellow-500 mb-6 text-center px-4 leading-relaxed tracking-widest">{getLocalizedUI('CONFIRM_RESET', settings.language)}</div>
                          <div className="flex flex-col gap-4 text-xl text-center">
                              <div className="text-green-400 animate-pulse">[A] {getLocalizedUI('YES', settings.language)}</div>
                              <div className="text-red-400">[B] {getLocalizedUI('NO', settings.language)}</div>
                          </div>
                      </div>
                  )}
                  {gameState === 'MENU' && (
                      <div className="absolute inset-0 flex flex-col p-4 bg-black/85 backdrop-blur-sm z-20 font-led text-[#4ade80]">
                         {menuPage === 'MAIN' && (
                            <>
                                <div className="text-center border-b border-[#14532d] pb-2 mb-2">
                                    <h1 className="text-3xl font-pixel italic tracking-widest text-white mb-2">CHEM<span className="text-red-500">SNAKE</span></h1>
                                </div>
                                <div className="flex-1 overflow-y-auto no-scrollbar space-y-2" ref={menuListRef}>
                                    <MenuItem label={getLocalizedUI('START', settings.language)} active={menuIndex===0} icon={Play} onClick={() => handleMenuClick(0)} onFocus={() => setMenuIndex(0)} />
                                    <MenuItem label={getLocalizedUI('CHAPTERS', settings.language)} active={menuIndex===1} icon={BookOpen} value={settings.selectedChapters.length ? settings.selectedChapters.length : getLocalizedUI('ALL_SHORT', settings.language)} onClick={() => handleMenuClick(1)} onFocus={() => setMenuIndex(1)} />
                                    <MenuItem label={getLocalizedUI('DIFFICULTY_OPT', settings.language)} active={menuIndex===2} icon={BarChart3} value={getLocalizedUI(`DIFF_${settings.difficulty}`, settings.language)} onClick={() => handleMenuClick(2)} onFocus={() => setMenuIndex(2)} />
                                    <MenuItem label={getLocalizedUI('IMPORT', settings.language)} active={menuIndex===3} icon={Upload} onClick={() => handleMenuClick(3)} onFocus={() => setMenuIndex(3)} />
                                    <MenuItem label={getLocalizedUI('SETTINGS', settings.language)} active={menuIndex===4} icon={Settings} onClick={() => handleMenuClick(4)} onFocus={() => setMenuIndex(4)} />
                                </div>
                            </>
                         )}
                         {menuPage !== 'MAIN' && (
                             <>
                                <div className="flex items-center gap-2 border-b border-[#14532d] pb-2 mb-2 text-yellow-400">
                                    <button onClick={() => handleAction('B')} className="text-xs px-2 py-1 bg-slate-800 rounded hover:bg-slate-700">[B] {getLocalizedUI('BACK_CMD', settings.language)}</button>
                                    <span className="flex-1 text-center font-bold tracking-widest">{getLocalizedUI(menuPage, settings.language)}</span>
                                </div>
                                <div className="flex-1 overflow-y-auto no-scrollbar space-y-2" ref={menuListRef}>
                                    {menuPage === 'CHAPTERS' && (
                                        <>
                                          <div className="text-[10px] text-center text-yellow-500/80 mb-1 border-b border-white/10 pb-1">
                                              {settings.selectedChapters.length === 0 
                                                ? (settings.language === 'zh' ? getLocalizedUI('ALL', settings.language) : 'MODE: ALL') 
                                                : (settings.language === 'zh' ? `已选: ${settings.selectedChapters.length} 章` : `SELECTED: ${settings.selectedChapters.length}`)}
                                          </div>
                                          <MenuItem label={getLocalizedUI('ALL', settings.language)} active={menuIndex === 0} value={settings.selectedChapters.length === 0 ? '[x]' : '[ ]'} onClick={() => handleMenuClick(0)} onFocus={() => setMenuIndex(0)} />
                                          {availableChapters.map((chap, i) => (
                                            <MenuItem key={chap} label={getChapterName(chap, settings.language)} active={menuIndex === i + 1} value={settings.selectedChapters.includes(chap) ? '[x]' : '[ ]'} onClick={() => handleMenuClick(i+1)} onFocus={() => setMenuIndex(i+1)} />
                                        ))}
                                        </>
                                    )}
                                    {menuPage === 'DIFFICULTY' && ['EASY', 'NORMAL', 'HARD', 'INSANE'].map((diff, i) => (
                                         <MenuItem key={diff} label={getLocalizedUI(`DIFF_${diff}`, settings.language)} active={menuIndex === i} icon={settings.difficulty === diff ? Check : undefined} onClick={() => handleMenuClick(i)} onFocus={() => setMenuIndex(i)} />
                                    ))}
                                    {menuPage === 'SETTINGS' && (
                                        <>
                                            <MenuItem label={getLocalizedUI('SFX', settings.language)} active={menuIndex===0} icon={settings.sound ? Volume2 : VolumeX} value={settings.sound ? getLocalizedUI('ON', settings.language) : getLocalizedUI('OFF', settings.language)} onClick={() => handleMenuClick(0)} onFocus={() => setMenuIndex(0)} />
                                            <MenuItem label={getLocalizedUI('MUSIC', settings.language)} active={menuIndex===1} icon={settings.music ? Music : Power} value={settings.music ? getLocalizedUI('ON', settings.language) : getLocalizedUI('OFF', settings.language)} onClick={() => handleMenuClick(1)} onFocus={() => setMenuIndex(1)} />
                                            <MenuItem label={getLocalizedUI('VIBE', settings.language)} active={menuIndex===2} icon={settings.vibration ? Smartphone : Waves} value={settings.vibration ? getLocalizedUI('ON', settings.language) : getLocalizedUI('OFF', settings.language)} onClick={() => handleMenuClick(2)} onFocus={() => setMenuIndex(2)} />
                                            <MenuItem label={getLocalizedUI('LANG', settings.language)} active={menuIndex===3} icon={Globe} value={settings.language === 'zh' ? '中文' : 'ENG'} onClick={() => handleMenuClick(3)} onFocus={() => setMenuIndex(3)} />
                                        </>
                                    )}
                                </div>
                             </>
                         )}
                      </div>
                  )}

                  {gameState === 'IMPORT_MODAL' && (
                      <div className="absolute inset-0 bg-[#0f380f] z-50 p-4 flex flex-col font-led text-green-400 text-xl">
                        <div className="text-center text-yellow-400 mb-2 font-pixel text-xs">{getLocalizedUI('DATA_UPLOAD', settings.language)}</div>
                         <div className="bg-slate-800 rounded p-4 mb-2 flex flex-col items-center justify-center border-2 border-dashed border-slate-600 relative">
                            <FileJson size={32} className="text-slate-500 mb-2"/>
                            <span className="text-base text-slate-400">{getLocalizedUI('TAP_UPLOAD', settings.language)}</span>
                            <span className="text-xs text-green-400 mt-1 truncate max-w-full px-2">{importFileName || getLocalizedUI('NO_FILE', settings.language)}</span>
                            <input type="file" accept="*/*" onChange={handleImportFile} className="absolute inset-0 opacity-0" />
                        </div>
                        <textarea className="flex-1 bg-black border border-slate-700 text-green-500 text-lg p-2 resize-none focus:outline-none rounded font-led" value={tempImportText} onChange={e => setTempImportText(e.target.value)} onFocus={(e) => e.target.scrollIntoView({block: 'center'})} placeholder={getLocalizedUI('PASTE_JSON', settings.language)} />
                        <div className="flex gap-2 mt-2">
                            <button onClick={() => setGameState('MENU')} className="flex-1 bg-slate-800 py-2 rounded">{getLocalizedUI('CANCEL', settings.language)}</button>
                            <button onClick={handleImportText} className="flex-1 bg-blue-900 py-2 rounded">{getLocalizedUI('LOAD', settings.language)}</button>
                        </div>
                      </div>
                  )}
                  {gameState === 'GAMEOVER' && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 z-30 text-[#4ade80] font-led">
                        <h2 className={`text-4xl font-pixel tracking-widest mb-4 drop-shadow-[0_2px_0_rgba(255,255,255,0.2)] text-center leading-relaxed ${isWin ? 'text-yellow-400 drop-shadow-[0_0_10px_gold]' : 'text-red-500'}`}>
                            {getLocalizedUI(isWin ? 'COMPLETED' : 'GAMEOVER', settings.language)}
                        </h2>
                        <div className="text-xl opacity-70 mb-1">{getLocalizedUI('SCORE', settings.language)}</div>
                        <div className="text-6xl font-bold mb-8 text-white">{score}</div>
                        <div className="flex gap-4">
                            <button className="px-6 py-3 bg-[#14532d] text-[#e0f8cf] text-xl font-bold rounded animate-pulse border-2 border-[#4ade80]" onClick={initGame}>{getLocalizedUI('RETRY', settings.language)}</button>
                            <button className="px-6 py-3 bg-[#0f2e15] text-[#4ade80] text-xl font-bold rounded border-2 border-[#14532d]" onClick={() => setGameState('REPORT')}>{getLocalizedUI('VIEW_REPORT', settings.language)}</button>
                        </div>
                      </div>
                  )}
                  {gameState === 'REPORT' && (
                    /* 修复1：明确 pointer-events-auto，并使用 touch-auto 绕过根节点的 touch-none */
                    <div className="absolute inset-0 bg-[#0f380f] z-50 flex flex-col p-4 overflow-hidden font-led text-lg pointer-events-auto" style={{ touchAction: 'auto' }}>
                        <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-2 shrink-0">
                          <h3 className="text-yellow-400 font-bold flex items-center gap-2"><Award size={20}/>{getLocalizedUI('REPORT', settings.language)}</h3>
                          <button onClick={() => handleAction('B')} className="text-slate-400 hover:text-white"><RotateCcw size={20}/></button>
                        </div>
                        
                        {/* 修复2：报告内容全量进入滚动容器，包括姓名/学号输入框，防止键盘遮挡 */}
                        <div 
                          ref={reportScrollRef}
                          className="flex-1 overflow-y-auto bg-black/40 rounded border border-slate-800 p-2 space-y-4 mb-2 pointer-events-auto" 
                          style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
                        >
                            {/* 数据概览部分 */}
                            <div className="grid grid-cols-2 gap-2 bg-slate-800 p-2 rounded border border-slate-700 shrink-0">
                                <div className="flex flex-col items-center p-2 bg-slate-900/50 rounded">
                                    <span className="text-slate-400 text-sm mb-1">{getLocalizedUI('GRADE', settings.language)}</span>
                                    <span className={`text-4xl font-bold ${score > 500 ? 'text-yellow-400 drop-shadow-[0_0_5px_yellow]' : 'text-white'}`}>{score > 500 ? 'A' : (score > 200 ? 'B' : 'C')}</span>
                                </div>
                                <div className="flex flex-col items-center p-2 bg-slate-900/50 rounded">
                                    <span className="text-slate-400 text-sm mb-1">{getLocalizedUI('ACCURACY', settings.language)}</span>
                                    <span className="text-4xl font-bold text-blue-400">{history.length>0?Math.round((history.filter(h=>h.correct).length/history.length)*100):0}%</span>
                                </div>
                            </div>

                            {/* 关键修复：输入框置于滚动区顶部。当键盘弹出，容器高度缩小时，用户可以直接上滑看到输入框 */}
                            <div className="flex gap-3 bg-slate-800 p-2 rounded border border-slate-700 items-end shrink-0 shadow-lg">
                                <div className="flex-1">
                                    <label className="text-xs text-slate-400 block mb-1 font-pixel">{getLocalizedUI('NAME', settings.language)}</label>
                                    <input 
                                        type="text" 
                                        value={studentName} 
                                        onChange={(e) => setStudentName(e.target.value)} 
                                        onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                                        className="w-full bg-black border border-slate-600 rounded px-2 py-1.5 text-green-400 focus:border-green-500 outline-none font-led text-xl uppercase tracking-wider" 
                                        placeholder="_" 
                                    />
                                </div>
                                <div className="w-1/3">
                                    <label className="text-xs text-slate-400 block mb-1 font-pixel">{getLocalizedUI('ID', settings.language)}</label>
                                    <input 
                                        type="text" 
                                        value={studentId} 
                                        onChange={(e) => setStudentId(e.target.value)} 
                                        onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                                        className="w-full bg-black border border-slate-600 rounded px-2 py-1.5 text-green-400 focus:border-green-500 outline-none font-led text-xl uppercase tracking-wider" 
                                        placeholder="#" 
                                    />
                                </div>
                            </div>

                           {analysis && (
                                <div className="bg-slate-800 p-2 rounded border border-slate-700">
                                    <h4 className="text-yellow-400 font-bold mb-2 text-sm flex items-center gap-1"><PieChart size={14} /> {getLocalizedUI('ANALYSIS', settings.language)}</h4>
                                    <div className="flex justify-between text-xs mb-3 text-slate-300">
                                        <span><Clock size={10} className="inline mr-1"/>{getLocalizedUI('AVG_TIME_OK', settings.language)}: <span className="text-green-400">{analysis.avgTimeCorrect}s</span></span>
                                        <span><Clock size={10} className="inline mr-1"/>{getLocalizedUI('AVG_TIME_X', settings.language)}: <span className="text-red-400">{analysis.avgTimeIncorrect}s</span></span>
                                    </div>
                                    <div className="space-y-2">
                                        {analysis.typeStats.map(([type, stats]) => {
                                            const accuracy = Math.round((stats.correct / stats.total) * 100);
                                            const typeLabel = settings.language === 'zh' ? (RXN_TYPES[type]?.zh || type) : (RXN_TYPES[type]?.en || type);
                                            return (
                                                <div key={type} className="text-xs">
                                                    <div className="flex justify-between mb-0.5"><span className="text-slate-400 truncate max-w-[120px]">{typeLabel}</span><span className="text-slate-500">{stats.correct}/{stats.total}</span></div>
                                                    <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden flex"><div style={{width: `${accuracy}%`}} className="h-full bg-green-500"></div></div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                           )}

                           <div className="space-y-2">
                                <div className="text-xs text-slate-500 uppercase font-bold tracking-wider px-1 border-b border-slate-700 pb-1">{getLocalizedUI('HISTORY_LOG', settings.language)}</div>
                                {history.length === 0 && <div className="text-center text-slate-500 py-4">{getLocalizedUI('NO_DATA', settings.language)}</div>}
                                {history.map((h, i) => (
                                    <div key={i} className="flex flex-col border-b border-gray-800 pb-2 last:border-0">
                                        <div className="flex items-start gap-2">
                                            <span className={`font-bold min-w-[20px] ${h.correct?'text-green-500':'text-red-500'}`}>{h.correct ? '✔' : '✘'}</span>
                                            <span className="text-gray-300 flex-1 leading-tight text-sm">{h.question} ➔ <span className={h.correct ? 'text-green-400' : 'text-red-400'}>{h.answer}</span></span>
                                            <span className="text-xs text-slate-600">{(h.duration/1000).toFixed(1)}s</span>
                                        </div>
                                        {!h.correct && <div className="text-[10px] text-yellow-600/80 ml-6">Exp: {h.expected}</div>}
                                    </div>
                                ))}
                           </div>
                        </div>

                        <div className="flex gap-2 shrink-0 pt-2 border-t border-slate-800">
                             <button onClick={copyReport} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded flex items-center justify-center gap-2 active:scale-95 transition-all"><ClipboardCopy size={18} /><span>{getLocalizedUI('COPY', settings.language)}</span></button>
                            <button onClick={sendReport} className="flex-1 bg-blue-700 hover:bg-blue-600 text-white py-3 rounded flex items-center justify-center gap-2 active:scale-95 transition-all"><Send size={18} /><span>{getLocalizedUI('SEND', settings.language)}</span></button>
                        </div>
                    </div>
                  )}
               </div>
            </div>
            <div className="text-center mt-1 relative h-6 flex justify-center items-center">
                 <span className="font-pixel font-black text-[#909080] tracking-[0.2em] text-[8px] shadow-[inset_0_-1px_1px_rgba(255,255,255,0.6),inset_0_1px_2px_rgba(0,0,0,0.2)] px-3 py-1 rounded bg-[#d0d0c0]">CJ STUDIO</span>
            </div>
        </div>
        
        <div className={`shrink-0 flex items-center justify-center relative ${isLandscape ? 'h-full flex-col justify-center w-36 gap-8' : 'w-full py-0 grid grid-cols-2 gap-2 mt-auto mb-2'}`}>
           {!isLandscape && (
             <div className="flex flex-col items-center justify-center gap-2 mt-8">
                 <AnalogStick onMove={handleStick} active={true} />
                 <SpeakerGrill />
             </div>
           )}
           <div className={`flex items-center justify-center relative ${isLandscape ? 'h-full flex-col justify-center gap-10' : ''}`}>
               <div className={`relative ${isLandscape ? 'w-40 h-40 rotate-0' : 'w-40 h-40 translate-y-1'}`}>
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
                      <ActionButton label="X" color="blue" size={isLandscape ? "lg" : "md"} onClick={() => handleAction('X')} icon={Smartphone} />
                      <span className="font-sans text-[#57534e] text-[10px] font-bold tracking-wider">{getLocalizedUI('BTN_VIBE', settings.language)}</span>
                  </div>
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
                      <ActionButton label="A" color="red" size={isLandscape ? "lg" : "md"} onClick={() => handleAction('A')} />
                      <span className="font-sans text-[#57534e] text-[10px] font-bold tracking-wider">{getLocalizedUI('BTN_OK', settings.language)}</span>
                  </div>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
                      <ActionButton label="B" color="yellow" size={isLandscape ? "lg" : "md"} onClick={() => handleAction('B')} />
                      <span className="font-sans text-[#57534e] text-[10px] font-bold tracking-wider">{getLocalizedUI('BTN_BACK', settings.language)}</span>
                  </div>
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
                      <ActionButton label="Y" color="green" size={isLandscape ? "lg" : "md"} onClick={()=>{}} holding={isBoosting} onPointerDown={()=>setIsBoosting(true)} onPointerUp={()=>setIsBoosting(false)} icon={FastForward} />
                      <span className="font-sans text-[#57534e] text-[10px] font-bold tracking-wider">{getLocalizedUI('BTN_BST', settings.language)}</span>
                  </div>
               </div>
               {isLandscape && (
                 <div className="flex flex-col gap-6 items-center w-full mt-4">
                     <div className="flex gap-4">
                        <ActionButton label="M" color="gray" size="sm" onClick={() => handleAction('MENU')} icon={Menu} />
                        <ActionButton label="R" color="gray" size="sm" onClick={() => handleAction('RESET')} icon={RotateCw} />
                     </div>
                     <div className="flex justify-center gap-3">
                        <PillButton label={getLocalizedUI('BTN_MUTE', settings.language)} onClick={() => handleAction('SELECT')} />
                        <PillButton label={getLocalizedUI('BTN_PAUSE', settings.language)} onClick={() => handleAction('START')} />
                     </div>
                     {/* 删除右侧蓝色装饰线 */}
                 </div>
               )}
           </div>
           {!isLandscape && (
               <div className="col-span-2 flex justify-center gap-4 mt-1 pb-1 items-center">
                   <PillButton label={getLocalizedUI('BTN_RESET', settings.language)} onClick={() => handleAction('RESET')} />
                   <PillButton label={getLocalizedUI('BTN_PAUSE', settings.language)} onClick={() => handleAction('START')} />
                   <PillButton label={getLocalizedUI('BTN_MENU', settings.language)} onClick={() => handleAction('MENU')} />
               </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default App;