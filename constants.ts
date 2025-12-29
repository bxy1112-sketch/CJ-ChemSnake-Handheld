
// Type Definitions
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

// Database (Exact Match from Ultimate H5 Version)
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
  "H2O":{formula:"H₂O",zh:{name:"水"},en:{name:"Water"}}
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
  {chapter:"polymer",from:"13Butadiene",to:"Rubber",type:"Polymerisation",cond:{zh:"Na (催化)",en:"Na"}}
];
