
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import * as mammoth from 'mammoth';

declare const __APP_VERSION__: string;
import * as XLSX from 'xlsx';
import { 
  Zap, Play, Settings, Trophy,
  BookOpen, Upload, Volume2, VolumeX, Smartphone, BarChart3, 
  ChevronRight, Check, FileJson, RotateCcw, Award, Globe, Music, Power, RotateCw, Menu, Grip, Key,
  Lightbulb, FastForward, Waves, Copy, Send, ClipboardCopy, Clock, PieChart, RefreshCw, AlertTriangle, Crosshair, Activity, Gamepad2, Keyboard, Tv, Hexagon, Eye, EyeOff, Cpu, Folder
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
  distractors?: {
      product?: string[];
      reactant?: string[];
      cond?: { zh: string; en: string }[];
      type?: string[];
  };
}

export const COMPOUNDS_CORE: Record<string, Compound> = {
  "N2":{formula:"N₂",zh:{name:"氮气"},en:{name:"Nitrogen"}},
  "H2":{formula:"H₂",zh:{name:"氢气"},en:{name:"Hydrogen"}},
  "NH3":{formula:"NH₃",zh:{name:"氨气"},en:{name:"Ammonia"}},
  "NO":{formula:"NO",zh:{name:"一氧化氮"},en:{name:"Nitric Oxide"}},
  "NO2":{formula:"NO₂",zh:{name:"二氧化氮"},en:{name:"Nitrogen Dioxide"}},
  "HNO3":{formula:"HNO₃",zh:{name:"硝酸"},en:{name:"Nitric Acid"}},
  "S":{formula:"S",zh:{name:"硫"},en:{name:"Sulfur"}},
  "SO2":{formula:"SO₂",zh:{name:"二氧化硫"},en:{name:"Sulfur Dioxide"}},
  "SO3":{formula:"SO₃",zh:{name:"三氧化硫"},en:{name:"Sulfur Trioxide"}},
  "H2SO4":{formula:"H₂SO₄",zh:{name:"硫酸"},en:{name:"Sulfuric Acid"}},
  "Cl2":{formula:"Cl₂",zh:{name:"氯气"},en:{name:"Chlorine"}},
  "HClO":{formula:"HClO",zh:{name:"次氯酸"},en:{name:"Hypochlorous Acid"}},
  "NaCl":{formula:"NaCl",zh:{name:"氯化钠"},en:{name:"Sodium Chloride"}},
  "NaOH":{formula:"NaOH",zh:{name:"氢氧化钠"},en:{name:"Sodium Hydroxide"}},
  "NaClO":{formula:"NaClO",zh:{name:"次氯酸钠"},en:{name:"Sodium Hypochlorite"}},
  "CaCO3":{formula:"CaCO₃",zh:{name:"碳酸钙"},en:{name:"Calcium Carbonate"}},
  "CaO":{formula:"CaO",zh:{name:"氧化钙"},en:{name:"Calcium Oxide"}},
  "Ca(OH)2":{formula:"Ca(OH)₂",zh:{name:"氢氧化钙"},en:{name:"Calcium Hydroxide"}},
  "Ca(ClO)2":{formula:"Ca(ClO)₂",zh:{name:"次氯酸钙"},en:{name:"Calcium Hypochlorite"}},
  "Fe":{formula:"Fe",zh:{name:"铁"},en:{name:"Iron"}},
  "FeCl3":{formula:"FeCl₃",zh:{name:"氯化铁"},en:{name:"Iron(III) Chloride"}},
  "FeCl2":{formula:"FeCl₂",zh:{name:"氯化亚铁"},en:{name:"Iron(II) Chloride"}},
  "Cu":{formula:"Cu",zh:{name:"铜"},en:{name:"Copper"}},
  "Cu(NO3)2":{formula:"Cu(NO₃)₂",zh:{name:"硝酸铜"},en:{name:"Copper(II) Nitrate"}},
  "P":{formula:"P",zh:{name:"磷"},en:{name:"Phosphorus"}},
  "PCl3":{formula:"PCl₃",zh:{name:"三氯化磷"},en:{name:"Phosphorus Trichloride"}},
  "PCl5":{formula:"PCl₅",zh:{name:"五氯化磷"},en:{name:"Phosphorus Pentachloride"}},
  "Si":{formula:"Si",zh:{name:"硅"},en:{name:"Silicon"}},
  "SiCl4":{formula:"SiCl₄",zh:{name:"四氯化硅"},en:{name:"Silicon Tetrachloride"}},
  "H2O2":{formula:"H₂O₂",zh:{name:"过氧化氢"},en:{name:"Hydrogen Peroxide"}},
  "O2":{formula:"O₂",zh:{name:"氧气"},en:{name:"Oxygen"}},
  "Ag+":{formula:"Ag⁺",zh:{name:"银离子"},en:{name:"Silver Ion"}},
  "AgCl":{formula:"AgCl",zh:{name:"氯化银"},en:{name:"Silver Chloride"}},
  "Ba2+":{formula:"Ba²⁺",zh:{name:"钡离子"},en:{name:"Barium Ion"}},
  "BaSO4":{formula:"BaSO₄",zh:{name:"硫酸钡"},en:{name:"Barium Sulfate"}},
  "Fe3+":{formula:"Fe³⁺",zh:{name:"铁离子"},en:{name:"Iron(III) Ion"}},
  "FeSCN2+":{formula:"[Fe(SCN)]²⁺",zh:{name:"硫氰化铁离子"},en:{name:"Iron(III) Thiocyanate"}},
  "Cu2+":{formula:"Cu²⁺",zh:{name:"铜离子"},en:{name:"Copper(II) Ion"}},
  "CuNH3_4":{formula:"[Cu(NH₃)₄]²⁺",zh:{name:"四氨合铜离子"},en:{name:"Tetraamminecopper(II)"}},
  "MnO4-":{formula:"MnO₄⁻",zh:{name:"高锰酸根"},en:{name:"Permanganate"}},
  "Mn2+":{formula:"Mn²⁺",zh:{name:"锰离子"},en:{name:"Manganese(II) Ion"}},
  "Cr2O72-":{formula:"Cr₂O₇²⁻",zh:{name:"重铬酸根"},en:{name:"Dichromate"}},
  "Cr3+":{formula:"Cr³⁺",zh:{name:"铬离子"},en:{name:"Chromium(III) Ion"}},
  "I2":{formula:"I₂",zh:{name:"碘"},en:{name:"Iodine"}},
  "I-":{formula:"I⁻",zh:{name:"碘离子"},en:{name:"Iodide"}},
  "Ca2+":{formula:"Ca²⁺",zh:{name:"钙离子"},en:{name:"Calcium Ion"}},
  "CaEDTA":{formula:"[Ca(EDTA)]²⁻",zh:{name:"钙-EDTA配合物"},en:{name:"Calcium-EDTA"}},
  "Mg2+":{formula:"Mg²⁺",zh:{name:"镁离子"},en:{name:"Magnesium Ion"}},
  "MgEDTA":{formula:"[Mg(EDTA)]²⁻",zh:{name:"镁-EDTA配合物"},en:{name:"Magnesium-EDTA"}},
  "Al3+":{formula:"Al³⁺",zh:{name:"铝离子"},en:{name:"Aluminum Ion"}},
  "AlF6":{formula:"[AlF₆]³⁻",zh:{name:"六氟合铝酸根"},en:{name:"Hexafluoroaluminate"}},
  "Pb2+":{formula:"Pb²⁺",zh:{name:"铅离子"},en:{name:"Lead(II) Ion"}},
  "PbI2":{formula:"PbI₂",zh:{name:"碘化铅"},en:{name:"Lead(II) Iodide"}},
  "Hg2+":{formula:"Hg²⁺",zh:{name:"汞离子"},en:{name:"Mercury(II) Ion"}},
  "HgI2":{formula:"HgI₂",zh:{name:"碘化汞"},en:{name:"Mercury(II) Iodide"}},
  "Zn2+":{formula:"Zn²⁺",zh:{name:"锌离子"},en:{name:"Zinc Ion"}},
  "ZnS":{formula:"ZnS",zh:{name:"硫化锌"},en:{name:"Zinc Sulfide"}},
  "Ni2+":{formula:"Ni²⁺",zh:{name:"镍离子"},en:{name:"Nickel(II) Ion"}},
  "NiDMG2":{formula:"Ni(DMG)₂",zh:{name:"丁二酮肟镍"},en:{name:"Nickel Dimethylglyoximate"}},
  "Co2+":{formula:"Co²⁺",zh:{name:"钴离子"},en:{name:"Cobalt(II) Ion"}},
  "CoSCN4":{formula:"[Co(SCN)₄]²⁻",zh:{name:"四硫氰合钴离子"},en:{name:"Tetrathiocyanatocobaltate(II)"}},
  "NH4+":{formula:"NH₄⁺",zh:{name:"铵根离子"},en:{name:"Ammonium Ion"}},
  "CO32-":{formula:"CO₃²⁻",zh:{name:"碳酸根"},en:{name:"Carbonate"}},
  "S2-":{formula:"S²⁻",zh:{name:"硫离子"},en:{name:"Sulfide"}},
  "H2S":{formula:"H₂S",zh:{name:"硫化氢"},en:{name:"Hydrogen Sulfide"}},
  "Fe2+":{formula:"Fe²⁺",zh:{name:"亚铁离子"},en:{name:"Iron(II) Ion"}},
  "FeOH2":{formula:"Fe(OH)₂",zh:{name:"氢氧化亚铁"},en:{name:"Iron(II) Hydroxide"}},
  "FeOH3":{formula:"Fe(OH)₃",zh:{name:"氢氧化铁"},en:{name:"Iron(III) Hydroxide"}},
  "H2Ol":{formula:"H₂O(l)",zh:{name:"液态水"},en:{name:"Water (l)"}},
  "H2Og":{formula:"H₂O(g)",zh:{name:"水蒸气"},en:{name:"Water (g)"}},
  "H2Os":{formula:"H₂O(s)",zh:{name:"冰"},en:{name:"Ice (s)"}},
  "I2s":{formula:"I₂(s)",zh:{name:"碘单质(固)"},en:{name:"Iodine (s)"}},
  "I2g":{formula:"I₂(g)",zh:{name:"碘蒸气"},en:{name:"Iodine (g)"}},
  "C_diam":{formula:"C(金刚石)",zh:{name:"金刚石"},en:{name:"Diamond"}},
  "C_graph":{formula:"C(石墨)",zh:{name:"石墨"},en:{name:"Graphite"}},
  "O3":{formula:"O₃",zh:{name:"臭氧"},en:{name:"Ozone"}},
  "H2_I2":{formula:"H₂ + I₂",zh:{name:"氢碘混合气"},en:{name:"H2 + I2"}},
  "HI":{formula:"HI",zh:{name:"碘化氢"},en:{name:"Hydrogen Iodide"}},
  "N2O4":{formula:"N₂O₄",zh:{name:"四氧化二氮"},en:{name:"Dinitrogen Tetroxide"}},
  "H2_O2":{formula:"H₂ + O₂",zh:{name:"氢氧混合气"},en:{name:"H2 + O2"}},
  "CH4_O2":{formula:"CH₄ + O₂",zh:{name:"甲烷氧气混合"},en:{name:"CH4 + O2"}},
  "ATP":{formula:"ATP",zh:{name:"三磷酸腺苷"},en:{name:"ATP"}},
  "ADP":{formula:"ADP",zh:{name:"二磷酸腺苷"},en:{name:"ADP"}},
  "Glucose":{formula:"C₆H₁₂O₆",zh:{name:"葡萄糖"},en:{name:"Glucose"}},
  "Pyruvate":{formula:"C₃H₄O₃",zh:{name:"丙酮酸"},en:{name:"Pyruvate"}},
  "CO_H2O":{formula:"CO + H₂O",zh:{name:"一氧化碳水蒸气"},en:{name:"CO + H2O"}},
  "CO2_H2":{formula:"CO₂ + H₂",zh:{name:"二氧化碳氢气"},en:{name:"CO2 + H2"}},
  "C_H2O":{formula:"C + H₂O",zh:{name:"碳水蒸气"},en:{name:"C + H2O"}},
  "CO_H2":{formula:"CO + H₂",zh:{name:"水煤气"},en:{name:"Water Gas"}},
  "KClO3":{formula:"KClO₃",zh:{name:"氯酸钾"},en:{name:"Potassium Chlorate"}},
  "KCl":{formula:"KCl",zh:{name:"氯化钾"},en:{name:"Potassium Chloride"}},
  "N2O":{formula:"N₂O",zh:{name:"一氧化二氮"},en:{name:"Nitrous Oxide"}},
  "NO_O3":{formula:"NO + O₃",zh:{name:"一氧化氮臭氧"},en:{name:"NO + O3"}},
  "NO2_O2":{formula:"NO₂ + O₂",zh:{name:"二氧化氮氧气"},en:{name:"NO2 + O2"}},
  "Cl_O3":{formula:"Cl + O₃",zh:{name:"氯原子臭氧"},en:{name:"Cl + O3"}},
  "ClO_O2":{formula:"ClO + O₂",zh:{name:"一氧化氯氧气"},en:{name:"ClO + O2"}},
  "H_H":{formula:"H + H",zh:{name:"氢原子对"},en:{name:"H + H"}},
  "U235":{formula:"²³⁵U",zh:{name:"铀-235"},en:{name:"Uranium-235"}},
  "Ba_Kr":{formula:"Ba + Kr",zh:{name:"钡氪裂变产物"},en:{name:"Ba + Kr"}},
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
  "Isopropanol":{formula:"CH₃CH(OH)CH₃",zh:{name:"异丙醇"},en:{name:"Isopropanol"}},
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

export const REACTIONS_CORE: Reaction[] =[
  {chapter:"INORGANIC",from:"N2",to:"NH3",type:"Haber Process",cond:{zh:"Fe催化, 高温高压",en:"Fe, High T/P"}},
  {chapter:"INORGANIC",from:"NH3",to:"NO",type:"Ostwald Process",cond:{zh:"Pt-Rh, 800℃",en:"Pt-Rh, 800℃"}},
  {chapter:"INORGANIC",from:"NO",to:"NO2",type:"Oxidation",cond:{zh:"O₂",en:"O₂"}},
  {chapter:"INORGANIC",from:"NO2",to:"HNO3",type:"Hydration",cond:{zh:"H₂O, O₂",en:"H₂O, O₂"}},
  {chapter:"INORGANIC",from:"S",to:"SO2",type:"Combustion",cond:{zh:"O₂, 点燃",en:"O₂, Ignition"}},
  {chapter:"INORGANIC",from:"SO2",to:"SO3",type:"Contact Process",cond:{zh:"V₂O₅, 450℃",en:"V₂O₅, 450℃"}},
  {chapter:"INORGANIC",from:"SO3",to:"H2SO4",type:"Hydration",cond:{zh:"98.3% H₂SO₄",en:"98.3% H₂SO₄"}},
  {chapter:"INORGANIC",from:"Cl2",to:"HClO",type:"Disproportionation",cond:{zh:"H₂O",en:"H₂O"}},
  {chapter:"INORGANIC",from:"NaCl",to:"NaOH",type:"Electrolysis",cond:{zh:"电解饱和食盐水",en:"Electrolysis"}},
  {chapter:"INORGANIC",from:"NaOH",to:"NaClO",type:"Disproportionation",cond:{zh:"Cl₂",en:"Cl₂"}},
  {chapter:"INORGANIC",from:"CaCO3",to:"CaO",type:"Decomposition",cond:{zh:"高温煅烧",en:"High Temp"}},
  {chapter:"INORGANIC",from:"CaO",to:"Ca(OH)2",type:"Hydration",cond:{zh:"H₂O",en:"H₂O"}},
  {chapter:"INORGANIC",from:"Ca(OH)2",to:"Ca(ClO)2",type:"Chlorination",cond:{zh:"Cl₂",en:"Cl₂"}},
  {chapter:"INORGANIC",from:"Fe",to:"FeCl3",type:"Oxidation",cond:{zh:"Cl₂, 点燃",en:"Cl₂, Ignition"}},
  {chapter:"INORGANIC",from:"FeCl3",to:"FeCl2",type:"Reduction",cond:{zh:"Fe",en:"Fe"}},
  {chapter:"INORGANIC",from:"Cu",to:"Cu(NO3)2",type:"Oxidation",cond:{zh:"浓HNO₃",en:"Conc. HNO₃"}},
  {chapter:"INORGANIC",from:"P",to:"PCl3",type:"Substitution",cond:{zh:"Cl₂ (不足)",en:"Cl₂ (def.)"}},
  {chapter:"INORGANIC",from:"PCl3",to:"PCl5",type:"Addition",cond:{zh:"Cl₂",en:"Cl₂"}},
  {chapter:"INORGANIC",from:"Si",to:"SiCl4",type:"Chlorination",cond:{zh:"Cl₂, 加热",en:"Cl₂, Heat"}},
  {chapter:"INORGANIC",from:"H2O2",to:"O2",type:"Decomposition",cond:{zh:"MnO₂ 催化",en:"MnO₂ Cat."}},
  {chapter:"ANALYTICAL",from:"Ag+",to:"AgCl",type:"Precipitation",cond:{zh:"Cl⁻",en:"Cl⁻"}},
  {chapter:"ANALYTICAL",from:"Ba2+",to:"BaSO4",type:"Precipitation",cond:{zh:"SO₄²⁻",en:"SO₄²⁻"}},
  {chapter:"ANALYTICAL",from:"Fe3+",to:"FeSCN2+",type:"Complexation",cond:{zh:"KSCN",en:"KSCN"}},
  {chapter:"ANALYTICAL",from:"Cu2+",to:"CuNH3_4",type:"Complexation",cond:{zh:"NH₃·H₂O (过量)",en:"Excess NH₃"}},
  {chapter:"ANALYTICAL",from:"MnO4-",to:"Mn2+",type:"Redox",cond:{zh:"Fe²⁺, H⁺",en:"Fe²⁺, H⁺"}},
  {chapter:"ANALYTICAL",from:"Cr2O72-",to:"Cr3+",type:"Redox",cond:{zh:"Fe²⁺, H⁺",en:"Fe²⁺, H⁺"}},
  {chapter:"ANALYTICAL",from:"I2",to:"I-",type:"Redox",cond:{zh:"Na₂S₂O₃",en:"Na₂S₂O₃"}},
  {chapter:"ANALYTICAL",from:"Ca2+",to:"CaEDTA",type:"Complexometry",cond:{zh:"EDTA, pH=10",en:"EDTA, pH=10"}},
  {chapter:"ANALYTICAL",from:"Mg2+",to:"MgEDTA",type:"Complexometry",cond:{zh:"EDTA, pH=10",en:"EDTA, pH=10"}},
  {chapter:"ANALYTICAL",from:"Al3+",to:"AlF6",type:"Complexation",cond:{zh:"NaF",en:"NaF"}},
  {chapter:"ANALYTICAL",from:"Pb2+",to:"PbI2",type:"Precipitation",cond:{zh:"KI",en:"KI"}},
  {chapter:"ANALYTICAL",from:"Hg2+",to:"HgI2",type:"Precipitation",cond:{zh:"KI",en:"KI"}},
  {chapter:"ANALYTICAL",from:"Zn2+",to:"ZnS",type:"Precipitation",cond:{zh:"H₂S, pH=7",en:"H₂S, pH=7"}},
  {chapter:"ANALYTICAL",from:"Ni2+",to:"NiDMG2",type:"Precipitation",cond:{zh:"丁二酮肟",en:"DMG"}},
  {chapter:"ANALYTICAL",from:"Co2+",to:"CoSCN4",type:"Complexation",cond:{zh:"NH₄SCN",en:"NH₄SCN"}},
  {chapter:"ANALYTICAL",from:"NH4+",to:"NH3",type:"Gas Evolution",cond:{zh:"NaOH, 加热",en:"NaOH, Heat"}},
  {chapter:"ANALYTICAL",from:"CO32-",to:"CO2",type:"Gas Evolution",cond:{zh:"H⁺",en:"H⁺"}},
  {chapter:"ANALYTICAL",from:"S2-",to:"H2S",type:"Gas Evolution",cond:{zh:"H⁺",en:"H⁺"}},
  {chapter:"ANALYTICAL",from:"Fe2+",to:"FeOH2",type:"Precipitation",cond:{zh:"NaOH",en:"NaOH"}},
  {chapter:"ANALYTICAL",from:"Fe3+",to:"FeOH3",type:"Precipitation",cond:{zh:"NaOH",en:"NaOH"}},
  {chapter:"PHYSICAL",from:"H2Ol",to:"H2Og",type:"Phase Change",cond:{zh:"100℃, 101kPa",en:"100℃, 101kPa"}},
  {chapter:"PHYSICAL",from:"H2Os",to:"H2Ol",type:"Phase Change",cond:{zh:"0℃, 101kPa",en:"0℃, 101kPa"}},
  {chapter:"PHYSICAL",from:"I2s",to:"I2g",type:"Sublimation",cond:{zh:"加热",en:"Heat"}},
  {chapter:"PHYSICAL",from:"C_diam",to:"C_graph",type:"Allotropy",cond:{zh:"常温常压",en:"STP"}},
  {chapter:"PHYSICAL",from:"O2",to:"O3",type:"Allotropy",cond:{zh:"放电",en:"Discharge"}},
  {chapter:"PHYSICAL",from:"H2_I2",to:"HI",type:"Equilibrium",cond:{zh:"加热",en:"Heat"}},
  {chapter:"PHYSICAL",from:"N2O4",to:"NO2",type:"Equilibrium",cond:{zh:"加热",en:"Heat"}},
  {chapter:"PHYSICAL",from:"PCl5",to:"PCl3",type:"Equilibrium",cond:{zh:"加热",en:"Heat"}},
  {chapter:"PHYSICAL",from:"H2_O2",to:"H2O",type:"Combustion",cond:{zh:"点燃",en:"Ignition"}},
  {chapter:"PHYSICAL",from:"CH4_O2",to:"CO2",type:"Combustion",cond:{zh:"点燃",en:"Ignition"}},
  {chapter:"PHYSICAL",from:"ATP",to:"ADP",type:"Hydrolysis",cond:{zh:"酶, H₂O",en:"Enzyme, H₂O"}},
  {chapter:"PHYSICAL",from:"Glucose",to:"Pyruvate",type:"Glycolysis",cond:{zh:"酶",en:"Enzyme"}},
  {chapter:"PHYSICAL",from:"CO_H2O",to:"CO2_H2",type:"Water-Gas Shift",cond:{zh:"催化剂, 加热",en:"Cat., Heat"}},
  {chapter:"PHYSICAL",from:"C_H2O",to:"CO_H2",type:"Water-Gas",cond:{zh:"高温",en:"High Temp"}},
  {chapter:"PHYSICAL",from:"KClO3",to:"KCl",type:"Decomposition",cond:{zh:"MnO₂ 催化, 加热",en:"MnO₂ Cat., Heat"}},
  {chapter:"PHYSICAL",from:"N2O",to:"N2",type:"Decomposition",cond:{zh:"加热",en:"Heat"}},
  {chapter:"PHYSICAL",from:"NO_O3",to:"NO2_O2",type:"Atmospheric",cond:{zh:"常温",en:"Room Temp"}},
  {chapter:"PHYSICAL",from:"Cl_O3",to:"ClO_O2",type:"Atmospheric",cond:{zh:"紫外线",en:"UV"}},
  {chapter:"PHYSICAL",from:"H_H",to:"H2",type:"Recombination",cond:{zh:"常温",en:"Room Temp"}},
  {chapter:"PHYSICAL",from:"U235",to:"Ba_Kr",type:"Fission",cond:{zh:"中子轰击",en:"Neutron"}},
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
type Point = { x: number; y: number; birthTime?: number };
type GameState = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAMEOVER' | 'IMPORT_MODAL' | 'REPORT' | 'QUIT_CONFIRM' | 'RESET_CONFIRM' | 'APP_EXIT_CONFIRM' | 'INPUT_INFO';
type MenuPage = 'MAIN' | 'CHAPTERS' | 'DIFFICULTY' | 'SETTINGS' | 'ABOUT' | 'LEADERBOARD' | 'AI_SETTINGS';
type GameMode = 'product' | 'cond' | 'reactant' | 'type' | 'symmetry';
type Difficulty = 'VERY_EASY' | 'EASY' | 'NORMAL' | 'HARD' | 'INSANE';
type Language = 'zh' | 'en';

type LeaderboardEntry = {
    id: number;
    name: string;
    score: number;
    difficulty: Difficulty;
    chapters: string[];
    date: number;
    timeLimitMode: boolean;
};

type MoleculeSymmetry = {
    molecule: string;
    name: string;
    pointGroup: string;
    elements: string[];
    wrong: string[];
    bankId?: string;
};

const LLM_PROVIDERS: Record<string, { name: string, baseUrl: string, model: string }> = {
    openai: { name: 'OpenAI (ChatGPT)', baseUrl: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4o' },
    deepseek: { name: 'DeepSeek', baseUrl: 'https://api.deepseek.com/chat/completions', model: 'deepseek-chat' },
    qwen: { name: 'Tongyi Qianwen', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', model: 'qwen-vl-max' },
    minimax: { name: 'MiniMax', baseUrl: 'https://api.minimax.chat/v1/chat/completions', model: 'abab6.5s-chat' }
};

const SYMMETRY_CORE: MoleculeSymmetry[] = [
    { molecule: 'H₂O', name: 'Water', pointGroup: 'C2v', elements: ['E', 'C₂', 'σv(xz)', 'σv\'(yz)'], wrong: ['i', 'C₃', 'σh', 'D₂'] },
    { molecule: 'NH₃', name: 'Ammonia', pointGroup: 'C3v', elements: ['E', '2C₃', '3σv'], wrong: ['i', 'C₂', 'σh', 'S₄'] },
    { molecule: 'CH₄', name: 'Methane', pointGroup: 'Td', elements: ['E', '8C₃', '3C₂', '6S₄', '6σd'], wrong: ['i', 'C₆', 'σh', 'D₄'] },
    { molecule: 'C₆H₆', name: 'Benzene', pointGroup: 'D6h', elements: ['E', '2C₆', '2C₃', 'C₂', '3C₂\'', '3C₂\"', 'i', '2S₃', '2S₆', 'σh', '3σd', '3σv'], wrong: ['Td', 'Oh', 'S₈'] },
    { molecule: 'CO₂', name: 'Carbon Dioxide', pointGroup: 'D∞h', elements: ['E', '2C∞', '∞σv', 'i', '2S∞', '∞C₂', 'σh'], wrong: ['Td', 'C₃', 'S₄'] },
    { molecule: 'BF₃', name: 'Boron Trifluoride', pointGroup: 'D3h', elements: ['E', '2C₃', '3C₂', 'σh', '2S₃', '3σv'], wrong: ['i', 'C₄', 'Oh'] },
    { molecule: 'SF₆', name: 'Sulfur Hexafluoride', pointGroup: 'Oh', elements: ['E', '8C₃', '6C₂', '6C₄', '3C₂(=C₄²)', 'i', '24S₄', '8S₆', '3σh', '6σd'], wrong: ['D∞h', 'C₅', 'C2v'] },
    { molecule: 'H₂O₂ (anti)', name: 'Hydrogen Peroxide', pointGroup: 'C2h', elements: ['E', 'C₂', 'i', 'σh'], wrong: ['C₃', 'σv', 'Td'] },
    { molecule: 'H₂O₂ (gauche)', name: 'Hydrogen Peroxide', pointGroup: 'C2', elements: ['E', 'C₂'], wrong: ['i', 'σh', 'σv', 'C₃'] },
    { molecule: 'HCN', name: 'Hydrogen Cyanide', pointGroup: 'C∞v', elements: ['E', '2C∞', '∞σv'], wrong: ['i', 'σh', 'C₂'] },
    { molecule: 'XeF₄', name: 'Xenon Tetrafluoride', pointGroup: 'D4h', elements: ['E', '2C₄', 'C₂', '2C₂\'', '2C₂\"', 'i', '2S₄', 'σh', '2σv', '2σd'], wrong: ['Td', 'Oh', 'C₃'] },
    { molecule: 'C₂H₄', name: 'Ethylene', pointGroup: 'D2h', elements: ['E', 'C₂(z)', 'C₂(y)', 'C₂(x)', 'i', 'σ(xy)', 'σ(xz)', 'σ(yz)'], wrong: ['C₃', 'S₄', 'Oh'] },
    { molecule: 'C₃H₄', name: 'Allene', pointGroup: 'D2d', elements: ['E', '2S₄', 'C₂(z)', '2C₂\'', '2σd'], wrong: ['i', 'σh', 'C₃'] },
    { molecule: 'C₅H₅FeC₅H₅ (staggered)', name: 'Ferrocene', pointGroup: 'D5d', elements: ['E', '2C₅', '2C₅²', '5C₂', 'i', '2S₁₀', '2S₁₀³', '5σd'], wrong: ['σh', 'C₃', 'Oh'] },
    { molecule: 'C₅H₅FeC₅H₅ (eclipsed)', name: 'Ferrocene', pointGroup: 'D5h', elements: ['E', '2C₅', '2C₅²', '5C₂', 'σh', '2S₅', '2S₅³', '5σv'], wrong: ['i', 'C₃', 'Oh'] },
    { molecule: 'C₆H₁₂ (chair)', name: 'Cyclohexane', pointGroup: 'D3d', elements: ['E', '2C₃', '3C₂', 'i', '2S₆', '3σd'], wrong: ['σh', 'C₄', 'Td'] },
    { molecule: 'C₆H₁₂ (boat)', name: 'Cyclohexane', pointGroup: 'C2v', elements: ['E', 'C₂', 'σv(xz)', 'σv\'(yz)'], wrong: ['i', 'σh', 'C₃'] },
    { molecule: 'PCl₅', name: 'Phosphorus Pentachloride', pointGroup: 'D3h', elements: ['E', '2C₃', '3C₂', 'σh', '2S₃', '3σv'], wrong: ['i', 'C₄', 'Oh'] },
    { molecule: 'C₆₀', name: 'Buckminsterfullerene', pointGroup: 'Ih', elements: ['E', '12C₅', '12C₅²', '20C₃', '15C₂', 'i', '12S₁₀', '12S₁₀³', '20S₆', '15σ'], wrong: ['D6h', 'Oh', 'Td'] },
    { molecule: 'SO₂', name: 'Sulfur Dioxide', pointGroup: 'C2v', elements: ['E', 'C₂', 'σv(xz)', 'σv\'(yz)'], wrong: ['i', 'C₃', 'σh'] },
    { molecule: 'SO₃', name: 'Sulfur Trioxide', pointGroup: 'D3h', elements: ['E', '2C₃', '3C₂', 'σh', '2S₃', '3σv'], wrong: ['i', 'C₄', 'Oh'] },
    { molecule: 'NH₄⁺', name: 'Ammonium', pointGroup: 'Td', elements: ['E', '8C₃', '3C₂', '6S₄', '6σd'], wrong: ['i', 'C₆', 'σh', 'D₄'] },
    { molecule: 'PtCl₄²⁻', name: 'Tetrachloroplatinate', pointGroup: 'D4h', elements: ['E', '2C₄', 'C₂', '2C₂\'', '2C₂\"', 'i', '2S₄', 'σh', '2σv', '2σd'], wrong: ['Td', 'Oh', 'C₃'] },
    { molecule: 'IF₇', name: 'Iodine Heptafluoride', pointGroup: 'D5h', elements: ['E', '2C₅', '2C₅²', '5C₂', 'σh', '2S₅', '2S₅³', '5σv'], wrong: ['i', 'C₃', 'Oh'] },
    { molecule: '[Ru(bpy)₃]²⁺', name: 'Tris(bipyridine)ruthenium(II)', pointGroup: 'D3', elements: ['E', '2C₃', '3C₂'], wrong: ['i', 'σh', 'σv', 'S₆'] },
    { molecule: 'B₁₂H₁₂²⁻', name: 'Dodecaborate', pointGroup: 'Ih', elements: ['E', '12C₅', '12C₅²', '20C₃', '15C₂', 'i', '12S₁₀', '12S₁₀³', '20S₆', '15σ'], wrong: ['D6h', 'Oh', 'Td'] }
];

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
  rxnFrom: string;
  rxnTo: string;
  gameMode: GameMode;
};

interface GameSettings {
  sound: boolean;
  music: boolean;
  vibration: boolean;
  difficulty: Difficulty;
  selectedChapters: string[];
  language: Language;
  timeLimitMode?: boolean;
  timeLimitDuration?: number;
  joyDeadzone: number;
  joySensitivity: number;
  reportEmail?: string;
}

// 增加自定义导入数据结构
interface ImportedData {
  fileName: string;
  customChapterId: string;
  compounds: Record<string, Compound>;
  reactions: Reaction[];
  symmetry?: MoleculeSymmetry[];
  rxnTypes?: Record<string, {zh: string, en: string}>;
  importDate: number;
  subjectCategory?: string;
}

const DIFFICULTY_CONFIG: Record<Difficulty, { speed: number; options: number; penalty: number }> = {
  VERY_EASY: { speed: 1.1, options: 4, penalty: 1 }, 
  EASY: { speed: 2.0, options: 4, penalty: 1 },    
  NORMAL: { speed: 3.3, options: 4, penalty: 1 },  
  HARD: { speed: 5.0, options: 4, penalty: 1 },    
  INSANE: { speed: 7.7, options: 4, penalty: 1 }    
};

const RXN_TYPES_CORE: Record<string, {zh: string, en: string}> = {
  "Substitution": {zh: "取代反应", en: "Substitution"},
  "Addition": {zh: "加成反应", en: "Addition"},
  "Polymerisation": {zh: "聚合反应", en: "Polymerization"},
  "Elimination": {zh: "消去反应", en: "Elimination"},
  "Oxidation": {zh: "氧化反应", en: "Oxidation"},
  "Reduction": {zh: "还原反应", en: "Reduction"},
  "Esterification": {zh: "酯化反应", en: "Esterification"},
  "Hydrolysis": {zh: "水解反应", en: "Hydrolysis"},
  "Acid-Base": {zh: "酸碱反应", en: "Acid-Base"},
  "Polycondensation": {zh: "缩聚反应", en: "Polycondensation"},
  "Symmetry": {zh: "对称元素收集", en: "Symmetry"},
  "Haber Process": {zh: "哈伯法合成氨", en: "Haber Process"},
  "Ostwald Process": {zh: "奥斯特瓦尔德法", en: "Ostwald Process"},
  "Hydration": {zh: "水合反应", en: "Hydration"},
  "Combustion": {zh: "燃烧反应", en: "Combustion"},
  "Contact Process": {zh: "接触法制硫酸", en: "Contact Process"},
  "Disproportionation": {zh: "歧化反应", en: "Disproportionation"},
  "Electrolysis": {zh: "电解反应", en: "Electrolysis"},
  "Decomposition": {zh: "分解反应", en: "Decomposition"},
  "Chlorination": {zh: "氯化反应", en: "Chlorination"},
  "Precipitation": {zh: "沉淀反应", en: "Precipitation"},
  "Complexation": {zh: "络合反应", en: "Complexation"},
  "Redox": {zh: "氧化还原反应", en: "Redox"},
  "Complexometry": {zh: "络合滴定", en: "Complexometry"},
  "Gas Evolution": {zh: "气体生成反应", en: "Gas Evolution"},
  "Phase Change": {zh: "相变", en: "Phase Change"},
  "Sublimation": {zh: "升华", en: "Sublimation"},
  "Allotropy": {zh: "同素异形体转化", en: "Allotropy"},
  "Equilibrium": {zh: "平衡反应", en: "Equilibrium"},
  "Glycolysis": {zh: "糖酵解", en: "Glycolysis"},
  "Water-Gas Shift": {zh: "水煤气变换", en: "Water-Gas Shift"},
  "Water-Gas": {zh: "水煤气反应", en: "Water-Gas"},
  "Atmospheric": {zh: "大气反应", en: "Atmospheric"},
  "Recombination": {zh: "复合反应", en: "Recombination"},
  "Fission": {zh: "裂变反应", en: "Fission"}
};

const CHAPTER_ORDER =[
  'INORGANIC', 'PHYSICAL', 'ANALYTICAL', 'ORGANIC', 'STRUCTURAL', 'hydrocarbon', 'halogen', 'alcohol_phenol', 'aldehyde', 'acid_ester', 'nitrogen', 'polymer'
];

const AUDIO_PATHS = {
  bgm: './bgm.mp3',
};

const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
let audioCtx: AudioContext | null = null;

const getLocalizedUI = (key: string, lang: Language) => {
  const dict: Record<string, {zh: string, en: string}> = {
    SCORE: {zh: '分数', en: 'SCORE'},
    BEST: {zh: '最佳', en: 'BEST'},
    START: {zh: '开始游戏', en: 'START GAME'},
    VERSUS: {zh: '双人对战', en: 'VERSUS'},
    TUTORIAL: {zh: '新手教程', en: 'TUTORIAL'},
    CHAPTERS: {zh: '内容选择', en: 'SUBJECTS'},
    DIFFICULTY_OPT: {zh: '难度设置', en: 'DIFFICULTY'},
    LEADERBOARD: {zh: '高分排行', en: 'LEADERBOARD'},
    IMPORT: {zh: '管理题库', en: 'IMPORT DATA'},
    SETTINGS: {zh: '系统设置', en: 'SETTINGS'},
    EXIT_APP: {zh: '退出游戏', en: 'EXIT APP'},
    CONFIRM_EXIT_APP: {zh: '彻底退出并关闭游戏？', en: 'EXIT APP TO SYSTEM?'},
    DIFFICULTY: {zh: '难度选择', en: 'DIFFICULTY'},
    SFX: {zh: '音效', en: 'SFX'},
    TIME_LIMIT: {zh: '限时模式', en: 'TIME LIMIT'},
    TIME_DURATION: {zh: '限时时长', en: 'DURATION'},
    REPORT_EMAIL: {zh: '报告邮箱', en: 'REPORT EMAIL'},
    REPORT_EMAIL_PROMPT: {zh: '请输入接收报告的邮箱地址：', en: 'Enter email address for reports:'},
    MUSIC: {zh: '音乐', en: 'MUSIC'},
    VIBE: {zh: '震动', en: 'VIBE'},
    LANG: {zh: '语言', en: 'LANGUAGE'},
    PAUSED: {zh: '暂停', en: 'PAUSED'},
    MENU: {zh: 'MENU', en: 'MENU'},
    GAMEOVER: {zh: '游戏结束', en: 'GAME OVER'},
    COMPLETED: {zh: '章节完成', en: 'CHAPTER CLEAR'},
    REPORT: {zh: '学习报告', en: 'REPORT'},
    RETRY: {zh: '重试 [A]', en: 'RETRY [A]'},
    VIEW_REPORT: {zh: '查看报告 [B]', en: 'REPORT [B]'},
    SAVE_SCORE: {zh: '保存成绩', en: 'SAVE SCORE'},
    SEND: {zh: '发送', en: 'SEND'},
    COPY: {zh: '复制报告', en: 'COPY REPORT'},
    NAME: {zh: '姓名', en: 'Name'},
    ID: {zh: '学号', en: 'ID'},
    WEAKNESS: {zh: '薄弱环节', en: 'Weakness'},
    ACCURACY: {zh: '准确率', en: 'Accuracy'},
    ACCURACY_BY_TYPE: {zh: '各题型准确率', en: 'Accuracy by Type'},
    TOTAL_Q: {zh: '答题数', en: 'Questions'},
    MAX_COMBO: {zh: '最大连击', en: 'Max Combo'},
    GRADE: {zh: '评级', en: 'Grade'},
    RESET: {zh: '重置', en: 'RESET'},
    HINT: {zh: '提示', en: 'HINT'},
    BOOST: {zh: '加速', en: 'BOOST'},
    RESUME: {zh: '继续游戏', en: 'RESUME'},
    QUIT: {zh: '退出当前', en: 'QUIT GAME'},
    ALL: {zh: '🔥 综合训练 (ALL)', en: '🔥 Comprehensive (ALL)'},
    ALL_SHORT: {zh: '综合训练', en: 'ALL'},
    ON: {zh: '开启', en: 'ON'},
    OFF: {zh: '关闭', en: 'OFF'},
    BACK_CMD: {zh: '返回', en: 'BACK'},
    NO_DATA: {zh: '暂无数据', en: 'NO DATA'},
    DATA_UPLOAD: {zh: '管理题库', en: 'DATA MGR'},
    TAP_UPLOAD: {zh: '点击上传 .JSON 文件', en: 'TAP TO UPLOAD .JSON'},
    PASTE_JSON: {zh: '在此粘贴 JSON 内容...', en: 'Paste JSON here...'},
    CANCEL: {zh: '取消', en: 'CANCEL'},
    LOAD: {zh: '加载新题库', en: 'LOAD NEW'},
    CLEAR: {zh: '清空题库', en: 'CLEAR'},
    CONFIRM_RESET: {zh: '停止并重置游戏？', en: 'Stop and Reset Game?'},
    CONFIRM_MENU: {zh: '返回主菜单？', en: 'Return to Main Menu?'},
    ALERT_NO_Q: {zh: '没有可用题目！', en: 'No questions available!'},
    ALERT_JSON_ERR: {zh: '错误：无效的 JSON', en: 'Error: Invalid JSON'},
    ALERT_LOADED: {zh: '题库追加加载成功！', en: 'Loaded successfully!'},
    ALERT_ENTER_INFO: {zh: '请输入姓名和学号', en: 'Please enter Name and Student ID'},
    ALERT_COPIED: {zh: '报告已复制到剪贴板', en: 'Report copied to clipboard'},
    ALERT_COPY_FAIL: {zh: '复制失败', en: 'Failed to copy'},
    ANALYSIS: {zh: '详细分析', en: 'ANALYSIS'},
    AVG_TIME_OK: {zh: '平均耗时(对)', en: 'Avg Time (OK)'},
    AVG_TIME_X: {zh: '平均耗时(错)', en: 'Avg Time (X)'},
    MOST_FREQ: {zh: '最常遇到', en: 'Most Frequent'},
    HISTORY_LOG: {zh: '答题记录', en: 'HISTORY LOG'},
    DIFF_VERY_EASY: {zh: '入门', en: 'V.EASY'},
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
    BTN_TIME: {zh: '限时', en: 'TIME'},
    BTN_RESET: {zh: '重置', en: 'RESET'},
    REALLY_QUIT: {zh: '确认退出当前局？', en: 'REALLY QUIT?'},
    YES: {zh: '是', en: 'YES'},
    NO: {zh: '否', en: 'NO'},
    NO_FILE: {zh: '未选择文件', en: 'No file selected'},
    ABOUT: {zh: '关于游戏', en: 'ABOUT'},
    EDIT_INFO: {zh: '修改信息', en: 'EDIT INFO'},
    UNNAMED: {zh: '未命名', en: 'Unnamed'},
    UNSET_ID: {zh: '未设置学号', en: 'No ID'},
    UNSET_EMAIL: {zh: '未设置', en: 'Not set'},
    CREDITS: {zh: '开发信息', en: 'CREDITS'},
    HOW_TO_PLAY: {zh: '玩法说明', en: 'HOW TO PLAY'},
    VERSION: {zh: '版本', en: 'VERSION'},
    DEADZONE: {zh: '摇杆死区', en: 'DEADZONE'},
    SENSITIVITY: {zh: '摇杆灵敏度', en: 'SENSITIVITY'},
  };
  return dict[key] ? dict[key][lang] : key;
};

// --- Retro Components ---

const PixelIcon = ({ type, size = 12, className = "" }: { type: 'keyboard' | 'gamepad' | 'tv', size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className={className}>
    {type === 'keyboard' && (
      <>
        <rect x="1" y="3.5" width="10" height="5" rx="0.5" stroke="currentColor" strokeWidth="1" fill="none" />
        <path d="M2.5 5h1v1h-1V5zm2 0h1v1h-1V5zm2 0h1v1h-1V5zm2 0h1v1h-1V5zm-4 2h4v0.5h-4V7z" fill="currentColor" />
      </>
    )}
    {type === 'gamepad' && (
      <>
        <path d="M1.5 4.5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-1v1h-1v-1h-3v1h-1v-1h-1a1 1 0 0 1-1-1v-2z" stroke="currentColor" strokeWidth="1" fill="none" />
        <path d="M3.5 5v2M2.5 6h2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        <circle cx="7.5" cy="6" r="0.5" fill="currentColor" />
        <circle cx="8.5" cy="5" r="0.5" fill="currentColor" />
      </>
    )}
    {type === 'tv' && (
      <>
        <rect x="2" y="3.5" width="8" height="6" rx="0.5" stroke="currentColor" strokeWidth="1" fill="none" />
        <rect x="3.5" y="5" width="3" height="3" fill="currentColor" fillOpacity="0.3" />
        <path d="M8 5h1M8 6.5h1" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" />
        <path d="M3 10.5h6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      </>
    )}
  </svg>
);

const AnalogStick: React.FC<{ onMove: (dx: number, dy: number) => void; active?: boolean; deadzone?: number; sensitivity?: number; vibrate?: (pattern: number) => void }> = React.memo(({ onMove, active = true, deadzone = 0.1, sensitivity = 1.0, vibrate }) => {
  const stickRef = useRef<HTMLDivElement>(null);
  const[pos, setPos] = useState({ x: 0, y: 0 });
  const[isDragging, setIsDragging] = useState(false);
  
  const isDraggingRef = useRef(false); 
  const lastVec = useRef({ x: 0, y: 0 });
  const lastOctant = useRef(-1);

  useEffect(() => {
    return () => onMove(0, 0);
  },[]);

  const updateStickPosition = (clientX: number, clientY: number) => {
    if (!stickRef.current) return;
    const rect = stickRef.current.getBoundingClientRect();
    if (rect.width === 0) return;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    let dx = clientX - centerX;
    let dy = clientY - centerY;
    
    const maxDist = rect.width / 2 - 12;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > maxDist) {
      const ratio = maxDist / dist;
      dx *= ratio;
      dy *= ratio;
    }
    setPos({ x: dx, y: dy });

    let normalizedX = maxDist > 0 ? dx / maxDist : 0;
    let normalizedY = maxDist > 0 ? dy / maxDist : 0;

    // Apply deadzone
    const mag = Math.sqrt(normalizedX * normalizedX + normalizedY * normalizedY);
    let currentOctant = -1;

    if (mag < deadzone) {
        normalizedX = 0;
        normalizedY = 0;
        currentOctant = -1;
    } else {
        // Rescale to 0-1 range after deadzone subtraction to avoid jump
        const scale = (mag - deadzone) / (1 - deadzone);
        normalizedX = (normalizedX / mag) * scale;
        normalizedY = (normalizedY / mag) * scale;
        
        // Calculate octant for haptic feedback
        const angle = Math.atan2(normalizedY, normalizedX);
        currentOctant = Math.round(8 * angle / (2 * Math.PI) + 8) % 8;
    }

    if (isDraggingRef.current && currentOctant !== -1 && currentOctant !== lastOctant.current) {
        if (vibrate) {
            // Stronger vibration when crossing deadzone, lighter when changing direction
            vibrate(lastOctant.current === -1 ? 10 : 5); 
        } else if (navigator.vibrate) {
            navigator.vibrate(lastOctant.current === -1 ? 10 : 5);
        }
        lastOctant.current = currentOctant;
    } else if (mag < deadzone && lastOctant.current !== -1) {
        lastOctant.current = -1;
    }

    // Apply sensitivity
    normalizedX *= sensitivity;
    normalizedY *= sensitivity;

    // Clamp to -1 to 1
    normalizedX = Math.max(-1, Math.min(1, normalizedX));
    normalizedY = Math.max(-1, Math.min(1, normalizedY));

    lastVec.current = { x: normalizedX, y: normalizedY };
    onMove(normalizedX, normalizedY);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!active) return;
    isDraggingRef.current = true;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    if (vibrate) vibrate(5);
    else if (navigator.vibrate) navigator.vibrate(5);
    updateStickPosition(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    updateStickPosition(e.clientX, e.clientY);
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
    setIsDragging(false);
    setPos({ x: 0, y: 0 });
    lastVec.current = { x: 0, y: 0 };
    lastOctant.current = -1;
    onMove(0, 0);
  };

  const tiltX = isDragging ? (pos.y / 30) * -12 : 0; 
  const tiltY = isDragging ? (pos.x / 30) * 12 : 0;
  const translateX = isDragging ? pos.x * 0.15 : 0;
  const translateY = isDragging ? pos.y * 0.15 : 0;

  return (
    <div 
      ref={stickRef}
      className={`relative w-[8.5rem] h-[8.5rem] md:w-[9.5rem] md:h-[9.5rem] flex items-center justify-center ${!active ? 'opacity-50 pointer-events-none' : ''}`}
      style={{ touchAction: 'none' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <div 
        className={`relative w-full h-full flex items-center justify-center ease-out pointer-events-none ${isDragging ? 'transition-none' : 'transition-all duration-150'}`}
        style={{ 
            transform: `perspective(400px) translate(${translateX}px, ${translateY}px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) ${isDragging ? 'scale(0.98)' : 'scale(1)'}`,
            filter: isDragging ? 'drop-shadow(0px 2px 2px rgba(0,0,0,0.8))' : 'drop-shadow(0px 8px 6px rgba(0,0,0,0.5)) drop-shadow(0px 2px 2px rgba(0,0,0,0.4))'
        }}
      >
        <svg viewBox="0 0 100 100" className="w-[88%] h-[88%] overflow-visible">
            <defs>
                <filter id="plastic-texture" x="-10%" y="-10%" width="120%" height="120%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise" />
                    <feColorMatrix type="matrix" values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0   0 0 0 0.1 0" in="noise" result="coloredNoise" />
                    <feComposite in="coloredNoise" in2="SourceGraphic" operator="in" result="maskedNoise" />
                    <feBlend in="SourceGraphic" in2="maskedNoise" mode="multiply" />
                </filter>
                <linearGradient id="concaveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#222" />
                    <stop offset="50%" stopColor="#1a1a1a" />
                    <stop offset="100%" stopColor="#111" />
                </linearGradient>
            </defs>
            <path d="M 34 4 C 34 2.5, 35 2, 36.5 2 L 63.5 2 C 65 2, 66 2.5, 66 4 L 66 34 L 96 34 C 97.5 34, 98 35, 98 36.5 L 98 63.5 C 98 65, 97.5 66, 96 66 L 66 66 L 66 96 C 66 97.5, 65 98, 63.5 98 L 36.5 98 C 35 98, 34 97.5, 34 96 L 34 66 L 4 66 C 2.5 66, 2 65, 2 63.5 L 2 36.5 C 2 35, 2.5 34, 4 34 L 34 34 Z" fill="#050505" transform="translate(0, 5)" />
            <g filter="url(#plastic-texture)">
                <path d="M 34 2 C 34 0.5, 35 0, 36.5 0 L 63.5 0 C 65 0, 66 0.5, 66 2 L 66 34 L 98 34 C 99.5 34, 100 35, 100 36.5 L 100 63.5 C 100 65, 99.5 66, 98 66 L 66 66 L 66 98 C 66 99.5, 65 100, 63.5 100 L 36.5 100 C 35 100, 34 99.5, 34 98 L 34 66 L 2 66 C 0.5 66, 0 65, 0 63.5 L 0 36.5 C 0 35, 0.5 34, 2 34 L 34 34 Z" fill="#1f1f1f" stroke="#000" strokeWidth="1" />
            </g>
            <path d="M 34.5 2.5 L 63.5 2.5 L 63.5 34.5 L 97.5 34.5 L 97.5 63.5 L 65.5 63.5 L 65.5 97.5 L 34.5 97.5 L 34.5 65.5 L 2.5 65.5 L 2.5 34.5 L 34.5 34.5 Z" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" pointerEvents="none"/>
            <circle cx="50" cy="50" r="14" fill="url(#concaveGrad)" />
            <circle cx="50" cy="50" r="14" fill="none" stroke="rgba(0,0,0,0.6)" strokeWidth="1" />
            <circle cx="50" cy="50" r="13" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            <circle cx="50" cy="50" r="10" fill="#151515" />

            <polygon points="50,6 54,11 46,11" fill="#111" />
            <polyline points="46,11.5 50,6.5 54,11.5" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" fill="none" />
            <g strokeLinecap="round">
                <line x1="42" y1="16" x2="58" y2="16" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                <line x1="42" y1="17" x2="58" y2="17" stroke="rgba(0,0,0,0.8)" strokeWidth="1.5" />
                <line x1="42" y1="21" x2="58" y2="21" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                <line x1="42" y1="22" x2="58" y2="22" stroke="rgba(0,0,0,0.8)" strokeWidth="1.5" />
                <line x1="42" y1="26" x2="58" y2="26" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                <line x1="42" y1="27" x2="58" y2="27" stroke="rgba(0,0,0,0.8)" strokeWidth="1.5" />
            </g>

            <polygon points="50,94 54,89 46,89" fill="#111" />
            <polyline points="46,88.5 50,93.5 54,88.5" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" fill="none" />
            <g strokeLinecap="round">
                <line x1="42" y1="84" x2="58" y2="84" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                <line x1="42" y1="85" x2="58" y2="85" stroke="rgba(0,0,0,0.8)" strokeWidth="1.5" />
                <line x1="42" y1="79" x2="58" y2="79" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                <line x1="42" y1="80" x2="58" y2="80" stroke="rgba(0,0,0,0.8)" strokeWidth="1.5" />
                <line x1="42" y1="74" x2="58" y2="74" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                <line x1="42" y1="75" x2="58" y2="75" stroke="rgba(0,0,0,0.8)" strokeWidth="1.5" />
            </g>

            <polygon points="6,50 11,46 11,54" fill="#111" />
            <polyline points="11.5,46 6.5,50 11.5,54" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" fill="none" />
            <g strokeLinecap="round">
                <line x1="16" y1="42" x2="16" y2="58" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                <line x1="17" y1="42" x2="17" y2="58" stroke="rgba(0,0,0,0.8)" strokeWidth="1.5" />
                <line x1="21" y1="42" x2="21" y2="58" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                <line x1="22" y1="42" x2="22" y2="58" stroke="rgba(0,0,0,0.8)" strokeWidth="1.5" />
                <line x1="26" y1="42" x2="26" y2="58" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                <line x1="27" y1="42" x2="27" y2="58" stroke="rgba(0,0,0,0.8)" strokeWidth="1.5" />
            </g>

            <polygon points="94,50 89,46 89,54" fill="#111" />
            <polyline points="88.5,46 93.5,50 88.5,54" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" fill="none" />
            <g strokeLinecap="round">
                <line x1="84" y1="42" x2="84" y2="58" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                <line x1="85" y1="42" x2="85" y2="58" stroke="rgba(0,0,0,0.8)" strokeWidth="1.5" />
                <line x1="79" y1="42" x2="79" y2="58" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                <line x1="80" y1="42" x2="80" y2="58" stroke="rgba(0,0,0,0.8)" strokeWidth="1.5" />
                <line x1="74" y1="42" x2="74" y2="58" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                <line x1="75" y1="42" x2="75" y2="58" stroke="rgba(0,0,0,0.8)" strokeWidth="1.5" />
            </g>
        </svg>
      </div>
    </div>
  );
});

const ActionButton = ({ label, color, size = 'md', onClick, icon: Icon, active, holding, onPointerDown, onPointerUp }: any) => {
  const [localPressed, setLocalPressed] = useState(false);
  const sizeClass = size === 'lg' ? 'w-14 h-14 text-xl' : size === 'sm' ? 'w-6 h-6 sm:w-8 sm:h-8 text-xs' : 'w-[2.8rem] h-[2.8rem] text-lg md:w-[3.3rem] md:h-[3.3rem]';
  const colorMap: any = {
      magenta: { 
          base: 'radial-gradient(circle at 30% 30%, #a64d79 0%, #8b2e5f 40%, #5e1b3c 100%)', 
          shadow: '#3d0b24', text: '#eecce0' 
      },
      darkgray: { 
          base: 'radial-gradient(circle at 30% 30%, #525454 0%, #2d2e2e 40%, #151515 100%)', 
          shadow: '#0a0a0a', text: '#999999' 
      },
  };
  const style = colorMap[color] || colorMap.magenta;
  const isPressed = active || holding || localPressed;

  return (
    <div className={`${sizeClass} relative group mx-1 md:mx-2`}>
        <div className="absolute inset-[-3px] rounded-full bg-black shadow-[0_1px_1px_rgba(255,255,255,0.4),inset_0_4px_6px_rgba(0,0,0,1)] pointer-events-none"></div>
        <div className={`absolute inset-0 rounded-full transition-transform duration-[40ms] ease-out ${isPressed ? 'translate-y-[3px] scale-[0.96]' : ''}`}>
             <div className="absolute inset-0 rounded-full translate-y-[4px]" style={{ backgroundColor: style.shadow }}></div>
             <button
                className="absolute inset-0 rounded-full flex items-center justify-center font-pixel outline-none overflow-hidden"
                style={{
                   background: style.base,
                   boxShadow: isPressed 
                       ? 'inset 0 3px 6px rgba(0,0,0,0.8)' 
                       : 'inset 0 1px 2px rgba(255,255,255,0.5), inset 0 -2px 4px rgba(0,0,0,0.6)',
                   color: style.text
                }}
                onPointerDown={(e) => { 
                  e.preventDefault(); 
                  setLocalPressed(true);
                  if(navigator.vibrate) navigator.vibrate(15);
                  if(onPointerDown) onPointerDown(e); 
                  else onClick(e); 
                }}
                onPointerUp={(e) => { e.preventDefault(); setLocalPressed(false); if(onPointerUp) onPointerUp(e); }}
                onPointerLeave={(e) => { setLocalPressed(false); if(onPointerUp) onPointerUp(e); }}
                onContextMenu={(e) => e.preventDefault()}
             >
                <div className={`absolute top-[4%] left-[10%] w-[60%] h-[35%] rounded-full bg-white transition-opacity duration-75 ${isPressed ? 'opacity-10' : 'opacity-30'}`} style={{ clipPath: 'ellipse(100% 100% at 50% 0%)', transform: 'rotate(-20deg)' }}></div>
                <span className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)] transform scale-[0.85] pointer-events-none z-10 relative">
                   {Icon ? <Icon size={size === 'lg' ? 24 : 18} strokeWidth={3} /> : label}
                </span>
             </button>
        </div>
    </div>
  );
};

const PillButton = ({ label, onClick, onLongPress, holding }: any) => {
    const [localPressed, setLocalPressed] = useState(false);
    const isPressed = holding || localPressed;
    const timerRef = useRef<any>(null);
    const hasLongPressed = useRef(false);

    return (
        <div className="flex flex-col items-center gap-2 transform rotate-[22deg] mx-1 md:mx-2">
            <div className="relative w-[3.2rem] h-[1.1rem] md:w-[3.8rem] md:h-[1.3rem] rounded-full shadow-[0_2px_2px_rgba(0,0,0,0.3),inset_0_2px_3px_rgba(0,0,0,0.5)] bg-black/30">
                <button  
                    className={`absolute inset-0 rounded-full transition-all duration-[40ms] outline-none block w-full h-full
                                ${isPressed ? 'translate-y-[1px] scale-[0.98]' : ''}`}
                    style={{
                        background: 'linear-gradient(180deg, #7e8082 0%, #5a5c5e 50%, #3a3c3e 100%)',
                        boxShadow: isPressed 
                             ? 'inset 0 2px 4px rgba(0,0,0,0.8)' 
                             : 'inset 0 1px 1px rgba(255,255,255,0.4), 0 2px 0 #2a2c2e, 0 3px 3px rgba(0,0,0,0.5)'
                    }}
                    onPointerDown={(e) => { 
                        e.preventDefault(); 
                        setLocalPressed(true);
                        hasLongPressed.current = false;
                        if(navigator.vibrate) navigator.vibrate(10);
                        if (onLongPress) {
                            timerRef.current = setTimeout(() => {
                                hasLongPressed.current = true;
                                onLongPress(e);
                            }, 600);
                        } else {
                            onClick(e); 
                        }
                    }}
                    onPointerUp={(e) => { 
                        e.preventDefault(); 
                        setLocalPressed(false); 
                        if (timerRef.current) clearTimeout(timerRef.current);
                        if (onLongPress && !hasLongPressed.current) onClick(e);
                    }}
                    onPointerLeave={(e) => { 
                        setLocalPressed(false); 
                        if (timerRef.current) clearTimeout(timerRef.current);
                    }}
                ></button>
            </div>
            <span className="text-[#2b2b6b] font-black text-[8px] md:text-[9px] tracking-[0.2em] uppercase font-sans whitespace-nowrap opacity-80 mt-[2px]">{label}</span>
        </div>
    );
};

const SpeakerGrill = () => (
    <div className="flex gap-1.5 opacity-20 transform -rotate-12">
        <div className="w-1.5 h-12 bg-black rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]"></div>
        <div className="w-1.5 h-12 bg-black rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]"></div>
        <div className="w-1.5 h-12 bg-black rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]"></div>
        <div className="w-1.5 h-12 bg-black rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]"></div>
        <div className="w-1.5 h-12 bg-black rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]"></div>
        <div className="w-1.5 h-12 bg-black rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)] hidden sm:block"></div>
    </div>
);

const THEMES: Record<string, { light: string, dark: string, lightHex: string, darkHex: string }> = {
  ORGANIC: { light: '139 172 15', dark: '22 38 7', lightHex: '#8bac0f', darkHex: '#162607' }, // Classic Green
  INORGANIC: { light: '139 155 180', dark: '22 32 50', lightHex: '#8b9bb4', darkHex: '#162032' }, // Blue
  STRUCTURAL: { light: '180 139 180', dark: '50 22 50', lightHex: '#b48bb4', darkHex: '#321632' }, // Purple
  PHYSICAL: { light: '180 160 139', dark: '50 32 22', lightHex: '#b4a08b', darkHex: '#322016' }, // Orange
  ANALYTICAL: { light: '139 180 160', dark: '22 50 32', lightHex: '#8bb4a0', darkHex: '#163220' }, // Teal
  CUSTOM: { light: '160 160 180', dark: '32 32 50', lightHex: '#a0a0b4', darkHex: '#202032' }, // Gray
  default: { light: '139 172 15', dark: '22 38 7', lightHex: '#8bac0f', darkHex: '#162607' } // Green
};

const getThemeColors = (chapterId: string, importedDataList?: ImportedData[]) => {
  if (chapterId.startsWith('CUSTOM_')) {
      return THEMES.CUSTOM;
  }
  if (['hydrocarbon', 'halogen', 'alcohol_phenol', 'aldehyde', 'acid_ester', 'nitrogen', 'polymer'].includes(chapterId)) return THEMES.ORGANIC;
  return THEMES[chapterId] || THEMES.default;
};

const CHAPTER_TRANS: Record<string, {zh: string, en: string}> = {
  ORGANIC: { zh: '有机化学', en: 'Organic Chemistry' },
  INORGANIC: { zh: '无机化学', en: 'Inorganic Chemistry' },
  STRUCTURAL: { zh: '结构化学', en: 'Structural Chemistry' },
  PHYSICAL: { zh: '物理化学', en: 'Physical Chemistry' },
  ANALYTICAL: { zh: '分析化学', en: 'Analytical Chemistry' },
  hydrocarbon: { zh: 'CH.1 烃类基础', en: 'CH.1 Hydrocarbons' },
  halogen: { zh: 'CH.2 卤代烃', en: 'CH.2 Halogens' },
  alcohol_phenol: { zh: 'CH.3 醇与酚', en: 'CH.3 Alcohols & Phenols' },
  aldehyde: { zh: 'CH.4 醛与酮', en: 'CH.4 Aldehydes & Ketones' },
  acid_ester: { zh: 'CH.5 酸与酯', en: 'CH.5 Acids & Esters' },
  nitrogen: { zh: 'CH.6 含氮化合物', en: 'CH.6 Nitrogen Comp.' },
  polymer: { zh: 'CH.7 高分子与合成', en: 'CH.7 Polymers' },
  default: { zh: '综合', en: 'General' }
};

// 【核心逻辑】：全新重写的章节名称获取机制，优先识别自定义导入库的文件名
const getChapterName = (id: string, lang: Language, importedList?: ImportedData[]) => {
  if (CHAPTER_TRANS[id]) return CHAPTER_TRANS[id][lang];
  if (id.startsWith('CUSTOM_')) {
      if (importedList && Array.isArray(importedList)) {
          const imported = importedList.find(data => data && data.customChapterId === id);
          if (imported) {
              const dateStr = new Date(imported.importDate).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', { month: 'numeric', day: 'numeric' });
              return `📁 AI ${dateStr}`;
          }
      }
      // Extract timestamp if present
      const match = id.match(/^CUSTOM_(\d+)$/);
      if (match) {
          const date = new Date(parseInt(match[1]));
          return `📁 Custom ${date.toLocaleDateString()}`;
      }
      return `📁 Custom Import`;
  }
  return id;
};

// --- Main App ---

const App = () => {
  const [gameState, setGameState] = useState<GameState>('MENU');
  const[menuPage, setMenuPage] = useState<MenuPage>('MAIN');
  const[menuIndex, setMenuIndex] = useState(0);
  const [isLandscape, setIsLandscape] = useState(false);
  const [isWin, setIsWin] = useState(false);
  const [showGameOverOverlay, setShowGameOverOverlay] = useState(false);
  const [isTutorial, setIsTutorial] = useState(false);
  const [isVersus, setIsVersus] = useState(false);
  const [isSymmetry, setIsSymmetry] = useState(false);
  const [versusWinner, setVersusWinner] = useState<'P1' | 'P2' | 'TIE' | null>(null);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [currentSymmetry, setCurrentSymmetry] = useState<MoleculeSymmetry | null>(null);
  const [collectedElements, setCollectedElements] = useState<string[]>([]);
  const tutorialTimerRef = useRef(0);
  
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 768);
  const [connectedGamepadsCount, setConnectedGamepadsCount] = useState(0);

  useEffect(() => {
    const checkGamepad = () => {
        const gps = navigator.getGamepads ? navigator.getGamepads() : [];
        let count = 0;
        for (let i = 0; i < gps.length; i++) {
            if (gps[i] && gps[i]?.connected) {
                count++;
            }
        }
        setConnectedGamepadsCount(count);
    };
    checkGamepad();
    window.addEventListener("gamepadconnected", checkGamepad);
    window.addEventListener("gamepaddisconnected", checkGamepad);
    return () => {
        window.removeEventListener("gamepadconnected", checkGamepad);
        window.removeEventListener("gamepaddisconnected", checkGamepad);
    };
  }, []);

  // Two-finger touch to toggle controls
  useEffect(() => {
    let hasToggled = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        // If ANY touch is on the controls, DO NOT trigger the toggle.
        // This prevents accidental toggles while playing (e.g. holding D-pad and pressing A/B)
        for (let i = 0; i < e.touches.length; i++) {
            const target = e.touches[i].target as HTMLElement;
            if (target && typeof target.closest === 'function' && target.closest('[data-controls="true"]')) {
                return;
            }
        }
        
        // Only toggle if BOTH fingers are explicitly touching the game screen area (not the controls)
        if (!hasToggled) {
            setShowControls(prev => {
                const newState = !prev;
                if (stateRef.current.settings.vibration && navigator.vibrate) {
                    navigator.vibrate(20);
                }
                return newState;
            });
            hasToggled = true;
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        hasToggled = false;
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
        const isLarge = window.innerWidth >= 768;
        setIsLargeScreen(isLarge);
        if (!isLarge && menuPage === 'MAIN' && menuIndex > 7) {
            setMenuIndex(7);
        }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [menuPage, menuIndex]);

  const [grid, setGrid] = useState({ w: 15, h: 20 });
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => {
      try {
          const saved = localStorage.getItem('chemSnake_leaderboard');
          return saved ? JSON.parse(saved) : [];
      } catch (e) {
          return [];
      }
  });
  const gameIdRef = useRef<number>(0);
  const hasSavedScoreRef = useRef<boolean>(false);
  const gridRef = useRef({ w: 15, h: 20 });
  
  const [settings, setSettings] = useState<GameSettings>(() => {
    const defaults: GameSettings = {
        sound: true, music: true, vibration: true, difficulty: 'VERY_EASY', selectedChapters:[], language: 'zh', timeLimitMode: false, timeLimitDuration: 180,
        joyDeadzone: 0.1, joySensitivity: 1.0, reportEmail: ''
    };
    try {
        const saved = localStorage.getItem('chemSnake_settings');
        if (saved) {
            return { ...defaults, ...JSON.parse(saved) };
        }
    } catch (e) {
        console.error("Failed to parse saved settings", e);
    }
    return defaults;
  });

  useEffect(() => {
      try { localStorage.setItem('chemSnake_settings', JSON.stringify(settings)); } catch (e) {}
  }, [settings]);

  // 【核心逻辑】：单独管理追加的自定义题库状态，并引入本地持久化保留开关
  const [importedDataList, setImportedDataList] = useState<ImportedData[]>(() => {
      try {
          const saved = localStorage.getItem('chemSnake_imported');
          if (saved) {
              const parsed = JSON.parse(saved);
              const migrateData = (data: any) => {
                  if (!data) return data;
                  const customId = data.customChapterId;
                  if (data.reactions) {
                      data.reactions = data.reactions.map((r: any) => ({ ...r, bankId: r.bankId || customId, cond: typeof r.cond === 'string' ? { zh: r.cond, en: r.cond } : (r.cond || { zh: '', en: '' }) }));
                  }
                  if (data.symmetry) {
                      data.symmetry = data.symmetry.map((s: any) => ({ ...s, bankId: s.bankId || customId, elements: s.elements || [], wrong: s.wrong || [] }));
                  }
                  return data;
              };
              if (Array.isArray(parsed)) {
                  return parsed.map(migrateData);
              } else if (parsed && typeof parsed === 'object') {
                  return [migrateData(parsed)];
              }
          }
      } catch (e) {}
      return [];
  });
  
  const [keepImport, setKeepImport] = useState(() => {
      try {
          const saved = localStorage.getItem('chemSnake_keepImport');
          return saved ? JSON.parse(saved) : true;
      } catch (e) { return true; }
  });

  useEffect(() => {
      try { localStorage.setItem('chemSnake_keepImport', JSON.stringify(keepImport)); } catch (e) {}
  }, [keepImport]);

  useEffect(() => {
      if (keepImport) {
          try { localStorage.setItem('chemSnake_imported', JSON.stringify(importedDataList)); } catch (e) {}
      } else {
          localStorage.removeItem('chemSnake_imported');
      }
  }, [importedDataList, keepImport]);

  // 【核心逻辑】：合并内置题库与自定义追加题库
  const dbCompounds = useMemo(() => {
    let combined = { ...COMPOUNDS_CORE };
    (importedDataList || []).forEach(data => {
        if (data) combined = { ...combined, ...(data.compounds || {}) };
    });
    return combined;
  }, [importedDataList]);

  const dbReactions = useMemo(() => {
    let combined = [ ...REACTIONS_CORE ];
    (importedDataList || []).forEach(data => {
        if (data) combined = [ ...combined, ...(Array.isArray(data.reactions) ? data.reactions : []) ];
    });
    return combined;
  }, [importedDataList]);

  const dbSymmetry = useMemo(() => {
    let combined = [ ...SYMMETRY_CORE ];
    (importedDataList || []).forEach(data => {
        if (data) combined = [ ...combined, ...(Array.isArray(data.symmetry) ? data.symmetry : []) ];
    });
    return combined;
  }, [importedDataList]);

  const dbRxnTypes = useMemo(() => {
    let combined = { ...RXN_TYPES_CORE };
    (importedDataList || []).forEach(data => {
        if (data && data.rxnTypes) combined = { ...combined, ...data.rxnTypes };
    });
    return combined;
  }, [importedDataList]);

  const[snake, setSnake] = useState<Point[]>([{ x: 7, y: 15 }]);
  const[snake2, setSnake2] = useState<Point[]>([]);
  const[direction, setDirection] = useState<Point>({ x: 0, y: -1 });
  const[direction2, setDirection2] = useState<Point>({ x: 0, y: -1 });
  const [nextDir, setNextDir] = useState<Point>({ x: 0, y: -1 });
  const [nextDir2, setNextDir2] = useState<Point>({ x: 0, y: -1 });
  const [food, setFood] = useState<FoodItem[]>([]);
  const[score, setScore] = useState(0);
  const[score2, setScore2] = useState(0);
  const[timeLeft, setTimeLeft] = useState(0);
  const [combo, setCombo] = useState(0);
  const [combo2, setCombo2] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [maxCombo2, setMaxCombo2] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [currentRxn, setCurrentRxn] = useState<Reaction | null>(null);
  const [pendingAction, setPendingAction] = useState<'copy' | 'send' | 'save_score' | 'settings' | null>(null);
  
  const currentChapter = (() => {
      if (gameState === 'PLAYING' || gameState === 'PAUSED' || gameState === 'QUIT_CONFIRM' || gameState === 'RESET_CONFIRM' || gameState === 'GAMEOVER' || gameState === 'REPORT') {
          if (isSymmetry) return currentSymmetry?.bankId || 'STRUCTURAL';
          if (currentRxn) return currentRxn.chapter;
      }
      if (gameState === 'INPUT_INFO') {
          if (pendingAction === 'settings') return settings.selectedChapters[0] || 'default';
          if (isSymmetry) return currentSymmetry?.bankId || 'STRUCTURAL';
          if (currentRxn) return currentRxn.chapter;
      }
      return settings.selectedChapters[0] || 'default';
  })();
  const themeColors = getThemeColors(currentChapter, importedDataList);

  useEffect(() => {
    document.documentElement.style.setProperty('--theme-light', themeColors.light);
    document.documentElement.style.setProperty('--theme-dark', themeColors.dark);
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', themeColors.lightHex);
    }
  }, [themeColors]);
  
  const [gameMode, setGameMode] = useState<GameMode>('product');
  const [isBoosting, setIsBoosting] = useState(false);
  const isBoostingRef = useRef(false);
  const setBoost = useCallback((val: boolean) => {
    setIsBoosting(val);
    isBoostingRef.current = val;
  }, []);

  const [isBoosting2, setIsBoosting2] = useState(false);
  const isBoosting2Ref = useRef(false);
  const setBoost2 = useCallback((val: boolean) => {
    setIsBoosting2(val);
    isBoosting2Ref.current = val;
  }, []);
  
  const [pendingStart, setPendingStart] = useState<string | null>(null);
  
  const [shake, setShake] = useState(0);
  const [flash, setFlash] = useState<{color: string, opacity: number} | null>(null);

  const floatsRef = useRef<FloatText[]>([]);
  const particlesRef = useRef<Particle[]>([]);

  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  
  const questionStartTimeRef = useRef<number>(0);
  const[tempImportText, setTempImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [aiReportAnalysis, setAiReportAnalysis] = useState<string | null>(null);
  const [aiThinkingStep, setAiThinkingStep] = useState(0);
  const thinkingSteps = [
    { zh: '正在扫描化学元素...', en: 'Scanning chemical elements...' },
    { zh: '正在识别化学反应...', en: 'Identifying chemical reactions...' },
    { zh: '正在分析分子结构...', en: 'Analyzing molecular structures...' },
    { zh: '正在生成游戏题目...', en: 'Generating game questions...' },
    { zh: '正在优化题目难度...', en: 'Optimizing question difficulty...' },
    { zh: '正在准备实验器材...', en: 'Preparing lab equipment...' }
  ];
  const [alertModal, setAlertModal] = useState<{ isOpen: boolean; message: string; title?: string; onConfirm?: () => void; onCancel?: () => void; cancelText?: string; confirmText?: string }>({ isOpen: false, message: '' });
  const showAlert = (message: string, title?: string, onConfirm?: () => void, onCancel?: () => void, cancelText?: string, confirmText?: string) => {
      setAlertModal({ isOpen: true, message, title, onConfirm, onCancel, cancelText, confirmText });
  };
  const [saveApiKey, setSaveApiKey] = useState(() => {
    try { return localStorage.getItem('save_api_key') === 'true'; } catch { return false; }
  });
  const [apiKey, setApiKey] = useState(() => {
    try { 
      const shouldSave = localStorage.getItem('save_api_key') === 'true';
      if (shouldSave) {
          const saved = localStorage.getItem('gemini_api_key');
          if (saved) return saved;
      } else {
          localStorage.removeItem('gemini_api_key');
      }
      return ''; 
    } catch { return ''; }
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [llmProvider, setLlmProvider] = useState(() => {
    try { return localStorage.getItem('llm_provider') || 'gemini'; } catch { return 'gemini'; }
  });
  const [customBaseUrl, setCustomBaseUrl] = useState(() => {
    try { return localStorage.getItem('custom_base_url') || ''; } catch { return ''; }
  });
  const [customModel, setCustomModel] = useState(() => {
    try { return localStorage.getItem('custom_model') || ''; } catch { return ''; }
  });
  const [showControls, setShowControls] = useState(true);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const menuListRef = useRef<HTMLDivElement>(null); 
  const reportScrollRef = useRef<HTMLDivElement>(null);

  const lastTimeRef = useRef<number>(0);
  const lastInputTime = useRef<number>(0);
  const lastRepeatTime = useRef<number>(0);
  const stickInput = useRef({ x: 0, y: 0 }); 
  const lastDirAngle = useRef<number>(0);

  const lastGamepadState = useRef({ A: false, B: false, X: false, Y_face: false, LB: false, LT: false, Accel: false, Start: false, Select: false, L3: false, R3: false });
  const lastGamepadState2 = useRef({ R3: false, Accel: false, Start: false });
  const usingGamepadRef = useRef(false);
  
  const activeGamepadIndexRef = useRef<number | null>(null);
  const handleActionRef = useRef<((btn: 'A' | 'B' | 'X' | 'Y' | 'START' | 'SELECT' | 'RESET' | 'MENU' | 'EXIT' | 'TIME' | 'TOGGLE_CONTROLS', fromMenu?: boolean) => void) | null>(null);

  // 【核心逻辑】：将合并后的所有章节提取并排序，保证追加的自定义章节永远显示在最后
  const availableChapters = useMemo(() => {
      const allChaptersInDb = new Set([...(dbReactions || []).map(r => r.chapter)]);
      const baseSubjects = ['ORGANIC', 'INORGANIC', 'STRUCTURAL', 'PHYSICAL', 'ANALYTICAL'].filter(sub => {
          if (sub === 'ORGANIC') return true;
          if (sub === 'STRUCTURAL') return true;
          return allChaptersInDb.has(sub);
      });
      const customCaps = (importedDataList || []).filter(data => data).map(data => data.customChapterId);
      return [...baseSubjects, ...customCaps];
  }, [dbReactions, importedDataList]);

  const stateRef = useRef({ 
      snake, snake2, direction, direction2, nextDir, nextDir2, food, gameState, settings, score, score2, combo, combo2, maxCombo, maxCombo2, 
      currentRxn, gameMode, history, grid: gridRef.current,
      menuPage, menuIndex, availableChapters,
      dbCompounds, dbReactions, dbSymmetry, dbRxnTypes, timeLeft, importedDataList,
      isTutorial, isVersus, tutorialStep,
      isSymmetry, currentSymmetry, collectedElements
  });

  useEffect(() => {
    stateRef.current = { 
        snake, snake2, direction, direction2, nextDir, nextDir2, food, gameState, settings, score, score2, combo, combo2, maxCombo, maxCombo2, 
        currentRxn, gameMode, history, grid: gridRef.current,
        menuPage, menuIndex, availableChapters,
        dbCompounds, dbReactions, dbSymmetry, dbRxnTypes, timeLeft, importedDataList,
        isTutorial, isVersus, tutorialStep,
        isSymmetry, currentSymmetry, collectedElements
    };
  }); 

  const getComp = useCallback((id: string, lang: Language) => {
    const comps = stateRef.current.dbCompounds; 
    const c = comps[id];
    if (!c) return { name: id, formula: id };
    const loc = lang === 'zh' ? c.zh : c.en;
    return { name: loc.name, formula: c.formula };
  },[]);

  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  useEffect(() => {
    const metaTags =[
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      { name: 'apple-mobile-web-app-title', content: 'ChemSnake' },
      { name: 'theme-color', content: '#a8a9a9' }
    ];
    let viewportMeta = document.querySelector('meta[name="viewport"]');
    if (!viewportMeta) {
        viewportMeta = document.createElement('meta');
        viewportMeta.setAttribute('name', 'viewport');
        document.head.appendChild(viewportMeta);
    }
    viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');

    metaTags.forEach(({ name, content }) => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    });

    Object.entries(AUDIO_PATHS).forEach(([key, path]) => {
      const audio = new Audio(path);
      audio.preload = 'auto';
      if (key === 'bgm') audio.loop = true;
      audioRefs.current[key] = audio;
    });

    const checkOrientation = () => setIsLandscape(window.innerWidth > window.innerHeight);
    checkOrientation();
    window.addEventListener('resize', checkOrientation);

    const handleGamepadConnected = (e: GamepadEvent) => {
        activeGamepadIndexRef.current = e.gamepad.index;
    };
    const handleGamepadDisconnected = (e: GamepadEvent) => {
        if (activeGamepadIndexRef.current === e.gamepad.index) {
            activeGamepadIndexRef.current = null;
        }
    };
    window.addEventListener("gamepadconnected", handleGamepadConnected);
    window.addEventListener("gamepaddisconnected", handleGamepadDisconnected);

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

    const handleKeyDown = (e: KeyboardEvent) => {
        // Prevent default scrolling for game keys
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Enter'].includes(e.key)) {
            e.preventDefault();
        }
        
        const state = stateRef.current;
        
        // Directional controls
        if (state.gameState === 'PLAYING') {
            if (state.isVersus) {
                if (e.key === 'w' || e.key === 'W') setNextDir({ x: 0, y: -1 });
                if (e.key === 's' || e.key === 'S') setNextDir({ x: 0, y: 1 });
                if (e.key === 'a' || e.key === 'A') setNextDir({ x: -1, y: 0 });
                if (e.key === 'd' || e.key === 'D') setNextDir({ x: 1, y: 0 });
                
                if (e.key === 'ArrowUp') setNextDir2({ x: 0, y: -1 });
                if (e.key === 'ArrowDown') setNextDir2({ x: 0, y: 1 });
                if (e.key === 'ArrowLeft') setNextDir2({ x: -1, y: 0 });
                if (e.key === 'ArrowRight') setNextDir2({ x: 1, y: 0 });
            } else {
                if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') setNextDir({ x: 0, y: -1 });
                if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') setNextDir({ x: 0, y: 1 });
                if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') setNextDir({ x: -1, y: 0 });
                if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') setNextDir({ x: 1, y: 0 });
            }
        }
        
        // Menu navigation
        if (state.gameState === 'MENU' || state.gameState === 'REPORT' || state.gameState === 'GAMEOVER') {
            if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
                if (state.gameState === 'REPORT' && reportScrollRef.current) {
                    reportScrollRef.current.scrollTop -= 20;
                } else if (state.gameState === 'MENU' || state.gameState === 'GAMEOVER') {
                    triggerMenuMove(-1);
                }
            }
            if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
                if (state.gameState === 'REPORT' && reportScrollRef.current) {
                    reportScrollRef.current.scrollTop += 20;
                } else if (state.gameState === 'MENU' || state.gameState === 'GAMEOVER') {
                    triggerMenuMove(1);
                }
            }
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                if (state.gameState === 'MENU') {
                    handleMenuAdjust(-1);
                }
            }
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                if (state.gameState === 'MENU') {
                    handleMenuAdjust(1);
                }
            }
        }

        // Action buttons
        if (e.key === 'Enter' || e.key === 'j' || e.key === 'J') handleActionRef.current?.('A', true);
        if (e.key === 'Escape' || e.key === 'k' || e.key === 'K') handleActionRef.current?.('B', true);
        if (e.key === ' ') handleActionRef.current?.('START', true);
        if (e.key === 't' || e.key === 'T') handleActionRef.current?.('TIME', true);
        if (e.key === 'c' || e.key === 'C') handleActionRef.current?.('TOGGLE_CONTROLS', true);
        if (e.key === 'Shift') {
            if (e.code === 'ShiftRight') setBoost2(true);
            else setBoost(true);
        }
        if (e.key === 'Enter' && e.code === 'NumpadEnter') setBoost2(true);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
        if (e.key === 'Shift') {
            if (e.code === 'ShiftRight') setBoost2(false);
            else setBoost(false);
        }
        if (e.key === 'Enter' && e.code === 'NumpadEnter') setBoost2(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
        window.removeEventListener('resize', checkOrientation);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        window.removeEventListener("gamepadconnected", handleGamepadConnected);
        window.removeEventListener("gamepaddisconnected", handleGamepadDisconnected);
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    };
  },[]);

  useEffect(() => {
    if (gameState === 'MENU' && menuListRef.current) {
        let childIndex = menuIndex;
        if (menuPage === 'CHAPTERS') childIndex += 1; 
        if (menuListRef.current.children && menuListRef.current.children[childIndex]) {
            const child = menuListRef.current.children[childIndex] as HTMLElement;
            if (child && child.scrollIntoView) {
                child.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }
    }
  }, [menuIndex, menuPage, gameState]);

  useEffect(() => {
      const handleResize = () => {
          if (!canvasContainerRef.current) return;
          const rect = canvasContainerRef.current.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) return;

          const dpr = window.devicePixelRatio || 1;
          const targetW = Math.floor(rect.width * dpr);
          const targetH = Math.floor(rect.height * dpr);
          if (canvasRef.current) {
              if (canvasRef.current.width !== targetW || canvasRef.current.height !== targetH) {
                  canvasRef.current.width = targetW;
                  canvasRef.current.height = targetH;
              }
          }

          const minDim = Math.min(rect.width, rect.height);
          const targetDensity = 17; 
          const rawCellSize = minDim / targetDensity;
          const cellSize = Math.max(Math.floor(rawCellSize), 12); 

          const w = Math.floor(rect.width / cellSize);
          const h = Math.floor(rect.height / cellSize);
          
          if (w !== gridRef.current.w || h !== gridRef.current.h) {
              gridRef.current = { w, h };
              setGrid({ w, h });
          }
      };
      handleResize();
      const observer = new ResizeObserver(() => handleResize());
      if (canvasContainerRef.current) observer.observe(canvasContainerRef.current);
      return () => observer.disconnect();
  },[]);

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
    let interval: NodeJS.Timeout;
    if (gameState === 'PLAYING') {
      interval = setInterval(() => {
        const diffMultiplier = {
            'VERY_EASY': 1,
            'EASY': 2,
            'NORMAL': 3,
            'HARD': 4,
            'INSANE': 5
        }[settings.difficulty] || 1;
        
        setScore(s => s + diffMultiplier);
        if (stateRef.current.isVersus) {
            setScore2(s => s + diffMultiplier);
        }
        
        // Add floating text for survival score
        const head = stateRef.current.snake[0];
        if (head) {
             floatsRef.current.push({
                 id: Date.now(),
                 x: head.x,
                 y: head.y - 1,
                 text: `+${diffMultiplier}`,
                 color: themeColors.darkHex,
                 life: 30,
                 fontSize: 10
             });
        }
        
        if (stateRef.current.isVersus) {
            const head2 = stateRef.current.snake2[0];
            if (head2) {
                 floatsRef.current.push({
                     id: Date.now() + 1,
                     x: head2.x,
                     y: head2.y - 1,
                     text: `+${diffMultiplier}`,
                     color: '#306230',
                     life: 30,
                     fontSize: 10
                 });
            }
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState, settings.difficulty]);

  useEffect(() => {
    let interval: number;
    if (isBoosting && gameState === 'PLAYING' && settings.vibration) {
      interval = window.setInterval(() => vibrate(15), 80);
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

  const vibrate = (pattern: number | number[], type: 'light' | 'heavy' | 'eat' | 'die' | 'win' = 'light') => {
    if (!stateRef.current.settings.vibration) return;
    if (navigator.vibrate) navigator.vibrate(pattern);
    try {
        const gamepads = navigator.getGamepads ? navigator.getGamepads() :[];
        let gp = null;
        if (activeGamepadIndexRef.current !== null && gamepads[activeGamepadIndexRef.current]) {
            gp = gamepads[activeGamepadIndexRef.current];
        } else {
            gp = gamepads.find(g => g !== null && g.connected);
        }
        if (gp && (gp as any).vibrationActuator) {
            let duration = Array.isArray(pattern) ? pattern.reduce((a, b) => a + b, 0) : pattern;
            let weakMag = 0.5;
            let strongMag = 0.5;
            
            if (type === 'eat') {
                weakMag = 0.8; strongMag = 0.1; duration = 100;
            } else if (type === 'die') {
                weakMag = 1.0; strongMag = 1.0; duration = 400;
            } else if (type === 'win') {
                weakMag = 0.5; strongMag = 0.8; duration = 300;
            } else if (type === 'heavy') {
                weakMag = 1.0; strongMag = 1.0;
            } else {
                weakMag = 0.3; strongMag = 0.3;
            }
            
            (gp as any).vibrationActuator.playEffect("dual-rumble", {
                startDelay: 0, duration: duration, weakMagnitude: weakMag, strongMagnitude: strongMag
            });
        }
    } catch (e) {}
  };
  
  const play = (key: 'bgm' | 'eat' | 'wrong' | 'die' | 'hint' | 'tick' | 'time_on' | 'time_off' | 'move' | 'select' | 'boost' | 'back' | 'start' | 'pause' | 'error') => {
    if (!stateRef.current.settings.sound && key !== 'bgm') return;
    
    if (key === 'bgm') {
        const audio = audioRefs.current[key];
        if (audio) { audio.currentTime = 0; audio.play().catch(() => {}); }
        return;
    }

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    if (!audioCtx) audioCtx = new AudioContextClass();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    const now = audioCtx.currentTime;

    if (key === 'tick') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(1200, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(now + 0.05);
    } else if (key === 'time_on') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1760, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(now + 0.3);
    } else if (key === 'time_off') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.15);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(now + 0.2);
    } else if (key === 'move' || key === 'select') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.08);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(now + 0.08);
    } else if (key === 'back') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(150, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(now + 0.1);
    } else if (key === 'boost') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(now + 0.1);
    } else if (key === 'start') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(660, now + 0.1);
        osc.frequency.setValueAtTime(880, now + 0.2);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(now + 0.4);
    } else if (key === 'pause') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(660, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(now + 0.3);
    } else if (key === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.2);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(now + 0.3);
    } else if (key === 'eat') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(now + 0.1);
    } else if (key === 'wrong') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(now + 0.2);
    } else if (key === 'die') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.5);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(now + 0.5);
    } else if (key === 'hint') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.setValueAtTime(600, now + 0.1);
        osc.frequency.setValueAtTime(800, now + 0.2);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(now + 0.4);
    }
  };

  const spawnParticles = (x: number, y: number, color: string, count: number) => {
      for(let i=0; i<count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 0.8 + 0.4;
          particlesRef.current.push({
              id: Math.random(), x: x, y: y,
              vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
              color: color, life: 45 + Math.random() * 30, size: Math.random() * 0.5 + 0.3
          });
      }
  };

  const getFilteredReactions = useCallback(() => {
    const state = stateRef.current;
    const all = state.dbReactions || [];
    const selected = state.settings.selectedChapters || [];
    if (selected.length === 0) return all;
    
    return all.filter((r: any) => {
        if (r.bankId && selected.includes(r.bankId)) return true;
        if (selected.includes('ORGANIC') && !r.chapter.startsWith('CUSTOM_') && !['INORGANIC', 'STRUCTURAL', 'PHYSICAL', 'ANALYTICAL'].includes(r.chapter)) return true;
        return selected.includes(r.chapter);
    });
  }, []);

  const getFilteredSymmetry = useCallback(() => {
    const state = stateRef.current;
    const all = state.dbSymmetry || [];
    const selected = state.settings.selectedChapters || [];
    if (selected.length === 0) return all;
    
    return all.filter((s: any) => {
        if (s.bankId && selected.includes(s.bankId)) return true;
        if (selected.includes('STRUCTURAL') && !s.bankId) return true;
        return false;
    });
  }, []);

    const findSafeSpot = (excludeSnake: Point[], excludeFood: Point[]) => {
     const state = stateRef.current;
     const { w, h } = gridRef.current;
     if (w <= 0 || h <= 0) return null; 
     let attempts = 0;
     const pad = 3; 
     
     // Start with a large safe distance, and gradually decrease it if we can't find a spot
     let minFoodDist = 9.0;
     
     while (attempts < 200) {
        if (attempts > 50) minFoodDist = 7.0;
        if (attempts > 100) minFoodDist = 5.0;
        if (attempts > 150) minFoodDist = 4.0;
        
        const x = Math.floor(Math.random() * (w - 2 * pad)) + pad + 0.5;
        const y = Math.floor(Math.random() * (h - 2 * pad)) + pad + 0.5;
        const onSnake = excludeSnake.some(s => Math.hypot(s.x - x, s.y - y) < 2.0);
        const onSnake2 = state.isVersus ? state.snake2.some(s => Math.hypot(s.x - x, s.y - y) < 2.0) : false;
        const onFood = excludeFood.some(f => Math.hypot(f.x - x, f.y - y) < minFoodDist);
        if (!onSnake && !onSnake2 && !onFood) return { x, y };
        attempts++;
     }
     return null;
  };

  const getDistractorPool = (mode: GameMode, rxn: Reaction, state: any) => {
    const currentChapter = rxn.chapter;
    const isCustom = currentChapter.startsWith('CUSTOM_');
    
    let correctVal: string;
    if (mode === 'product') correctVal = rxn.to;
    else if (mode === 'cond') correctVal = JSON.stringify(rxn.cond);
    else if (mode === 'type') correctVal = rxn.type;
    else correctVal = rxn.from;

    if (rxn.distractors) {
        if (mode === 'product' && rxn.distractors.product && rxn.distractors.product.length > 0) {
            return rxn.distractors.product.filter(c => c !== correctVal);
        }
        if (mode === 'reactant' && rxn.distractors.reactant && rxn.distractors.reactant.length > 0) {
            return rxn.distractors.reactant.filter(c => c !== correctVal);
        }
        if (mode === 'cond' && rxn.distractors.cond && rxn.distractors.cond.length > 0) {
            return rxn.distractors.cond.map(c => JSON.stringify(c)).filter(c => c !== correctVal);
        }
        if (mode === 'type' && rxn.distractors.type && rxn.distractors.type.length > 0) {
            return rxn.distractors.type.filter(c => c !== correctVal);
        }
    }

    if (mode === 'type') {
        let pool: string[] = [];
        if (isCustom && state.importedDataList) {
            const importData = state.importedDataList.find((d: any) => d.customChapterId === currentChapter);
            if (importData && importData.rxnTypes) {
                pool = Object.keys(importData.rxnTypes).filter(c => c !== correctVal);
            }
        }
        if (pool.length < 1) {
            const defaultTypes = Object.keys(state.dbRxnTypes);
            pool = [...new Set([...state.dbReactions.map((r: any) => r.type), ...defaultTypes])].filter(c => c !== correctVal);
        }
        return pool;
    }
    
    if (mode === 'cond') {
        const defaultConds = [
          { zh: '加热', en: 'Heat' }, { zh: '光照', en: 'Light' }, { zh: '催化剂', en: 'Catalyst' },
          { zh: '高温高压', en: 'High T&P' }, { zh: '点燃', en: 'Ignite' }, { zh: '浓H₂SO₄', en: 'Conc. H₂SO₄' },
          { zh: 'NaOH', en: 'NaOH' }, { zh: 'H₂O', en: 'H₂O' }
        ];
        let pool: string[] = [];
        if (isCustom && state.importedDataList) {
            const importData = state.importedDataList.find((d: any) => d.customChapterId === currentChapter);
            if (importData && importData.reactions) {
                pool = [...new Set(importData.reactions.map((r: any) => JSON.stringify(r.cond))) as Set<string>].filter(c => c !== correctVal);
            }
        }
        if (pool.length < 1) {
            pool = [...new Set([...state.dbReactions.map((r: any) => JSON.stringify(r.cond)), ...defaultConds.map(c => JSON.stringify(c))]) as Set<string>].filter(c => c !== correctVal);
        }
        return pool;
    }
    
    let pool: string[] = [];
    if (isCustom && state.importedDataList) {
        const importData = state.importedDataList.find((d: any) => d.customChapterId === currentChapter);
        if (importData && importData.compounds) {
            pool = Object.keys(importData.compounds).filter(k => k !== rxn.from && k !== rxn.to);
        }
    }
    if (pool.length < 1) {
        pool = Object.keys(state.dbCompounds).filter(k => k !== rxn.from && k !== rxn.to);
    }
    return pool;
  };

  const nextQuestion = (pool = getFilteredReactions(), newRecord?: HistoryRecord) => {
    const state = stateRef.current;
    const selected = state.settings.selectedChapters;
    const symPool = getFilteredSymmetry();
    
    let playSymmetry = false;
    if (state.isTutorial) {
        playSymmetry = false;
    } else {
        const canPlayReaction = pool.length > 0;
        const canPlaySymmetry = symPool.length > 0;
        
        if (canPlayReaction && canPlaySymmetry) {
            playSymmetry = Math.random() < 0.5;
        } else if (canPlaySymmetry) {
            playSymmetry = true;
        } else if (canPlayReaction) {
            playSymmetry = false;
        } else {
            showAlert(state.settings.language === 'zh' ? '所选内容暂无题目，敬请期待！' : 'No questions available for selected subjects, coming soon!');
            handleGameOver();
            return;
        }
    }
    
    if (playSymmetry) {
        setIsSymmetry(true);
        state.isSymmetry = true;
        const sym = symPool[Math.floor(Math.random() * symPool.length)];
        setCurrentSymmetry(sym);
        setCollectedElements([]);
        setGameMode('symmetry');
        setCurrentRxn(null);
        state.currentSymmetry = sym;
        state.collectedElements = [];
        state.gameMode = 'symmetry';
        state.currentRxn = null;
        
        const { options: targetCount } = DIFFICULTY_CONFIG[state.settings.difficulty];
        const missing = sym.elements || [];
        if (missing.length === 0) {
            nextQuestion(pool);
            return;
        }
        const correctVal = missing[Math.floor(Math.random() * missing.length)];
        const opts = [correctVal];
        const distPool = [...sym.wrong];
        
        const globalWrongPool = ['E', 'C₂', 'C₃', 'C₄', 'C₅', 'C₆', 'i', 'σh', 'σv', 'σd', 'S₃', 'S₄', 'S₆', 'S₈', 'Oh', 'Td', 'D∞h', 'C∞v', 'D3h', 'C2v'];
        
        let optAttempts = 0;
        while (opts.length < targetCount && optAttempts < 50) {
          let rand;
          if (distPool.length > 0) {
              rand = distPool[Math.floor(Math.random() * distPool.length)];
          } else {
              rand = globalWrongPool[Math.floor(Math.random() * globalWrongPool.length)];
          }
          if (!opts.includes(rand as string) && !missing.includes(rand as string)) {
              opts.push(rand as string);
              if (distPool.includes(rand as string)) {
                  distPool.splice(distPool.indexOf(rand as string), 1);
              }
          }
          optAttempts++;
        }
        
        for (let i = opts.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [opts[i], opts[j]] = [opts[j], opts[i]];
        }
    
        const newFood: FoodItem[] =[];
        opts.forEach((val, i) => {
          const pos = findSafeSpot(state.snake, newFood);
          if (pos) newFood.push({ id: Date.now() + i, ...pos, val, isCorrect: val === correctVal, kind: 'symmetry' });
        });
        setFood(newFood);
        state.food = newFood;
        questionStartTimeRef.current = Date.now();
        return;
    }

    setIsSymmetry(false);
    state.isSymmetry = false;
    
    if (!pool || pool.length === 0) {
        pool = state.dbReactions;
        if (!pool || pool.length === 0) return; 
    }

    const currentHistory = newRecord ?[...state.history, newRecord] : (state.history || []);
    const solvedSigs = new Set((currentHistory || []).filter(h => h && h.correct).map(h => `${h.rxnFrom}_${h.rxnTo}_${h.gameMode}`));

    const remainingQs: {rxn: Reaction, mode: GameMode}[] =[];
    pool.forEach(r => {
        let allowedModes: GameMode[] = ['product', 'cond', 'reactant', 'type'];
        if (r.distractors) {
            const explicitModes = Object.keys(r.distractors).filter(k => r.distractors![k as keyof typeof r.distractors]?.length) as GameMode[];
            if (explicitModes.length > 0) {
                allowedModes = explicitModes;
            }
        }
        
        if (allowedModes.includes('product') && !solvedSigs.has(`${r.from}_${r.to}_product`)) remainingQs.push({rxn: r, mode: 'product'});
        if (allowedModes.includes('cond') && !solvedSigs.has(`${r.from}_${r.to}_cond`)) remainingQs.push({rxn: r, mode: 'cond'});
        if (allowedModes.includes('reactant') && !solvedSigs.has(`${r.from}_${r.to}_reactant`)) remainingQs.push({rxn: r, mode: 'reactant'});
        if (allowedModes.includes('type') && !solvedSigs.has(`${r.from}_${r.to}_type`)) remainingQs.push({rxn: r, mode: 'type'});
    });

    if (remainingQs.length === 0) {
        if (state.isVersus) {
            const vWinner = state.score > state.score2 ? 'P1' : (state.score2 > state.score ? 'P2' : 'TIE');
            handleGameOver(true, vWinner);
        } else {
            handleGameOver(true);
        }
        return;
    }

    const nextQ = remainingQs[Math.floor(Math.random() * remainingQs.length)];
    const rxn = nextQ.rxn;
    const mode = nextQ.mode;

    setCurrentRxn(rxn);
    setGameMode(mode);
    state.currentRxn = rxn;
    state.gameMode = mode;

    let correctVal: string;
    if (mode === 'product') correctVal = rxn.to;
    else if (mode === 'cond') correctVal = JSON.stringify(rxn.cond);
    else if (mode === 'type') correctVal = rxn.type;
    else correctVal = rxn.from;

    const diff = state.settings.difficulty;
    const { options: targetCount } = DIFFICULTY_CONFIG[diff];
    const opts = [correctVal];
    const distPool = getDistractorPool(mode, rxn, state);

    let optAttempts = 0;
    while (opts.length < targetCount && distPool.length > 0 && optAttempts < 50) {
      const rand = distPool[Math.floor(Math.random() * distPool.length)];
      if (!opts.includes(rand as string)) opts.push(rand as string);
      optAttempts++;
    }
    
    // Shuffle options so correct answer isn't always first
    for (let i = opts.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [opts[i], opts[j]] = [opts[j], opts[i]];
    }

    const newFood: FoodItem[] =[];
    opts.forEach((val, i) => {
      const pos = findSafeSpot(state.snake, newFood);
      if (pos) newFood.push({ id: Date.now() + i, ...pos, val, isCorrect: val === correctVal, kind: mode });
    });
    setFood(newFood);
    state.food = newFood;
    questionStartTimeRef.current = Date.now();
  };

  const spawnDistractors = (count: number) => {
    const state = stateRef.current;
    const mode = state.gameMode;
    
    let distPool: string[] = [];
    if (mode === 'symmetry') {
        const sym = state.currentSymmetry;
        if (!sym) return;
        const missing = sym.elements || [];
        distPool = [...sym.wrong];
        const globalWrongPool = ['E', 'C₂', 'C₃', 'C₄', 'C₅', 'C₆', 'i', 'σh', 'σv', 'σd', 'S₃', 'S₄', 'S₆', 'S₈', 'Oh', 'Td', 'D∞h', 'C∞v', 'D3h', 'C2v'];
        distPool.push(...globalWrongPool);
        distPool = distPool.filter(c => !missing.includes(c));
    } else {
        const rxn = state.currentRxn;
        if (!rxn) return;
        distPool = getDistractorPool(mode, rxn, state);
    }
    
    if (distPool.length === 0) return;

    setFood(prev => {
        const nextFood = [...prev];
        const existingVals = nextFood.map(f => f.val);
        let attempts = 0;
        for (let i = 0; i < count; i++) {
             if (attempts > 50) break;
             const val = distPool[Math.floor(Math.random() * distPool.length)];
             if (existingVals.includes(val)) {
                 attempts++;
                 i--;
                 continue;
             }
             const pos = findSafeSpot(state.snake, nextFood); 
             if (pos) { 
                 nextFood.push({ id: Date.now() + i, ...pos, val, isCorrect: false, kind: mode }); 
                 existingVals.push(val);
             }
             else { attempts++; i--; }
        }
        return nextFood;
    });
  };

  const initGame = useCallback((mode: 'SINGLE' | 'VERSUS' | 'TUTORIAL' = 'SINGLE') => {
    const tutorial = mode === 'TUTORIAL';
    const versus = mode === 'VERSUS';
    gameIdRef.current = Date.now();
    hasSavedScoreRef.current = false;
    const state = stateRef.current;
    
    setIsTutorial(tutorial);
    setIsVersus(versus);
    
    state.isTutorial = tutorial;
    state.isVersus = versus;
    
    setShowControls(!versus);
    setTutorialStep(0);
    tutorialTimerRef.current = 0;
    setAiReportAnalysis(null);
    
    const pool = getFilteredReactions();
    const symPool = getFilteredSymmetry();
    const selected = state.settings.selectedChapters;
    const hasSymmetry = symPool.length > 0;
    if (!tutorial && !hasSymmetry && pool.length === 0) { showAlert(getLocalizedUI('ALERT_NO_Q', state.settings.language)); return; }
    const { w, h } = gridRef.current;
    if (w <= 0 || h <= 0) return;
    
    const startX = versus ? Math.floor(w / 4) + 0.5 : Math.floor(w / 2) + 0.5;
    const startY = Math.floor(h / 2) + 2.5;
    const initialSnake =[{ x: startX, y: startY }, { x: startX, y: startY + 1 }, { x: startX, y: startY + 2 }];
    
    let initialSnake2: Point[] = [];
    if (versus) {
        const startX2 = Math.floor(w * 3 / 4) + 0.5;
        initialSnake2 = [{ x: startX2, y: startY }, { x: startX2, y: startY + 1 }, { x: startX2, y: startY + 2 }];
    }
    
    state.snake = initialSnake;
    state.snake2 = initialSnake2;
    state.direction = tutorial ? { x: 0, y: 0 } : { x: 0, y: -1 };
    state.direction2 = { x: 0, y: -1 };
    state.nextDir = tutorial ? { x: 0, y: 0 } : { x: 0, y: -1 };
    state.nextDir2 = { x: 0, y: -1 };
    state.food =[];
    state.gameState = 'PLAYING';
    state.score = 0;
    state.score2 = 0;
    state.combo = 0;
    state.combo2 = 0;
    state.maxCombo = 0;
    state.maxCombo2 = 0;
    state.currentRxn = null;
    state.history =[];
    state.menuPage = 'MAIN';
    state.menuIndex = 0;
    state.timeLeft = state.settings.timeLimitMode ? (state.settings.timeLimitDuration || 180) : 0;
    state.isTutorial = tutorial;
    state.isVersus = versus;
    state.tutorialStep = 0;

    lastTimeRef.current = performance.now();
    lastDirAngle.current = Math.atan2(-1, 0); 
    setSnake(initialSnake);
    setSnake2(initialSnake2);
    setDirection(tutorial ? { x: 0, y: 0 } : { x: 0, y: -1 });
    setDirection2({ x: 0, y: -1 });
    setNextDir(tutorial ? { x: 0, y: 0 } : { x: 0, y: -1 });
    setNextDir2({ x: 0, y: -1 });
    setScore(0);
    setScore2(0);
    setTimeLeft(state.settings.timeLimitMode && !tutorial ? (state.settings.timeLimitDuration || 180) : 0);
    setCombo(0);
    setCombo2(0);
    setMaxCombo(0);
    setMaxCombo2(0);
    setIsWin(false); 
    floatsRef.current = []; 
    particlesRef.current = []; 
    setHistory([]);
    setGameState('PLAYING'); 
    
    if (tutorial) {
        setCurrentRxn(null);
        setFood([]);
    } else {
        nextQuestion(pool);
    }
    
    play('select');
    setTimeout(() => vibrate([50, 30, 50]), 10);
  },[getFilteredReactions]);

  useEffect(() => {
      if (pendingStart && stateRef.current.settings.selectedChapters.includes(pendingStart)) {
          const hasNew = stateRef.current.dbReactions.some(r => r.bankId === pendingStart) || stateRef.current.dbSymmetry.some(s => s.bankId === pendingStart);
          if (hasNew) {
              initGame('SINGLE');
              setPendingStart(null);
          }
      }
  }, [dbReactions, dbSymmetry, settings.selectedChapters, pendingStart, initGame]);

  const gameLoopRef = useRef<((time: number) => void) | null>(null);
  
  gameLoopRef.current = (time: number) => {
    try {
        const delta = time - lastTimeRef.current;
        lastTimeRef.current = time;

        const state = stateRef.current; 

        const gamepads = navigator.getGamepads ? navigator.getGamepads() :[];
        let gp = null;
        if (activeGamepadIndexRef.current !== null && gamepads[activeGamepadIndexRef.current]) {
            gp = gamepads[activeGamepadIndexRef.current];
        } else {
            gp = gamepads.find(g => g !== null && g.connected);
            if (gp) activeGamepadIndexRef.current = gp.index; 
        }

        if (gp) {
            let dx = gp.axes[0] || 0;
            let dy = gp.axes[1] || 0;

            if (gp.buttons[12]?.pressed) dy = -1;
            if (gp.buttons[13]?.pressed) dy = 1;
            if (gp.buttons[14]?.pressed) dx = -1;
            if (gp.buttons[15]?.pressed) dx = 1;

            const deadzone = 0.2;
            if (Math.abs(dx) > deadzone || Math.abs(dy) > deadzone) {
                stickInput.current = { x: dx, y: dy };
                if (state.gameState === 'PLAYING') {
                    setNextDir({ x: dx, y: dy });
                }
                usingGamepadRef.current = true;
            } else if (usingGamepadRef.current) {
                stickInput.current = { x: 0, y: 0 };
                usingGamepadRef.current = false;
            }

            const btnA = gp.buttons[0]?.pressed; 
            const btnB = gp.buttons[1]?.pressed; 
            const btnX = gp.buttons[2]?.pressed; 
            const btnY_face = gp.buttons[3]?.pressed; 
            const btnLB = gp.buttons[4]?.pressed; 
            const btnLT = gp.buttons[6]?.pressed; 
            const btnRB = gp.buttons[5]?.pressed; 
            const btnRT = gp.buttons[7]?.pressed; 
            const isAccelerating = btnRB || btnRT; 

            const btnSelect = gp.buttons[8]?.pressed; 
            const btnStart = gp.buttons[9]?.pressed;  
            const btnL3 = gp.buttons[10]?.pressed;
            const btnR3 = gp.buttons[11]?.pressed;

            if (btnA && !lastGamepadState.current.A) handleActionRef.current?.('A', true);
            if (btnB && !lastGamepadState.current.B) handleActionRef.current?.('B', true);
            if (btnX && !lastGamepadState.current.X) handleActionRef.current?.('X', true);
            if (btnY_face && !lastGamepadState.current.Y_face) handleActionRef.current?.('SELECT', true);
            if (btnLB && !lastGamepadState.current.LB) handleActionRef.current?.('MENU', true);
            if (btnLT && !lastGamepadState.current.LT) handleActionRef.current?.('RESET', true);
            if (btnStart && !lastGamepadState.current.Start) handleActionRef.current?.('START', true);
            if (btnSelect && !lastGamepadState.current.Select) handleActionRef.current?.('EXIT', true);
            if (btnL3 && !lastGamepadState.current.L3) handleActionRef.current?.('TIME', true);
            if (btnR3 && !lastGamepadState.current.R3) handleActionRef.current?.('TOGGLE_CONTROLS', true);

            if (isAccelerating && !lastGamepadState.current.Accel) setBoost(true);
            else if (!isAccelerating && lastGamepadState.current.Accel) setBoost(false);

            lastGamepadState.current = { 
                A: !!btnA, B: !!btnB, X: !!btnX, Y_face: !!btnY_face, 
                LB: !!btnLB, LT: !!btnLT, Accel: !!isAccelerating, 
                Start: !!btnStart, Select: !!btnSelect, L3: !!btnL3, R3: !!btnR3
            };
        }

        let gp2 = null;
        if (state.isVersus) {
            gp2 = gamepads.find(g => g !== null && g.connected && g.index !== gp?.index);
        }

        if (gp2) {
            let dx2 = gp2.axes[0] || 0;
            let dy2 = gp2.axes[1] || 0;

            if (gp2.buttons[12]?.pressed) dy2 = -1;
            if (gp2.buttons[13]?.pressed) dy2 = 1;
            if (gp2.buttons[14]?.pressed) dx2 = -1;
            if (gp2.buttons[15]?.pressed) dx2 = 1;

            const deadzone = 0.2;
            if (Math.abs(dx2) > deadzone || Math.abs(dy2) > deadzone) {
                if (state.gameState === 'PLAYING') {
                    setNextDir2({ x: dx2, y: dy2 });
                }
            }

            const btnR3_2 = gp2.buttons[11]?.pressed;
            if (btnR3_2 && !lastGamepadState2.current.R3) handleActionRef.current?.('TOGGLE_CONTROLS', true);
            
            const btnRB2 = gp2.buttons[5]?.pressed;
            const btnRT2 = gp2.buttons[7]?.pressed;
            const isAccelerating2 = btnRB2 || btnRT2;
            if (isAccelerating2 && !lastGamepadState2.current.Accel) setBoost2(true);
            else if (!isAccelerating2 && lastGamepadState2.current.Accel) setBoost2(false);

            const btnStart2 = gp2.buttons[9]?.pressed;
            if (btnStart2 && !lastGamepadState2.current.Start) handleActionRef.current?.('START', true);

            lastGamepadState2.current = { R3: !!btnR3_2, Accel: !!isAccelerating2, Start: !!btnStart2 };
        }

        if (state.gameState === 'REPORT') {
            const { y } = stickInput.current;
            if (Math.abs(y) > 0.3 && reportScrollRef.current) reportScrollRef.current.scrollTop += y * 12; 
        }

        if (state.gameState === 'MENU' || state.gameState === 'GAMEOVER') {
            const { x, y } = stickInput.current;
            if (state.menuPage === 'ABOUT') {
                if (Math.abs(y) > 0.3 && menuListRef.current) menuListRef.current.scrollTop += y * 12;
            } else {
                if (Math.abs(y) > 0.4) { 
                    const now = Date.now();
                    const startDelay = 400; const repeatRate = 180; 
                    if (lastInputTime.current === 0) {
                        lastInputTime.current = now; lastRepeatTime.current = now;
                        triggerMenuMove(y > 0 ? 1 : -1);
                    } else {
                        if (now - lastInputTime.current >= startDelay && now - lastRepeatTime.current >= repeatRate) {
                            lastRepeatTime.current = now;
                            triggerMenuMove(y > 0 ? 1 : -1);
                        }
                    }
                } else if (Math.abs(x) > 0.4 && state.gameState === 'MENU') {
                    const now = Date.now();
                    const startDelay = 400; const repeatRate = 180; 
                    if (lastInputTime.current === 0) {
                        lastInputTime.current = now; lastRepeatTime.current = now;
                        handleMenuAdjust(x > 0 ? 1 : -1);
                    } else {
                        if (now - lastInputTime.current >= startDelay && now - lastRepeatTime.current >= repeatRate) {
                            lastRepeatTime.current = now;
                            handleMenuAdjust(x > 0 ? 1 : -1);
                        }
                    }
                } else { lastInputTime.current = 0; lastRepeatTime.current = 0; }
            }
        }
        
        if (state.gameState === 'PLAYING') {
            if (state.isTutorial) {
                if (state.tutorialStep === 0 && (state.direction.x !== 0 || state.direction.y !== 0)) {
                    state.tutorialStep = 1;
                    setTutorialStep(1);
                    const rxn = {
                        chapter: 'tutorial', type: 'Substitution',
                        from: 'CH4', to: 'CH3Cl',
                        cond: {zh: 'Cl₂, 光照', en: 'Cl₂, Light'}
                    };
                    state.currentRxn = rxn;
                    setCurrentRxn(rxn);
                    state.gameMode = 'product';
                    setGameMode('product');
                    const newFood: FoodItem[] = [];
                    const pos1 = findSafeSpot(state.snake, newFood) || { x: 7, y: 5 };
                    newFood.push({ id: 1, ...pos1, val: 'CH3Cl', isCorrect: true, kind: 'product' as const });
                    const pos2 = findSafeSpot(state.snake, newFood) || { x: 12, y: 10 };
                    newFood.push({ id: 2, ...pos2, val: 'C2H6', isCorrect: false, kind: 'product' as const });
                    state.food = newFood;
                    setFood(newFood);
                }
                if (state.tutorialStep === 2) {
                    tutorialTimerRef.current -= delta;
                    if (tutorialTimerRef.current <= 0) {
                        state.tutorialStep = 3;
                        setTutorialStep(3);
                        const rxn = {
                            chapter: 'tutorial', type: 'Addition',
                            from: 'C2H4', to: 'C2H6',
                            cond: {zh: 'H₂, Ni, 加热', en: 'H₂, Ni, Heat'}
                        };
                        state.currentRxn = rxn;
                        setCurrentRxn(rxn);
                        const newFood: FoodItem[] = [];
                        const pos3 = findSafeSpot(state.snake, newFood) || { x: 7, y: 7 };
                        newFood.push({ id: 3, ...pos3, val: 'CH3Cl', isCorrect: false, kind: 'product' as const });
                        state.food = newFood;
                        setFood(newFood);
                    }
                }
                if (state.tutorialStep === 4) {
                    tutorialTimerRef.current -= delta;
                    if (tutorialTimerRef.current <= 0) {
                        state.tutorialStep = 5;
                        setTutorialStep(5);
                        const rxn = {
                            chapter: 'tutorial', type: 'Addition',
                            from: 'C2H4', to: 'C2H6',
                            cond: {zh: 'H₂, Ni, 加热', en: 'H₂, Ni, Heat'}
                        };
                        state.currentRxn = rxn;
                        setCurrentRxn(rxn);
                        state.gameMode = 'cond';
                        setGameMode('cond');
                        const newFood: FoodItem[] = [];
                        const pos4 = findSafeSpot(state.snake, newFood) || { x: 5, y: 12 };
                        newFood.push({ id: 4, ...pos4, val: 'H₂, Ni, 加热', isCorrect: true, kind: 'cond' as const });
                        const pos5 = findSafeSpot(state.snake, newFood) || { x: 10, y: 5 };
                        newFood.push({ id: 5, ...pos5, val: 'Cl₂, 光照', isCorrect: false, kind: 'cond' as const });
                        state.food = newFood;
                        setFood(newFood);
                    }
                }
                if (state.tutorialStep === 6) {
                    tutorialTimerRef.current -= delta;
                    if (tutorialTimerRef.current <= 0) {
                        state.tutorialStep = 7;
                        setTutorialStep(7);
                        const rxn = {
                            chapter: 'tutorial', type: 'Substitution',
                            from: 'CH4', to: 'CH3Cl',
                            cond: {zh: 'Cl₂, 光照', en: 'Cl₂, Light'}
                        };
                        state.currentRxn = rxn;
                        setCurrentRxn(rxn);
                        state.gameMode = 'reactant';
                        setGameMode('reactant');
                        const newFood: FoodItem[] = [];
                        const pos6 = findSafeSpot(state.snake, newFood) || { x: 8, y: 8 };
                        newFood.push({ id: 6, ...pos6, val: 'CH4', isCorrect: true, kind: 'reactant' as const });
                        const pos7 = findSafeSpot(state.snake, newFood) || { x: 3, y: 14 };
                        newFood.push({ id: 7, ...pos7, val: 'C2H4', isCorrect: false, kind: 'reactant' as const });
                        state.food = newFood;
                        setFood(newFood);
                    }
                }
                if (state.tutorialStep === 8) {
                    tutorialTimerRef.current -= delta;
                    if (tutorialTimerRef.current <= 0) {
                        state.tutorialStep = 9;
                        setTutorialStep(9);
                        state.food = [];
                        setFood([]);
                        state.currentRxn = null;
                        setCurrentRxn(null);
                        tutorialTimerRef.current = 5000;
                    }
                }
                if (state.tutorialStep === 9) {
                    tutorialTimerRef.current -= delta;
                    if (tutorialTimerRef.current <= 0) {
                        state.tutorialStep = 10;
                        setTutorialStep(10);
                        tutorialTimerRef.current = 6000;
                    }
                }
                if (state.tutorialStep === 10) {
                    tutorialTimerRef.current -= delta;
                    if (tutorialTimerRef.current <= 0) {
                        state.tutorialStep = 11;
                        setTutorialStep(11);
                        tutorialTimerRef.current = 6000;
                    }
                }
                if (state.tutorialStep === 11) {
                    tutorialTimerRef.current -= delta;
                    if (tutorialTimerRef.current <= 0) {
                        state.tutorialStep = 12;
                        setTutorialStep(12);
                    }
                }
            }
            
            const config = DIFFICULTY_CONFIG[state.settings.difficulty];
            const moveSpeed1 = config.speed * (isBoostingRef.current ? 2.5 : 1.0) * (delta / 1000);
            const moveSpeed2 = config.speed * (isBoosting2Ref.current ? 2.5 : 1.0) * (delta / 1000);
            
            if (isBoostingRef.current && time % 150 < 20) play('boost');
            if (state.isVersus && isBoosting2Ref.current && time % 150 < 20) play('boost');

            const processSnake = (
                currentSnake: Point[], currentNextDir: Point, currentDir: Point,
                setDirFn: (d: Point) => void, setSnakeFn: (s: Point[]) => void,
                scoreVal: number, setScoreFn: any,
                comboVal: number, setComboFn: any,
                setMaxComboFn: any,
                isPlayer2: boolean,
                otherSnake: Point[] | null,
                moveSpeed: number
            ) => {
                let newDir = { ...currentDir };
                if (Math.abs(currentNextDir.x) > 0.1 || Math.abs(currentNextDir.y) > 0.1) {
                    const len = Math.sqrt(currentNextDir.x**2 + currentNextDir.y**2);
                    if (len > 0.1) {
                        const ndx = currentNextDir.x / len;
                        const ndy = currentNextDir.y / len;

                        let finalDx = ndx;
                        let finalDy = ndy;
                        let shouldUpdate = true;

                        if (currentSnake.length > 1) {
                            const head = currentSnake[0];
                            const neck = currentSnake[1];
                            let bdx = head.x - neck.x;
                            let bdy = head.y - neck.y;
                            
                            if (bdx > state.grid.w / 2) bdx -= state.grid.w;
                            else if (bdx < -state.grid.w / 2) bdx += state.grid.w;
                            if (bdy > state.grid.h / 2) bdy -= state.grid.h;
                            else if (bdy < -state.grid.h / 2) bdy += state.grid.h;

                            const blen = Math.sqrt(bdx*bdx + bdy*bdy);
                            if (blen > 0.01) {
                                const nx = bdx / blen;
                                const ny = bdy / blen;
                                const dot = ndx * nx + ndy * ny;
                                
                                if (dot < -0.1) {
                                    let px = ndx - dot * nx;
                                    let py = ndy - dot * ny;
                                    const plen = Math.sqrt(px*px + py*py);
                                    if (plen > 0.2) {
                                        finalDx = px / plen;
                                        finalDy = py / plen;
                                    } else {
                                        shouldUpdate = false;
                                    }
                                }
                            }
                        }

                        if (shouldUpdate) {
                            newDir = { x: finalDx, y: finalDy };
                            setDirFn(newDir);
                            if (!isPlayer2 && state.settings.vibration) {
                                const currentAngle = Math.atan2(finalDy, finalDx);
                                let angleDiff = Math.abs(currentAngle - lastDirAngle.current);
                                if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
                                if (angleDiff > 0.5) { vibrate(15); lastDirAngle.current = currentAngle; }
                            }
                        }
                    }
                }

                const head = currentSnake[0];
                let newX = head.x + newDir.x * moveSpeed;
                let newY = head.y + newDir.y * moveSpeed;

                if (newX < 0) newX += state.grid.w;
                if (newX >= state.grid.w) newX -= state.grid.w;
                if (newY < 0) newY += state.grid.h;
                if (newY >= state.grid.h) newY -= state.grid.h;

                const newHead: Point = { x: newX, y: newY };
                const newSnake: Point[] = [newHead];
                const segmentDist = 1.0; 

                for (let i = 1; i < currentSnake.length; i++) {
                    let curr = currentSnake[i];
                    const prev = newSnake[i-1];
                    let dx = prev.x - curr.x;
                    let dy = prev.y - curr.y;

                    if (dx > state.grid.w / 2) dx -= state.grid.w;
                    else if (dx < -state.grid.w / 2) dx += state.grid.w;
                    if (dy > state.grid.h / 2) dy -= state.grid.h;
                    else if (dy < -state.grid.h / 2) dy += state.grid.h;

                    const dist = Math.sqrt(dx*dx + dy*dy);
                    if (dist > segmentDist) {
                        const ratio = (dist - segmentDist) / dist;
                        let moveX = dx * ratio; let moveY = dy * ratio;
                        let nextX = curr.x + moveX; let nextY = curr.y + moveY;

                        if (nextX < 0) nextX += state.grid.w;
                        if (nextX >= state.grid.w) nextX -= state.grid.w;
                        if (nextY < 0) nextY += state.grid.h;
                        if (nextY >= state.grid.h) nextY -= state.grid.h;
                        newSnake.push({ x: nextX, y: nextY, birthTime: curr.birthTime });
                    } else {
                        newSnake.push(curr);
                    }
                }

                const checkCollision = (headStart: Point, headEnd: Point, target: Point, gridW: number, gridH: number, radiusSq: number) => {
                    let dx = target.x - headStart.x;
                    let dy = target.y - headStart.y;
                    if (dx > gridW / 2) dx -= gridW;
                    else if (dx < -gridW / 2) dx += gridW;
                    if (dy > gridH / 2) dy -= gridH;
                    else if (dy < -gridH / 2) dy += gridH;

                    let ex = headEnd.x - headStart.x;
                    let ey = headEnd.y - headStart.y;
                    if (ex > gridW / 2) ex -= gridW;
                    else if (ex < -gridW / 2) ex += gridW;
                    if (ey > gridH / 2) ey -= gridH;
                    else if (ey < -gridH / 2) ey += gridH;

                    const lenSq = ex * ex + ey * ey;
                    let t = 0;
                    if (lenSq > 0.0001) {
                        t = (dx * ex + dy * ey) / lenSq;
                        t = Math.max(0, Math.min(1, t));
                    }

                    const cx = t * ex;
                    const cy = t * ey;

                    const distSq = (dx - cx) * (dx - cx) + (dy - cy) * (dy - cy);
                    return distSq < radiusSq;
                };

                let hitSelf = false;
                for (let i = 5; i < newSnake.length; i++) {
                    if (checkCollision(head, newHead, newSnake[i], state.grid.w, state.grid.h, 0.3)) {
                        hitSelf = true; break;
                    }
                }

                let hitOther = false;
                if (otherSnake) {
                    for (let i = 0; i < otherSnake.length; i++) {
                        if (checkCollision(head, newHead, otherSnake[i], state.grid.w, state.grid.h, 0.3)) {
                            hitOther = true; break;
                        }
                    }
                }

                if (hitSelf || hitOther) {
                    if (state.isVersus) {
                        handleGameOver(true, isPlayer2 ? 'P1' : 'P2');
                        return newSnake;
                    } else {
                        handleGameOver();
                        return newSnake;
                    }
                } else {
                    const eatRadius = 0.8;
                    let ateIdx = -1;
                    for(let i=0; i<state.food.length; i++) {
                        if (checkCollision(head, newHead, state.food[i], state.grid.w, state.grid.h, eatRadius * eatRadius)) {
                            ateIdx = i; break;
                        }
                    }

                    if (ateIdx !== -1) {
                        const foodItem = state.food[ateIdx];
                        const rxn = state.currentRxn;
                        const mode = state.gameMode;
                        
                        if (state.isSymmetry && state.currentSymmetry) {
                            if (foodItem.isCorrect) {
                                const newCollected = [...state.collectedElements, foodItem.val];
                                setCollectedElements(newCollected);
                                state.collectedElements = newCollected;
                                
                                const isComplete = newCollected.length === state.currentSymmetry.elements.length;
                                const floatGain = (isComplete ? 50 : 10) + comboVal * 2;
                                
                                if (isComplete) {
                                    setScoreFn((s: number) => s + floatGain);
                                    play('start');
                                    spawnParticles(foodItem.x, foodItem.y, '#e056fd', 20);
                                    
                                    const duration = Date.now() - questionStartTimeRef.current;
                                    const record: HistoryRecord = {
                                        id: Date.now(), timestamp: Date.now(),
                                        question: state.currentSymmetry.molecule,
                                        answer: state.currentSymmetry.elements.join(', '),
                                        expected: state.currentSymmetry.elements.join(', '),
                                        correct: true,
                                        chapter: 'symmetry', type: 'Symmetry', duration: duration,
                                        rxnFrom: state.currentSymmetry.molecule, rxnTo: state.currentSymmetry.pointGroup, gameMode: 'symmetry'
                                    };
                                    if (!isPlayer2) setHistory(prev => [...prev, record]);
                                    
                                    nextQuestion();
                                } else {
                                    setScoreFn((s: number) => s + floatGain);
                                    play('eat');
                                    spawnParticles(foodItem.x, foodItem.y, '#e056fd', 10);
                                    
                                    const { options: targetCount } = DIFFICULTY_CONFIG[state.settings.difficulty];
                                    const missing = (state.currentSymmetry?.elements || []).filter(e => !newCollected.includes(e));
                                    const correctVal = missing[Math.floor(Math.random() * missing.length)];
                                    const opts = [correctVal];
                                    const distPool = [...state.currentSymmetry.wrong];
                                    
                                    let optAttempts = 0;
                                    while (opts.length < targetCount && distPool.length > 0 && optAttempts < 50) {
                                      const rand = distPool[Math.floor(Math.random() * distPool.length)];
                                      if (!opts.includes(rand as string)) opts.push(rand as string);
                                      optAttempts++;
                                    }
                                    
                                    for (let i = opts.length - 1; i > 0; i--) {
                                        const j = Math.floor(Math.random() * (i + 1));
                                        [opts[i], opts[j]] = [opts[j], opts[i]];
                                    }
                                
                                    const newFood: FoodItem[] =[];
                                    opts.forEach((val, i) => {
                                      const pos = findSafeSpot(newSnake, newFood);
                                      if (pos) newFood.push({ id: Date.now() + i, ...pos, val, isCorrect: val === correctVal, kind: 'symmetry' });
                                    });
                                    setFood(newFood);
                                    state.food = newFood;
                                }
                                
                                setComboFn((c: number) => { const next = c + 1; setMaxComboFn((m: number) => Math.max(m, next)); return next; });
                                floatsRef.current.push(
                                    { id: Date.now() + (isPlayer2 ? 100 : 0), x: foodItem.x, y: foodItem.y, text: `+${floatGain}`, color: isPlayer2 ? '#306230' : themeColors.darkHex, life: 60, fontSize: 16 },
                                    { id: Date.now() + 1 + (isPlayer2 ? 100 : 0), x: foodItem.x, y: foodItem.y - 1, text: state.settings.language === 'zh' ? '对称元素' : 'Symmetry', color: isPlayer2 ? '#306230' : themeColors.darkHex, life: 80, fontSize: 12 }
                                );
                                
                                const tail = newSnake[newSnake.length-1];
                                newSnake.push({...tail, birthTime: performance.now()});
                            } else {
                                const penalty = 10 + comboVal * 2;
                                setScoreFn((s: number) => Math.max(0, s - penalty));
                                play('error');
                                setComboFn(0);
                                spawnParticles(foodItem.x, foodItem.y, '#ef4444', 15);
                                if (!isPlayer2) { setShake(20); setFlash({color: themeColors.darkHex, opacity: 0.5}); }
                                floatsRef.current.push(
                                    { id: Date.now() + (isPlayer2 ? 100 : 0), x: foodItem.x, y: foodItem.y, text: `-${penalty}`, color: '#ef4444', life: 60, fontSize: 16 }
                                );
                                newSnake.pop();
                                
                                if (newSnake.length === 0) {
                                    handleGameOver();
                                    return newSnake;
                                }
                                
                                const duration = Date.now() - questionStartTimeRef.current;
                                const record: HistoryRecord = {
                                    id: Date.now(), timestamp: Date.now(),
                                    question: state.currentSymmetry.molecule,
                                    answer: foodItem.val,
                                    expected: state.currentSymmetry.elements.join(', '),
                                    correct: false,
                                    chapter: 'symmetry', type: 'Symmetry', duration: duration,
                                    rxnFrom: state.currentSymmetry.molecule, rxnTo: state.currentSymmetry.pointGroup, gameMode: 'symmetry'
                                };
                                if (!isPlayer2) setHistory(prev => [...prev, record]);
                                
                                const { options: targetCount } = DIFFICULTY_CONFIG[state.settings.difficulty];
                                const missing = (state.currentSymmetry?.elements || []).filter(e => !state.collectedElements.includes(e));
                                const correctVal = missing[Math.floor(Math.random() * missing.length)];
                                const opts = [correctVal];
                                const distPool = [...state.currentSymmetry.wrong];
                                
                                let optAttempts = 0;
                                while (opts.length < targetCount && distPool.length > 0 && optAttempts < 50) {
                                  const rand = distPool[Math.floor(Math.random() * distPool.length)];
                                  if (!opts.includes(rand as string)) opts.push(rand as string);
                                  optAttempts++;
                                }
                                
                                for (let i = opts.length - 1; i > 0; i--) {
                                    const j = Math.floor(Math.random() * (i + 1));
                                    [opts[i], opts[j]] = [opts[j], opts[i]];
                                }
                            
                                const newFood: FoodItem[] =[];
                                opts.forEach((val, i) => {
                                  const pos = findSafeSpot(newSnake, newFood);
                                  if (pos) newFood.push({ id: Date.now() + i, ...pos, val, isCorrect: val === correctVal, kind: 'symmetry' });
                                });
                                setFood(newFood);
                                state.food = newFood;
                            }
                        } else if (rxn) {
                            let correctRaw: string;
                            if (mode === 'product') correctRaw = rxn.to;
                            else if (mode === 'cond') correctRaw = JSON.stringify(rxn.cond);
                            else if (mode === 'type') correctRaw = rxn.type;
                            else correctRaw = rxn.from;

                            let expectedStr: string;
                            if (mode === 'product' || mode === 'reactant') expectedStr = getComp(correctRaw, state.settings.language).formula;
                            else if (mode === 'type') expectedStr = state.settings.language === 'zh' ? (state.dbRxnTypes[correctRaw]?.zh || correctRaw) : (state.dbRxnTypes[correctRaw]?.en || correctRaw);
                            else if (mode === 'cond') {
                                try {
                                    const condObj = JSON.parse(correctRaw);
                                    expectedStr = state.settings.language === 'zh' ? condObj.zh : condObj.en;
                                } catch (e) {
                                    expectedStr = correctRaw;
                                }
                            }
                            else expectedStr = correctRaw;

                            let answerStr: string;
                            if (foodItem.kind === 'product' || foodItem.kind === 'reactant') answerStr = getComp(foodItem.val, state.settings.language).formula;
                            else if (foodItem.kind === 'type') answerStr = state.settings.language === 'zh' ? (state.dbRxnTypes[foodItem.val]?.zh || foodItem.val) : (state.dbRxnTypes[foodItem.val]?.en || foodItem.val);
                            else if (foodItem.kind === 'cond') {
                                try {
                                    const condObj = JSON.parse(foodItem.val);
                                    answerStr = state.settings.language === 'zh' ? condObj.zh : condObj.en;
                                } catch (e) {
                                    answerStr = foodItem.val;
                                }
                            }
                            else answerStr = foodItem.val;

                            const duration = Date.now() - questionStartTimeRef.current;
                            const record: HistoryRecord = {
                                id: Date.now(), timestamp: Date.now(),
                                question: mode === 'reactant' ? `${getComp(rxn.to, state.settings.language).formula}` : `${getComp(rxn.from, state.settings.language).formula}`,
                                answer: answerStr,
                                expected: expectedStr, correct: foodItem.isCorrect,
                                chapter: rxn.chapter, type: rxn.type, duration: duration,
                                rxnFrom: rxn.from, rxnTo: rxn.to, gameMode: mode
                            };
                            if (!isPlayer2) setHistory(prev => [...prev, record]);

                            if (foodItem.isCorrect) {
                                play('eat'); if(!isPlayer2) vibrate([80, 50, 80], 'eat'); 
                                spawnParticles(foodItem.x, foodItem.y, isPlayer2 ? '#306230' : themeColors.darkHex, 12);
                                if (!isPlayer2) { setShake(5); setFlash({color: '#ffffff', opacity: 0.2}); }
                                const gain = 10 + comboVal * 2;
                                setScoreFn((s: number) => s + gain);
                                setComboFn((c: number) => { const next = c + 1; setMaxComboFn((m: number) => Math.max(m, next)); return next; });
                                floatsRef.current.push(
                                    { id: Date.now() + (isPlayer2 ? 100 : 0), x: foodItem.x, y: foodItem.y, text: `+${gain}`, color: isPlayer2 ? '#306230' : themeColors.darkHex, life: 60, fontSize: 16 },
                                    { id: Date.now() + 1 + (isPlayer2 ? 100 : 0), x: foodItem.x, y: foodItem.y - 1, text: state.settings.language === 'zh' ? (state.dbRxnTypes[rxn.type]?.zh || rxn.type) : (state.dbRxnTypes[rxn.type]?.en || rxn.type), color: isPlayer2 ? '#306230' : themeColors.darkHex, life: 80, fontSize: 12 }
                                );
                                if (!state.isTutorial) {
                                    nextQuestion(getFilteredReactions(), record);
                                }
                                const tail = newSnake[newSnake.length-1];
                                newSnake.push({...tail, birthTime: performance.now()});
                                
                                if (state.isTutorial) {
                                    if (state.tutorialStep === 1) {
                                        state.tutorialStep = 2;
                                        setTutorialStep(2);
                                        tutorialTimerRef.current = 3000;
                                        state.food = [];
                                        setFood([]);
                                    } else if (state.tutorialStep === 3) {
                                        state.food = [];
                                        setFood([]);
                                    } else if (state.tutorialStep === 5) {
                                        state.tutorialStep = 6;
                                        setTutorialStep(6);
                                        tutorialTimerRef.current = 3000;
                                        state.food = [];
                                        setFood([]);
                                    } else if (state.tutorialStep === 7) {
                                        state.tutorialStep = 8;
                                        setTutorialStep(8);
                                        tutorialTimerRef.current = 3000;
                                        state.food = [];
                                        setFood([]);
                                    }
                                }
                            } else {
                                play('wrong'); if(!isPlayer2) vibrate([400], 'die'); 
                                spawnParticles(foodItem.x, foodItem.y, '#0d1704', 16);
                                if (!isPlayer2) { setShake(20); setFlash({color: themeColors.darkHex, opacity: 0.5}); }
                                setComboFn(0); setScoreFn((s: number) => s - 5); 
                                newSnake.pop(); 
                                
                                if (state.isTutorial) {
                                    if (newSnake.length === 0) newSnake.push({x: 7, y: 15});
                                    if (state.tutorialStep === 1 || state.tutorialStep === 5 || state.tutorialStep === 7) {
                                        const nextFood = [...state.food];
                                        nextFood.splice(ateIdx, 1);
                                        state.food = nextFood;
                                        setFood(nextFood);
                                    } else if (state.tutorialStep === 3) {
                                        state.tutorialStep = 4;
                                        setTutorialStep(4);
                                        tutorialTimerRef.current = 4000;
                                        state.food = [];
                                        setFood([]);
                                    }
                                } else {
                                    if (newSnake.length === 0) { 
                                        if (state.isVersus) {
                                            handleGameOver(true, isPlayer2 ? 'P1' : 'P2');
                                            return newSnake;
                                        } else {
                                            handleGameOver(); return newSnake; 
                                        }
                                    }
                                    floatsRef.current.push(
                                        { id: Date.now() + (isPlayer2 ? 100 : 0), x: foodItem.x, y: foodItem.y, text: '-5', color: '#0d1704', life: 40, fontSize: 20 },
                                        { id: Date.now()+1 + (isPlayer2 ? 100 : 0), x: foodItem.x, y: foodItem.y - 1, text: state.settings.language === 'zh' ? '错误' : 'WRONG', color: themeColors.darkHex, life: 40, fontSize: 14 }
                                    );
                                    const nextFood = [...state.food];
                                    nextFood.splice(ateIdx, 1);
                                    setFood(nextFood);
                                    const { penalty } = DIFFICULTY_CONFIG[state.settings.difficulty];
                                    spawnDistractors(penalty);
                                }
                            }
                        }
                    }
                }
                setSnakeFn(newSnake);
                return newSnake;
            };

            state.snake = processSnake(
                state.snake, state.nextDir, state.direction,
                setDirection, setSnake,
                state.score, setScore,
                state.combo, setCombo, setMaxCombo, false,
                state.isVersus ? state.snake2 : null,
                moveSpeed1
            );

            if (state.isVersus) {
                state.snake2 = processSnake(
                    state.snake2, state.nextDir2, state.direction2,
                    setDirection2, setSnake2,
                    state.score2, setScore2,
                    state.combo2, setCombo2, setMaxCombo2, true,
                    state.snake,
                    moveSpeed2
                );
            }
        }
        draw();
    } catch (e) {
        console.error("Game Loop Error (Recovered):", e);
    }
  };

  useEffect(() => {
      const globalLoopId = { current: 0 };
      const loop = (time: number) => {
          if (gameLoopRef.current) gameLoopRef.current(time);
          globalLoopId.current = requestAnimationFrame(loop);
      };
      globalLoopId.current = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(globalLoopId.current);
  },[]);

  function triggerMenuMove(yDir: number) {
        play('move');
        let max = isLargeScreen ? 9 : 8; 
        if (stateRef.current.gameState === 'GAMEOVER') max = 4;
        else if (stateRef.current.menuPage === 'CHAPTERS') max = stateRef.current.availableChapters.length + 1; 
        else if (stateRef.current.menuPage === 'DIFFICULTY') max = 5; 
        else if (stateRef.current.menuPage === 'SETTINGS') max = 11;
        else if (stateRef.current.menuPage === 'ABOUT') max = 1;
        else if (stateRef.current.menuPage === 'LEADERBOARD') max = 1;
        setMenuIndex(i => (i + yDir + max) % max);
        vibrate(10);
  }

  const handleGameOver = (win: boolean = false, vWinner: 'P1' | 'P2' | 'TIE' | null = null) => {
    play(win ? 'hint' : 'die');
    vibrate(win ?[100, 50, 100, 50, 100] :[500, 100, 500, 100, 1000], win ? 'win' : 'die'); 
    setIsWin(win);
    setVersusWinner(vWinner);
    
    // Explosion effect
    if (!win) {
        const currentSnake = [...stateRef.current.snake];
        if (currentSnake.length > 0) {
            currentSnake.forEach((segment, i) => {
                 spawnParticles(segment.x, segment.y, themeColors.darkHex, 12);
            });
        }
        setSnake([]); // Hide snake
    }

    setGameState('GAMEOVER');
    setMenuIndex(0);
    setShowGameOverOverlay(false);
    setShake(win ? 10 : 50);
    setFlash({color: win ? '#ffffff' : themeColors.lightHex, opacity: 0.8});
    setHighScore(prev => Math.max(prev, stateRef.current.score));
    
    setTimeout(() => {
        setShowGameOverOverlay(true);
    }, 1500);
  };

  useEffect(() => {
    if (gameState === 'GAMEOVER' && !hasSavedScoreRef.current && score > 0) {
        hasSavedScoreRef.current = true;
        const entry: LeaderboardEntry = {
            id: gameIdRef.current,
            name: studentName || 'Anonymous',
            score: score,
            difficulty: settings.difficulty,
            chapters: settings.selectedChapters,
            date: Date.now(),
            timeLimitMode: settings.timeLimitMode
        };
        setLeaderboard(prev => {
            const newLb = [...prev, entry].sort((a, b) => b.score - a.score).slice(0, 100);
            try { localStorage.setItem('chemSnake_leaderboard', JSON.stringify(newLb)); } catch (e) {}
            return newLb;
        });
    }
  }, [gameState, score, settings, studentName]);

  useEffect(() => {
    if ((gameState === 'GAMEOVER' || gameState === 'REPORT' || gameState === 'INPUT_INFO') && hasSavedScoreRef.current) {
        setLeaderboard(prev => {
            const newLb = [...prev];
            const idx = newLb.findIndex(e => e.id === gameIdRef.current);
            if (idx >= 0 && newLb[idx].name !== (studentName || 'Anonymous')) {
                newLb[idx].name = studentName || 'Anonymous';
                try { localStorage.setItem('chemSnake_leaderboard', JSON.stringify(newLb)); } catch (e) {}
                return newLb;
            }
            return prev;
        });
    }
  }, [studentName, gameState]);

  useEffect(() => {
    // Use stateRef.current.isTutorial to avoid race condition where isTutorial state update lags behind gameState
    if (gameState === 'PLAYING' && settings.timeLimitMode && !stateRef.current.isTutorial) {
      if (timeLeft <= 0) {
        if (stateRef.current.isVersus) {
            const vWinner = score > score2 ? 'P1' : (score2 > score ? 'P2' : 'TIE');
            handleGameOver(true, vWinner);
        } else {
            handleGameOver(false);
        }
        return;
      }
      const timer = setTimeout(() => {
        if (timeLeft <= 10 && timeLeft > 5) {
            play('tick');
        } else if (timeLeft <= 5 && timeLeft > 0) {
            play('tick');
            setTimeout(() => play('tick'), 200);
            setTimeout(() => play('tick'), 400);
        }
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [gameState, settings.timeLimitMode, timeLeft]);

  const analysis = useMemo(() => {
    if (history.length === 0) return null;
    const typeStats: Record<string, { total: number; correct: number; time: number }> = {};
    const modeStats: Record<string, { total: number; correct: number; time: number }> = {};
    let totalTimeCorrect = 0;
    let correctCount = 0;
    let totalTimeIncorrect = 0;
    let incorrectCount = 0;

    history.forEach(h => {
        if (!typeStats[h.type]) typeStats[h.type] = { total: 0, correct: 0, time: 0 };
        if (!modeStats[h.gameMode]) modeStats[h.gameMode] = { total: 0, correct: 0, time: 0 };
        
        typeStats[h.type].total += 1;
        typeStats[h.type].time += h.duration;
        modeStats[h.gameMode].total += 1;
        modeStats[h.gameMode].time += h.duration;

        if (h.correct) {
            typeStats[h.type].correct += 1;
            modeStats[h.gameMode].correct += 1;
            totalTimeCorrect += h.duration;
            correctCount++;
        } else {
            totalTimeIncorrect += h.duration;
            incorrectCount++;
        }
    });

    const sortedTypes = Object.entries(typeStats).sort((a, b) => b[1].total - a[1].total);
    const sortedModes = Object.entries(modeStats).sort((a, b) => b[1].total - a[1].total);
    
    let weakness = '';
    let maxIncorrect = 0;
    sortedTypes.forEach(([type, stats]) => {
        const incorrect = stats.total - stats.correct;
        if (incorrect > maxIncorrect) {
            maxIncorrect = incorrect;
            weakness = type;
        }
    });

    let modeWeakness = '';
    let maxModeIncorrect = 0;
    sortedModes.forEach(([mode, stats]) => {
        const incorrect = stats.total - stats.correct;
        if (incorrect > maxModeIncorrect) {
            maxModeIncorrect = incorrect;
            modeWeakness = mode;
        }
    });

    return {
        typeStats: sortedTypes,
        modeStats: sortedModes,
        avgTimeCorrect: correctCount ? Math.round(totalTimeCorrect / correctCount / 1000 * 10) / 10 : 0,
        avgTimeIncorrect: incorrectCount ? Math.round(totalTimeIncorrect / incorrectCount / 1000 * 10) / 10 : 0,
        MostFrequent: sortedTypes.length > 0 ? sortedTypes[0][0] : '',
        weakness: maxIncorrect > 0 ? weakness : null,
        modeWeakness: maxModeIncorrect > 0 ? modeWeakness : null
    };
  }, [history]);

  const generateAIReportAnalysis = async () => {
      const env = (window as any).process?.env || {};
      const envApiKey = env.API_KEY || env.GEMINI_API_KEY || '';
      let effectiveApiKey = apiKey || envApiKey;
      
      if (!effectiveApiKey && llmProvider === 'gemini') {
          if ((window as any).aistudio) {
              try {
                  await (window as any).aistudio.openSelectKey();
                  const newEnv = (window as any).process?.env || {};
                  effectiveApiKey = apiKey || newEnv.API_KEY || newEnv.GEMINI_API_KEY || '';
              } catch (err) {
                  console.error('Failed to open key selector:', err);
              }
          }
          if (!effectiveApiKey) {
              showAlert(settings.language === 'zh' ? '请先在设置中配置 Gemini API Key' : 'Please configure Gemini API Key in settings');
              return null;
          }
      } else if (!apiKey && llmProvider !== 'gemini' && llmProvider !== 'custom') {
          showAlert(settings.language === 'zh' ? '请先在设置中配置 API Key' : 'Please configure API Key in settings');
          return null;
      }

      setIsGeneratingReport(true);
      try {
          const correctCount = history.filter(h => h.correct).length;
          const accuracy = history.length > 0 ? Math.round((correctCount / history.length) * 100) : 0;
          const promptText = `
          As an expert chemistry tutor, analyze the student's game performance data and provide a concise, encouraging, and targeted learning report.
          
          Student Name: ${studentName || 'Anonymous'}
          Score: ${score}
          Accuracy: ${accuracy}%
          Most Frequent Question Type: ${analysis?.MostFrequent || 'N/A'}
          Weakness (Most Incorrect Knowledge Point): ${analysis?.weakness || 'N/A'}
          Weakness (Most Incorrect Game Mode): ${analysis?.modeWeakness || 'N/A'}
          
          History Log (Sample of recent mistakes):
          ${JSON.stringify(history.filter(h => !h.correct).slice(-5).map(h => ({ mode: h.gameMode, q: h.question, exp: h.expected, ans: h.answer })))}
          
          Please provide the analysis in the language: ${settings.language === 'zh' ? 'Chinese' : 'English'}.
          Focus on the specific subjects they struggled with, explain why those mistakes might happen, and give 1-2 actionable tips to improve. Keep it under 150 words. Do not include any headers like [Analysis] or [分析], just output the text directly.
          `;
          
          let responseText = '';

          if (llmProvider === 'gemini') {
              const ai = new GoogleGenAI(effectiveApiKey ? { apiKey: effectiveApiKey } : {});
              const response = await ai.models.generateContent({
                  model: 'gemini-3.1-pro-preview',
                  contents: promptText,
              });
              responseText = response.text || '';
          } else {
              const providerConfig = llmProvider === 'custom' 
                  ? { baseUrl: customBaseUrl, model: customModel }
                  : LLM_PROVIDERS[llmProvider as keyof typeof LLM_PROVIDERS];
                  
              const body = {
                  model: providerConfig.model,
                  messages: [
                      {
                          role: 'user',
                          content: promptText
                      }
                  ],
                  max_tokens: 2048
              };

              const res = await fetch(providerConfig.baseUrl, {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${apiKey}`
                  },
                  body: JSON.stringify(body)
              });

              if (!res.ok) {
                  const errData = await res.json().catch(() => ({}));
                  throw new Error(errData.error?.message || `HTTP error ${res.status}`);
              }

              const data = await res.json();
              responseText = data.choices[0].message.content;
          }
          
          setAiReportAnalysis(responseText);
          return responseText;
      } catch (err: any) {
          console.error(err);
          showAlert(settings.language === 'zh' ? '生成报告失败: ' + err.message : 'Failed to generate report: ' + err.message);
          return null;
      } finally {
          setIsGeneratingReport(false);
      }
  };

  const generateReportText = (aiReport?: string | null) => {
      const correctCount = history.filter(h => h.correct).length;
      const accuracy = history.length > 0 ? Math.round((correctCount / history.length) * 100) : 0;
      const isZh = settings.language === 'zh';
      const diff = getLocalizedUI(`DIFF_${settings.difficulty}`, settings.language);
      
      let report = `=======================================\n`;
      report += isZh ? `🎓 CHEM-SNAKE 学习报告\n` : `🎓 CHEM-SNAKE LEARNING REPORT\n`;
      report += `=======================================\n`;
      report += isZh ? `👤 姓名: ${studentName || '学生'}\n` : `👤 Name: ${studentName || 'Student'}\n`;
      report += isZh ? `🆔 学号: ${studentId || '无'}\n` : `🆔 ID: ${studentId || 'N/A'}\n`;
      report += isZh ? `📅 日期: ${new Date().toLocaleString()}\n` : `📅 Date: ${new Date().toLocaleString()}\n`;
      report += isZh ? `⚙️ 难度: ${diff}\n` : `⚙️ Difficulty: ${diff}\n`;
      report += `---------------------------------------\n`;
      report += isZh ? `[综合表现]\n` : `[OVERALL PERFORMANCE]\n`;
      report += isZh ? `🏆 得分: ${score}\n` : `🏆 Score: ${score}\n`;
      report += isZh ? `✨ 最高连击: ${maxCombo}\n` : `✨ Max Combo: ${maxCombo}\n`;
      report += isZh ? `🎯 准确率: ${accuracy}% (${correctCount}/${history.length})\n` : `🎯 Accuracy: ${accuracy}% (${correctCount}/${history.length})\n`;

      if (analysis) {
        const weak = isZh ? (dbRxnTypes[analysis.MostFrequent]?.zh || analysis.MostFrequent) : (dbRxnTypes[analysis.MostFrequent]?.en || analysis.MostFrequent);
        
        const MODE_NAMES: Record<string, {zh: string, en: string}> = {
            'product': {zh: '猜产物', en: 'Guess Product'},
            'cond': {zh: '猜条件', en: 'Guess Condition'},
            'reactant': {zh: '猜反应物', en: 'Guess Reactant'},
            'type': {zh: '猜类型', en: 'Guess Type'},
            'symmetry': {zh: '猜对称性', en: 'Guess Symmetry'}
        };
        
        const weakMode = analysis.modeWeakness ? (isZh ? (MODE_NAMES[analysis.modeWeakness]?.zh || analysis.modeWeakness) : (MODE_NAMES[analysis.modeWeakness]?.en || analysis.modeWeakness)) : 'N/A';

        report += isZh ? `⏱️ 答对均时: ${analysis.avgTimeCorrect}s\n` : `⏱️ Avg Time (OK): ${analysis.avgTimeCorrect}s\n`;
        report += isZh ? `⏱️ 答错均时: ${analysis.avgTimeIncorrect}s\n` : `⏱️ Avg Time (X): ${analysis.avgTimeIncorrect}s\n`;
        report += isZh ? `📉 易错知识点: ${weak}\n` : `📉 Weakness: ${weak}\n`;
        report += isZh ? `📉 易错模式: ${weakMode}\n` : `📉 Weak Mode: ${weakMode}\n`;
        report += `---------------------------------------\n`;
        report += isZh ? `[模式掌握]\n` : `[MODE MASTERY]\n`;
        analysis.modeStats.forEach(([mode, stats]) => {
           const acc = Math.round((stats.correct / stats.total) * 100);
           const mName = isZh ? (MODE_NAMES[mode]?.zh || mode) : (MODE_NAMES[mode]?.en || mode);
           report += `▪ ${mName}:\n  ${stats.correct}/${stats.total} [${acc}%]\n`;
        });
        report += `---------------------------------------\n`;
        report += isZh ? `[知识点掌握]\n` : `[KNOWLEDGE MASTERY]\n`;
        analysis.typeStats.forEach(([type, stats]) => {
           const acc = Math.round((stats.correct / stats.total) * 100);
           const tName = isZh ? (dbRxnTypes[type]?.zh || type) : (dbRxnTypes[type]?.en || type);
           report += `▪ ${tName}:\n  ${stats.correct}/${stats.total} [${acc}%]\n`;
        });
      }

      const finalAiReport = aiReport !== undefined ? aiReport : aiReportAnalysis;
      if (finalAiReport) {
          report += `---------------------------------------\n`;
          report += isZh ? `[AI 学习建议]\n` : `[AI LEARNING ADVICE]\n`;
          report += `${finalAiReport}\n`;
      }

      report += `---------------------------------------\n`;
      report += isZh ? `[答题明细]\n` : `[HISTORY LOG]\n`;
      if (history.length === 0) {
          report += isZh ? `暂无数据\n` : `No Data\n`;
      } else {
          history.forEach((h, i) => {
              const mark = h.correct ? '✔' : '✘';
              const exp = !h.correct ? (isZh ? ` | 应答: ${h.expected}` : ` | Exp: ${h.expected}`) : '';
              report += `${i+1}. [${mark}] ${h.question} ➔ ${h.answer}${exp} (${(h.duration/1000).toFixed(1)}s)\n`;
          });
      }
      report += `=======================================\n`;
      report += `Generated by ChemSnake 🐍\n`;
      return report;
  };

  const sendReport = async () => {
    let currentAiReport = aiReportAnalysis;
    if (!currentAiReport && history.length > 0) {
        currentAiReport = await generateAIReportAnalysis();
    }
    const body = generateReportText(currentAiReport);
    const toEmail = settings.reportEmail ? encodeURIComponent(settings.reportEmail) : '';
    window.location.href = `mailto:${toEmail}?subject=${encodeURIComponent("ChemSnake Report")}&body=${encodeURIComponent(body)}`;
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
        if (successful) showAlert(getLocalizedUI('ALERT_COPIED', settings.language));
        else showAlert(getLocalizedUI('ALERT_COPY_FAIL', settings.language));
      } catch (err) {
        showAlert(getLocalizedUI('ALERT_COPY_FAIL', settings.language));
      }
      document.body.removeChild(textArea);
  }

  const copyReport = async () => {
      let currentAiReport = aiReportAnalysis;
      if (!currentAiReport && history.length > 0) {
          currentAiReport = await generateAIReportAnalysis();
      }
      const body = generateReportText(currentAiReport);
      if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(body)
            .then(() => showAlert(getLocalizedUI('ALERT_COPIED', settings.language)))
            .catch(err => fallbackCopyTextToClipboard(body));
      } else {
          fallbackCopyTextToClipboard(body);
      }
  };

  const getHudFontSize = (text: string) => {
     if (!text) return 'text-xl';
     if (text.length > 20) return 'text-[9px] md:text-xs';
     if (text.length > 12) return 'text-xs md:text-sm'; 
     if (text.length > 8) return 'text-sm md:text-base';
     return 'text-xl';
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // if (!stateRef.current.snake || stateRef.current.snake.length === 0) return; // REMOVED early return
    
    const { w: gridW, h: gridH } = stateRef.current.grid;
    const dpr = window.devicePixelRatio || 1;
    const maxCellW = canvas.width / gridW;
    const maxCellH = canvas.height / gridH;
    const cellSize = Math.floor(Math.min(maxCellW, maxCellH));
    const gridPixelW = cellSize * gridW;
    const gridPixelH = cellSize * gridH;
    const offsetX = Math.floor((canvas.width - gridPixelW) / 2);
    const offsetY = Math.floor((canvas.height - gridPixelH) / 2);
    
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, themeColors.lightHex);
    bgGrad.addColorStop(1, themeColors.lightHex);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)'; 
    ctx.lineWidth = 1;
    for (let x = 0; x <= gridW; x++) { 
        ctx.beginPath(); ctx.moveTo(offsetX + x * cellSize, offsetY); ctx.lineTo(offsetX + x * cellSize, offsetY + gridPixelH); ctx.stroke(); 
    }
    for (let y = 0; y <= gridH; y++) { 
        ctx.beginPath(); ctx.moveTo(offsetX, offsetY + y * cellSize); ctx.lineTo(offsetX + gridPixelW, offsetY + y * cellSize); ctx.stroke(); 
    }
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)'; 
    ctx.lineWidth = 2;
    ctx.strokeRect(offsetX, offsetY, gridPixelW, gridPixelH);

    const halfCell = cellSize / 2;
    
    if (stateRef.current.snake && stateRef.current.snake.length > 0) {
        for (let i = stateRef.current.snake.length - 1; i >= 0; i--) {
            const s = stateRef.current.snake[i];
            const x = offsetX + s.x * cellSize - halfCell; 
            const y = offsetY + s.y * cellSize - halfCell;
            
            ctx.fillStyle = themeColors.darkHex; 
            
            ctx.shadowColor = `rgba(${themeColors.dark.replace(/ /g, ', ')}, 0.4)`;
            ctx.shadowBlur = i === 0 ? 10 : 0; 
            
            let scale = 1;
            if (s.birthTime) {
                const age = performance.now() - s.birthTime;
                if (age < 400) {
                    const t = age / 400;
                    const c1 = 1.70158;
                    const c3 = c1 + 1;
                    scale = 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
                    scale = Math.max(0, scale);
                }
            }
            
            const size = (cellSize - 2) * scale;
            const offset = (cellSize - 2 - size) / 2;

            ctx.beginPath(); 
            ctx.roundRect(x + 1 + offset, y + 1 + offset, size, size, 4 * dpr * scale); 
            ctx.fill();

            if (i === 0) {
                ctx.fillStyle = themeColors.lightHex;
                const dir = stateRef.current.direction;
                const eyeOffset = 0.3 * cellSize;
                const centerX = x + halfCell;
                const centerY = y + halfCell;
                
                const lx = centerX + dir.x * 0.2 * cellSize - dir.y * eyeOffset;
                const ly = centerY + dir.y * 0.2 * cellSize + dir.x * eyeOffset;
                const rx = centerX + dir.x * 0.2 * cellSize + dir.y * eyeOffset;
                const ry = centerY + dir.y * 0.2 * cellSize - dir.x * eyeOffset;

                ctx.beginPath(); ctx.arc(lx, ly, 2.5 * dpr, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(rx, ry, 2.5 * dpr, 0, Math.PI * 2); ctx.fill();
            }
        }
    }

    if (stateRef.current.isVersus && stateRef.current.snake2 && stateRef.current.snake2.length > 0) {
        for (let i = stateRef.current.snake2.length - 1; i >= 0; i--) {
            const s = stateRef.current.snake2[i];
            const x = offsetX + s.x * cellSize - halfCell; 
            const y = offsetY + s.y * cellSize - halfCell;
            
            // Use a different color for Player 2 (e.g., #306230)
            ctx.fillStyle = i === 0 ? '#306230' : '#4a824a'; 
            
            ctx.shadowColor = 'rgba(48, 98, 48, 0.4)';
            ctx.shadowBlur = i === 0 ? 10 : 0; 
            
            let scale = 1;
            if (s.birthTime) {
                const age = performance.now() - s.birthTime;
                if (age < 400) {
                    const t = age / 400;
                    const c1 = 1.70158;
                    const c3 = c1 + 1;
                    scale = 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
                    scale = Math.max(0, scale);
                }
            }
            
            const size = (cellSize - 2) * scale;
            const offset = (cellSize - 2 - size) / 2;

            ctx.beginPath(); 
            // Draw a slightly different shape or just roundRect
            ctx.roundRect(x + 1 + offset, y + 1 + offset, size, size, 4 * dpr * scale); 
            ctx.fill();

            // Draw inner hollow part for P2 body
            if (i !== 0) {
                ctx.fillStyle = themeColors.lightHex;
                ctx.beginPath();
                ctx.roundRect(x + 3 + offset, y + 3 + offset, size - 4, size - 4, 2 * dpr * scale);
                ctx.fill();
            }

            if (i === 0) {
                ctx.fillStyle = themeColors.lightHex;
                const dir = stateRef.current.direction2;
                const eyeOffset = 0.3 * cellSize;
                const centerX = x + halfCell;
                const centerY = y + halfCell;
                
                const lx = centerX + dir.x * 0.2 * cellSize - dir.y * eyeOffset;
                const ly = centerY + dir.y * 0.2 * cellSize + dir.x * eyeOffset;
                const rx = centerX + dir.x * 0.2 * cellSize + dir.y * eyeOffset;
                const ry = centerY + dir.y * 0.2 * cellSize - dir.x * eyeOffset;

                ctx.beginPath(); ctx.arc(lx, ly, 2.5 * dpr, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(rx, ry, 2.5 * dpr, 0, Math.PI * 2); ctx.fill();
            }
        }
    }

    const bubbles = stateRef.current.food.map(f => {
      const x = offsetX + f.x * cellSize - halfCell;
      const y = offsetY + f.y * cellSize - halfCell;
      const cx = x + cellSize / 2;
      let label = '';
      let nameLabel = '';
      if (f.kind === 'symmetry') {
         label = f.val;
         nameLabel = '';
      } else if (f.kind === 'cond') {
         try {
             const condObj = JSON.parse(f.val);
             label = settings.language === 'zh' ? condObj.zh : condObj.en;
         } catch (e) {
             label = f.val;
         }
         nameLabel = ''; 
      } else if (f.kind === 'type') {
         label = settings.language==='zh' ? (dbRxnTypes[f.val]?.zh || f.val) : (dbRxnTypes[f.val]?.en || f.val);
         nameLabel = '';
      } else {
         const c = getComp(f.val, settings.language);
         label = c.formula;
         nameLabel = c.name;
         if (label === nameLabel) {
             nameLabel = '';
         }
      }
      const isCompact = canvas.width / dpr < 500; 
      const labelFontSize = isCompact ? 11 : 14; 
      const nameFontSize = isCompact ? 8 : 10;  
      
      const isFormula = f.kind === 'product' || f.kind === 'reactant';
      const labelFontStr = isFormula ? `900 ${labelFontSize * dpr}px "VT323", monospace` : `bold ${labelFontSize * dpr}px system-ui, sans-serif`;
      const nameFontStr = `bold ${nameFontSize * dpr}px system-ui, sans-serif`;
      
      ctx.font = labelFontStr; 
      const labelMetrics = ctx.measureText(label);
      ctx.font = nameFontStr; 
      const nameMetrics = ctx.measureText(nameLabel);
      const paddingX = (isCompact ? 3 : 6) * dpr;
      const paddingY = (isCompact ? 2 : 3) * dpr;
      const lineGap = (isCompact ? 1 : 2) * dpr;
      const bubbleW = Math.max(labelMetrics.width, nameMetrics.width) + paddingX * 2;
      const bubbleH = (labelFontSize * dpr) + (nameLabel ? (nameFontSize * dpr) + lineGap : 0) + paddingY * 2;
      
      let bubbleX = cx;
      
      const halfW = bubbleW / 2;
      if (bubbleX - halfW < offsetX) bubbleX = offsetX + halfW;
      if (bubbleX + halfW > offsetX + gridPixelW) bubbleX = offsetX + gridPixelW - halfW;
      
      const halfH = bubbleH / 2;
      let bubbleY;

      // Deterministic positioning based on grid half
      if (f.y > gridH / 2) {
          // Bottom half: Place bubble ABOVE food
          bubbleY = y - halfH - 4 * dpr;
      } else {
          // Top half: Place bubble BELOW food
          bubbleY = y + cellSize + halfH + 4 * dpr;
      }

      // Safety clamp
      if (bubbleY - halfH < offsetY) bubbleY = offsetY + halfH;
      if (bubbleY + halfH > offsetY + gridPixelH) bubbleY = offsetY + gridPixelH - halfH;

      return { 
          ...f, pixelX: x, pixelY: y, cellSize, 
          bubbleX, bubbleY, bubbleW, bubbleH, 
          label, nameLabel, labelFontSize, nameFontSize,
          labelFontStr, nameFontStr,
          paddingY, lineGap, renderY: bubbleY 
      };
    });

    bubbles.forEach(b => {
      const boxPadding = 3 * dpr;
      const boxSize = b.cellSize - boxPadding;
      const px = b.pixelX; 
      const py = b.pixelY;
      
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.strokeStyle = themeColors.darkHex;
      ctx.lineWidth = 1.5 * dpr;
      ctx.fillStyle = `rgba(${themeColors.dark.replace(/ /g, ', ')}, 0.2)`; 
      ctx.beginPath();
      ctx.roundRect(px + boxPadding/2, py + boxPadding/2, boxSize, boxSize, 2 * dpr);
      ctx.fill();
      ctx.stroke();
      
      const halfW = b.bubbleW / 2;
      
      ctx.fillStyle = themeColors.darkHex; 
      ctx.strokeStyle = themeColors.lightHex; 
      ctx.lineWidth = 1.5 * dpr;
      ctx.shadowColor = `rgba(${themeColors.dark.replace(/ /g, ', ')}, 0.4)`;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.roundRect(b.bubbleX - halfW, b.renderY - b.bubbleH/2, b.bubbleW, b.bubbleH, 2 * dpr);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      
      ctx.fillStyle = themeColors.lightHex;
      ctx.textAlign = 'center'; 
      ctx.textBaseline = 'middle'; 
      ctx.font = b.labelFontStr; 
      
      if (b.nameLabel) {
          let textY = b.renderY - b.bubbleH/2 + b.paddingY + (b.labelFontSize * dpr) / 2;
          ctx.fillText(b.label, b.bubbleX, textY);
          ctx.font = b.nameFontStr; 
          textY += (b.labelFontSize * dpr) / 2 + b.lineGap + (b.nameFontSize * dpr) / 2;
          ctx.fillText(b.nameLabel, b.bubbleX, textY);
      } else {
          ctx.fillText(b.label, b.bubbleX, b.renderY);
      }
    });

    floatsRef.current.forEach(f => {
       const x = offsetX + f.x * cellSize; 
       const y = offsetY + f.y * cellSize;
       const fSize = (f.fontSize || 16) * dpr;
       ctx.font = `bold ${fSize}px "VT323", monospace`;
       ctx.fillStyle = f.color; 
       ctx.strokeStyle = themeColors.lightHex; 
       ctx.lineWidth = 3; 
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
       setNextDir({ x, y });
    }
  },[]);

  const handleAction = (btn: 'A' | 'B' | 'X' | 'Y' | 'START' | 'SELECT' | 'RESET' | 'MENU' | 'EXIT' | 'TIME' | 'TOGGLE_CONTROLS', fromMenu: boolean = false, overrideIndex?: number) => {
    if (!fromMenu) vibrate(20); 

    const currState = stateRef.current.gameState;
    const menuPage = stateRef.current.menuPage;
    const menuIndex = overrideIndex !== undefined ? overrideIndex : stateRef.current.menuIndex;

    if (btn === 'TOGGLE_CONTROLS') {
        setShowControls(s => !s);
        return;
    }

    if (btn === 'TIME') {
        const newMode = !stateRef.current.settings.timeLimitMode;
        setSettings(prev => ({ ...prev, timeLimitMode: newMode }));
        if (newMode && stateRef.current.timeLeft <= 0) {
            setTimeLeft(stateRef.current.settings.timeLimitDuration || 180);
        }
        play(newMode ? 'time_on' : 'time_off');
        vibrate(newMode ? [50, 50, 50] : [150]);
        return;
    }

    if (btn === 'EXIT') {
        setGameState('APP_EXIT_CONFIRM');
        play('pause');
        return;
    }

    if (btn === 'X') {
        const newVibe = !settings.vibration;
        setSettings(prev => ({ ...prev, vibration: newVibe }));
        if (newVibe && navigator.vibrate) navigator.vibrate(50); 
        return;
    }

    if (btn === 'SELECT') {
        const newState = !settings.sound;
        setSettings(prev => ({ ...prev, sound: newState, music: newState }));
        return;
    }
    
    if (btn === 'MENU') {
        if (currState === 'PLAYING' || currState === 'PAUSED') {
            setGameState('QUIT_CONFIRM');
        } else {
            setGameState('MENU');
            setMenuPage('MAIN');
            setMenuIndex(0);
        }
        return;
    }

    if (btn === 'RESET') {
        if (currState === 'PLAYING' || currState === 'PAUSED' || currState === 'GAMEOVER') {
             setGameState('RESET_CONFIRM');
             play('pause');
        }
        return;
    }
    
    if (currState === 'IMPORT_MODAL') {
        if (btn === 'B') {
            setGameState('MENU');
        }
        return;
    }
    
    if (currState === 'APP_EXIT_CONFIRM') {
        if (btn === 'A') {
            if (typeof (window as any).plus !== 'undefined') {
                (window as any).plus.runtime.quit();
            } else {
                window.close(); 
            }
        }
        if (btn === 'B') {
            setGameState('MENU');
            setMenuPage('MAIN');
            setMenuIndex(0);
        }
        return;
    }

    if (currState === 'PLAYING') {
       if (stateRef.current.isTutorial && btn === 'B') {
           setGameState('MENU');
           setMenuPage('MAIN');
           setMenuIndex(0);
           return;
       }
       if (btn === 'START' || btn === 'B') {
           setGameState('PAUSED');
           play('pause');
       }
       return;
    }
    if (currState === 'PAUSED') {
       if (btn === 'START' || btn === 'A') {
           setGameState('PLAYING');
           play('start');
       }
       if (btn === 'B') setGameState('QUIT_CONFIRM');
       return;
    }
    if (currState === 'QUIT_CONFIRM') {
        if (btn === 'A') {
            setGameState('MENU');
            setMenuPage('MAIN');
            setMenuIndex(0);
        }
        if (btn === 'B') setGameState('PAUSED');
        return;
    }
    if (currState === 'RESET_CONFIRM') {
        if (btn === 'A') initGame();
        if (btn === 'B') setGameState('PLAYING');
        return;
    }
    if (currState === 'GAMEOVER') {
       if (btn === 'A') {
           if (menuIndex === 0) initGame();
           else if (menuIndex === 1) {
               setPendingAction('save_score');
               setGameState('INPUT_INFO');
           }
           else if (menuIndex === 2) setGameState('REPORT');
           else if (menuIndex === 3) {
               setGameState('MENU');
               setMenuPage('MAIN');
               setMenuIndex(0);
           }
       }
       if (btn === 'B') setGameState('REPORT');
       return;
    }
    if (currState === 'REPORT') {
        if (btn === 'B') {
            if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
            }
            setGameState('MENU');
            setMenuPage('MAIN');
            setMenuIndex(0);
            lastInputTime.current = 0;
            lastRepeatTime.current = 0;
            stickInput.current = { x: 0, y: 0 };
        }
        return;
    }
    if (currState === 'INPUT_INFO') {
        if (btn === 'B') {
            setGameState(pendingAction === 'save_score' ? 'GAMEOVER' : (pendingAction === 'settings' ? 'MENU' : 'REPORT'));
            setPendingAction(null);
        }
        return;
    }
    if (currState === 'MENU') {
       if (btn === 'B') {
          if (menuPage !== 'MAIN') { 
              if (menuPage === 'CHAPTERS') setMenuIndex(1);
              else if (menuPage === 'DIFFICULTY') setMenuIndex(2);
              else if (menuPage === 'SETTINGS') setMenuIndex(6);
              else if (menuPage === 'ABOUT') {
                  setMenuPage('SETTINGS');
                  setMenuIndex(10);
                  play('back');
                  return;
              }
              else if (menuPage === 'AI_SETTINGS') {
                  setMenuPage('SETTINGS');
                  setMenuIndex(9);
                  play('back');
                  return;
              }
              else if (menuPage === 'LEADERBOARD') setMenuIndex(3);
              else setMenuIndex(0);
              setMenuPage('MAIN'); 
              play('back'); 
          }
          return;
       }
       if (btn === 'A') {
          if (!fromMenu) play('select');
          if (menuPage === 'MAIN') {
             const mainMenuItems = [
                 { id: 'START' },
                 ...(isLargeScreen ? [{ id: 'VERSUS' }] : []),
                 { id: 'TUTORIAL' },
                 { id: 'CHAPTERS' },
                 { id: 'DIFFICULTY' },
                 { id: 'LEADERBOARD' },
                 { id: 'IMPORT' },
                 { id: 'SETTINGS' },
                 { id: 'EXIT' }
             ];
             const actionId = mainMenuItems[menuIndex]?.id;
             if (actionId === 'START') initGame('SINGLE');
             if (actionId === 'VERSUS') initGame('VERSUS');
             if (actionId === 'TUTORIAL') initGame('TUTORIAL');
             if (actionId === 'CHAPTERS') { setMenuPage('CHAPTERS'); setMenuIndex(0); }
             if (actionId === 'DIFFICULTY') { setMenuPage('DIFFICULTY'); setMenuIndex(0); }
             if (actionId === 'LEADERBOARD') { setMenuPage('LEADERBOARD'); setMenuIndex(0); }
             if (actionId === 'IMPORT') { setGameState('IMPORT_MODAL'); }
             if (actionId === 'SETTINGS') { setMenuPage('SETTINGS'); setMenuIndex(0); }
             if (actionId === 'EXIT') { setGameState('APP_EXIT_CONFIRM'); } 
          } else if (menuPage === 'CHAPTERS') {
             if (menuIndex === 0) {
                 stateRef.current.settings.selectedChapters = [];
                 setSettings(s => ({ ...s, selectedChapters: [] }));
             } else {
                 const chap = availableChapters[menuIndex - 1];
                 const curr = stateRef.current.settings.selectedChapters;
                 const newChapters = curr.includes(chap) ? curr.filter(c => c !== chap) : [...curr, chap];
                 stateRef.current.settings.selectedChapters = newChapters;
                 setSettings(s => ({ ...s, selectedChapters: newChapters }));
             }
          } else if (menuPage === 'DIFFICULTY') {
             const diffs: Difficulty[] =['VERY_EASY', 'EASY', 'NORMAL', 'HARD', 'INSANE'];
             setSettings(s => ({ ...s, difficulty: diffs[menuIndex] }));
          } else if (menuPage === 'SETTINGS') {
             if (menuIndex === 0) setSettings(s => ({ ...s, sound: !s.sound }));
             if (menuIndex === 1) setSettings(s => ({ ...s, music: !s.music }));
             if (menuIndex === 2) setSettings(s => ({ ...s, vibration: !s.vibration }));
             if (menuIndex === 3) setSettings(s => ({ ...s, language: s.language === 'zh' ? 'en' : 'zh' }));
             if (menuIndex === 4) setSettings(s => ({ ...s, timeLimitMode: !s.timeLimitMode }));
             if (menuIndex === 5) setSettings(s => {
                 const durations = [60, 180, 300, 600];
                 const nextIdx = (durations.indexOf(s.timeLimitDuration || 180) + 1) % durations.length;
                 return { ...s, timeLimitDuration: durations[nextIdx] };
             });
             if (menuIndex === 6) setSettings(s => {
                 const current = s.joyDeadzone ?? 0.1;
                 const next = Math.round((current + 0.05) * 100) / 100;
                 return { ...s, joyDeadzone: next > 0.5 ? 0.0 : next };
             });
             if (menuIndex === 7) setSettings(s => {
                 const current = s.joySensitivity ?? 1.0;
                 const next = Math.round((current + 0.2) * 10) / 10;
                 return { ...s, joySensitivity: next > 2.0 ? 0.5 : next };
             });
             if (menuIndex === 8) {
                 setPendingAction('settings');
                 setGameState('INPUT_INFO');
             }
             if (menuIndex === 9) { setMenuPage('AI_SETTINGS'); setMenuIndex(0); }
             if (menuIndex === 10) { setMenuPage('ABOUT'); setMenuIndex(0); }
          }
       }
    }
  };

  handleActionRef.current = handleAction;

  const handleActionClick = (action: 'copy' | 'send') => {
      if (action === 'send' && !settings.reportEmail) {
          setPendingAction(action);
          setGameState('INPUT_INFO');
      } else {
          if (action === 'copy') copyReport();
          if (action === 'send') sendReport();
      }
  };

  const handleMenuClick = (index: number) => {
      setMenuIndex(index);
      vibrate(20);
      play('select');
      handleAction('A', true, index);
  };

  const handleMenuAdjust = (dir: number, index?: number) => {
      const idx = index !== undefined ? index : stateRef.current.menuIndex;
      if (stateRef.current.menuPage === 'SETTINGS') {
          if (idx === 6) {
              setSettings(s => {
                  const current = s.joyDeadzone ?? 0.1;
                  let next = Math.round((current + dir * 0.05) * 100) / 100;
                  if (next < 0.0) next = 0.0;
                  if (next > 0.5) next = 0.5;
                  return { ...s, joyDeadzone: next };
              });
              play('move');
              vibrate(10);
          } else if (idx === 7) {
              setSettings(s => {
                  const current = s.joySensitivity ?? 1.0;
                  let next = Math.round((current + dir * 0.1) * 10) / 10;
                  if (next < 0.5) next = 0.5;
                  if (next > 2.0) next = 2.0;
                  return { ...s, joySensitivity: next };
              });
              play('move');
              vibrate(10);
          }
      }
  };

  const chapterTitle = (() => {
      if (gameState === 'IMPORT_MODAL') return settings.language === 'zh' ? '管理题库' : 'MANAGE DATA';
      if (gameState === 'REPORT') return settings.language === 'zh' ? '成绩单' : 'REPORT';
      if (gameState === 'GAMEOVER') return settings.language === 'zh' ? '游戏结束' : 'GAME OVER';
      if (gameState === 'INPUT_INFO') return settings.language === 'zh' ? '输入信息' : 'INPUT INFO';
      if (gameState === 'APP_EXIT_CONFIRM') return settings.language === 'zh' ? '退出游戏' : 'EXIT GAME';
      if (gameState === 'PLAYING' || gameState === 'PAUSED' || gameState === 'QUIT_CONFIRM' || gameState === 'RESET_CONFIRM') {
          if (isTutorial) return settings.language === 'zh' ? '新手教程' : 'TUTORIAL';
          if (isSymmetry) return currentSymmetry?.bankId ? getChapterName(currentSymmetry.bankId, settings.language, importedDataList) : (settings.language === 'zh' ? '结构化学' : 'STRUCTURAL');
          return currentRxn ? getChapterName(currentRxn.chapter, settings.language, importedDataList) : '';
      }
      return gameState === 'MENU' ? getLocalizedUI('MENU', settings.language) : '';
  })();

  const fromComp = useMemo(() => currentRxn ? getComp(currentRxn.from, settings.language) : null, [currentRxn, settings.language, getComp]);
  const toComp = useMemo(() => currentRxn ? getComp(currentRxn.to, settings.language) : null, [currentRxn, settings.language, getComp]);
  const condText = currentRxn ? (gameMode === 'cond' ? '???' : currentRxn.cond[settings.language]) : '';
  
  const shakeX = shake ? (Math.random() - 0.5) * 10 : 0;
  const shakeY = shake ? (Math.random() - 0.5) * 10 : 0;

  const MenuItem = ({ id, label, active, icon: Icon, value, onClick, onFocus, type, onDecrease, onIncrease }: any) => (
      <div 
          className={`flex items-center justify-between px-2 py-1.5 cursor-pointer rounded transition-all duration-200 ${active ? 'bg-theme-dark text-theme-light shadow-[0_2px_0_rgba(22,38,7,0.2)] scale-[1.02]' : 'hover:bg-theme-dark/10 text-theme-dark'}`}
          onClick={onClick}
          onPointerEnter={(e) => {
              if (e.pointerType === 'mouse') onFocus();
          }}
      >
          <div className="flex items-center gap-2">
              {active && <span className="animate-pulse">▶</span>}
              {Icon && <Icon size={14} className="shrink-0" />}
              <span className="font-bold tracking-wide text-xs sm:text-sm">{label}</span>
          </div>
          {type === 'slider' ? (
              <div className="flex items-center gap-2">
                  <button onClick={(e) => { e.stopPropagation(); onDecrease(); }} className={`px-1.5 rounded ${active ? 'hover:bg-theme-light/20' : 'hover:bg-theme-dark/20'}`}>-</button>
                  <span className="text-[10px] opacity-80 font-mono w-6 text-center">{value}</span>
                  <button onClick={(e) => { e.stopPropagation(); onIncrease(); }} className={`px-1.5 rounded ${active ? 'hover:bg-theme-light/20' : 'hover:bg-theme-dark/20'}`}>+</button>
              </div>
          ) : (
              value && <span className="text-[10px] opacity-80 font-mono truncate max-w-[100px]">{value}</span>
          )}
      </div>
  );

  const parseImportedData = (data: any) => {
      const sanitizeFormula = (formula: string) => {
          if (typeof formula !== 'string') return formula;
          return formula
              .replace(/^H₂₀$/g, 'H₂O')
              .replace(/^H₂₀₂$/g, 'H₂O₂')
              .replace(/^H₂₀\+$/g, 'H₂O+')
              .replace(/^H₃₀\+$/g, 'H₃O+')
              .replace(/^H₃₀⁺$/g, 'H₃O⁺')
              .replace(/^H₂₀\(l\)$/g, 'H₂O(l)')
              .replace(/^H₂₀\(g\)$/g, 'H₂O(g)')
              .replace(/^H₂₀\(s\)$/g, 'H₂O(s)')
              .replace(/·H₂₀$/g, '·H₂O')
              .replace(/·[1-9]H₂₀$/g, match => match.replace('₀', 'O'))
              .replace(/·[₁-₉]H₂₀$/g, match => match.replace('₀', 'O'));
      };

      let rawCompounds = data.compounds || {};
      let compounds: Record<string, any> = {};
      
      Object.keys(rawCompounds).forEach(key => {
          const sanitizedKey = sanitizeFormula(key);
          const comp = rawCompounds[key];
          if (comp && typeof comp === 'object') {
              compounds[sanitizedKey] = {
                  ...comp,
                  formula: sanitizeFormula(comp.formula || sanitizedKey)
              };
          } else {
              compounds[sanitizedKey] = comp;
          }
      });

      let reactions: any[] = [];
      let symmetry: any[] = [];
      let subjectCategory = data.subjectCategory || 'GENERAL';

      if (Array.isArray(data)) {
          // If the AI just returned an array, assume it's a list of reactions
          reactions = data;
      } else {
          if (Array.isArray(data.reactions)) {
              reactions = data.reactions;
          } else if (data.reactions && typeof data.reactions === 'object') {
              reactions = Object.values(data.reactions);
          } else if (Array.isArray(data.reaction)) {
              reactions = data.reaction;
          }
          
          if (Array.isArray(data.symmetry)) {
              symmetry = data.symmetry;
          } else if (data.symmetry && typeof data.symmetry === 'object') {
              symmetry = Object.values(data.symmetry);
          }
      }
      
      reactions = reactions.map((r: any) => ({
          ...r,
          from: sanitizeFormula(r.from),
          to: sanitizeFormula(r.to)
      })).filter((r: any) => r && r.from && r.to);
      
      symmetry = symmetry.map((s: any) => ({
          ...s,
          molecule: sanitizeFormula(s.molecule)
      })).filter((s: any) => s && s.molecule && Array.isArray(s.elements) && s.elements.length > 0);
      
      const rxnTypes = data.rxnTypes || {};
      
      return { compounds, reactions, symmetry, subjectCategory, rxnTypes };
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      const clearInput = () => {
          e.target.value = '';
      };
      
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
          const reader = new FileReader();
          reader.onload = (event) => {
              try {
                  const text = event.target?.result as string;
                  let parsedText = text.replace(/^```json/m, '').replace(/```$/m, '').trim();
                  const data = JSON.parse(parsedText);
                  
                  const { compounds, reactions, symmetry, subjectCategory, rxnTypes } = parseImportedData(data);

                  if (reactions.length > 0 || symmetry.length > 0) {
                      const customId = `CUSTOM_${Date.now()}`;
                      const newReactions = reactions.map((r: any) => ({ ...r, chapter: customId, bankId: customId, cond: typeof r.cond === 'string' ? { zh: r.cond, en: r.cond } : (r.cond || { zh: '', en: '' }) }));
                      const newSymmetry = symmetry.map((s: any) => ({ ...s, bankId: customId, elements: s.elements || [], wrong: s.wrong || [] }));
                      const newImport: ImportedData = {
                          fileName: file.name,
                          customChapterId: customId,
                          compounds: compounds,
                          reactions: newReactions,
                          symmetry: newSymmetry,
                          rxnTypes: rxnTypes,
                          importDate: Date.now(),
                          subjectCategory: subjectCategory
                      };
                      setImportedDataList(prev => [...prev, newImport]);
                      setSettings(s => ({ ...s, selectedChapters: [customId] }));
                      stateRef.current.settings.selectedChapters = [customId];
                      play('start');
                      showAlert(
                          settings.language === 'zh' ? '导入成功！新题库已加载。是否立即开始游戏？' : 'Import successful! New question bank loaded. Start game now?',
                          settings.language === 'zh' ? '成功' : 'Success',
                          () => {
                              // Ensure stateRef has the latest selectedChapters before starting
                              stateRef.current.settings.selectedChapters = [customId];
                              // Use setPendingStart to allow React to process the state updates (importedDataList, settings)
                              // and wait for dbReactions to be fully updated before initGame is called.
                              setPendingStart(customId);
                          },
                          () => setGameState('MENU'),
                          settings.language === 'zh' ? '返回菜单' : 'Menu',
                          settings.language === 'zh' ? '开始游戏' : 'Start'
                      );
                  } else {
                      play('error');
                      showAlert(settings.language === 'zh' ? '没有可用题目！请检查 JSON 内容。' : 'No questions available! Please check the JSON content.');
                  }
              } catch (err: any) {
                  play('error');
                  showAlert(`Failed to parse JSON: ${err.message}`);
              }
          };
          reader.readAsText(file);
          clearInput();
      } else {
          // If it's not a JSON file, pass it to handleAIImport
          handleAIImport(e);
      }
  };

  const handleAIImport = async (e: React.ChangeEvent<HTMLInputElement> | undefined, textContent?: string) => {
      const file = e?.target.files?.[0];
      if (!file && !textContent) return;
      
      const clearInput = () => {
          if (e) e.target.value = '';
      };
      
      const env = (window as any).process?.env || {};
      const envApiKey = env.API_KEY || env.GEMINI_API_KEY || '';
      let effectiveApiKey = apiKey || envApiKey;

      if (!effectiveApiKey && llmProvider === 'gemini') {
          if ((window as any).aistudio) {
              try {
                  await (window as any).aistudio.openSelectKey();
                  const newEnv = (window as any).process?.env || {};
                  effectiveApiKey = apiKey || newEnv.API_KEY || newEnv.GEMINI_API_KEY || '';
              } catch (err) {
                  console.error('Failed to open key selector:', err);
              }
          }
          if (!effectiveApiKey) {
              play('error');
              showAlert(settings.language === 'zh' ? '请先在设置中配置 Gemini API Key' : 'Please configure Gemini API Key in settings first');
              clearInput();
              return;
          }
      } else if (!apiKey && llmProvider !== 'gemini' && llmProvider !== 'custom') {
          play('error');
          showAlert(settings.language === 'zh' ? '请先在设置中配置 API Key' : 'Please configure API Key in settings first');
          clearInput();
          return;
      }

      setIsGenerating(true);
      setAiThinkingStep(0);
      const thinkingInterval = setInterval(() => {
          setAiThinkingStep(prev => (prev + 1) % thinkingSteps.length);
      }, 2000);

      try {
          let mimeType = 'text/plain';
          let base64Data = '';
          let fileTextContent = textContent || '';

          if (file) {
              mimeType = file.type || 'application/octet-stream';
              if (mimeType.startsWith('image/')) {
                  const reader = new FileReader();
                  const promise = new Promise<string>((resolve, reject) => {
                      reader.onload = () => resolve(reader.result as string);
                      reader.onerror = reject;
                  });
                  reader.readAsDataURL(file);
                  const dataUrl = await promise;
                  base64Data = dataUrl.split(',')[1];
              } else if (mimeType === 'application/pdf' || file.name.endsWith('.pdf')) {
                  throw new Error(settings.language === 'zh' ? '暂不支持直接解析 PDF，请上传图片或纯文本文件。' : 'Direct PDF parsing is not supported yet. Please upload an image or plain text file.');
              } else if (file.name.endsWith('.doc') || file.name.endsWith('.docx') || file.name.endsWith('.xls') || file.name.endsWith('.xlsx')) {
                  throw new Error(settings.language === 'zh' ? '暂不支持直接解析 Word/Excel 文件，请截图上传或复制内容保存为 txt 文件上传。' : 'Word/Excel files are not supported directly. Please take a screenshot or copy the text to a .txt file.');
              } else {
                  const reader = new FileReader();
                  const promise = new Promise<string>((resolve, reject) => {
                      reader.onload = () => resolve(reader.result as string);
                      reader.onerror = reject;
                  });
                  reader.readAsText(file);
                  fileTextContent = await promise;
              }
          }

          const promptText = `
          You are an expert Chemistry Professor. Analyze the provided document or image and transform the chemical information into highly accurate, innovative, and scientifically sound interactive questions for a "Chemistry Snake" game.
          
          CRITICAL REQUIREMENT: ONLY generate questions related to CHEMISTRY (Organic, Inorganic, Physical, Analytical, Structural). Do NOT generate questions for biology, physics, or general knowledge.

          The game uses a "from -> to" matching mechanic. The player sees a "from" prompt and must eat the correct "to" answer, while avoiding wrong answers.
          
          =========================================================
          CRITICAL INSTRUCTION FOR EXAM PAPERS & FLOWCHARTS (编号与元素区分)
          =========================================================
          Exam papers frequently use letters (A, B, C, D, E, F, X, Y, Z) to represent unknown compounds in reaction flowcharts. 
          YOU MUST NEVER USE THESE PLACEHOLDER LETTERS AS ANSWERS! 
          - "F" in an organic synthesis flowchart is almost NEVER Fluorine. It is an unknown compound "F".
          - If you see a reaction like: "A --(O2/Cu, Δ)--> B", DO NOT output "from: A, to: B".
          - Instead, you MUST deduce the actual chemical structure or name of the compound behind the label based on the reaction context. 
          - If you deduce A is Ethanol and B is Acetaldehyde, output "from: Ethanol, to: Acetaldehyde". 
          - If you CANNOT deduce the actual chemical identity of a placeholder letter, DO NOT include that reaction in your output.

          =========================================================
          DEEP CHEMICAL UNDERSTANDING (理解化学本质)
          =========================================================
          Do not just copy-paste text from the image. Extract the ESSENCE of the chemical transformation.
          - Instead of matching arbitrary text, test the player's understanding of *why* a reaction happens or *what* the core change is.
          - For complex multi-step syntheses, extract the key functional group transformations, named reactions, or critical intermediates.
          
          EXAMPLES OF BAD VS GOOD PAIRS:
          - BAD: from: "A", to: "B", cond: "H+" (Meaningless placeholders)
          - GOOD: from: "CH₂=CH₂", to: "CH₃CH₂OH", cond: "H₂O/H⁺" (Actual chemistry)
          - BAD: from: "F", to: "G" (Misinterpreting label F as Fluorine)
          - GOOD: from: "Ester", to: "Carboxylic Acid + Alcohol", cond: "H₂O/H⁺, Δ" (Testing the concept)

          =========================================================
          DIFFICULTY, COMPLEXITY & VARIETY (难度、深度与多样性)
          =========================================================
          - DO NOT generate trivial or basic questions (e.g., "Water -> H2O" or "Na + Cl -> NaCl").
          - Generate ADVANCED, challenging questions suitable for university-level chemistry or chemistry olympiads.
          - Focus on: tricky exceptions, complex mechanisms, regioselectivity (Markovnikov/anti-Markovnikov, Zaitsev/Hofmann), stereochemistry (R/S, E/Z, syn/anti addition), advanced reagents (e.g., DIBAL-H, PCC, Grignard, Wittig), and critical intermediates.
          - If the source material is simple, ELEVATE the difficulty by asking about the underlying mechanism, the catalyst's role, or a related advanced concept.
          - AVOID REPETITION: Do not generate multiple questions testing the exact same concept or reaction. Ensure a diverse set of questions.

          =========================================================
          SCENARIO-SPECIFIC EXTRACTION STRATEGIES (场景化出题策略)
          =========================================================
          You must adapt your extraction strategy based on the visual or textual content. Do not just blindly copy text; understand the SCENARIO and generate targeted questions:
          
          1. MULTI-STEP SYNTHESIS FLOWCHARTS (多步合成路线):
          - Do NOT just extract the final product. Extract EACH logical step as a separate reaction.
          - If a reagent is missing (e.g., A --?--> B), frame it so the player must identify the reagent. (e.g., "from": "A -> B", "to": "Reagent").
          - If an intermediate is missing (e.g., A --Reagent--> ?), make the intermediate the answer.
          
          2. SPECTRA & GRAPHS (NMR, IR, MS, Titration Curves, Phase Diagrams):
          - For IR: "from: Wavenumber (e.g., 1700 cm⁻¹)", "to: Functional Group (e.g., C=O)".
          - For NMR: "from: Chemical Shift / Splitting", "to: Proton Environment".
          - For Titration: "from: Equivalence Point / Buffer Region", "to: Dominant Species / pKa".
          - For Phase Diagrams: "from: Triple Point / Eutectic Point", "to: Coexisting Phases".
          
          3. EXPERIMENTAL SETUPS & APPARATUS (实验装置图):
          - "from: Apparatus Name / Setup", "to: Purpose / Function".
          - "from: Reagent used in wash bottle", "to: Impurity removed".
          
          4. MECHANISMS (反应机理):
          - "from: Reactant + Reagent", "to: Reactive Intermediate (Carbocation, Carbanion, Radical)".
          - "from: Intermediate", "to: Rearrangement Product (e.g., 1,2-hydride shift)".
          
          5. DATA TABLES (数据表格):
          - Extract trends or anomalies. "from: Highest Electronegativity in Group 17", "to: Fluorine".
          
          6. COMPLEX MOLECULES (复杂分子结构图):
          - Do not just extract the name. Ask about its properties!
          - "from: Number of chiral centers in [Molecule]", "to: 3".
          - "from: Most acidic proton in [Molecule]", "to: Carboxylic OH".
          - "from: Functional groups present in [Molecule]", "to: Ester, Amine, Phenol".

          =========================================================
          COGNITIVE PROCESS (思考与推理过程)
          =========================================================
          Before generating the JSON output, you MUST analyze the source text deeply as an Expert Educator. Do not just blindly extract text.
          1. What is the CORE EDUCATIONAL CONCEPT being tested?
          2. How can this concept be mapped into a clear, elegant "A -> B" relationship for a matching game?
          3. If the question is a wordy multiple-choice question, distill it into its purest form. The "from" field can be a concise question or scenario, and the "to" field is the answer.
          4. You MUST include a "_thought_process" field at the very beginning of your JSON output, explaining your reasoning for how you designed the questions and why you chose the specific "from", "to", "cond", and "type" mappings.

          =========================================================
          HOW TO FRAME THE QUESTION (如何设计题目)
          =========================================================
          The game engine uses the "from" and "to" fields to create the matching pair. You must carefully decide what goes into these fields based on what the question is testing.
          
          - If testing PRODUCT prediction: "from" = Reactants, "to" = Product.
          - If testing REAGENT selection: "from" = Reactant -> Product, "to" = Reagent.
          - If testing CONCEPT understanding: "from" = Concept/Definition, "to" = Term/Name. Set \`cond\` to the context (e.g., "Physical Meaning") and set \`type\` to "NONE".
          - If testing PROPERTY comparison: "from" = "Highest Boiling Point among X, Y, Z", "to" = "X". Set \`cond\` to "Property" and set \`type\` to "NONE".
          - If testing REACTION TYPE: "from" = Reactant -> Product, "to" = "Reaction Type Name" (and set \`type\` to "CLASSIFICATION").

          =========================================================
          QUESTION TYPES & DISTRACTOR LOGIC (题型与干扰项生成逻辑)
          =========================================================
          You must identify the type of question (Multiple Choice, True/False, Fill-in-the-blank, Short Answer) and generate distractors accordingly.
          CRITICAL REQUIREMENT: Distractors MUST strictly belong to the same chemical sub-discipline (Organic, Inorganic, Physical, Analytical, etc.) and context as the correct answer. NEVER mix inorganic distractors into an organic question, or vice versa. This is a fundamental requirement.

          1. MULTIPLE CHOICE (选择题):
          - CRITICAL: For ONE multiple-choice question, you MUST generate EXACTLY ONE reaction object. Do NOT generate a separate reaction for each wrong option.
          - You MUST extract the exact wrong options provided in the source text and put them ALL in the \`distractors\` object of that SINGLE reaction.
          
          2. TRUE/FALSE (判断题):
          - The "from" is the core concept or statement. The "to" is the correct judgment or fact.
          - The distractor MUST be the opposite judgment or a common misconception.

          3. FILL-IN-THE-BLANK / SHORT ANSWER / GENERAL REACTIONS (填空/简答/常规方程式):
          - You MUST GENERATE 3 highly plausible, chemically reasonable distractors.
          - For Organic: Use wrong regioselectivity (Markovnikov vs anti-Markovnikov), wrong stereochemistry (E/Z, R/S), or products of competing reactions (SN1 vs E1).
          - For Inorganic: Use wrong oxidation states, similar but incorrect ligands, or wrong precipitate formulas.
          - For Physical: Use inverse formulas, wrong signs (+/-), or closely related but incorrect terms.

          HOW TO FORMAT DISTRACTORS:
          - Place the wrong options in the \`distractors\` object inside the reaction.
          - CRITICAL MAPPING: The game engine uses specific modes. 
            - If your answer is in the "to" field (e.g., Product, Reagent, Term), put the distractors in \`distractors.product\`.
            - If your answer is in the "from" field (e.g., Reactant, Concept), put the distractors in \`distractors.reactant\`.
            - If your answer is in the "cond" field, put the distractors in \`distractors.cond\`.
            - If your answer is in the "type" field, put the distractors in \`distractors.type\`.
          - CRITICAL RULE FOR "type": The \`type\` field is strictly for the CATEGORY of the reaction (e.g., "Addition", "Oxidation", "Definition"). NEVER put the actual answer in the \`type\` field. If the question asks for a concept name, put it in the \`to\` field and use \`distractors.product\`.
          - ALL compounds referenced in \`distractors.product\` or \`distractors.reactant\` MUST be defined in the \`compounds\` dictionary.
          - ALL types referenced in \`distractors.type\` MUST be defined in the \`rxnTypes\` dictionary.
          
          Example for a multiple-choice product question:
          "_thought_process": "The user provided a reaction between A and B forming C. This is a standard product prediction question. I will map A+B to C.",
          "compounds": { "A": {...}, "B": {...}, "C": {...}, "D": {...}, "E": {...}, "F": {...} }
          "reactions": [ { "chapter": "ORG", "from": "A + B", "to": "C", "type": "ADDITION", "cond": {"zh": "加热", "en": "Heat"}, "distractors": { "product": ["D", "E", "F"] } } ]

          Example for a concept question (e.g., "|ψ(x,y,z,t)|²"):
          "_thought_process": "The question asks for the physical meaning of the wavefunction modulus squared. This is a concept question. I will map the formula to its meaning ('Probability Density'). I will use 'Physical Meaning' as the condition and 'NONE' for the type.",
          "compounds": { "PSI_SQ": { "formula": "|ψ(x,y,z,t)|²", "zh": {"name": "波函数模平方"}, "en": {"name": "Wavefunction Modulus Squared"} }, "PROB_DENSITY": { "formula": "概率密度", "zh": {"name": "概率密度"}, "en": {"name": "Probability Density"} }, "VOLUME_ELEMENT": { "formula": "微体积元", "zh": {"name": "微体积元"}, "en": {"name": "Volume element"} }, "PROBABILITY": { "formula": "概率", "zh": {"name": "概率"}, "en": {"name": "Probability"} }, "TOTAL_PROB": { "formula": "总概率", "zh": {"name": "总概率"}, "en": {"name": "Total probability"} } }
          "reactions": [ { "chapter": "QUANTUM", "from": "PSI_SQ", "to": "PROB_DENSITY", "type": "NONE", "cond": {"zh": "物理意义", "en": "Physical Meaning"}, "distractors": { "product": ["VOLUME_ELEMENT", "PROBABILITY", "TOTAL_PROB"] } } ]
          "rxnTypes": {}

          Example for a wordy multiple-choice question:
          "_thought_process": "The source asks: 'Which statement about the photoelectric effect is correct? A) Proves wave nature B) E_k depends on intensity C) Threshold frequency exists D) Any frequency works'. The core concept is the photoelectric effect. I will distill this into 'from: Photoelectric Effect', 'to: Threshold frequency exists'. The distractors are the false statements.",
          "compounds": { "PHOTOELECTRIC": { "formula": "光电效应", "zh": {"name": "光电效应"}, "en": {"name": "Photoelectric Effect"} }, "THRESHOLD": { "formula": "存在极限频率", "zh": {"name": "存在极限频率"}, "en": {"name": "Threshold frequency exists"} }, "WAVE_NATURE": { "formula": "证明波动性", "zh": {"name": "证明波动性"}, "en": {"name": "Proves wave nature"} }, "INTENSITY_DEP": { "formula": "E_k与光强有关", "zh": {"name": "E_k与光强有关"}, "en": {"name": "E_k depends on intensity"} }, "ANY_FREQ": { "formula": "任意频率均可", "zh": {"name": "任意频率均可"}, "en": {"name": "Occurs at any frequency"} } }
          "reactions": [ { "chapter": "QUANTUM", "from": "PHOTOELECTRIC", "to": "THRESHOLD", "type": "NONE", "cond": {"zh": "正确表述", "en": "Correct Statement"}, "distractors": { "product": ["WAVE_NATURE", "INTENSITY_DEP", "ANY_FREQ"] } } ]

          =========================================================
          GAME MODES & DATA STRUCTURE
          =========================================================
          1. "reactions": (PRIMARY MODE) Represents ANY logical pair (A -> B) with a context/condition.
             - ORGANIC: Reactant -> Major Product (cond: Reagents/Catalysts/Named Reaction). Focus on regioselectivity, stereochemistry, named reactions.
             - INORGANIC: Reactant -> Precipitate/Gas/Color/Complex (cond: Reagent/Environment).
             - PHYSICAL: Law/Concept/State A -> Formula/Key Property/State B (cond: Constraint/Process).
             - ANALYTICAL: Analyte/Titration/Instrument -> Indicator Color Change/Signal/Detector (cond: Method/pH/Condition).
             - STRUCTURAL: Molecule/Ion -> Geometry/Hybridization/Point Group (cond: VSEPR/Theory).
             Each item MUST have: "from" (starting concept/molecule), "to" (target/answer/product), "type" (category/reaction type), and "cond" (an object with "zh" and "en" keys for the brief context/condition).
             
          2. "symmetry": ONLY generate this if the text is EXPLICITLY about point groups (e.g., C2v, D3h) or symmetry elements (C3, σv, i). Otherwise, leave empty [].
          
          3. "compounds": A dictionary of ALL terms used in "from" and "to". 
             - "formula": MUST BE A CHEMICAL FORMULA (e.g., "H₂O", "CH₃COOH", "C₆H₅Br"). DO NOT PUT LONG NAMES HERE. If it's a concept or term, use a concise abbreviation or short phrase (max 15 chars).
             - "zh": { "name": "Chinese Name" }
             - "en": { "name": "English Name" }
          
          =========================================================
          FORMATTING & OUTPUT RULES
          =========================================================
          1. CONCISENESS IS KING: Keep "formula", "from", "to", and "cond" extremely short! Mobile screens are small. 
          2. USE CHEMICAL FORMULAS: The \`formula\` field MUST be a chemical formula or structural formula (e.g. C₆H₅Br, PhOH), NEVER a long text name. The \`zh\` and \`en\` fields will contain the full names.
          3. PROPER UNICODE: Chemical formulas MUST use proper Unicode subscripts/superscripts (e.g., H₂O, SO₄²⁻, NH₄⁺, C₆H₁₂O₆, ΔH).
          4. DICTIONARY MATCHING: EVERY 'from' and 'to' value in 'reactions' MUST exactly match a key in the 'compounds' dictionary.
          5. BILINGUAL: BOTH 'zh' and 'en' names MUST be provided for every compound and condition.
          6. STRICT LANGUAGE ENFORCEMENT (严格语言控制): For any text fields (like names in 'compounds' or conditions in 'cond'), you MUST provide BOTH 'zh' (Chinese) and 'en' (English) translations. DO NOT mix English and Chinese within the same string. 
          7. REACTION TYPES: If you use a "type" that is NOT standard (like "Substitution", "Addition", "Elimination", "Oxidation", "Reduction", "Acid-Base", "Precipitation", "Complexation", "Thermodynamics", "Kinetics", "Electrochemistry", "Quantum", "Spectroscopy", "Chromatography", "Titration", "Symmetry", "Bonding", "Crystal"), you MUST define it in a new "rxnTypes" dictionary in the root of the JSON.
              - "rxnTypes": { "CustomTypeKey": { "zh": "Chinese Name", "en": "English Name" } }
          8. Output ONLY valid JSON. Do not wrap in markdown code blocks (\`\`\`json). Start directly with { and end with }.

          Return a JSON object with keys: "_thought_process", "compounds", "reactions", "symmetry", "rxnTypes" (optional), and "subjectCategory" (e.g., "ORGANIC", "INORGANIC", "PHYSICAL", "ANALYTICAL", or "STRUCTURAL").
          `;

          let responseText = '';

          if (llmProvider === 'gemini') {
              const ai = new GoogleGenAI(effectiveApiKey ? { apiKey: effectiveApiKey } : {});
              const parts: any[] = [{ text: promptText }];
              if (base64Data) {
                  parts.push({ inlineData: { mimeType: mimeType, data: base64Data } });
              } else {
                  parts.push({ text: `Content to analyze:\n${fileTextContent}` });
              }

              const response = await ai.models.generateContent({
                  model: 'gemini-3.1-pro-preview',
                  contents: {
                      parts: parts
                  },
                  config: {
                      systemInstruction: "You are an expert chemistry professor and game designer. Your task is to generate highly accurate, scientifically rigorous, and innovative chemistry questions for a matching game. You must strictly output valid JSON.",
                      // responseMimeType: 'application/json' // Removed to avoid strict JSON enforcement errors if model wants to add markdown
                  }
              });
              responseText = response.text || '{}';
          } else {
              const providerConfig = llmProvider === 'custom' 
                  ? { baseUrl: customBaseUrl, model: customModel }
                  : LLM_PROVIDERS[llmProvider as keyof typeof LLM_PROVIDERS];
                  
              const isImage = mimeType.startsWith('image/');
              
              let content: any[] = [
                  { type: 'text', text: promptText }
              ];
              
              if (isImage) {
                  content.push({
                      type: 'image_url',
                      image_url: {
                          url: `data:${mimeType};base64,${base64Data}`
                      }
                  });
              } else if (fileTextContent) {
                  content[0].text += `\n\nDocument Content:\n${fileTextContent}`;
              }
              
              const body = {
                  model: providerConfig.model,
                  messages: [
                      {
                          role: 'user',
                          content: content
                      }
                  ],
                  max_tokens: 4096
              };

              const res = await fetch(providerConfig.baseUrl, {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${apiKey}`
                  },
                  body: JSON.stringify(body)
              });

              if (!res.ok) {
                  const errData = await res.json().catch(() => ({}));
                  throw new Error(errData.error?.message || `HTTP error ${res.status}`);
              }

              const data = await res.json();
              responseText = data.choices[0].message.content;
          }

          // Extract JSON from markdown blocks if present
          const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          if (jsonMatch) {
              responseText = jsonMatch[1].trim();
          } else {
              responseText = responseText.replace(/^```json/m, '').replace(/```$/m, '').trim();
              // Sometimes models output text before the JSON
              const firstBrace = responseText.indexOf('{');
              const lastBrace = responseText.lastIndexOf('}');
              if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                  responseText = responseText.substring(firstBrace, lastBrace + 1);
              }
          }
          
          let data;
          try {
              data = JSON.parse(responseText);
          } catch (parseErr: any) {
              // Attempt to fix truncated JSON
              let fixed = false;
              let currentText = responseText.trim();
              
              // Remove trailing comma if any
              if (currentText.endsWith(',')) {
                  currentText = currentText.slice(0, -1);
              }
              
              // Try appending closing brackets
              const suffixesToTry = [
                  '}', '}}', '}}}', 
                  ']}', ']}', ']}}', 
                  '"}', '""}', '":""}', 
                  '}]}', '}}]}',
                  ',"reactions":[],"symmetry":[]}',
                  '},"reactions":[],"symmetry":[]}',
                  '}}'
              ];
              
              for (const suffix of suffixesToTry) {
                  try {
                      data = JSON.parse(currentText + suffix);
                      fixed = true;
                      console.log('Successfully fixed truncated JSON with suffix:', suffix);
                      break;
                  } catch (e) {
                      // Continue trying
                  }
              }
              
              // If still failing, try to cut off the last incomplete line and try again
              if (!fixed) {
                  const lines = currentText.split('\n');
                  if (lines.length > 1) {
                      lines.pop(); // Remove last line
                      currentText = lines.join('\n').trim();
                      if (currentText.endsWith(',')) currentText = currentText.slice(0, -1);
                      
                      for (const suffix of suffixesToTry) {
                          try {
                              data = JSON.parse(currentText + suffix);
                              fixed = true;
                              console.log('Successfully fixed truncated JSON by removing last line and adding suffix:', suffix);
                              break;
                          } catch (e) {
                              // Continue trying
                          }
                      }
                  }
              }

              if (!fixed) {
                  console.error('JSON Parse Error:', parseErr);
                  console.error('Raw Response:', responseText);
                  throw new Error(`Failed to parse AI response as JSON. The response might have been truncated. Error: ${parseErr.message}`);
              }
          }
          
          const { compounds, reactions, symmetry, subjectCategory, rxnTypes } = parseImportedData(data);

          if (reactions.length > 0 || symmetry.length > 0) {
              const customId = `CUSTOM_${Date.now()}`;
              const newReactions = reactions.map((r: any) => ({ ...r, chapter: customId, bankId: customId, cond: typeof r.cond === 'string' ? { zh: r.cond, en: r.cond } : (r.cond || { zh: '', en: '' }) }));
              const newSymmetry = symmetry.map((s: any) => ({ ...s, bankId: customId, elements: s.elements || [], wrong: s.wrong || [] }));
              
              const dateStr = new Date().toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }).replace(/\//g, '');
              const subjectMap: Record<string, string> = {
                  'ORGANIC': settings.language === 'zh' ? '有机' : 'Org',
                  'INORGANIC': settings.language === 'zh' ? '无机' : 'Inorg',
                  'PHYSICAL': settings.language === 'zh' ? '物化' : 'Phys',
                  'ANALYTICAL': settings.language === 'zh' ? '分析' : 'Analyt',
                  'STRUCTURAL': settings.language === 'zh' ? '结构' : 'Struct'
              };
              const subjectName = subjectMap[subjectCategory] || (settings.language === 'zh' ? '综合' : 'Gen');
              const generatedFileName = `AI-${dateStr}-${subjectName}`;

              const newImport: ImportedData = {
                  fileName: generatedFileName,
                  customChapterId: customId,
                  compounds: compounds,
                  reactions: newReactions,
                  symmetry: newSymmetry,
                  rxnTypes: rxnTypes,
                  importDate: Date.now(),
                  subjectCategory: subjectCategory
              };
              setImportedDataList(prev => [...prev, newImport]);
              
              setSettings(s => ({ ...s, selectedChapters: [customId] }));
              stateRef.current.settings.selectedChapters = [customId];
              play('start');
              showAlert(
                  settings.language === 'zh' ? '导入成功！新题库已加载。是否立即开始游戏？' : 'Import successful! New question bank loaded. Start game now?',
                  settings.language === 'zh' ? '成功' : 'Success',
                  () => {
                      stateRef.current.settings.selectedChapters = [customId];
                      setPendingStart(customId);
                  },
                  () => setGameState('MENU'),
                  settings.language === 'zh' ? '返回菜单' : 'Menu',
                  settings.language === 'zh' ? '开始游戏' : 'Start'
              );
          } else {
              console.error('AI returned:', responseText);
              throw new Error(settings.language === 'zh' ? '没有可用题目！AI 返回的数据中未包含有效的反应或结构题。' : 'No questions available! AI returned no valid reactions or symmetry questions.');
          }
      } catch (err: any) {
          console.error(err);
          play('error');
          showAlert(settings.language === 'zh' ? 'AI 识别失败: ' + err.message : 'AI Recognition failed: ' + err.message);
      } finally {
          if (typeof thinkingInterval !== 'undefined') clearInterval(thinkingInterval);
          setIsGenerating(false);
          clearInput();
      }
  };

  const handleClearImport = () => {
      setImportedDataList([]);
      setSettings(s => ({ ...s, selectedChapters: s.selectedChapters.filter(c => !c.startsWith('CUSTOM_')) }));
      play('back');
  };

  const handleImportText = () => {
      const text = tempImportText || prompt('Paste JSON content here:');
      if (text) {
          try {
              let parsedText = text.replace(/^```json/m, '').replace(/```$/m, '').trim();
              const data = JSON.parse(parsedText);
              
              const { compounds, reactions, symmetry, subjectCategory, rxnTypes } = parseImportedData(data);

              if (reactions.length > 0 || symmetry.length > 0) {
                  const customId = `CUSTOM_${Date.now()}`;
                  const newReactions = reactions.map((r: any) => ({ ...r, chapter: customId, bankId: customId, cond: typeof r.cond === 'string' ? { zh: r.cond, en: r.cond } : (r.cond || { zh: '', en: '' }) }));
                  const newSymmetry = symmetry.map((s: any) => ({ ...s, bankId: customId, elements: s.elements || [], wrong: s.wrong || [] }));
                  const newImport: ImportedData = {
                      fileName: 'pasted_data.json',
                      customChapterId: customId,
                      compounds: compounds,
                      reactions: newReactions,
                      symmetry: newSymmetry,
                      rxnTypes: rxnTypes,
                      importDate: Date.now(),
                      subjectCategory: subjectCategory
                  };
                  setImportedDataList(prev => [...prev, newImport]);
                  setSettings(s => ({ ...s, selectedChapters: [customId] }));
                  stateRef.current.settings.selectedChapters = [customId];
                  play('start');
                  setTempImportText(''); // Clear the textarea after successful import
                  showAlert(
                      settings.language === 'zh' ? '导入成功！新题库已加载。是否立即开始游戏？' : 'Import successful! New question bank loaded. Start game now?',
                      settings.language === 'zh' ? '成功' : 'Success',
                      () => {
                          stateRef.current.settings.selectedChapters = [customId];
                          setPendingStart(customId);
                      },
                      () => setGameState('MENU'),
                      settings.language === 'zh' ? '返回菜单' : 'Menu',
                      settings.language === 'zh' ? '开始游戏' : 'Start'
                  );
              } else {
                  play('error');
                  showAlert(settings.language === 'zh' ? '没有可用题目！请检查 JSON 内容。' : 'No questions available! Please check the JSON content.');
              }
          } catch (err: any) {
              play('error');
              showAlert(`Failed to parse JSON: ${err.message}`);
          }
      }
  };

  const currentBgColor = themeColors.lightHex;
  const currentTextColor = themeColors.darkHex;

  return (
    <div className={`fixed inset-0 flex flex-col items-center justify-center font-sans select-none overflow-hidden ${showControls ? 'bg-gradient-to-b from-[#c8c9c9] via-[#b8b9b9] to-[#a8a9a9] pt-[max(env(safe-area-inset-top),8px)] pb-[max(env(safe-area-inset-bottom),12px)]' : 'bg-black'} h-[100dvh]`}>
        <FontStyles />
        {showControls && <div className="absolute inset-0 opacity-40 mix-blend-multiply bg-[radial-gradient(rgba(0,0,0,0.1)_0.5px,transparent_0.5px)] [background-size:2px_2px] pointer-events-none"></div>}

        <div className={`relative z-10 transition-all duration-300 flex w-full h-full mx-auto ${showControls ? (isLandscape ? 'flex-row items-center justify-between p-1 sm:p-2 md:p-4 max-w-[1600px] gap-1 sm:gap-2 md:gap-4' : 'flex-col p-2 md:p-6 max-w-[800px]') : 'flex-col max-w-full'}`}>
          
          {isLandscape && showControls && (
             <div data-controls="true" className="flex flex-col justify-center items-center gap-6 sm:gap-10 shrink-0 relative h-full w-28 sm:w-36 md:w-48">
                 <div className="flex justify-center items-baseline opacity-80">
                     <span className="font-sans font-black italic text-[#2b2b6b] tracking-tighter text-[14px] sm:text-[18px] md:text-[22px]">Nintendo</span>
                 </div>
                 
                 <AnalogStick onMove={handleStick} active={true} deadzone={settings.joyDeadzone ?? 0.1} sensitivity={settings.joySensitivity ?? 1.0} vibrate={vibrate} />
                 
                 <div className="flex justify-center items-baseline gap-0.5 opacity-80">
                     <span className="font-sans italic text-[16px] sm:text-[20px] md:text-[24px] leading-none font-semibold text-[#2b2b6b] tracking-[0.1em] whitespace-nowrap">GAME BOY</span>
                     <span className="font-sans italic text-[8px] leading-none font-bold text-[#2b2b6b] tracking-tighter mb-1 sm:mb-2">TM</span>
                 </div>
             </div>
          )}

          <div className={`relative flex flex-col z-10 ${showControls ? (isLandscape ? 'flex-1 h-full max-h-[90vh] min-w-0' : 'w-full flex-1 min-h-[40vh]') : 'w-full h-full flex-1'}`}>
              
              <div className={`flex-1 ${showControls ? 'bg-[#5b5f63] shadow-[0_10px_20px_rgba(0,0,0,0.4),inset_0_2px_4px_rgba(255,255,255,0.1)] border-[3px] border-[#333] rounded-[0.5rem] md:rounded-[1rem] p-2 md:p-4' : 'bg-[#2c2f33] border border-[#4a4d53] shadow-[0_8px_32px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.15)] rounded-[1.25rem] mt-[max(env(safe-area-inset-top),12px)] mb-[max(env(safe-area-inset-bottom),12px)] ml-[max(env(safe-area-inset-left),12px)] mr-[max(env(safe-area-inset-right),12px)] p-1.5 sm:p-2.5'} relative overflow-hidden flex flex-col transition-all duration-500`}>
                 
                 <div className="absolute top-0 left-0 w-[150%] h-[30%] bg-gradient-to-b from-white/10 to-transparent -rotate-6 transform origin-top-left pointer-events-none z-0"></div>

                 <div className="flex justify-between items-center mb-1 sm:mb-2 px-1 relative z-10 min-h-[14px] sm:min-h-[18px]">
                      {/* Left: Battery */}
                      <div className="text-[8px] sm:text-[10px] text-[#9a9e9e] font-bold tracking-widest flex items-center gap-1 sm:gap-2 font-pixel drop-shadow-sm shrink-0 z-10 opacity-80">
                          <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full border border-[#111] transition-colors duration-500 ${gameState !== 'APP_EXIT_CONFIRM' ? 'bg-[#e81c1c] shadow-[0_0_8px_rgba(232,28,28,1),0_0_12px_rgba(232,28,28,0.6),inset_0_1px_2px_rgba(255,255,255,0.8)] animate-[pulse_3s_ease-in-out_infinite]' : 'bg-[#5c1010] shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]'}`}></span>
                          <span className="leading-none mt-[2px]">BATTERY</span>
                      </div>

                      {/* Right: LED Array - Elegant Pill Indentation */}
                      <div className="flex items-center gap-2 sm:gap-2.5 z-20 px-2 py-[2px] sm:px-2.5 sm:py-[3px] bg-black/[0.04] rounded-[4px] border border-black/[0.08] shadow-[inset_0_1px_2px_rgba(0,0,0,0.15),0_1px_0_rgba(255,255,255,0.2)]">
                           {/* System Dot (Amber - Breathing) */}
                           <div className="group relative" title="System Ready">
                               <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 border border-[#111] bg-[#ffa502] shadow-[0_0_8px_rgba(255,165,2,1),0_0_12px_rgba(255,165,2,0.6),inset_0_1px_2px_rgba(255,255,255,0.8)] rounded-full animate-[pulse_3s_ease-in-out_infinite]"></div>
                           </div>

                           {/* Gamepad Dot (Teal for 1, Retro Green for 2+) */}
                           <div className="group relative" title={connectedGamepadsCount > 0 ? `${connectedGamepadsCount} Gamepad(s) Connected` : "Gamepad Disconnected"}>
                               <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 border border-[#111] rounded-full transition-all duration-500 ${connectedGamepadsCount >= 2 ? 'bg-[#2ed573] shadow-[0_0_8px_rgba(46,213,115,1),0_0_12px_rgba(46,213,115,0.6),inset_0_1px_2px_rgba(255,255,255,0.8)] animate-[pulse_3s_ease-in-out_infinite]' : connectedGamepadsCount === 1 ? 'bg-[#1e90ff] shadow-[0_0_8px_rgba(30,144,255,1),0_0_12px_rgba(30,144,255,0.6),inset_0_1px_2px_rgba(255,255,255,0.8)] animate-[pulse_3s_ease-in-out_infinite]' : 'bg-[#0f4c3a] shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]'}`}></div>
                           </div>

                          {/* Controls Toggle Dot (Retro Red) */}
                          <div 
                              className="group relative outline-none p-4 -m-4 z-30"
                              title={settings.language === 'zh' ? '虚拟按键状态 (双指捏合/张开切换)' : 'Virtual Controls Status (Pinch to toggle)'}
                          >
                              <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 border border-[#111] rounded-full transition-all duration-500 ${!showControls ? 'bg-[#e81c1c] shadow-[0_0_8px_rgba(232,28,28,1),0_0_12px_rgba(232,28,28,0.6),inset_0_1px_2px_rgba(255,255,255,0.8)] animate-[pulse_3s_ease-in-out_infinite]' : 'bg-[#5c1010] shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]'}`}></div>
                          </div>

                          {/* Time Limit Mode Dot (Retro Magenta) */}
                          <div className="group relative" title={settings.language === 'zh' ? '限时模式' : 'Time Limit Mode'}>
                              <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 border border-[#111] rounded-full transition-all duration-500 ${settings.timeLimitMode ? 'bg-[#e056fd] shadow-[0_0_8px_rgba(224,86,253,1),0_0_12px_rgba(224,86,253,0.6),inset_0_1px_2px_rgba(255,255,255,0.8)] animate-[pulse_3s_ease-in-out_infinite]' : 'bg-[#4c155c] shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]'}`}></div>
                          </div>
                      </div>
                 </div>

                 <div style={{backgroundColor: currentBgColor, color: currentTextColor}} className={`flex-1 ${showControls ? 'border-[2px] border-[#252626] rounded-sm' : 'border-[2px] border-[#1a1c1e] rounded-[0.75rem]'} relative overflow-hidden flex flex-col shadow-[inset_0_6px_16px_rgba(0,0,0,0.6)] transition-colors duration-500 z-10`}>
                      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(0,0,0,0.05)_50%,transparent_50%),linear-gradient(90deg,rgba(0,0,0,0.05)_50%,transparent_50%)] [background-size:4px_4px] z-30 mix-blend-overlay opacity-50"></div>

                      {/* Dynamic Island */}
                      <div className={`absolute top-0 left-1/2 -translate-x-1/2 z-40 bg-theme-dark text-theme-light rounded-b-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_-2px_4px_rgba(255,255,255,0.1)] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] flex justify-center items-center px-5 sm:px-8 py-1.5 sm:py-2 gap-4 sm:gap-6 border-x border-b border-theme-dark ${
                          (gameState === 'PLAYING' || gameState === 'PAUSED' || gameState === 'QUIT_CONFIRM' || gameState === 'RESET_CONFIRM')
                          ? 'translate-y-0 opacity-100 scale-100'
                          : '-translate-y-full opacity-0 scale-95'
                      }`}>
                          {(settings.timeLimitMode || isTutorial) && (
                              <div className={`flex items-center justify-center shrink-0 relative transition-all duration-300 ${timeLeft <= 10 && (gameState === 'PLAYING' || gameState === 'PAUSED') && !isTutorial ? 'animate-pulse' : ''}`}>
                                  <span className={`relative z-10 text-xs sm:text-sm font-bold font-led tracking-tight leading-none ${timeLeft <= 10 && (gameState === 'PLAYING' || gameState === 'PAUSED') && !isTutorial ? 'text-[#ef4444] drop-shadow-[0_0_6px_rgba(239,68,68,0.8)]' : 'text-theme-light'}`}>
                                      {isTutorial ? '03:00' : `${Math.floor((gameState === 'PLAYING' || gameState === 'PAUSED' || gameState === 'QUIT_CONFIRM' || gameState === 'RESET_CONFIRM' ? timeLeft : (settings.timeLimitDuration || 180)) / 60).toString().padStart(2, '0')}:${((gameState === 'PLAYING' || gameState === 'PAUSED' || gameState === 'QUIT_CONFIRM' || gameState === 'RESET_CONFIRM' ? timeLeft : (settings.timeLimitDuration || 180)) % 60).toString().padStart(2, '0')}`}
                                  </span>
                              </div>
                          )}
                          <div className="flex items-center justify-center shrink-0 relative" title={settings.language === 'zh' ? '进度: 已答对/总题数' : 'Progress: Solved/Total'}>
                              <span className="relative z-10 text-xs sm:text-sm font-bold font-led tracking-tight leading-none text-theme-light">
                                  {isTutorial ? '3/100' : (() => {
                                      const selected = settings.selectedChapters;
                                      let total = 0;
                                      const getReactionModesCount = (r: any) => {
                                          let allowedModes = ['product', 'cond', 'reactant', 'type'];
                                          if (r.distractors) {
                                              const explicitModes = Object.keys(r.distractors).filter(k => r.distractors[k]?.length);
                                              if (explicitModes.length > 0) {
                                                  allowedModes = explicitModes;
                                              }
                                          }
                                          return allowedModes.length;
                                      };

                                      if (selected.length === 0) {
                                          total = (dbReactions || []).reduce((acc: number, r: any) => acc + getReactionModesCount(r), 0) + (dbSymmetry || []).length;
                                      } else {
                                          total += (dbReactions || []).filter((r: any) => {
                                              if (r.bankId && selected.includes(r.bankId)) return true;
                                              if (selected.includes('ORGANIC') && !r.chapter.startsWith('CUSTOM_') && !['INORGANIC', 'STRUCTURAL', 'PHYSICAL', 'ANALYTICAL'].includes(r.chapter)) return true;
                                              return selected.includes(r.chapter);
                                          }).reduce((acc: number, r: any) => acc + getReactionModesCount(r), 0);
                                          total += (dbSymmetry || []).filter((s: any) => {
                                              if (s.bankId && selected.includes(s.bankId)) return true;
                                              if (selected.includes('STRUCTURAL') && !s.bankId) return true;
                                              return false;
                                          }).length;
                                      }
                                      const solved = new Set((history || []).filter(h => h && h.correct).map(h => h.gameMode === 'symmetry' ? h.rxnFrom : `${h.rxnFrom}_${h.rxnTo}_${h.gameMode}`)).size;
                                      return `${solved}/${total}`;
                                  })()}
                              </span>
                          </div>
                      </div>

                      <div className="p-1 border-b border-black/20 z-20 shrink-0 min-h-[40px] sm:min-h-[50px] flex flex-col gap-0.5 font-pixel tracking-wide relative">
                          <div className="flex justify-between items-center text-xs md:text-sm leading-normal border-b border-black/20 pb-1.5 mb-1 font-bold gap-2">
                              <div className="uppercase min-w-0 truncate flex items-center gap-1.5 justify-start">
                                  {chapterTitle.startsWith('📁') ? (
                                      <>
                                          <Folder size={12} className="shrink-0" />
                                          <span className="pt-0.5 truncate">{chapterTitle.replace('📁 ', '')}</span>
                                      </>
                                  ) : chapterTitle.includes(' ') ? (
                                      <>
                                          <span className="shrink-0">{chapterTitle.split(' ')[0]}</span>
                                          <span className="text-[10px] md:text-xs opacity-90 mt-[1px] truncate">{chapterTitle.split(' ').slice(1).join(' ')}</span>
                                      </>
                                  ) : (
                                      <span className="pt-0.5 truncate">{chapterTitle}</span>
                                  )}
                              </div>

                              <div className="flex gap-1.5 sm:gap-2 items-center justify-end opacity-90 whitespace-nowrap">
                                   {settings.sound && <Volume2 size={12} className="shrink-0" />}
                                   {settings.vibration && <Smartphone size={12} className="shrink-0" />}
                                   <span className="text-sm tracking-tighter shrink-0 min-w-[3.5rem] text-right flex items-center gap-2">
                                       {isVersus ? (
                                           <>
                                               <span className="text-theme-dark font-bold">P1: {score < 0 ? '-' + Math.abs(score).toString().padStart(4, '0') : score.toString().padStart(5, '0')}</span>
                                               <span className="text-[#306230] font-bold">P2: {score2 < 0 ? '-' + Math.abs(score2).toString().padStart(4, '0') : score2.toString().padStart(5, '0')}</span>
                                           </>
                                       ) : (
                                           score < 0 ? '-' + Math.abs(score).toString().padStart(4, '0') : score.toString().padStart(5, '0')
                                       )}
                                   </span>
                              </div>
                          </div>
                          
                          {(gameState === 'PLAYING' || gameState === 'PAUSED' || gameState === 'QUIT_CONFIRM' || gameState === 'RESET_CONFIRM') && (
                             <div className="flex items-center justify-between gap-2 flex-1 px-1 h-full relative font-led">
                                {gameState === 'PLAYING' && isTutorial && (
                                    <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-[90%] max-w-[320px] bg-theme-dark/60 backdrop-blur-sm text-theme-light p-2 sm:p-3 rounded border border-theme-light/50 text-center font-pixel shadow-lg z-20 text-xs sm:text-sm leading-relaxed pointer-events-none">
                                        {tutorialStep === 0 && (settings.language === 'zh' ? '欢迎来到化蛇！使用方向键或WASD移动。' : 'Welcome to ChemSnake! Use Arrow Keys or WASD to move.')}
                                        {tutorialStep === 1 && (settings.language === 'zh' ? '看上方的化学方程式，吃掉正确的产物！' : 'Look at the equation above. Eat the correct product!')}
                                        {tutorialStep === 2 && (settings.language === 'zh' ? '太棒了！你获得了分数并变长了。' : 'Great! You scored points and grew longer.')}
                                        {tutorialStep === 3 && (settings.language === 'zh' ? '现在试试吃掉【错误】的答案看看会发生什么。' : 'Now try eating the WRONG answer to see what happens.')}
                                        {tutorialStep === 4 && (settings.language === 'zh' ? '哎呀！吃错会扣分并缩短身体。请尽量避免！' : 'Ouch! Wrong answers deduct points and shrink you. Avoid them!')}
                                        {tutorialStep === 5 && (settings.language === 'zh' ? '有时候，你需要根据产物猜测【反应条件】！' : 'Sometimes you need to guess the Reaction Condition!')}
                                        {tutorialStep === 6 && (settings.language === 'zh' ? '干得漂亮！' : 'Well done!')}
                                        {tutorialStep === 7 && (settings.language === 'zh' ? '还有些时候，你需要根据产物和条件猜测【反应物】！' : 'Other times, you need to guess the Reactant!')}
                                        {tutorialStep === 8 && (settings.language === 'zh' ? '完美！' : 'Perfect!')}
                                        {tutorialStep === 9 && (settings.language === 'zh' ? '注意顶部：左侧是限时模式的倒计时，右侧是你的答题进度。' : 'Look top: Left is Time Limit countdown, Right is your solved/total progress.')}
                                        {tutorialStep === 10 && (settings.language === 'zh' ? '双指轻触屏幕空白处，可隐藏/显示虚拟按键，享受全屏体验！' : 'Double-tap 2 fingers on empty space to toggle controls for full screen!')}
                                        {tutorialStep === 11 && (settings.language === 'zh' ? '留意机身LED灯：左侧红灯=电源；右侧四灯：黄=运行，蓝/绿=单/双手柄，红=全屏，紫=限时。' : 'LEDs: Left Red=Power. Right 4 LEDs: Gold=Status, Blue/Green=1/2 Pads, Red=Full Screen, Magenta=Time Limit.')}
                                        {tutorialStep === 12 && (settings.language === 'zh' ? '教程结束！按 [B] 或 ESC 返回主菜单。' : 'Tutorial Complete! Press [B] or ESC to return.')}
                                    </div>
                                )}
                                {isSymmetry && currentSymmetry ? (
                                    <div className="flex flex-col items-center justify-center w-full h-full px-2 py-1">
                                        <div className="text-sm sm:text-base font-bold text-theme-dark mb-1.5 leading-none font-sans tracking-normal">
                                            {currentSymmetry.molecule} <span className="opacity-70 text-xs sm:text-sm">({currentSymmetry.pointGroup})</span>
                                        </div>
                                        <div className="flex gap-1.5 flex-wrap justify-center">
                                            {currentSymmetry.elements.map((el, idx) => {
                                                const isCollected = collectedElements.includes(el);
                                                return (
                                                    <div key={idx} className={`px-1.5 py-0.5 border-2 rounded text-xs sm:text-sm font-bold leading-none font-sans tracking-normal ${isCollected ? 'border-theme-dark text-theme-light bg-theme-dark' : 'border-theme-dark/40 text-theme-dark/60 bg-transparent border-dashed'}`}>
                                                        {isCollected ? el : '?'}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : currentRxn ? (
                                    <>
                                        <div className="flex-1 flex justify-end min-w-0">
                                            <div className="flex flex-col items-center max-w-full">
                                               <div className={`font-bold font-led whitespace-nowrap overflow-visible transition-all ${gameMode === 'reactant' ? 'animate-pulse bg-theme-dark text-theme-light px-2 rounded ring-2 ring-theme-light shadow-lg scale-110' : 'opacity-90'} ${getHudFontSize(gameMode === 'reactant' ? '???' : fromComp.formula)}`}>
                                                  {gameMode === 'reactant' ? '???' : fromComp.formula}
                                               </div>
                                               <div className="text-[10px] font-bold leading-tight truncate max-w-full opacity-70 mt-1">{gameMode === 'reactant' ? '???' : fromComp.name}</div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-center justify-center px-1 mx-2 shrink-0">
                                           {condText && condText !== 'NONE' && condText !== '无' && (
                                               <div style={{backgroundColor: gameMode === 'cond' ? themeColors.darkHex : currentTextColor, color: gameMode === 'cond' ? themeColors.lightHex : currentBgColor}} className={`text-sm text-center whitespace-nowrap border px-2 py-0.5 rounded z-10 font-led shadow-sm mb-1.5 transition-all ${gameMode === 'cond' ? 'animate-pulse ring-2 ring-theme-light shadow-lg scale-110' : ''}`}>
                                                  {condText}
                                               </div>
                                           )}
                                           <div style={{backgroundColor: currentTextColor}} className="w-full h-[2px] relative mt-0 opacity-50">
                                              <div style={{borderLeftColor: currentTextColor}} className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[4px] border-t-transparent border-l-[6px] border-b-[4px] border-b-transparent"></div>
                                           </div>
                                           {currentRxn.type && currentRxn.type !== 'NONE' && currentRxn.type !== '无' && (
                                               <div style={{backgroundColor: gameMode === 'type' ? themeColors.darkHex : 'transparent', color: gameMode === 'type' ? themeColors.lightHex : currentTextColor}} className={`text-[10px] text-center whitespace-nowrap px-1 py-0.5 rounded z-10 font-bold mt-1 transition-all ${gameMode === 'type' ? 'animate-pulse ring-1 ring-theme-light shadow-sm scale-110' : 'opacity-70'}`}>
                                                  {gameMode === 'type' ? '???' : (settings.language === 'zh' ? (dbRxnTypes[currentRxn.type]?.zh || currentRxn.type) : (dbRxnTypes[currentRxn.type]?.en || currentRxn.type))}
                                               </div>
                                           )}
                                        </div>
                                        <div className="flex-1 flex justify-start min-w-0">
                                           <div className="flex flex-col items-center max-w-full">
                                               <div className={`font-bold font-led whitespace-nowrap overflow-visible transition-all ${gameMode === 'product' ? 'animate-pulse bg-theme-dark text-theme-light px-2 rounded ring-2 ring-theme-light shadow-lg scale-110' : 'opacity-90'} ${getHudFontSize(gameMode === 'product' ? '???' : toComp.formula)}`}>
                                                  {gameMode === 'product' ? '???' : toComp.formula}
                                               </div>
                                               <div className="text-[10px] font-bold leading-tight truncate max-w-full opacity-70 mt-1">{gameMode === 'product' ? '???' : toComp.name}</div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex-1 flex justify-center items-center font-bold text-xl opacity-50 font-pixel tracking-widest">
                                        {isTutorial ? (settings.language === 'zh' ? '等待操作...' : 'WAITING...') : ''}
                                    </div>
                                )}
                             </div>
                          )}
                      </div>

                      <div className="flex-1 relative min-h-0 w-full h-full overflow-hidden rounded-sm shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]" ref={canvasContainerRef}>
                           <div style={{transform: `translate(${shakeX}px, ${shakeY}px)`}} className="w-full h-full">
                              <canvas ref={canvasRef} className={`w-full h-full block ${gameState !== 'PLAYING' ? 'opacity-30 blur-sm' : ''}`} />
                           </div>
                           {/* Scanline and LCD grid filters */}
                           <div className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-30 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] [background-size:100%_2px,3px_100%] z-20"></div>
                           <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_20px_rgba(0,0,0,0.3)] z-20"></div>
                           
                           {flash && <div className="absolute inset-0 pointer-events-none z-10" style={{backgroundColor: flash.color, opacity: flash.opacity}}></div>}
                            
                            {gameState === 'PAUSED' && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-theme-light/90 z-30 font-led text-theme-dark">
                                    <div className="text-4xl font-pixel tracking-widest mb-8 animate-pulse">PAUSED</div>
                                    <div className="flex flex-col gap-4 text-center font-bold">
                                        <div className="text-xl">[A] {getLocalizedUI('RESUME', settings.language)}</div>
                                        <div className="text-xl opacity-70">[B] {getLocalizedUI('QUIT', settings.language)}</div>
                                    </div>
                                </div>
                            )}
                            {gameState === 'QUIT_CONFIRM' && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-theme-light/95 z-40 font-led text-theme-dark">
                                    <div className="text-2xl font-pixel mb-6 text-center px-4 leading-relaxed tracking-widest">{getLocalizedUI('REALLY_QUIT', settings.language)}</div>
                                    <div className="flex flex-col gap-4 text-xl text-center font-bold">
                                        <div className="animate-pulse">[A] {getLocalizedUI('YES', settings.language)}</div>
                                        <div className="opacity-70">[B] {getLocalizedUI('NO', settings.language)}</div>
                                    </div>
                                </div>
                            )}
                            {gameState === 'APP_EXIT_CONFIRM' && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-theme-light/95 z-50 font-led text-theme-dark">
                                    <div className="text-2xl font-pixel mb-6 text-center px-4 leading-relaxed tracking-widest">{getLocalizedUI('CONFIRM_EXIT_APP', settings.language)}</div>
                                    <div className="flex flex-col gap-4 text-xl text-center font-bold">
                                        <div className="animate-pulse">[A] {getLocalizedUI('YES', settings.language)}</div>
                                        <div className="opacity-70">[B] {getLocalizedUI('NO', settings.language)}</div>
                                    </div>
                                </div>
                            )}
                            {gameState === 'RESET_CONFIRM' && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-theme-light/95 z-40 font-led text-theme-dark">
                                    <div className="text-2xl font-pixel mb-6 text-center px-4 leading-relaxed tracking-widest">{getLocalizedUI('CONFIRM_RESET', settings.language)}</div>
                                    <div className="flex flex-col gap-4 text-xl text-center font-bold">
                                        <div className="animate-pulse">[A] {getLocalizedUI('YES', settings.language)}</div>
                                        <div className="opacity-70">[B] {getLocalizedUI('NO', settings.language)}</div>
                                    </div>
                                </div>
                            )}
                            {gameState === 'MENU' && (
                                <div className="absolute inset-0 flex flex-col p-4 bg-theme-light/95 backdrop-blur-sm z-20 font-led text-theme-dark" style={{ touchAction: 'auto' }}>
                                   {menuPage === 'MAIN' && (
                                      <>
                                          <div className={`text-center border-b border-theme-dark/30 ${isLandscape ? 'pb-1 mb-1' : 'pb-1 sm:pb-2 mb-1 sm:mb-2'}`}>
                                              <h1 className={`${isLandscape ? 'text-2xl' : 'text-3xl sm:text-4xl md:text-5xl'} font-pixel font-bold tracking-widest text-theme-dark ${isLandscape ? 'mb-0' : 'mb-1 sm:mb-2'}`}>CHEM<span className="text-[#8b2e5f] drop-shadow-md">SNAKE</span></h1>
                                          </div>
                                          <div className="flex-1 overflow-y-auto no-scrollbar space-y-2" ref={menuListRef}>
                                              {[
                                                  { id: 'START', label: getLocalizedUI('START', settings.language), icon: Play },
                                                  ...(isLargeScreen ? [{ id: 'VERSUS', label: getLocalizedUI('VERSUS', settings.language), icon: Waves }] : []),
                                                  { id: 'TUTORIAL', label: getLocalizedUI('TUTORIAL', settings.language), icon: Lightbulb },
                                                  { id: 'CHAPTERS', label: getLocalizedUI('CHAPTERS', settings.language), icon: BookOpen, value: settings.selectedChapters.length === 0 ? getLocalizedUI('ALL_SHORT', settings.language) : (settings.selectedChapters.length === 1 && settings.selectedChapters[0].startsWith('CUSTOM_') ? getChapterName(settings.selectedChapters[0], settings.language, importedDataList) : settings.selectedChapters.length) },
                                                  { id: 'DIFFICULTY_OPT', label: getLocalizedUI('DIFFICULTY_OPT', settings.language), icon: BarChart3, value: getLocalizedUI(`DIFF_${settings.difficulty}`, settings.language) },
                                                  { id: 'LEADERBOARD', label: getLocalizedUI('LEADERBOARD', settings.language), icon: Trophy },
                                                  { id: 'IMPORT', label: getLocalizedUI('IMPORT', settings.language), icon: Upload, value: importedDataList.length > 0 ? `📁 ${importedDataList.length} Banks` : '' },
                                                  { id: 'SETTINGS', label: getLocalizedUI('SETTINGS', settings.language), icon: Settings },
                                                  { id: 'EXIT_APP', label: getLocalizedUI('EXIT_APP', settings.language), icon: Power }
                                              ].map((item, idx) => (
                                                  <MenuItem key={item.id} label={item.label} active={menuIndex === idx} icon={item.icon} value={item.value as any} onClick={() => handleMenuClick(idx)} onFocus={() => setMenuIndex(idx)} />
                                              ))}
                                          </div>
                                      </>
                                   )}
                                   {menuPage !== 'MAIN' && (
                                       <>
                                          <div className="flex items-center gap-2 border-b border-theme-dark/30 pb-2 mb-2 text-theme-dark">
                                              <button onClick={() => handleAction('B')} className="text-xs px-2 py-1 border border-theme-dark rounded hover:bg-theme-dark/10 font-bold">[B] {getLocalizedUI('BACK_CMD', settings.language)}</button>
                                              <span className="flex-1 text-center font-bold tracking-widest">{getLocalizedUI(menuPage, settings.language)}</span>
                                          </div>
                                          <div className="flex-1 overflow-y-auto no-scrollbar space-y-2" ref={menuListRef}>
                                              {menuPage === 'CHAPTERS' && (
                                                  <>
                                                    <div className="text-[10px] text-center opacity-70 mb-1 border-b border-theme-dark/20 pb-1">
                                                        <span>
                                                          {settings.selectedChapters.length === 0 
                                                            ? (settings.language === 'zh' ? getLocalizedUI('ALL', settings.language) : 'MODE: ALL') 
                                                            : (settings.selectedChapters.length === 1 && settings.selectedChapters[0].startsWith('CUSTOM_'))
                                                                ? getChapterName(settings.selectedChapters[0], settings.language, importedDataList)
                                                                : (settings.language === 'zh' ? `已选: ${settings.selectedChapters.length} 章` : `SELECTED: ${settings.selectedChapters.length}`)}
                                                        </span>
                                                    </div>
                                                    <MenuItem label={getLocalizedUI('ALL', settings.language)} active={menuIndex === 0} value={settings.selectedChapters.length === 0 ? '[x]' : '[ ]'} onClick={() => handleMenuClick(0)} onFocus={() => setMenuIndex(0)} />
                                                    {availableChapters.map((chap, i) => (
                                                      <MenuItem key={chap} label={getChapterName(chap, settings.language, importedDataList)} active={menuIndex === i + 1} value={settings.selectedChapters.includes(chap) ? '[x]' : '[ ]'} onClick={() => handleMenuClick(i+1)} onFocus={() => setMenuIndex(i+1)} />
                                                  ))}
                                                  </>
                                              )}
                                              {menuPage === 'DIFFICULTY' &&['VERY_EASY', 'EASY', 'NORMAL', 'HARD', 'INSANE'].map((diff, i) => (
                                                   <MenuItem key={diff} label={getLocalizedUI(`DIFF_${diff}`, settings.language)} active={menuIndex === i} icon={settings.difficulty === diff ? Check : undefined} onClick={() => handleMenuClick(i)} onFocus={() => setMenuIndex(i)} />
                                              ))}
                                              {menuPage === 'SETTINGS' && (
                                                  <>
                                                      <MenuItem label={getLocalizedUI('SFX', settings.language)} active={menuIndex===0} icon={settings.sound ? Volume2 : VolumeX} value={settings.sound ? getLocalizedUI('ON', settings.language) : getLocalizedUI('OFF', settings.language)} onClick={() => handleMenuClick(0)} onFocus={() => setMenuIndex(0)} />
                                                      <MenuItem label={getLocalizedUI('MUSIC', settings.language)} active={menuIndex===1} icon={settings.music ? Music : Power} value={settings.music ? getLocalizedUI('ON', settings.language) : getLocalizedUI('OFF', settings.language)} onClick={() => handleMenuClick(1)} onFocus={() => setMenuIndex(1)} />
                                                      <MenuItem label={getLocalizedUI('VIBE', settings.language)} active={menuIndex===2} icon={settings.vibration ? Smartphone : Waves} value={settings.vibration ? getLocalizedUI('ON', settings.language) : getLocalizedUI('OFF', settings.language)} onClick={() => handleMenuClick(2)} onFocus={() => setMenuIndex(2)} />
                                                      <MenuItem label={getLocalizedUI('LANG', settings.language)} active={menuIndex===3} icon={Globe} value={settings.language === 'zh' ? '中文' : 'ENG'} onClick={() => handleMenuClick(3)} onFocus={() => setMenuIndex(3)} />
                                                      <MenuItem label={getLocalizedUI('TIME_LIMIT', settings.language)} active={menuIndex===4} icon={settings.timeLimitMode ? Check : undefined} value={settings.timeLimitMode ? getLocalizedUI('ON', settings.language) : getLocalizedUI('OFF', settings.language)} onClick={() => handleMenuClick(4)} onFocus={() => setMenuIndex(4)} />
                                                      <MenuItem label={getLocalizedUI('TIME_DURATION', settings.language)} active={menuIndex===5} icon={Clock} value={`${(settings.timeLimitDuration || 180) / 60} MIN`} onClick={() => handleMenuClick(5)} onFocus={() => setMenuIndex(5)} />
                                                      <MenuItem label={getLocalizedUI('DEADZONE', settings.language)} active={menuIndex===6} icon={Crosshair} type="slider" value={`${(settings.joyDeadzone ?? 0.1).toFixed(2)}`} onClick={() => handleMenuClick(6)} onFocus={() => setMenuIndex(6)} onDecrease={() => handleMenuAdjust(-1, 6)} onIncrease={() => handleMenuAdjust(1, 6)} />
                                                      <MenuItem label={getLocalizedUI('SENSITIVITY', settings.language)} active={menuIndex===7} icon={Activity} type="slider" value={`${(settings.joySensitivity ?? 1.0).toFixed(1)}`} onClick={() => handleMenuClick(7)} onFocus={() => setMenuIndex(7)} onDecrease={() => handleMenuAdjust(-1, 7)} onIncrease={() => handleMenuAdjust(1, 7)} />
                                                      <MenuItem label={getLocalizedUI('REPORT_EMAIL', settings.language)} active={menuIndex===8} icon={Send} value={settings.reportEmail ? (settings.reportEmail.length > 10 ? settings.reportEmail.substring(0, 8) + '...' : settings.reportEmail) : getLocalizedUI('UNSET_EMAIL', settings.language)} onClick={() => handleMenuClick(8)} onFocus={() => setMenuIndex(8)} />
                                                      <MenuItem label={settings.language === 'zh' ? 'AI 设置' : 'AI SETTINGS'} active={menuIndex===9} icon={Cpu} onClick={() => handleMenuClick(9)} onFocus={() => setMenuIndex(9)} />
                                                      <MenuItem label={getLocalizedUI('ABOUT', settings.language)} active={menuIndex===10} icon={Lightbulb} onClick={() => handleMenuClick(10)} onFocus={() => setMenuIndex(10)} />
                                                      <MenuItem label={settings.language === 'zh' ? '重置设置' : 'RESET SETTINGS'} active={menuIndex===11} icon={RotateCcw} onClick={() => handleMenuClick(11)} onFocus={() => setMenuIndex(11)} />
                                                      <div className="text-[10px] text-center opacity-50 mt-2 font-led w-full">
                                                          {settings.language === 'zh' ? '设置已自动保存' : 'Settings auto-saved'}
                                                      </div>
                                                  </>
                                              )}
                                              {menuPage === 'LEADERBOARD' && (
                                                  <div className="p-2 font-led text-sm space-y-2">
                                                      {leaderboard.length === 0 ? (
                                                          <div className="text-center opacity-50 py-10">{getLocalizedUI('NO_DATA', settings.language)}</div>
                                                      ) : (
                                                          leaderboard.map((entry, i) => (
                                                              <div key={entry.id} className="flex items-center justify-between border-b border-theme-dark/10 pb-1 last:border-0">
                                                                  <div className="flex items-center gap-2">
                                                                      <span className={`font-bold w-5 text-center ${i < 3 ? 'text-[#8b2e5f]' : 'opacity-60'}`}>{i + 1}</span>
                                                                      <div className="flex flex-col">
                                                                          <span className="font-bold truncate max-w-[100px]">{entry.name}</span>
                                                                          <span className="text-[10px] opacity-60">{new Date(entry.date).toLocaleDateString()}</span>
                                                                      </div>
                                                                  </div>
                                                                  <div className="flex flex-col items-end">
                                                                      <span className="font-bold text-lg leading-none">{entry.score}</span>
                                                                      <div className="flex items-center gap-1 text-[10px] opacity-70">
                                                                          <span>{getLocalizedUI(`DIFF_${entry.difficulty}`, settings.language)}</span>
                                                                          {entry.timeLimitMode && <Clock size={10} />}
                                                                      </div>
                                                                  </div>
                                                              </div>
                                                          ))
                                                      )}
                                                  </div>
                                              )}
                                              {menuPage === 'AI_SETTINGS' && (
                                                  <div className="p-2 font-led text-sm space-y-4 overflow-y-auto no-scrollbar" style={{ touchAction: 'auto' }}>
                                                      <div className="mb-2 shrink-0">
                                                          <label className="text-xs font-bold opacity-80 mb-1 block">{settings.language === 'zh' ? 'AI 模型提供商' : 'AI Provider'}</label>
                                                          <select 
                                                              value={llmProvider}
                                                              onChange={e => {
                                                                  setLlmProvider(e.target.value);
                                                                  try { localStorage.setItem('llm_provider', e.target.value); } catch {}
                                                              }}
                                                              className="w-full bg-theme-dark/10 border border-theme-dark/50 text-theme-dark text-sm p-1.5 focus:outline-none rounded font-bold"
                                                          >
                                                              <option value="gemini">Gemini (Google)</option>
                                                              <option value="openai">OpenAI (ChatGPT)</option>
                                                              <option value="deepseek">DeepSeek</option>
                                                              <option value="qwen">Tongyi Qianwen (通义千问)</option>
                                                              <option value="minimax">MiniMax</option>
                                                              <option value="custom">Custom (OpenAI Compatible)</option>
                                                          </select>
                                                      </div>

                                                      {llmProvider === 'custom' && (
                                                          <>
                                                              <div className="mb-2 shrink-0">
                                                                  <label className="text-xs font-bold opacity-80 mb-1 block">Base URL</label>
                                                                  <input 
                                                                      type="text" 
                                                                      value={customBaseUrl} 
                                                                      onChange={e => {
                                                                          setCustomBaseUrl(e.target.value);
                                                                          try { localStorage.setItem('custom_base_url', e.target.value); } catch {}
                                                                      }} 
                                                                      className="w-full bg-theme-dark/10 border border-theme-dark/50 text-theme-dark text-sm p-1.5 focus:outline-none rounded font-led placeholder:text-theme-dark/40" 
                                                                      placeholder="https://api.example.com/v1/chat/completions" 
                                                                  />
                                                              </div>
                                                              <div className="mb-2 shrink-0">
                                                                  <label className="text-xs font-bold opacity-80 mb-1 block">Model Name</label>
                                                                  <input 
                                                                      type="text" 
                                                                      value={customModel} 
                                                                      onChange={e => {
                                                                          setCustomModel(e.target.value);
                                                                          try { localStorage.setItem('custom_model', e.target.value); } catch {}
                                                                      }} 
                                                                      className="w-full bg-theme-dark/10 border border-theme-dark/50 text-theme-dark text-sm p-1.5 focus:outline-none rounded font-led placeholder:text-theme-dark/40" 
                                                                      placeholder="model-name" 
                                                                  />
                                                              </div>
                                                          </>
                                                      )}

                                                      <div className="mb-2 shrink-0">
                                                          <label className="text-xs font-bold opacity-80 mb-1 block">{settings.language === 'zh' ? 'API Key (用于AI识别和报告)' : 'API Key'}</label>
                                                          
                                                          {llmProvider === 'gemini' && (window as any).aistudio && (
                                                              <button 
                                                                  onClick={async () => {
                                                                      try {
                                                                          await (window as any).aistudio.openSelectKey();
                                                                      } catch (err) {
                                                                          console.error('Failed to open key selector:', err);
                                                                      }
                                                                  }}
                                                                  className="w-full mb-2 bg-theme-dark text-theme-light p-2 rounded font-bold text-xs flex items-center justify-center gap-2 hover:bg-theme-dark/90 transition-colors"
                                                              >
                                                                  <Key size={14} />
                                                                  {settings.language === 'zh' ? '从 AI Studio 选择 API Key' : 'Select Key from AI Studio'}
                                                              </button>
                                                          )}

                                                          <div className="relative">
                                                              <input 
                                                                  type="text" 
                                                                  style={{ WebkitTextSecurity: showApiKey ? 'none' : 'disc' } as any}
                                                                  value={apiKey} 
                                                                  onChange={e => {
                                                                      setApiKey(e.target.value);
                                                                      if (saveApiKey) {
                                                                          try { localStorage.setItem('gemini_api_key', e.target.value); } catch {}
                                                                      }
                                                                  }} 
                                                                  onFocus={(e) => setTimeout(() => e.target.scrollIntoView({behavior: 'smooth', block: 'center'}), 300)}
                                                                  className="w-full bg-theme-dark/10 border border-theme-dark/50 text-theme-dark text-sm p-1.5 pr-8 focus:outline-none rounded font-led placeholder:text-theme-dark/40" 
                                                                  placeholder={llmProvider === 'gemini' ? (settings.language === 'zh' ? '或手动输入 Key...' : 'Or enter Key manually...') : 'sk-...'} 
                                                              />
                                                              <button 
                                                                  type="button"
                                                                  onClick={() => setShowApiKey(!showApiKey)}
                                                                  className="absolute right-2 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100"
                                                              >
                                                                  {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                                              </button>
                                                          </div>
                                                          <div className="flex items-center gap-2 mt-2">
                                                              <input 
                                                                  type="checkbox" 
                                                                  id="saveApiKey"
                                                                  checked={saveApiKey}
                                                                  onChange={(e) => {
                                                                      const checked = e.target.checked;
                                                                      setSaveApiKey(checked);
                                                                      try {
                                                                          localStorage.setItem('save_api_key', checked ? 'true' : 'false');
                                                                          if (checked) {
                                                                              localStorage.setItem('gemini_api_key', apiKey);
                                                                          } else {
                                                                              localStorage.removeItem('gemini_api_key');
                                                                          }
                                                                      } catch {}
                                                                  }}
                                                                  className="w-3 h-3 accent-theme-dark"
                                                              />
                                                              <label htmlFor="saveApiKey" className="text-xs opacity-80 cursor-pointer">
                                                                  {settings.language === 'zh' ? '记住 API Key (本地存储)' : 'Remember API Key (Local Storage)'}
                                                              </label>
                                                          </div>
                                                      </div>
                                                      <div className="text-[10px] text-center opacity-50 mt-2 font-led w-full">
                                                          {settings.language === 'zh' ? '按 B 键返回' : 'Press B to return'}
                                                      </div>
                                                  </div>
                                              )}
                                              {menuPage === 'ABOUT' && (
                                                  <div className="p-2 font-led text-sm space-y-3">
                                                      <div className="border border-theme-dark/20 p-2 rounded bg-theme-dark/5">
                                                          <div className="font-bold border-b border-theme-dark/20 pb-1 mb-1">{getLocalizedUI('CREDITS', settings.language)}</div>
                                                          <div className="opacity-90 flex justify-between">
                                                              <span>{settings.language === 'zh' ? '出品人' : 'Creator'}:</span>
                                                              <span>{settings.language === 'zh' ? 'CJ 工作室' : 'CJ Studio'}</span>
                                                          </div>
                                                          <div className="opacity-90 flex justify-between">
                                                              <span>{getLocalizedUI('VERSION', settings.language)}:</span>
                                                              <span>{typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.5'}</span>
                                                          </div>
                                                      </div>
                                                      <div className="border border-theme-dark/20 p-2 rounded bg-theme-dark/5">
                                                          <div className="font-bold border-b border-theme-dark/20 pb-1 mb-1">{getLocalizedUI('HOW_TO_PLAY', settings.language)}</div>
                                                          <div className="text-[11px] leading-relaxed space-y-1.5 opacity-90">
                                                              <p>▪ <span className="font-bold">{settings.language === 'zh' ? '目标' : 'Goal'}:</span> {settings.language === 'zh' ? '观察屏幕顶部的化学方程式或分子结构提示，控制小蛇吃掉场上正确的反应产物、反应条件或对称元素。' : 'Observe the reaction or molecular structure prompt at the top. Control the snake to eat the correct product, condition, or symmetry element.'}</p>
                                                              <p>▪ <span className="font-bold">{settings.language === 'zh' ? '得分' : 'Score'}:</span> {settings.language === 'zh' ? '吃对加分并延长蛇身。连续答对增加连击倍数。生存时间越长，每秒得分越高（随难度增加）。' : 'Correct answers grant points and grow snake. Chain for Combo. Survival grants points per second (scales with difficulty).'}</p>
                                                              <p>▪ <span className="font-bold">{settings.language === 'zh' ? '惩罚' : 'Penalty'}:</span> {settings.language === 'zh' ? '吃错扣除5分，连击清零，缩短蛇身，并在场上生成更多错误干扰项。' : 'Wrong answers deduct 5 pts, reset Combo, shrink the snake, and spawn more distractors.'}</p>
                                                              <p>▪ <span className="font-bold">{settings.language === 'zh' ? '失败' : 'Game Over'}:</span> {settings.language === 'zh' ? '当蛇头撞到自己的身体，或者蛇身长度缩减为0时，游戏结束。' : 'The game ends if the snake collides with its own body or if its length shrinks to zero.'}</p>
                                                              <p>▪ <span className="font-bold">{settings.language === 'zh' ? '限时' : 'Time Limit'}:</span> {settings.language === 'zh' ? '开启限时模式后，你需要在3分钟内尽可能多地答题。倒计时结束游戏即刻结算！' : 'In Time Limit mode, you have 3 minutes to score as much as possible before the game ends!'}</p>
                                                              <p>▪ <span className="font-bold">{settings.language === 'zh' ? '双人对战' : 'Versus Mode'}:</span> {settings.language === 'zh' ? 'P1使用WASD，P2使用方向键。撞击对方或自己身体直接死亡，对方获胜！时间或题库耗尽时，分数高者获胜。' : 'P1 uses WASD, P2 uses Arrows. Colliding with self or opponent results in instant death and opponent wins! Highest score wins when time/questions run out.'}</p>
                                                              <p>▪ <span className="font-bold">{settings.language === 'zh' ? 'AI 设置' : 'AI Settings'}:</span> {settings.language === 'zh' ? '在设置菜单中配置 AI 模型和 API Key，用于生成错题分析报告和智能导入题库。' : 'Configure AI provider and API Key in the Settings menu to generate error analysis reports and smart import questions.'}</p>
                                                          </div>
                                                      </div>
                                                      <div className="border border-theme-dark/20 p-2 rounded bg-theme-dark/5">
                                                          <div className="font-bold border-b border-theme-dark/20 pb-1 mb-1">{settings.language === 'zh' ? '操作说明 (手柄 & 键盘)' : 'CONTROLS (GAMEPAD & KEYBOARD)'}</div>
                                                          <div className="text-[10px] leading-relaxed grid grid-cols-1 gap-y-1.5 opacity-90">
                                                              <div className="flex justify-between border-b border-theme-dark/10 pb-1">
                                                                  <span className="font-bold w-[70px] shrink-0">{settings.language === 'zh' ? '移动' : 'Move'}</span>
                                                                  <span className="text-right">摇杆/十字键 <span className="opacity-50">|</span> WASD / 方向键</span>
                                                              </div>
                                                              <div className="flex justify-between border-b border-theme-dark/10 pb-1">
                                                                  <span className="font-bold w-[70px] shrink-0">{settings.language === 'zh' ? '双人移动' : 'Versus Move'}</span>
                                                                  <span className="text-right">P1: 摇杆0 / WASD <span className="opacity-50">|</span> P2: 摇杆1 / 方向键</span>
                                                              </div>
                                                              <div className="flex justify-between border-b border-theme-dark/10 pb-1">
                                                                  <span className="font-bold w-[70px] shrink-0">{settings.language === 'zh' ? '确定/继续' : 'OK/Resume'}</span>
                                                                  <span className="text-right">[A] <span className="opacity-50">|</span> Enter / J</span>
                                                              </div>
                                                              <div className="flex justify-between border-b border-theme-dark/10 pb-1">
                                                                  <span className="font-bold w-[70px] shrink-0">{settings.language === 'zh' ? '返回/取消' : 'Back/Cancel'}</span>
                                                                  <span className="text-right">[B] <span className="opacity-50">|</span> Esc / K</span>
                                                              </div>
                                                              <div className="flex justify-between border-b border-theme-dark/10 pb-1">
                                                                  <span className="font-bold w-[70px] shrink-0">{settings.language === 'zh' ? '暂停游戏' : 'Pause'}</span>
                                                                  <span className="text-right">[Start] <span className="opacity-50">|</span> 空格键 (Space)</span>
                                                              </div>
                                                              <div className="flex justify-between border-b border-theme-dark/10 pb-1">
                                                                  <span className="font-bold w-[70px] shrink-0">{settings.language === 'zh' ? '长按加速' : 'Hold Boost'}</span>
                                                                  <span className="text-right">[Y/RB/RT] <span className="opacity-50">|</span> Shift (P1) / R-Shift (P2)</span>
                                                              </div>
                                                              <div className="flex justify-between border-b border-theme-dark/10 pb-1">
                                                                  <span className="font-bold w-[70px] shrink-0">{settings.language === 'zh' ? '限时模式' : 'Time Limit'}</span>
                                                                  <span className="text-right">L3 <span className="opacity-50">|</span> T <span className="opacity-50">|</span> {settings.language === 'zh' ? '长按虚拟键[静音]' : 'Hold Btn[MUTE]'}</span>
                                                              </div>
                                                              <div className="flex justify-between border-b border-theme-dark/10 pb-1">
                                                                  <span className="font-bold w-[70px] shrink-0">{settings.language === 'zh' ? '虚拟按键' : 'Controls'}</span>
                                                                  <span className="text-right">R3 <span className="opacity-50">|</span> C</span>
                                                              </div>
                                                              <div className="flex justify-between">
                                                                  <span className="font-bold w-[70px] shrink-0">{settings.language === 'zh' ? '快捷菜单' : 'Quick Menu'}</span>
                                                                  <span className="text-right">[Select/LB] 呼出菜单 <span className="opacity-50">|</span> [LT] 重置</span>
                                                              </div>
                                                          </div>
                                                      </div>
                                                      <div className="border border-theme-dark/20 p-2 rounded bg-theme-dark/5 mt-2">
                                                          <div className="font-bold border-b border-theme-dark/20 pb-1 mb-1">{settings.language === 'zh' ? '指示灯 & 手势' : 'INDICATORS & GESTURES'}</div>
                                                          <div className="text-[10px] leading-relaxed grid grid-cols-1 gap-y-1.5 opacity-90">
                                                              <div className="flex justify-between border-b border-theme-dark/10 pb-1">
                                                                  <span className="font-bold w-[70px] shrink-0">{settings.language === 'zh' ? '全屏手势' : 'Full Screen'}</span>
                                                                  <span className="text-right">{settings.language === 'zh' ? '双指轻触屏幕空白处' : 'Double-tap 2 fingers on empty space'}</span>
                                                              </div>
                                                              <div className="flex justify-between border-b border-theme-dark/10 pb-1">
                                                                  <span className="font-bold w-[70px] shrink-0">{settings.language === 'zh' ? '左侧指示灯' : 'Left LED'}</span>
                                                                  <span className="text-right">{settings.language === 'zh' ? '红灯 (电源)' : 'Red (Power)'}</span>
                                                              </div>
                                                              <div className="flex justify-between">
                                                                  <span className="font-bold w-[70px] shrink-0">{settings.language === 'zh' ? '右侧四灯' : 'Right LEDs'}</span>
                                                                  <span className="text-right">{settings.language === 'zh' ? '黄(运行) 蓝/绿(手柄) 红(全屏) 紫(限时)' : 'Gold(Run) Blue/Green(Pad) Red(Full) Magenta(Time)'}</span>
                                                              </div>
                                                          </div>
                                                      </div>
                                                  </div>
                                              )}
                                          </div>
                                       </>
                                   )}
                                </div>
                            )}

                            {gameState === 'IMPORT_MODAL' && (
                                <div className="absolute inset-0 bg-theme-light z-50 p-2 sm:p-4 pb-[50vh] flex flex-col font-led text-theme-dark text-xl overflow-y-auto no-scrollbar" style={{ touchAction: 'auto' }}>
                                  <div className="text-center font-bold mb-2 font-pixel text-xs shrink-0">{getLocalizedUI('DATA_UPLOAD', settings.language)}</div>
                                  {importedDataList.length > 0 && (
                                      <div className="text-xs text-center mb-2 opacity-80 font-led truncate px-2">
                                          {settings.language === 'zh' ? `当前已加载: ${importedDataList.length} 个题库` : `Loaded: ${importedDataList.length} Banks`}
                                      </div>
                                  )}
                                  
                                  <div className="border-2 border-dashed border-theme-dark/50 rounded p-2 sm:p-4 mb-2 flex flex-col items-center justify-center relative bg-theme-dark/5 cursor-pointer hover:bg-theme-dark/10 transition-colors shrink-0">
                                      {isGenerating ? (
                                          <div className="flex flex-col items-center justify-center py-4">
                                              <div className="w-8 h-8 border-4 border-theme-dark border-t-transparent rounded-full animate-spin mb-3"></div>
                                              <span className="text-sm font-bold animate-pulse text-center px-4">
                                                  {settings.language === 'zh' ? thinkingSteps[aiThinkingStep].zh : thinkingSteps[aiThinkingStep].en}
                                              </span>
                                          </div>
                                      ) : (
                                          <>
                                              <FileJson size={24} className="mb-1 sm:mb-2"/>
                                              <span className="text-sm sm:text-base font-bold text-center">{settings.language === 'zh' ? '点击上传 JSON/图片/TXT' : 'Tap to upload JSON/Image/TXT'}</span>
                                              <input type="file" accept=".json,image/*,text/plain" onChange={handleImportFile} disabled={isGenerating} className="absolute inset-0 opacity-0 cursor-pointer" />
                                          </>
                                      )}
                                  </div>

                                  {!isGenerating && (
                                      <div className="mb-2 shrink-0">
                                          <div className="flex justify-between items-center mb-1">
                                              <label className="text-xs font-bold opacity-80">{settings.language === 'zh' ? '或手动粘贴 JSON 题库代码：' : 'Or Paste JSON Code:'}</label>
                                              <button 
                                                  onClick={() => {
                                                      const text = prompt(settings.language === 'zh' ? '请输入化学相关文本、笔记或反应方程式：' : 'Please enter chemistry text, notes, or equations:');
                                                      if (text) handleAIImport(undefined, text);
                                                  }}
                                                  className="text-[10px] bg-theme-dark text-theme-light px-2 py-1 rounded font-bold flex items-center gap-1 hover:bg-theme-dark/80 transition-colors"
                                              >
                                                  <Lightbulb size={12} />
                                                  {settings.language === 'zh' ? 'AI 识别文本/笔记' : 'AI Parse Text'}
                                              </button>
                                          </div>
                                      </div>
                                  )}
                                  
                                  <textarea className="flex-1 min-h-[60px] bg-theme-dark/10 border border-theme-dark/50 text-theme-dark text-sm sm:text-lg p-2 resize-none focus:outline-none rounded font-led placeholder:text-theme-dark/40" value={tempImportText} onChange={e => setTempImportText(e.target.value)} onFocus={(e) => setTimeout(() => e.target.scrollIntoView({block: 'start'}), 300)} placeholder={getLocalizedUI('PASTE_JSON', settings.language)} />
                                  
                                  {/* 【新增】：退出游戏保留选项的打钩开关 */}
                                  <label className="flex items-center gap-2 mt-2 text-xs sm:text-sm cursor-pointer opacity-80 hover:opacity-100 font-bold shrink-0">
                                      <input type="checkbox" checked={keepImport} onChange={e => {
                                          const newVal = e.target.checked;
                                          setKeepImport(newVal);
                                      }} className="accent-theme-dark w-3 h-3 sm:w-4 sm:h-4 cursor-pointer shrink-0" />
                                      <span className="truncate">{settings.language === 'zh' ? '退出游戏后保留此题库 (Local Save)' : 'Keep data after exit'}</span>
                                  </label>

                                  <div className="flex gap-2 mt-2 shrink-0 pb-2 sm:pb-4">
                                      <button onClick={() => handleAction('B')} disabled={isImporting} className="flex-1 border border-theme-dark hover:bg-theme-dark/10 py-1.5 sm:py-2 rounded font-bold text-sm sm:text-base disabled:opacity-50">{getLocalizedUI('CANCEL', settings.language)}</button>
                                      {/* 【新增】：一键清空题库按钮，只有当存在追加题库时才显示 */}
                                      {importedDataList.length > 0 && (
                                          <button onClick={handleClearImport} disabled={isImporting} className="flex-1 border-2 border-[#9e284c] text-[#9e284c] hover:bg-[#9e284c]/10 py-1.5 sm:py-2 rounded font-bold text-sm sm:text-base disabled:opacity-50">{getLocalizedUI('CLEAR', settings.language)}</button>
                                      )}
                                      <button onClick={handleImportText} disabled={isImporting} className="flex-1 bg-theme-dark text-theme-light py-1.5 sm:py-2 rounded font-bold shadow-md active:scale-95 text-sm sm:text-base disabled:opacity-50 flex items-center justify-center gap-2">
                                          {isImporting && <div className="w-4 h-4 border-2 border-theme-light border-t-transparent rounded-full animate-spin"></div>}
                                          {getLocalizedUI('LOAD', settings.language)}
                                      </button>
                                  </div>
                                </div>
                            )}
                            
                            {gameState === 'GAMEOVER' && showGameOverOverlay && (
                                <div className="absolute inset-0 flex flex-col items-center bg-theme-light/95 z-30 text-theme-dark font-led p-2 overflow-y-auto no-scrollbar" style={{ touchAction: 'auto' }}>
                                  <div className="flex flex-col items-center justify-center my-auto w-full max-w-[400px]">
                                      <h2 className={`text-xl sm:text-3xl md:text-4xl font-pixel tracking-widest mb-1 sm:mb-4 drop-shadow-sm text-center leading-normal font-bold shrink-0 py-2`}>
                                          {isVersus ? (
                                              versusWinner === 'P1' ? 'P1 WINS!' : (versusWinner === 'P2' ? 'P2 WINS!' : 'TIE!')
                                          ) : (
                                              getLocalizedUI(isWin ? 'COMPLETED' : 'GAMEOVER', settings.language)
                                          )}
                                      </h2>
                                      
                                      <div className="flex justify-center items-end gap-6 mb-4 sm:mb-6">
                                          {isVersus ? (
                                              <>
                                                  <div className="flex flex-col items-center">
                                                      <div className="text-xs sm:text-sm opacity-70 mb-0.5">P1 {getLocalizedUI('SCORE', settings.language)}</div>
                                                      <div className="text-4xl sm:text-5xl font-bold leading-none">{score}</div>
                                                  </div>
                                                  <div className="flex flex-col items-center">
                                                      <div className="text-xs sm:text-sm opacity-70 mb-0.5">P2 {getLocalizedUI('SCORE', settings.language)}</div>
                                                      <div className="text-4xl sm:text-5xl font-bold leading-none">{score2}</div>
                                                  </div>
                                              </>
                                          ) : (
                                              <>
                                                  <div className="flex flex-col items-center">
                                                      <div className="text-xs sm:text-sm opacity-70 mb-0.5">{getLocalizedUI('SCORE', settings.language)}</div>
                                                      <div className="text-4xl sm:text-5xl font-bold leading-none">{score}</div>
                                                  </div>
                                                  <div className="flex flex-col items-center">
                                                      <div className="text-xs sm:text-sm opacity-70 mb-0.5">{getLocalizedUI('ACCURACY', settings.language)}</div>
                                                      <div className="text-4xl sm:text-5xl font-bold leading-none">{history.length>0?Math.round((history.filter(h=>h.correct).length/history.length)*100):0}%</div>
                                                  </div>
                                              </>
                                          )}
                                      </div>

                                      {analysis && analysis.typeStats.length > 0 && (
                                          <div className="w-[90%] max-w-[320px] bg-theme-dark/10 border border-theme-dark/20 rounded p-2 sm:p-3 mb-4 sm:mb-6 text-[10px] sm:text-xs flex flex-col gap-1.5 shadow-inner">
                                              {analysis.weakness && (
                                                  <div className="flex items-center gap-1.5 text-[#9e284c] font-bold mb-1 border-b border-theme-dark/10 pb-1.5">
                                                      <AlertTriangle size={14} className="shrink-0" />
                                                      <span>{getLocalizedUI('WEAKNESS', settings.language)}: {settings.language === 'zh' ? (dbRxnTypes[analysis.weakness]?.zh || analysis.weakness) : (dbRxnTypes[analysis.weakness]?.en || analysis.weakness)}</span>
                                                  </div>
                                              )}
                                              <div className="font-bold opacity-80 mb-0.5 flex justify-between">
                                                  <span>{getLocalizedUI('ACCURACY_BY_TYPE', settings.language)}:</span>
                                              </div>
                                              <div className="flex flex-col gap-1 max-h-[100px] overflow-y-auto no-scrollbar pr-1">
                                                  {analysis.typeStats.map(([type, stats]) => (
                                                      <div key={type} className="flex justify-between items-center">
                                                          <span className="truncate pr-2 opacity-80">{settings.language === 'zh' ? (dbRxnTypes[type]?.zh || type) : (dbRxnTypes[type]?.en || type)}</span>
                                                          <span className="font-bold shrink-0">{Math.round((stats.correct / stats.total) * 100)}% ({stats.correct}/{stats.total})</span>
                                                      </div>
                                                  ))}
                                              </div>
                                          </div>
                                      )}

                                      <div className="flex flex-col gap-2 sm:gap-3 w-[85%] max-w-[320px] shrink-0 justify-center mx-auto font-pixel">
                                          <button className={`w-full py-2 sm:py-3 text-[12px] sm:text-xl font-bold rounded shadow-lg whitespace-nowrap transition-colors ${menuIndex === 0 ? 'bg-theme-dark text-theme-light animate-pulse' : 'border-2 border-theme-dark text-theme-dark hover:bg-theme-dark/10'}`} onClick={() => handleAction('A', true, 0)} onMouseEnter={() => setMenuIndex(0)}>
                                              {menuIndex === 0 ? '[A] ' : ''}{getLocalizedUI('RETRY', settings.language).replace(' [A]', '')}
                                          </button>
                                          <button className={`w-full py-2 sm:py-3 text-[12px] sm:text-xl font-bold rounded shadow-lg whitespace-nowrap transition-colors ${menuIndex === 1 ? 'bg-theme-dark text-theme-light animate-pulse' : 'border-2 border-theme-dark text-theme-dark hover:bg-theme-dark/10'}`} onClick={() => handleAction('A', true, 1)} onMouseEnter={() => setMenuIndex(1)}>
                                              {menuIndex === 1 ? '[A] ' : ''}{getLocalizedUI('SAVE_SCORE', settings.language)}
                                          </button>
                                          <button className={`w-full py-2 sm:py-3 text-[12px] sm:text-xl font-bold rounded shadow-lg whitespace-nowrap transition-colors ${menuIndex === 2 ? 'bg-theme-dark text-theme-light animate-pulse' : 'border-2 border-theme-dark text-theme-dark hover:bg-theme-dark/10'}`} onClick={() => handleAction('A', true, 2)} onMouseEnter={() => setMenuIndex(2)}>
                                              {menuIndex === 2 ? '[A] ' : ''}{getLocalizedUI('VIEW_REPORT', settings.language).replace(' [B]', '')}
                                          </button>
                                          <button className={`w-full py-2 sm:py-3 text-[12px] sm:text-xl font-bold rounded shadow-lg whitespace-nowrap transition-colors ${menuIndex === 3 ? 'bg-theme-dark text-theme-light animate-pulse' : 'border-2 border-theme-dark text-theme-dark hover:bg-theme-dark/10'}`} onClick={() => handleAction('A', true, 3)} onMouseEnter={() => setMenuIndex(3)}>
                                              {menuIndex === 3 ? '[A] ' : ''}{settings.language === 'zh' ? '返回主菜单' : 'MAIN MENU'}
                                          </button>
                                      </div>
                                  </div>
                                </div>
                            )}
                            {gameState === 'REPORT' && (
                              <div ref={reportScrollRef} className="absolute inset-0 bg-theme-light z-50 flex flex-col p-2 sm:p-4 overflow-y-auto no-scrollbar font-led text-sm sm:text-lg text-theme-dark pointer-events-auto" style={{ touchAction: 'auto' }}>
                                  <div className="flex items-center justify-between border-b border-theme-dark/30 pb-1 sm:pb-2 mb-1 sm:mb-2 shrink-0">
                                    <h3 className="font-bold flex items-center gap-1 sm:gap-2"><Award size={18}/>{getLocalizedUI('REPORT', settings.language)}</h3>
                                    <button onClick={() => handleAction('B')} className="opacity-70 hover:opacity-100"><RotateCcw size={18}/></button>
                                  </div>

                                  <div className="flex items-center justify-between bg-theme-dark/10 p-1.5 sm:p-2 rounded mb-1 sm:mb-2 border border-theme-dark/20 shrink-0">
                                      <div className="flex flex-col text-[10px] sm:text-xs font-bold opacity-80 truncate mr-2">
                                          <span className="truncate">{studentName || getLocalizedUI('UNNAMED', settings.language)} ({studentId || getLocalizedUI('UNSET_ID', settings.language)})</span>
                                      </div>
                                      <button onClick={() => { setPendingAction(null); setGameState('INPUT_INFO'); }} className="px-2 sm:px-3 py-1 sm:py-1.5 bg-theme-dark text-theme-light rounded text-[10px] sm:text-xs active:scale-95 whitespace-nowrap shadow">
                                          {getLocalizedUI('EDIT_INFO', settings.language)}
                                      </button>
                                  </div>
                                  
                                  <div 
                                    className="flex flex-col bg-[#9bbc0f]/50 rounded border border-theme-dark/30 p-1.5 sm:p-2 space-y-2 sm:space-y-4 mb-2 pointer-events-auto shrink-0" 
                                  >
                                      <div className="grid grid-cols-2 gap-2 p-2 rounded border border-theme-dark/20 shrink-0 bg-theme-dark/5">
                                          <div className="flex flex-col items-center p-2 rounded">
                                              <span className="text-sm mb-1 opacity-70">{getLocalizedUI('GRADE', settings.language)}</span>
                                              <span className="text-4xl font-bold">{score > 500 ? 'A' : (score > 200 ? 'B' : 'C')}</span>
                                          </div>
                                          <div className="flex flex-col items-center p-2 rounded">
                                              <span className="text-sm mb-1 opacity-70">{getLocalizedUI('ACCURACY', settings.language)}</span>
                                              <span className="text-4xl font-bold">{history.length>0?Math.round((history.filter(h=>h.correct).length/history.length)*100):0}%</span>
                                          </div>
                                      </div>

                                     {analysis && (
                                          <div className="p-2 rounded border border-theme-dark/20 bg-theme-dark/5">
                                              <h4 className="font-bold mb-2 text-sm flex items-center gap-1"><PieChart size={14} /> {getLocalizedUI('ANALYSIS', settings.language)}</h4>
                                              <div className="flex justify-between text-xs mb-3 opacity-80">
                                                  <span><Clock size={10} className="inline mr-1"/>{getLocalizedUI('AVG_TIME_OK', settings.language)}: <span>{analysis.avgTimeCorrect}s</span></span>
                                                  <span><Clock size={10} className="inline mr-1"/>{getLocalizedUI('AVG_TIME_X', settings.language)}: <span>{analysis.avgTimeIncorrect}s</span></span>
                                              </div>
                                              <div className="space-y-2">
                                                  {analysis.typeStats.map(([type, stats]) => {
                                                      const accuracy = Math.round((stats.correct / stats.total) * 100);
                                                      const typeLabel = settings.language === 'zh' ? (dbRxnTypes[type]?.zh || type) : (dbRxnTypes[type]?.en || type);
                                                      return (
                                                          <div key={type} className="text-xs">
                                                              <div className="flex justify-between mb-0.5"><span className="opacity-80 truncate max-w-[120px]">{typeLabel}</span><span className="font-bold">{stats.correct}/{stats.total}</span></div>
                                                              <div className="h-2 w-full bg-theme-dark/20 rounded-full overflow-hidden flex"><div style={{width: `${accuracy}%`}} className="h-full bg-theme-dark"></div></div>
                                                          </div>
                                                      )
                                                  })}
                                              </div>
                                          </div>
                                     )}

                                     <div className="p-2 rounded border border-theme-dark/20 bg-theme-dark/5">
                                         <h4 className="font-bold mb-2 text-sm flex items-center gap-1"><Lightbulb size={14} /> {settings.language === 'zh' ? 'AI 学习建议' : 'AI Learning Advice'}</h4>
                                         {aiReportAnalysis ? (
                                             <div className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed opacity-90">
                                                 {aiReportAnalysis}
                                             </div>
                                         ) : (
                                             <button 
                                                 onClick={generateAIReportAnalysis} 
                                                 disabled={isGeneratingReport}
                                                 className="w-full py-2 bg-theme-dark text-theme-light rounded text-xs sm:text-sm font-bold active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
                                             >
                                                 {isGeneratingReport ? (
                                                     <><div className="w-4 h-4 border-2 border-theme-light border-t-transparent rounded-full animate-spin"></div> {settings.language === 'zh' ? '正在分析...' : 'Analyzing...'}</>
                                                 ) : (
                                                     <><Lightbulb size={16} /> {settings.language === 'zh' ? '生成 AI 针对性分析' : 'Generate AI Targeted Analysis'}</>
                                                 )}
                                             </button>
                                         )}
                                     </div>

                                      <div className="space-y-2">
                                          <div className="text-xs opacity-70 uppercase font-bold tracking-wider px-1 border-b border-theme-dark/30 pb-1">{getLocalizedUI('HISTORY_LOG', settings.language)}</div>
                                          {history.length === 0 && <div className="text-center opacity-50 py-4">{getLocalizedUI('NO_DATA', settings.language)}</div>}
                                          {history.map((h, i) => (
                                              <div key={i} className="flex flex-col border-b border-theme-dark/10 pb-2 last:border-0">
                                                  <div className="flex items-start gap-2">
                                                      <span className={`font-bold min-w-[20px]`}>{h.correct ? '✔' : '✘'}</span>
                                                      <span className="flex-1 leading-tight text-sm opacity-90">{h.question} ➔ <span className="font-bold">{h.answer}</span></span>
                                                      <span className="text-xs opacity-60">{(h.duration/1000).toFixed(1)}s</span>
                                                  </div>
                                                  {!h.correct && <div className="text-[10px] ml-6 opacity-70">Exp: {h.expected}</div>}
                                              </div>
                                          ))}
                                     </div>
                                  </div>

                                  <div className="flex gap-2 shrink-0 pt-2 border-t border-theme-dark/30">
                                       <button onClick={() => handleActionClick('copy')} className="flex-1 border border-theme-dark hover:bg-theme-dark/10 py-2 sm:py-3 rounded flex items-center justify-center gap-2 active:scale-95 transition-all font-bold text-sm sm:text-base"><ClipboardCopy size={18} /><span>{getLocalizedUI('COPY', settings.language)}</span></button>
                                      <button onClick={() => handleActionClick('send')} className="flex-1 bg-theme-dark text-theme-light py-2 sm:py-3 rounded flex items-center justify-center gap-2 active:scale-95 transition-all font-bold text-sm sm:text-base"><Send size={18} /><span>{getLocalizedUI('SEND', settings.language)}</span></button>
                                  </div>
                              </div>
                            )}

                      </div>
                 </div>
              </div>
              
              {showControls && (
              <div className={`mt-1 md:mt-2 pl-4 md:pl-8 flex justify-start items-baseline gap-1 opacity-80 pb-1 md:pb-2 shrink-0 ${isLandscape ? 'hidden' : ''}`}>
                   <span className="font-sans font-black italic text-[#2b2b6b] tracking-tighter text-[12px] md:text-[18px]">Nintendo</span>
                   <span className="font-sans italic text-[20px] md:text-[32px] leading-none font-light text-[#2b2b6b] tracking-[0.15em]">GAME BOY</span>
                   <span className="font-sans italic text-[8px] md:text-[12px] leading-none font-bold text-[#2b2b6b] tracking-tighter mb-2 md:mb-4">TM</span>
              </div>
              )}
          </div>

          {/* 控制区容器 */}
          {showControls && (
            <div data-controls="true" className={`shrink-0 flex items-center justify-center relative ${isLandscape ? 'h-full flex-col justify-center w-28 sm:w-36 md:w-48' : 'w-full py-0 grid grid-cols-2 gap-2 mb-2 sm:mb-4'}`}>
               {!isLandscape && (
                 <div className="flex flex-col items-center justify-center -mt-4">
                     <AnalogStick onMove={handleStick} active={true} deadzone={settings.joyDeadzone ?? 0.1} sensitivity={settings.joySensitivity ?? 1.0} vibrate={vibrate} />
                 </div>
               )}
               <div className={`flex items-center justify-center w-full relative ${isLandscape ? 'flex-col gap-6 sm:gap-10' : ''}`}>
                   
                   <div className={`relative shrink-0 aspect-square ${isLandscape ? 'w-28 sm:w-36 md:w-44' : 'w-40 sm:w-48'}`}>
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
                          <ActionButton label="X" color="darkgray" size="md" onClick={() => handleAction('X')} icon={Smartphone} />
                          <span className="font-sans text-[#2b2b6b] text-[10px] font-bold tracking-wider opacity-90">{getLocalizedUI('BTN_VIBE', settings.language)}</span>
                      </div>
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
                          <ActionButton label="A" color="magenta" size="md" onClick={() => handleAction('A')} />
                          <span className="font-sans text-[#2b2b6b] text-[10px] font-bold tracking-wider opacity-90">{getLocalizedUI('BTN_OK', settings.language)}</span>
                      </div>
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
                          <ActionButton label="B" color="magenta" size="md" onClick={() => handleAction('B')} />
                          <span className="font-sans text-[#2b2b6b] text-[10px] font-bold tracking-wider opacity-90">{getLocalizedUI('BTN_BACK', settings.language)}</span>
                      </div>
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
                          <ActionButton label="Y" color="darkgray" size="md" onClick={()=>{}} holding={isBoosting} onPointerDown={()=>setBoost(true)} onPointerUp={()=>setBoost(false)} icon={FastForward} />
                          <span className="font-sans text-[#2b2b6b] text-[10px] font-bold tracking-wider opacity-90">{getLocalizedUI('BTN_BST', settings.language)}</span>
                      </div>
                   </div>
                   
                   {isLandscape && (
                     <div className="flex flex-col gap-4 sm:gap-6 items-center w-full mt-2">
                         <div className="flex gap-4 sm:gap-6">
                            <ActionButton label="M" color="darkgray" size="sm" onClick={() => handleAction('MENU')} icon={Menu} />
                            <ActionButton label="R" color="darkgray" size="sm" onClick={() => handleAction('RESET')} icon={RotateCw} />
                         </div>
                         <div className="flex justify-center gap-2 sm:gap-4">
                            <PillButton label={getLocalizedUI('BTN_MUTE', settings.language)} onClick={() => handleAction('SELECT')} onLongPress={() => handleAction('TIME')} />
                            <PillButton label={getLocalizedUI('BTN_PAUSE', settings.language)} onClick={() => handleAction('START')} />
                         </div>
                     </div>
                   )}
               </div>
               
               {/* 底部功能区：静音/重置/暂停/菜单 + 扬声器 */}
               {!isLandscape && (
                   <div className="col-span-2 flex items-end justify-between px-4 sm:px-8 mt-2 mb-4 w-full">
                       <div className="flex gap-2 sm:gap-4">
                           <PillButton label={getLocalizedUI('BTN_MUTE', settings.language)} onClick={() => handleAction('SELECT')} onLongPress={() => handleAction('TIME')} />
                           <PillButton label={getLocalizedUI('BTN_RESET', settings.language)} onClick={() => handleAction('RESET')} />
                           <PillButton label={getLocalizedUI('BTN_PAUSE', settings.language)} onClick={() => handleAction('START')} />
                           <PillButton label={getLocalizedUI('BTN_MENU', settings.language)} onClick={() => handleAction('MENU')} />
                       </div>
                       <SpeakerGrill />
                   </div>
               )}
            </div>
          )}

          {gameState === 'INPUT_INFO' && (
              <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex p-4 pb-[30vh] pointer-events-auto overflow-y-auto no-scrollbar" style={{ touchAction: 'auto' }}>
                  <div className="bg-theme-light border-4 border-theme-dark rounded-xl p-4 sm:p-6 shadow-2xl flex flex-col gap-2 sm:gap-4 w-full max-w-[320px] text-theme-dark font-led animate-in zoom-in duration-200 m-auto">
                      <h3 className="font-bold text-xl sm:text-2xl text-center flex items-center justify-center gap-2 mb-1 sm:mb-2"><BookOpen size={20}/>{settings.language === 'zh' ? '学生信息' : 'INFO'}</h3>
                      <div>
                          <label className="text-xs sm:text-sm block mb-1 font-bold opacity-80">{getLocalizedUI('NAME', settings.language)}</label>
                          <input 
                              type="text" 
                              value={studentName} 
                              onChange={(e) => setStudentName(e.target.value)} 
                              className="w-full bg-theme-dark/10 border-2 border-theme-dark rounded p-2 sm:p-3 focus:bg-theme-dark/20 outline-none font-bold text-lg sm:text-xl uppercase tracking-wider placeholder:opacity-50 transition-colors shadow-inner" 
                              placeholder="Name"
                              autoFocus
                          />
                      </div>
                      <div>
                          <label className="text-xs sm:text-sm block mb-1 font-bold opacity-80">{getLocalizedUI('ID', settings.language)}</label>
                          <input 
                              type="text" 
                              value={studentId} 
                              onChange={(e) => setStudentId(e.target.value)} 
                              className="w-full bg-theme-dark/10 border-2 border-theme-dark rounded p-2 sm:p-3 focus:bg-theme-dark/20 outline-none font-bold text-lg sm:text-xl tracking-wider placeholder:opacity-50 transition-colors shadow-inner" 
                              placeholder="ID Number"
                          />
                      </div>
                      <div>
                          <label className="text-xs sm:text-sm block mb-1 font-bold opacity-80">{getLocalizedUI('REPORT_EMAIL', settings.language)}</label>
                          <input 
                              type="email" 
                              value={settings.reportEmail || ''} 
                              onChange={(e) => setSettings(s => ({ ...s, reportEmail: e.target.value }))} 
                              className="w-full bg-theme-dark/10 border-2 border-theme-dark rounded p-2 sm:p-3 focus:bg-theme-dark/20 outline-none font-bold text-lg sm:text-xl tracking-wider placeholder:opacity-50 transition-colors shadow-inner" 
                              placeholder="Email (Optional)"
                          />
                      </div>
                      <div className="flex gap-2 sm:gap-3 mt-2 sm:mt-4">
                          <button className="flex-1 border-2 border-theme-dark py-2 sm:py-3 rounded font-bold text-base sm:text-lg hover:bg-theme-dark/10 active:scale-95 transition-transform" onClick={() => {
                              setGameState(pendingAction === 'save_score' ? 'GAMEOVER' : (pendingAction === 'settings' ? 'MENU' : 'REPORT'));
                              setPendingAction(null);
                          }}>{getLocalizedUI('CANCEL', settings.language)}</button>
                          <button className="flex-1 bg-theme-dark text-theme-light py-2 sm:py-3 rounded font-bold text-base sm:text-lg active:scale-95 transition-transform shadow-lg" onClick={() => {
                              setGameState(pendingAction === 'save_score' ? 'GAMEOVER' : (pendingAction === 'settings' ? 'MENU' : 'REPORT'));
                              if (pendingAction === 'copy') copyReport();
                              if (pendingAction === 'send') sendReport();
                              setPendingAction(null);
                          }}>{getLocalizedUI('BTN_OK', settings.language)}</button>
                      </div>
                  </div>
              </div>
          )}

          {alertModal.isOpen && (
              <div className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto overflow-y-auto no-scrollbar" style={{ touchAction: 'auto' }}>
                  <div className="bg-theme-light border-4 border-theme-dark rounded-xl p-4 sm:p-6 shadow-2xl flex flex-col gap-4 w-full max-w-[320px] text-theme-dark font-led animate-in zoom-in duration-200 my-auto">
                      {alertModal.title && <h3 className="font-bold text-xl sm:text-2xl text-center mb-2">{alertModal.title}</h3>}
                      <div className="text-sm sm:text-base font-bold whitespace-pre-wrap text-center leading-relaxed">
                          {alertModal.message}
                      </div>
                      <div className={`flex gap-2 sm:gap-3 mt-2 ${alertModal.onCancel ? 'flex-row' : 'flex-col'}`}>
                          {alertModal.onCancel && (
                              <button 
                                  className="flex-1 border-2 border-theme-dark py-2 sm:py-3 rounded font-bold text-base sm:text-lg hover:bg-theme-dark/10 active:scale-95 transition-transform" 
                                  onClick={() => {
                                      setAlertModal({ isOpen: false, message: '' });
                                      alertModal.onCancel!();
                                  }}
                              >
                                  {alertModal.cancelText || getLocalizedUI('CANCEL', settings.language)}
                              </button>
                          )}
                          <button 
                              className="flex-1 bg-theme-dark text-theme-light py-2 sm:py-3 rounded font-bold text-base sm:text-lg active:scale-95 transition-transform shadow-lg" 
                              onClick={() => {
                                  setAlertModal({ isOpen: false, message: '' });
                                  if (alertModal.onConfirm) alertModal.onConfirm();
                              }}
                          >
                              {alertModal.confirmText || getLocalizedUI('BTN_OK', settings.language)}
                          </button>
                      </div>
                  </div>
              </div>
          )}

        </div>
    </div>
  );
};

export default App;
