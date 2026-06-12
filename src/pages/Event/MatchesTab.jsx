import { useState, useMemo } from "react";
import { Search, List, GitBranch, ChevronDown, Trophy, BarChart2 } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════
   FORMAT DETECTION
   Đọc tournament.bracketType nếu có, fallback về formatName mapping
═══════════════════════════════════════════════════════════════════ */
const FORMAT_MAP = {
  "Loại trực tiếp":      "single_elimination",
  "Loại trực tiếp kép":  "double_elimination",
  "Vòng bảng + Playoff": "group_stage",
  "Vòng bảng":           "round_robin",
  "Vòng tròn + Loại":    "group_stage",
};
const detectFormat = (t) =>
  t?.bracketType || FORMAT_MAP[t?.formatName] || "single_elimination";

const VIEWS = {
  single_elimination: [
    { id:"list",    label:"Danh sách", Icon:List      },
    { id:"bracket", label:"Sơ đồ",    Icon:GitBranch },
  ],
  double_elimination: [
    { id:"list",    label:"Danh sách", Icon:List      },
    { id:"bracket", label:"Sơ đồ",    Icon:GitBranch },
  ],
  round_robin: [
    { id:"list",    label:"Lịch đấu",  Icon:List      },
    { id:"standing",label:"Bảng điểm", Icon:BarChart2 },
  ],
  group_stage: [
    { id:"list",    label:"Lịch đấu",  Icon:List      },
    { id:"standing",label:"Bảng điểm", Icon:BarChart2 },
    { id:"bracket", label:"Playoff",   Icon:GitBranch },
  ],
};

/* ═══════════════════════════════════════════════════════════════════
   1. SINGLE ELIMINATION — mock data
═══════════════════════════════════════════════════════════════════ */
const SE_ROUNDS = [
  { id:"r1", label:"Vòng 1",    raceTO:7  },
  { id:"sf", label:"Bán kết",   raceTO:9  },
  { id:"f",  label:"Chung kết", raceTO:11 },
];
const SE_MATCHES = [
  { id:"m1", roundId:"r1", seq:1, table:"B1", time:"2026-06-01T09:00",
    p1:{ name:"Nguyễn Văn Anh",   flag:"🇻🇳", score:7 },
    p2:{ name:"Ko Pin Yi",         flag:"🇹🇼", score:3 }, status:"done", winSide:1 },
  { id:"m2", roundId:"r1", seq:2, table:"B2", time:"2026-06-01T09:00",
    p1:{ name:"Carlo Biado",       flag:"🇵🇭", score:7 },
    p2:{ name:"Trần Đức Minh",     flag:"🇻🇳", score:5 }, status:"done", winSide:1 },
  { id:"m3", roundId:"r1", seq:3, table:"B3", time:"2026-06-01T11:00",
    p1:{ name:"James Aranas",      flag:"🇵🇭", score:7 },
    p2:{ name:"Lê Quang Hùng",     flag:"🇻🇳", score:2 }, status:"done", winSide:1 },
  { id:"m4", roundId:"r1", seq:4, table:"B4", time:"2026-06-01T11:00",
    p1:{ name:"Trần Quốc Tuấn",    flag:"🇻🇳", score:4 },
    p2:{ name:"Nguyễn Mạnh Hùng",  flag:"🇻🇳", score:7 }, status:"done", winSide:2 },
  { id:"m5", roundId:"sf", seq:1, table:"B1", time:"2026-06-03T14:00",
    p1:{ name:"Nguyễn Văn Anh",   flag:"🇻🇳", score:9 },
    p2:{ name:"Carlo Biado",       flag:"🇵🇭", score:7 }, status:"done", winSide:1 },
  { id:"m6", roundId:"sf", seq:2, table:"B2", time:"2026-06-03T14:00",
    p1:{ name:"James Aranas",      flag:"🇵🇭", score:5 },
    p2:{ name:"Nguyễn Mạnh Hùng",  flag:"🇻🇳", score:7 }, status:"live", winSide:null },
  { id:"m7", roundId:"f",  seq:1, table:"B1", time:"2026-06-05T16:00",
    p1:{ name:"Nguyễn Văn Anh",   flag:"🇻🇳", score:null },
    p2:{ name:"TBD",               flag:"",    score:null }, status:"upcoming", winSide:null },
];
const SE_DONE_OVR = {
  m6: { status:"done", winSide:2, p1:{name:"James Aranas",     flag:"🇵🇭",score:7 }, p2:{name:"Nguyễn Mạnh Hùng",flag:"🇻🇳",score:9 } },
  m7: { status:"done", winSide:1, p1:{name:"Nguyễn Văn Anh",   flag:"🇻🇳",score:11}, p2:{name:"Nguyễn Mạnh Hùng",flag:"🇻🇳",score:8 } },
};
const SE_MATCHES_DONE = SE_MATCHES.map(m => SE_DONE_OVR[m.id] ? {...m,...SE_DONE_OVR[m.id]} : m);

/* ═══════════════════════════════════════════════════════════════════
   2. DOUBLE ELIMINATION — mock data  (WB 4→2→1 + LB 2→2→1→1 + GF)
═══════════════════════════════════════════════════════════════════ */
const DE_ROUNDS = [
  { id:"wb1",  label:"WB Vòng 1",    raceTO:7,  bracket:"W" },
  { id:"wb2",  label:"WB Bán kết",   raceTO:9,  bracket:"W" },
  { id:"wbf",  label:"WB Chung kết", raceTO:11, bracket:"W" },
  { id:"lb1",  label:"LB Vòng 1",    raceTO:7,  bracket:"L" },
  { id:"lb2",  label:"LB Vòng 2",    raceTO:7,  bracket:"L" },
  { id:"lbsf", label:"LB Bán kết",   raceTO:9,  bracket:"L" },
  { id:"lbf",  label:"LB Chung kết", raceTO:11, bracket:"L" },
  { id:"gf",   label:"Chung kết",    raceTO:13, bracket:"GF" },
];
const DE_MATCHES = [
  { id:"d1",  roundId:"wb1",  seq:1, bracket:"W", table:"B1", time:"2026-06-01T09:00",
    p1:{ name:"Nguyễn Văn Anh",   flag:"🇻🇳", score:7 },
    p2:{ name:"Ko Pin Yi",         flag:"🇹🇼", score:3 }, status:"done", winSide:1 },
  { id:"d2",  roundId:"wb1",  seq:2, bracket:"W", table:"B2", time:"2026-06-01T09:00",
    p1:{ name:"Carlo Biado",       flag:"🇵🇭", score:7 },
    p2:{ name:"Trần Đức Minh",     flag:"🇻🇳", score:5 }, status:"done", winSide:1 },
  { id:"d3",  roundId:"wb1",  seq:3, bracket:"W", table:"B3", time:"2026-06-01T11:00",
    p1:{ name:"James Aranas",      flag:"🇵🇭", score:7 },
    p2:{ name:"Lê Quang Hùng",     flag:"🇻🇳", score:2 }, status:"done", winSide:1 },
  { id:"d4",  roundId:"wb1",  seq:4, bracket:"W", table:"B4", time:"2026-06-01T11:00",
    p1:{ name:"Trần Quốc Tuấn",    flag:"🇻🇳", score:4 },
    p2:{ name:"Nguyễn Mạnh Hùng",  flag:"🇻🇳", score:7 }, status:"done", winSide:2 },
  { id:"d5",  roundId:"wb2",  seq:1, bracket:"W", table:"B1", time:"2026-06-03T09:00",
    p1:{ name:"Nguyễn Văn Anh",   flag:"🇻🇳", score:9 },
    p2:{ name:"Carlo Biado",       flag:"🇵🇭", score:7 }, status:"done", winSide:1 },
  { id:"d6",  roundId:"wb2",  seq:2, bracket:"W", table:"B2", time:"2026-06-03T09:00",
    p1:{ name:"James Aranas",      flag:"🇵🇭", score:5 },
    p2:{ name:"Nguyễn Mạnh Hùng",  flag:"🇻🇳", score:9 }, status:"done", winSide:2 },
  { id:"d7",  roundId:"wbf",  seq:1, bracket:"W", table:"B1", time:"2026-06-05T09:00",
    p1:{ name:"Nguyễn Văn Anh",   flag:"🇻🇳", score:null },
    p2:{ name:"Nguyễn Mạnh Hùng",  flag:"🇻🇳", score:null }, status:"upcoming", winSide:null },
  { id:"d8",  roundId:"lb1",  seq:1, bracket:"L", table:"B3", time:"2026-06-01T14:00",
    p1:{ name:"Ko Pin Yi",         flag:"🇹🇼", score:7 },
    p2:{ name:"Trần Đức Minh",     flag:"🇻🇳", score:4 }, status:"done", winSide:1 },
  { id:"d9",  roundId:"lb1",  seq:2, bracket:"L", table:"B4", time:"2026-06-01T14:00",
    p1:{ name:"Lê Quang Hùng",     flag:"🇻🇳", score:3 },
    p2:{ name:"Trần Quốc Tuấn",    flag:"🇻🇳", score:7 }, status:"done", winSide:2 },
  { id:"d10", roundId:"lb2",  seq:1, bracket:"L", table:"B3", time:"2026-06-03T14:00",
    p1:{ name:"Ko Pin Yi",         flag:"🇹🇼", score:7 },
    p2:{ name:"Carlo Biado",       flag:"🇵🇭", score:5 }, status:"done", winSide:1 },
  { id:"d11", roundId:"lb2",  seq:2, bracket:"L", table:"B4", time:"2026-06-03T14:00",
    p1:{ name:"Trần Quốc Tuấn",    flag:"🇻🇳", score:9 },
    p2:{ name:"James Aranas",      flag:"🇵🇭", score:7 }, status:"done", winSide:1 },
  { id:"d12", roundId:"lbsf", seq:1, bracket:"L", table:"B2", time:"2026-06-05T09:00",
    p1:{ name:"Ko Pin Yi",         flag:"🇹🇼", score:null },
    p2:{ name:"Trần Quốc Tuấn",    flag:"🇻🇳", score:null }, status:"upcoming", winSide:null },
  { id:"d13", roundId:"lbf",  seq:1, bracket:"L", table:"B2", time:"2026-06-05T14:00",
    p1:{ name:"TBD",               flag:"",    score:null },
    p2:{ name:"TBD",               flag:"",    score:null }, status:"upcoming", winSide:null },
  { id:"d14", roundId:"gf",   seq:1, bracket:"GF", table:"B1", time:"2026-06-07T16:00",
    p1:{ name:"TBD (WB)",          flag:"",    score:null },
    p2:{ name:"TBD (LB)",          flag:"",    score:null }, status:"upcoming", winSide:null },
];
const DE_DONE_OVR = {
  d7:  { status:"done", winSide:1, p1:{name:"Nguyễn Văn Anh",   flag:"🇻🇳",score:11}, p2:{name:"Nguyễn Mạnh Hùng", flag:"🇻🇳",score:7 } },
  d12: { status:"done", winSide:1, p1:{name:"Ko Pin Yi",         flag:"🇹🇼",score:9 }, p2:{name:"Trần Quốc Tuấn",   flag:"🇻🇳",score:6 } },
  d13: { status:"done", winSide:2, p1:{name:"Ko Pin Yi",         flag:"🇹🇼",score:9 }, p2:{name:"Nguyễn Mạnh Hùng", flag:"🇻🇳",score:11} },
  d14: { status:"done", winSide:1, p1:{name:"Nguyễn Văn Anh",   flag:"🇻🇳",score:13}, p2:{name:"Nguyễn Mạnh Hùng", flag:"🇻🇳",score:10} },
};
const DE_MATCHES_DONE = DE_MATCHES.map(m => DE_DONE_OVR[m.id] ? {...m,...DE_DONE_OVR[m.id]} : m);

/* ═══════════════════════════════════════════════════════════════════
   3. ROUND ROBIN — mock data  (6 cơ thủ × 5 vòng = 15 trận)
═══════════════════════════════════════════════════════════════════ */
const RR_PLAYERS = [
  { id:1, name:"Trần Quốc Khánh",    flag:"🇻🇳" },
  { id:2, name:"Nguyễn Hoàng Long",  flag:"🇻🇳" },
  { id:3, name:"Lê Thanh Tùng",      flag:"🇻🇳" },
  { id:4, name:"Phạm Văn Đức",       flag:"🇻🇳" },
  { id:5, name:"Vũ Mạnh Cường",      flag:"🇻🇳" },
  { id:6, name:"Đinh Trọng Khương",  flag:"🇻🇳" },
];
const RR_ROUNDS = [
  { id:"v1", label:"Vòng 1", raceTO:15 },
  { id:"v2", label:"Vòng 2", raceTO:15 },
  { id:"v3", label:"Vòng 3", raceTO:15 },
  { id:"v4", label:"Vòng 4", raceTO:15 },
  { id:"v5", label:"Vòng 5", raceTO:15 },
];
const RR_MATCHES = [
  { id:"rr1",  roundId:"v1", seq:1, table:"B1", time:"2026-05-28T09:00",
    p1:{id:1,name:"Trần Quốc Khánh",   flag:"🇻🇳",score:15}, p2:{id:6,name:"Đinh Trọng Khương",flag:"🇻🇳",score:11}, status:"done",winSide:1 },
  { id:"rr2",  roundId:"v1", seq:2, table:"B2", time:"2026-05-28T09:00",
    p1:{id:2,name:"Nguyễn Hoàng Long", flag:"🇻🇳",score:15}, p2:{id:5,name:"Vũ Mạnh Cường",    flag:"🇻🇳",score:12}, status:"done",winSide:1 },
  { id:"rr3",  roundId:"v1", seq:3, table:"B3", time:"2026-05-28T09:00",
    p1:{id:3,name:"Lê Thanh Tùng",     flag:"🇻🇳",score:13}, p2:{id:4,name:"Phạm Văn Đức",     flag:"🇻🇳",score:15}, status:"done",winSide:2 },

  { id:"rr4",  roundId:"v2", seq:1, table:"B1", time:"2026-05-29T09:00",
    p1:{id:1,name:"Trần Quốc Khánh",   flag:"🇻🇳",score:15}, p2:{id:5,name:"Vũ Mạnh Cường",    flag:"🇻🇳",score:9 }, status:"done",winSide:1 },
  { id:"rr5",  roundId:"v2", seq:2, table:"B2", time:"2026-05-29T09:00",
    p1:{id:6,name:"Đinh Trọng Khương", flag:"🇻🇳",score:15}, p2:{id:4,name:"Phạm Văn Đức",     flag:"🇻🇳",score:13}, status:"done",winSide:1 },
  { id:"rr6",  roundId:"v2", seq:3, table:"B3", time:"2026-05-29T09:00",
    p1:{id:2,name:"Nguyễn Hoàng Long", flag:"🇻🇳",score:10}, p2:{id:3,name:"Lê Thanh Tùng",    flag:"🇻🇳",score:15}, status:"done",winSide:2 },

  { id:"rr7",  roundId:"v3", seq:1, table:"B1", time:"2026-05-30T09:00",
    p1:{id:1,name:"Trần Quốc Khánh",   flag:"🇻🇳",score:15}, p2:{id:4,name:"Phạm Văn Đức",     flag:"🇻🇳",score:14}, status:"done",winSide:1 },
  { id:"rr8",  roundId:"v3", seq:2, table:"B2", time:"2026-05-30T09:00",
    p1:{id:5,name:"Vũ Mạnh Cường",     flag:"🇻🇳",score:15}, p2:{id:3,name:"Lê Thanh Tùng",    flag:"🇻🇳",score:11}, status:"done",winSide:1 },
  { id:"rr9",  roundId:"v3", seq:3, table:"B3", time:"2026-05-30T09:00",
    p1:{id:6,name:"Đinh Trọng Khương", flag:"🇻🇳",score:8 }, p2:{id:2,name:"Nguyễn Hoàng Long",flag:"🇻🇳",score:15}, status:"done",winSide:2 },

  { id:"rr10", roundId:"v4", seq:1, table:"B1", time:"2026-06-02T09:00",
    p1:{id:1,name:"Trần Quốc Khánh",   flag:"🇻🇳",score:7 }, p2:{id:3,name:"Lê Thanh Tùng",    flag:"🇻🇳",score:15}, status:"done",winSide:2 },
  { id:"rr11", roundId:"v4", seq:2, table:"B2", time:"2026-06-02T09:00",
    p1:{id:4,name:"Phạm Văn Đức",      flag:"🇻🇳",score:15}, p2:{id:2,name:"Nguyễn Hoàng Long",flag:"🇻🇳",score:5 }, status:"live",winSide:null },
  { id:"rr12", roundId:"v4", seq:3, table:"B3", time:"2026-06-02T09:00",
    p1:{id:5,name:"Vũ Mạnh Cường",     flag:"🇻🇳",score:null},p2:{id:6,name:"Đinh Trọng Khương",flag:"🇻🇳",score:null},status:"upcoming",winSide:null },

  { id:"rr13", roundId:"v5", seq:1, table:"B1", time:"2026-06-04T09:00",
    p1:{id:1,name:"Trần Quốc Khánh",   flag:"🇻🇳",score:null},p2:{id:2,name:"Nguyễn Hoàng Long",flag:"🇻🇳",score:null},status:"upcoming",winSide:null },
  { id:"rr14", roundId:"v5", seq:2, table:"B2", time:"2026-06-04T09:00",
    p1:{id:3,name:"Lê Thanh Tùng",     flag:"🇻🇳",score:null},p2:{id:6,name:"Đinh Trọng Khương",flag:"🇻🇳",score:null},status:"upcoming",winSide:null },
  { id:"rr15", roundId:"v5", seq:3, table:"B3", time:"2026-06-04T09:00",
    p1:{id:4,name:"Phạm Văn Đức",      flag:"🇻🇳",score:null},p2:{id:5,name:"Vũ Mạnh Cường",    flag:"🇻🇳",score:null},status:"upcoming",winSide:null },
];
const RR_DONE_OVR = {
  rr11: { status:"done", winSide:1, p1:{id:4,name:"Phạm Văn Đức",      flag:"🇻🇳",score:15}, p2:{id:2,name:"Nguyễn Hoàng Long",flag:"🇻🇳",score:5 } },
  rr12: { status:"done", winSide:1, p1:{id:5,name:"Vũ Mạnh Cường",     flag:"🇻🇳",score:15}, p2:{id:6,name:"Đinh Trọng Khương",flag:"🇻🇳",score:11} },
  rr13: { status:"done", winSide:1, p1:{id:1,name:"Trần Quốc Khánh",   flag:"🇻🇳",score:15}, p2:{id:2,name:"Nguyễn Hoàng Long",flag:"🇻🇳",score:12} },
  rr14: { status:"done", winSide:1, p1:{id:3,name:"Lê Thanh Tùng",     flag:"🇻🇳",score:15}, p2:{id:6,name:"Đinh Trọng Khương",flag:"🇻🇳",score:9 } },
  rr15: { status:"done", winSide:1, p1:{id:4,name:"Phạm Văn Đức",      flag:"🇻🇳",score:15}, p2:{id:5,name:"Vũ Mạnh Cường",   flag:"🇻🇳",score:13} },
};
const RR_MATCHES_DONE = RR_MATCHES.map(m => RR_DONE_OVR[m.id] ? {...m,...RR_DONE_OVR[m.id]} : m);

/* ═══════════════════════════════════════════════════════════════════
   4. GROUP STAGE — mock data  (2 bảng × 4 cơ thủ + Playoff)
═══════════════════════════════════════════════════════════════════ */
const GS_GROUPS = [
  { id:"A", label:"Bảng A", color:"#0284c7", lightBg:"#eff6ff" },
  { id:"B", label:"Bảng B", color:"#7c3aed", lightBg:"#f5f3ff" },
];
const GS_PLAYERS = {
  A: [
    { id:1, name:"Nguyễn Văn Anh",   flag:"🇻🇳" },
    { id:2, name:"Ko Pin Yi",         flag:"🇹🇼" },
    { id:3, name:"Carlo Biado",       flag:"🇵🇭" },
    { id:4, name:"Trần Đức Minh",     flag:"🇻🇳" },
  ],
  B: [
    { id:5, name:"James Aranas",      flag:"🇵🇭" },
    { id:6, name:"Lê Quang Hùng",     flag:"🇻🇳" },
    { id:7, name:"Trần Quốc Tuấn",    flag:"🇻🇳" },
    { id:8, name:"Nguyễn Mạnh Hùng",  flag:"🇻🇳" },
  ],
};
const GS_MATCHES = [
  /* Bảng A — 3 vòng × 2 trận */
  { id:"ga1", roundId:"ga1", group:"A", seq:1, table:"B1", time:"2026-06-01T09:00",
    p1:{id:1,name:"Nguyễn Văn Anh",  flag:"🇻🇳",score:9}, p2:{id:2,name:"Ko Pin Yi",        flag:"🇹🇼",score:5}, status:"done",winSide:1 },
  { id:"ga2", roundId:"ga1", group:"A", seq:2, table:"B2", time:"2026-06-01T09:00",
    p1:{id:3,name:"Carlo Biado",      flag:"🇵🇭",score:9}, p2:{id:4,name:"Trần Đức Minh",    flag:"🇻🇳",score:6}, status:"done",winSide:1 },
  { id:"ga3", roundId:"ga2", group:"A", seq:1, table:"B1", time:"2026-06-02T09:00",
    p1:{id:1,name:"Nguyễn Văn Anh",  flag:"🇻🇳",score:9}, p2:{id:3,name:"Carlo Biado",      flag:"🇵🇭",score:7}, status:"done",winSide:1 },
  { id:"ga4", roundId:"ga2", group:"A", seq:2, table:"B2", time:"2026-06-02T09:00",
    p1:{id:2,name:"Ko Pin Yi",        flag:"🇹🇼",score:9}, p2:{id:4,name:"Trần Đức Minh",    flag:"🇻🇳",score:4}, status:"done",winSide:1 },
  { id:"ga5", roundId:"ga3", group:"A", seq:1, table:"B1", time:"2026-06-03T09:00",
    p1:{id:1,name:"Nguyễn Văn Anh",  flag:"🇻🇳",score:null}, p2:{id:4,name:"Trần Đức Minh", flag:"🇻🇳",score:null}, status:"upcoming",winSide:null },
  { id:"ga6", roundId:"ga3", group:"A", seq:2, table:"B2", time:"2026-06-03T09:00",
    p1:{id:2,name:"Ko Pin Yi",        flag:"🇹🇼",score:null}, p2:{id:3,name:"Carlo Biado",   flag:"🇵🇭",score:null}, status:"upcoming",winSide:null },

  /* Bảng B — 3 vòng × 2 trận */
  { id:"gb1", roundId:"gb1", group:"B", seq:1, table:"B3", time:"2026-06-01T11:00",
    p1:{id:5,name:"James Aranas",     flag:"🇵🇭",score:9}, p2:{id:6,name:"Lê Quang Hùng",   flag:"🇻🇳",score:4}, status:"done",winSide:1 },
  { id:"gb2", roundId:"gb1", group:"B", seq:2, table:"B4", time:"2026-06-01T11:00",
    p1:{id:7,name:"Trần Quốc Tuấn",   flag:"🇻🇳",score:7}, p2:{id:8,name:"Nguyễn Mạnh Hùng",flag:"🇻🇳",score:9}, status:"done",winSide:2 },
  { id:"gb3", roundId:"gb2", group:"B", seq:1, table:"B3", time:"2026-06-02T11:00",
    p1:{id:5,name:"James Aranas",     flag:"🇵🇭",score:9}, p2:{id:7,name:"Trần Quốc Tuấn",  flag:"🇻🇳",score:3}, status:"done",winSide:1 },
  { id:"gb4", roundId:"gb2", group:"B", seq:2, table:"B4", time:"2026-06-02T11:00",
    p1:{id:6,name:"Lê Quang Hùng",    flag:"🇻🇳",score:4}, p2:{id:8,name:"Nguyễn Mạnh Hùng",flag:"🇻🇳",score:9}, status:"done",winSide:2 },
  { id:"gb5", roundId:"gb3", group:"B", seq:1, table:"B3", time:"2026-06-03T11:00",
    p1:{id:5,name:"James Aranas",     flag:"🇵🇭",score:6}, p2:{id:8,name:"Nguyễn Mạnh Hùng",flag:"🇻🇳",score:9}, status:"live",winSide:null },
  { id:"gb6", roundId:"gb3", group:"B", seq:2, table:"B4", time:"2026-06-03T11:00",
    p1:{id:6,name:"Lê Quang Hùng",    flag:"🇻🇳",score:null},p2:{id:7,name:"Trần Quốc Tuấn",flag:"🇻🇳",score:null},status:"upcoming",winSide:null },

  /* Playoff */
  { id:"po1", roundId:"sf", group:"PO", seq:1, table:"B1", time:"2026-06-05T14:00",
    p1:{id:null,name:"Nhất Bảng A",   flag:"",score:null}, p2:{id:null,name:"Nhì Bảng B",  flag:"",score:null}, status:"upcoming",winSide:null },
  { id:"po2", roundId:"sf", group:"PO", seq:2, table:"B2", time:"2026-06-05T14:00",
    p1:{id:null,name:"Nhất Bảng B",   flag:"",score:null}, p2:{id:null,name:"Nhì Bảng A",  flag:"",score:null}, status:"upcoming",winSide:null },
  { id:"po3", roundId:"gf", group:"PO", seq:1, table:"B1", time:"2026-06-07T16:00",
    p1:{id:null,name:"TBD",            flag:"",score:null}, p2:{id:null,name:"TBD",          flag:"",score:null}, status:"upcoming",winSide:null },
];
const GS_DONE_OVR = {
  ga5: { status:"done", winSide:1, p1:{id:1,name:"Nguyễn Văn Anh",   flag:"🇻🇳",score:9 }, p2:{id:4,name:"Trần Đức Minh",    flag:"🇻🇳",score:4 } },
  ga6: { status:"done", winSide:1, p1:{id:2,name:"Ko Pin Yi",         flag:"🇹🇼",score:9 }, p2:{id:3,name:"Carlo Biado",      flag:"🇵🇭",score:7 } },
  gb5: { status:"done", winSide:2, p1:{id:5,name:"James Aranas",      flag:"🇵🇭",score:6 }, p2:{id:8,name:"Nguyễn Mạnh Hùng",flag:"🇻🇳",score:9 } },
  gb6: { status:"done", winSide:2, p1:{id:6,name:"Lê Quang Hùng",    flag:"🇻🇳",score:5 }, p2:{id:7,name:"Trần Quốc Tuấn",  flag:"🇻🇳",score:9 } },
  po1: { status:"done", winSide:1, p1:{id:1,name:"Nguyễn Văn Anh",   flag:"🇻🇳",score:11}, p2:{id:5,name:"James Aranas",    flag:"🇵🇭",score:7 } },
  po2: { status:"done", winSide:1, p1:{id:8,name:"Nguyễn Mạnh Hùng", flag:"🇻🇳",score:11}, p2:{id:2,name:"Ko Pin Yi",       flag:"🇹🇼",score:9 } },
  po3: { status:"done", winSide:1, p1:{id:1,name:"Nguyễn Văn Anh",   flag:"🇻🇳",score:13}, p2:{id:8,name:"Nguyễn Mạnh Hùng",flag:"🇻🇳",score:10} },
};
const GS_MATCHES_DONE = GS_MATCHES.map(m => GS_DONE_OVR[m.id] ? {...m,...GS_DONE_OVR[m.id]} : m);

/* ═══════════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════════ */
const fmtTime = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("vi-VN",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit",hour12:false}).replace(",","");
};


function computeStandings(players, matches) {
  const s = {};
  players.forEach(p => { s[p.id] = { ...p, played:0, wins:0, losses:0, scored:0, conceded:0 }; });
  matches.filter(m => m.status === "done").forEach(({ p1, p2, winSide }) => {
    if (!s[p1.id] || !s[p2.id]) return;
    s[p1.id].played++;  s[p2.id].played++;
    s[p1.id].scored   += (p1.score||0); s[p1.id].conceded += (p2.score||0);
    s[p2.id].scored   += (p2.score||0); s[p2.id].conceded += (p1.score||0);
    if (winSide===1) { s[p1.id].wins++; s[p2.id].losses++; }
    else if (winSide===2) { s[p2.id].wins++; s[p1.id].losses++; }
  });
  return Object.values(s).sort((a,b) =>
    b.wins !== a.wins ? b.wins - a.wins
    : (b.scored - b.conceded) - (a.scored - a.conceded)
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SHARED DISPLAY COMPONENTS
═══════════════════════════════════════════════════════════════════ */
const BracketCard = ({ match, compact }) => {
  const isLive     = match?.status === "live";
  const isUpcoming = match?.status === "upcoming";
  const W = compact ? 180 : 210;

  if (!match) return (
    <div className="rounded-xl border border-dashed border-white/10 flex items-center justify-center"
         style={{ width:W, height:70, background:"rgba(255,255,255,0.04)" }}>
      <span className="text-white/20 text-xs">TBD</span>
    </div>
  );

  return (
    <div className={`rounded-xl overflow-hidden border ${isLive?"border-red-500/40":"border-white/10"}`}
         style={{ width:W, height:70, background: isLive?"rgba(239,52,42,0.08)":"rgba(255,255,255,0.06)" }}>
      <div className="flex items-center justify-between px-2.5 pt-1.5 pb-0.5">
        <span className="text-[9px] text-white/30 font-medium">{match.table}</span>
        {isLive
          ? <span className="flex items-center gap-1 text-[9px] text-red-400 font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"/>LIVE</span>
          : <span className="text-[9px] text-white/25">{fmtTime(match.time)}</span>}
      </div>
      {[{p:match.p1,side:1},{p:match.p2,side:2}].map(({p,side})=>{
        const isWinner = match.winSide === side;
        return (
          <div key={side} className={`flex items-center justify-between px-2.5 py-[3px] mx-1 rounded ${isWinner?"bg-yellow-400/15":""}`}>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className={`text-[11px] leading-tight truncate ${isWinner?"text-[#fbbf24] font-bold":isUpcoming?"text-white/60 font-light":"text-white/40 font-light"}`}
                    style={{maxWidth: compact?108:133}}>
                {p.name||"TBD"}
              </span>
            </div>
            <span className={`text-sm font-bold tabular-nums shrink-0 ${isWinner?"text-[#ef342a]":"text-white/30"}`}>
              {p.score??(isUpcoming?"":"—")}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const MatchRow = ({ m, matchNum }) => {
  const num    = matchNum ?? m.seq;
  const isLive = m.status === "live";
  const isDone = m.status === "done";
  const p1Win  = m.winSide === 1;
  const p2Win  = m.winSide === 2;

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 border-b border-white/[0.05] last:border-0 transition-colors ${isLive ? "" : "hover:bg-white/[0.03]"}`}
      style={isLive ? { background: "rgba(239,52,42,0.07)" } : {}}
    >
      {/* Table badge — italic, subdued */}
      <div className="shrink-0 w-10 text-center">
        <span className="text-[11px] italic font-bold text-sky-400/60">{m.table}</span>
      </div>

      {/* Players */}
      <div className="flex-1 flex items-center min-w-0">
        {/* P1 — right-aligned */}
        <div className="flex-1 flex items-center justify-end gap-1.5 min-w-0">
          <span className={`text-[13px] leading-tight truncate text-right max-w-[100px] sm:max-w-[140px]
            ${p1Win ? "font-bold text-[#fbbf24]" : isDone ? "text-white font-light" : "text-white/65"}`}>
            {m.p1.name}
          </span>
          <span className={`text-xl font-black tabular-nums shrink-0 w-7 text-right
            ${p1Win ? "text-[#ef342a]" : m.p1.score != null ? "text-white" : "text-transparent"}`}>
            {m.p1.score ?? ""}
          </span>
        </div>

        <span className="shrink-0 text-[10px] text-white/20 font-medium px-3">vs</span>

        {/* P2 — left-aligned */}
        <div className="flex-1 flex items-center gap-1.5 min-w-0">
          <span className={`text-xl font-black tabular-nums shrink-0 w-7
            ${p2Win ? "text-[#ef342a]" : m.p2.score != null ? "text-white" : "text-transparent"}`}>
            {m.p2.score ?? ""}
          </span>
          <span className={`text-[13px] leading-tight truncate max-w-[100px] sm:max-w-[140px]
            ${p2Win ? "font-bold text-[#fbbf24]" : isDone ? "text-white font-light" : "text-white/65"}`}>
            {m.p2.name}
          </span>
        </div>
      </div>

      {/* Right: time + match refs */}
      <div className="shrink-0 flex flex-col items-end gap-0.5 pl-3 border-l border-white/[0.07] min-w-[95px]">
        {isLive
          ? <span className="flex items-center gap-1 text-[10px] text-red-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"/>LIVE
            </span>
          : <span className="text-[10px] text-sky-400/70 font-light">{fmtTime(m.time)}</span>
        }
        <span className="text-[9px] text-sky-400/50 font-light tracking-wide">
          #{num} / W#{num + 15} / L#{num + 25}
        </span>
      </div>
    </div>
  );
};

/* ─── Generic list view (used by SE, DE, RR) ── */
const BRACKET_BADGE = {
  W:  { label:"WB", cls:"bg-emerald-500/15 text-emerald-400" },
  L:  { label:"LB", cls:"bg-orange-500/15 text-orange-400"   },
  GF: { label:"GF", cls:"bg-yellow-500/15 text-yellow-400"   },
};
const ListView = ({ matches, rounds }) => {
  const matchNumMap = useMemo(() => {
    const map = {};
    let idx = 0;
    rounds.forEach(r => {
      matches
        .filter(m => m.roundId === r.id)
        .sort((a, b) => a.seq - b.seq)
        .forEach(m => { map[m.id] = ++idx; });
    });
    return map;
  }, [matches, rounds]);

  return (
    <div className="space-y-4">
      {rounds.map(round => {
        const rMatches = matches.filter(m => m.roundId === round.id).sort((a,b) => a.seq - b.seq);
        if (!rMatches.length) return null;
        const badge = round.bracket ? BRACKET_BADGE[round.bracket] : null;
        return (
          <div key={round.id} className="rounded-3xl overflow-hidden shadow-sm"
               style={{background:"linear-gradient(160deg,#0d1b2e 0%,#0f2237 100%)", border:"1px solid rgba(255,255,255,0.06)"}}>
            <div className="flex items-center justify-between px-5 py-2.5"
                 style={{background:"linear-gradient(135deg,#9b1c1c 0%,#7f1616 100%)"}}>
              <div className="flex items-center gap-2">
                {badge && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-white/20 text-white">{badge.label}</span>}
                <span className="text-xs font-semibold text-white tracking-wide">{round.label}</span>
              </div>
              <span className="text-[10px] font-light text-white/70">Race to {round.raceTO}</span>
            </div>
            <div>{rMatches.map(m => <MatchRow key={m.id} m={m} matchNum={matchNumMap[m.id]}/>)}</div>
          </div>
        );
      })}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   SINGLE ELIMINATION — bracket geometry + view
═══════════════════════════════════════════════════════════════════ */
const C_H=70, C_W=210, P_GAP=14, P_SP=28, R_GAP=56;

function seY(r,m){
  if(r===0){ const off=m>=2?P_SP:0; return m*(C_H+P_GAP)+off+C_H/2; }
  if(r===1) return (seY(0,m*2)+seY(0,m*2+1))/2;
  return (seY(1,0)+seY(1,1))/2;
}
const seTop=(r,m)=>seY(r,m)-C_H/2;
const seXL=(r)=>r*(C_W+R_GAP);
const seXR=(r)=>seXL(r)+C_W;
function sePath(fr,fm){
  const midX=seXR(fr)+R_GAP/2;
  return `M ${seXR(fr)} ${seY(fr,fm)} H ${midX} V ${seY(fr+1,Math.floor(fm/2))} H ${seXL(fr+1)}`;
}
const SE_SVG_H = Math.ceil(seTop(0,3)+C_H+20);
const SE_SVG_W = seXR(2)+20;

const BracketView = ({ matches }) => {
  const meta=[{id:"r1",label:"Vòng 1",raceTO:7},{id:"sf",label:"Bán kết",raceTO:9},{id:"f",label:"Chung kết",raceTO:11}];
  const br=(id)=>matches.filter(m=>m.roundId===id).sort((a,b)=>a.seq-b.seq);
  const all=[br("r1"),br("sf"),br("f")];
  return (
    <div className="rounded-3xl overflow-auto border border-gray-100 shadow-sm"
         style={{background:"linear-gradient(160deg,#0d1b2e 0%,#0f2237 100%)"}}>
      <div className="flex border-b border-white/8" style={{width:SE_SVG_W+40,paddingLeft:20,paddingRight:20}}>
        {meta.map((r,i)=>(
          <div key={r.id} className="flex-shrink-0 text-center py-2.5" style={{width:C_W,marginLeft:i>0?R_GAP:0}}>
            <p className="text-white text-xs font-semibold">{r.label}</p>
            <p className="text-white/35 text-[10px] font-light">Race to {r.raceTO}</p>
          </div>
        ))}
      </div>
      <div className="relative" style={{width:SE_SVG_W+40,height:SE_SVG_H,margin:"16px 20px"}}>
        <svg className="absolute inset-0 pointer-events-none" width={SE_SVG_W} height={SE_SVG_H} style={{overflow:"visible"}}>
          {[0,1,2,3].map(i=><path key={i} d={sePath(0,i)} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={1.5}/>)}
          {[0,1].map(i=><path key={i} d={sePath(1,i)} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={1.5}/>)}
        </svg>
        {all.map((rm,ri)=>rm.map((m,mi)=>(
          <div key={m.id} className="absolute" style={{left:seXL(ri),top:seTop(ri,mi)}}>
            <BracketCard match={m} compact={false}/>
          </div>
        )))}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   DOUBLE ELIMINATION — WB inner (reuses SE geometry) + LB inner
═══════════════════════════════════════════════════════════════════ */
const WBBracketInner = ({ matches }) => {
  const meta=[{id:"wb1",label:"WB Vòng 1",raceTO:7},{id:"wb2",label:"WB Bán kết",raceTO:9},{id:"wbf",label:"WB Chung kết",raceTO:11}];
  const br=(id)=>matches.filter(m=>m.roundId===id).sort((a,b)=>a.seq-b.seq);
  const all=[br("wb1"),br("wb2"),br("wbf")];
  return (
    <div className="overflow-auto">
      <div className="flex border-b border-white/8" style={{width:SE_SVG_W+40,paddingLeft:20,paddingRight:20}}>
        {meta.map((r,i)=>(
          <div key={r.id} className="flex-shrink-0 text-center py-2.5" style={{width:C_W,marginLeft:i>0?R_GAP:0}}>
            <p className="text-white text-xs font-semibold">{r.label}</p>
            <p className="text-white/35 text-[10px] font-light">Race to {r.raceTO}</p>
          </div>
        ))}
      </div>
      <div className="relative" style={{width:SE_SVG_W+40,height:SE_SVG_H,margin:"16px 20px"}}>
        <svg className="absolute inset-0 pointer-events-none" width={SE_SVG_W} height={SE_SVG_H} style={{overflow:"visible"}}>
          {[0,1,2,3].map(i=><path key={i} d={sePath(0,i)} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={1.5}/>)}
          {[0,1].map(i=><path key={i} d={sePath(1,i)} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={1.5}/>)}
        </svg>
        {all.map((rm,ri)=>rm.map((m,mi)=>(
          <div key={m.id} className="absolute" style={{left:seXL(ri),top:seTop(ri,mi)}}>
            <BracketCard match={m} compact={false}/>
          </div>
        )))}
      </div>
    </div>
  );
};

/* LB geometry: lb1(2)→lb2(2)→lbsf(1)→lbf(1) */
const LB_RG=56;
function lbY(r,m){
  if(r<=1) return m*(C_H+P_GAP)+C_H/2;
  if(r===2) return (lbY(1,0)+lbY(1,1))/2;
  return lbY(2,0);
}
const lbTop=(r,m)=>lbY(r,m)-C_H/2;
const lbXL=(r)=>r*(C_W+LB_RG);
const lbXR=(r)=>lbXL(r)+C_W;
function lbPath(fr,fm){
  const toM = fr===1?0:fm;
  const midX=lbXR(fr)+LB_RG/2;
  return `M ${lbXR(fr)} ${lbY(fr,fm)} H ${midX} V ${lbY(fr+1,toM)} H ${lbXL(fr+1)}`;
}
const LB_SVG_W=lbXR(3)+20;
const LB_SVG_H=lbTop(0,1)+C_H+20;

const LBBracketInner = ({ matches }) => {
  const meta=[{id:"lb1",label:"LB Vòng 1",raceTO:7},{id:"lb2",label:"LB Vòng 2",raceTO:7},{id:"lbsf",label:"LB Bán kết",raceTO:9},{id:"lbf",label:"LB Chung kết",raceTO:11}];
  const br=(id)=>matches.filter(m=>m.roundId===id).sort((a,b)=>a.seq-b.seq);
  const all=[br("lb1"),br("lb2"),br("lbsf"),br("lbf")];
  return (
    <div className="overflow-auto">
      <div className="flex border-b border-white/8" style={{width:LB_SVG_W+40,paddingLeft:20,paddingRight:20}}>
        {meta.map((r,i)=>(
          <div key={r.id} className="flex-shrink-0 text-center py-2.5" style={{width:C_W,marginLeft:i>0?LB_RG:0}}>
            <p className="text-white text-xs font-semibold">{r.label}</p>
            <p className="text-white/35 text-[10px] font-light">Race to {r.raceTO}</p>
          </div>
        ))}
      </div>
      <div className="relative" style={{width:LB_SVG_W+40,height:LB_SVG_H,margin:"16px 20px"}}>
        <svg className="absolute inset-0 pointer-events-none" width={LB_SVG_W} height={LB_SVG_H} style={{overflow:"visible"}}>
          {[0,1].map(i=><path key={`a${i}`} d={lbPath(0,i)} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={1.5}/>)}
          {[0,1].map(i=><path key={`b${i}`} d={lbPath(1,i)} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={1.5}/>)}
          <path d={lbPath(2,0)} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={1.5}/>
        </svg>
        {all.map((rm,ri)=>rm.map((m,mi)=>(
          <div key={m.id} className="absolute" style={{left:lbXL(ri),top:lbTop(ri,mi)}}>
            <BracketCard match={m} compact={false}/>
          </div>
        )))}
      </div>
    </div>
  );
};

const DoubleEliminationBracketView = ({ matches }) => {
  const wb = matches.filter(m=>["wb1","wb2","wbf"].includes(m.roundId));
  const lb = matches.filter(m=>["lb1","lb2","lbsf","lbf"].includes(m.roundId));
  const gf = matches.find(m=>m.roundId==="gf");
  return (
    <div className="space-y-3">
      <div className="rounded-3xl overflow-hidden border border-gray-100 shadow-sm"
           style={{background:"linear-gradient(160deg,#0d1b2e 0%,#0f2237 100%)"}}>
        <div className="flex items-center gap-2 px-5 py-2.5 border-b border-white/8">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"/>
          <span className="text-white text-xs font-semibold tracking-wide">NHÁNH THẮNG (WINNER BRACKET)</span>
          <span className="ml-auto text-[10px] text-white/30">Thua → Nhánh Thua</span>
        </div>
        <WBBracketInner matches={wb}/>
      </div>
      <div className="flex items-center gap-3 px-2">
        <div className="flex-1 border-t border-dashed border-gray-200"/>
        <span className="text-[11px] text-gray-400 font-light whitespace-nowrap">Thua Nhánh Thắng → Nhánh Thua</span>
        <div className="flex-1 border-t border-dashed border-gray-200"/>
      </div>
      <div className="rounded-3xl overflow-hidden border border-gray-100 shadow-sm"
           style={{background:"linear-gradient(160deg,#1c0e0e 0%,#2a1515 100%)"}}>
        <div className="flex items-center gap-2 px-5 py-2.5 border-b border-white/8">
          <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0"/>
          <span className="text-white text-xs font-semibold tracking-wide">NHÁNH THUA (LOSER BRACKET)</span>
          <span className="ml-auto text-[10px] text-white/30">Thắng → Chung kết</span>
        </div>
        <LBBracketInner matches={lb}/>
      </div>
      <div className="rounded-3xl overflow-hidden border border-yellow-500/20 shadow-sm"
           style={{background:"linear-gradient(160deg,#1a1408 0%,#221c0a 100%)"}}>
        <div className="flex items-center gap-2 px-5 py-2.5 border-b border-white/8">
          <Trophy size={12} className="text-yellow-400 shrink-0"/>
          <span className="text-white text-xs font-semibold tracking-wide">CHUNG KẾT (GRAND FINAL)</span>
          <span className="ml-auto text-[10px] text-yellow-400/50">Race to 13</span>
        </div>
        <div className="p-5 flex justify-center">
          <BracketCard match={gf??null} compact={false}/>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   STANDINGS — shared component (dùng cho cả RR và GS)
═══════════════════════════════════════════════════════════════════ */
const StandingsTable = ({ players, matches, advanceCount, headerColor, headerLabel }) => {
  const rows = useMemo(()=>computeStandings(players,matches),[players,matches]);
  const MEDAL = ["🥇","🥈","🥉"];
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-2.5"
           style={{background: headerColor||"linear-gradient(135deg,#0d1b2e 0%,#162840 100%)"}}>
        <span className="text-white text-xs font-semibold tracking-wide">{headerLabel||"BẢNG XẾP HẠNG"}</span>
        {advanceCount && (
          <span className="text-[10px] text-white/50 font-light">Top {advanceCount} vào Playoff</span>
        )}
      </div>
      {/* Column headers */}
      <div className="flex items-center gap-3 px-5 py-2 bg-gray-50 border-b border-gray-100">
        <span className="w-6 text-center text-[9px] text-gray-400 font-bold uppercase">#</span>
        <span className="flex-1 text-[9px] text-gray-400 font-bold uppercase tracking-wide">Cơ thủ</span>
        <div className="flex items-center gap-4 shrink-0">
          {["TĐ","T","B","Điểm"].map(col=>(
            <span key={col} className="text-[9px] text-gray-400 font-bold w-7 text-center">{col}</span>
          ))}
        </div>
      </div>
      {/* Rows */}
      {rows.map((p,idx)=>{
        const isTop = advanceCount && idx < advanceCount;
        const isWarn = advanceCount && idx === advanceCount;
        return (
          <div key={p.id}
               className={`flex items-center gap-3 px-5 py-3 border-b border-gray-100 last:border-0
                 ${isTop?"bg-emerald-50/50":""}
                 ${isWarn?"border-t-2 border-dashed border-gray-200":""}`}>
            <span className={`w-6 text-center text-sm shrink-0 ${idx<3?"":"text-gray-300 text-xs font-semibold"}`}>
              {idx<3 ? MEDAL[idx] : idx+1}
            </span>
            <div className="flex-1 min-w-0 flex items-center gap-1.5">
              <span className={`text-sm font-medium truncate ${isTop?"text-emerald-700 font-semibold":"text-[#0d1b2e]"}`}>{p.name}</span>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <span className="text-xs text-gray-400 w-7 text-center tabular-nums">{p.played}</span>
              <span className="text-xs font-semibold text-emerald-600 w-7 text-center tabular-nums">{p.wins}</span>
              <span className="text-xs text-gray-400 w-7 text-center tabular-nums">{p.losses}</span>
              <span className={`text-sm font-bold w-7 text-center tabular-nums ${p.wins>p.losses?"text-[#0d1b2e]":"text-gray-400"}`}>{p.wins}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   ROUND ROBIN VIEWS
═══════════════════════════════════════════════════════════════════ */
const RoundRobinStandingsView = ({ matches }) => (
  <StandingsTable players={RR_PLAYERS} matches={matches} headerLabel="BẢNG XẾP HẠNG — VÒNG TRÒN ĐƠN"/>
);

/* ═══════════════════════════════════════════════════════════════════
   GROUP STAGE VIEWS
═══════════════════════════════════════════════════════════════════ */

/* Group Stage — List view: Bảng A, Bảng B, Playoff sections */
const GS_ROUND_LABELS = {
  ga1:"Vòng 1", ga2:"Vòng 2", ga3:"Vòng 3",
  gb1:"Vòng 1", gb2:"Vòng 2", gb3:"Vòng 3",
  sf:"Bán kết", gf:"Chung kết",
};
const GS_RACE = { sf:11, gf:13 };

const GroupStageListView = ({ matches }) => {
  const groupColors = { A:"#0284c7", B:"#7c3aed", PO:"#b45309" };
  const groupLabels = { A:"Bảng A", B:"Bảng B", PO:"Playoff" };

  const matchNumMap = useMemo(() => {
    const map = {};
    let idx = 0;
    ["A","B","PO"].forEach(g => {
      const gm = matches.filter(m => m.group === g);
      [...new Set(gm.map(m => m.roundId))].forEach(rid => {
        gm.filter(m => m.roundId === rid)
          .sort((a,b) => a.seq - b.seq)
          .forEach(m => { map[m.id] = ++idx; });
      });
    });
    return map;
  }, [matches]);

  const sections = useMemo(() => {
    const byGroup = {};
    matches.forEach(m => {
      if (!byGroup[m.group]) byGroup[m.group] = {};
      if (!byGroup[m.group][m.roundId]) byGroup[m.group][m.roundId] = [];
      byGroup[m.group][m.roundId].push(m);
    });
    return ["A","B","PO"].map(g=>({ group:g, rounds: byGroup[g]||{} }));
  }, [matches]);

  return (
    <div className="space-y-5">
      {sections.map(({ group, rounds }) => {
        const roundIds = Object.keys(rounds);
        if (!roundIds.length) return null;
        const color = groupColors[group];
        return (
          <div key={group}>
            {/* Group label */}
            <div className="flex items-center gap-2 mb-2 px-1">
              <span className="w-2 h-2 rounded-full shrink-0" style={{background:color}}/>
              <span className="text-xs font-semibold text-[#0d1b2e] tracking-wide">{groupLabels[group]}</span>
              <div className="flex-1 h-px bg-gray-200"/>
            </div>
            <div className="space-y-3">
              {roundIds.map(rid => {
                const rMatches = rounds[rid];
                const label = GS_ROUND_LABELS[rid]||rid;
                const raceTO = rMatches[0]?.raceTO || GS_RACE[rid] || 9;
                return (
                  <div key={rid} className="rounded-3xl overflow-hidden shadow-sm"
                       style={{background:"linear-gradient(160deg,#0d1b2e 0%,#0f2237 100%)", border:"1px solid rgba(255,255,255,0.06)"}}>
                    <div className="flex items-center justify-between px-5 py-2.5"
                         style={{background:"linear-gradient(135deg,#9b1c1c 0%,#7f1616 100%)"}}>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0 bg-white/50"/>
                        <span className="text-white text-xs font-semibold tracking-wide">{label}</span>
                      </div>
                      <span className="text-[10px] text-white/70 font-light">Race to {raceTO}</span>
                    </div>
                    <div>{rMatches.sort((a,b)=>a.seq-b.seq).map(m=><MatchRow key={m.id} m={m} matchNum={matchNumMap[m.id]}/>)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* Group Stage — Standings view: 2 groups side by side (stacked on mobile) */
const GroupStageStandingsView = ({ matches }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    {GS_GROUPS.map(g => (
      <StandingsTable
        key={g.id}
        players={GS_PLAYERS[g.id]}
        matches={matches.filter(m=>m.group===g.id)}
        advanceCount={2}
        headerColor={`linear-gradient(135deg, ${g.color} 0%, ${g.color}cc 100%)`}
        headerLabel={g.label.toUpperCase()}
      />
    ))}
  </div>
);

/* Group Stage — Playoff bracket (SF×2 → Final): simple 2-round 4-player bracket */
const PO_GAP=28;
function poY(r,m){ if(r===0) return m*(C_H+PO_GAP)+C_H/2; return (poY(0,0)+poY(0,1))/2; }
const poTop=(r,m)=>poY(r,m)-C_H/2;
const poXL=(r)=>r*(C_W+R_GAP);
const poXR=(r)=>poXL(r)+C_W;
function poPath(fm){
  const midX=poXR(0)+R_GAP/2;
  return `M ${poXR(0)} ${poY(0,fm)} H ${midX} V ${poY(1,0)} H ${poXL(1)}`;
}
const PO_SVG_W=poXR(1)+20;
const PO_SVG_H=poTop(0,1)+C_H+20;

const GroupStagePlayoffView = ({ matches }) => {
  const sfMatches = matches.filter(m=>m.roundId==="sf").sort((a,b)=>a.seq-b.seq);
  const gfMatch   = matches.find(m=>m.roundId==="gf");
  return (
    <div className="rounded-3xl overflow-hidden border border-yellow-500/20 shadow-sm"
         style={{background:"linear-gradient(160deg,#1a1408 0%,#221c0a 100%)"}}>
      <div className="flex items-center gap-2 px-5 py-2.5 border-b border-white/8">
        <Trophy size={12} className="text-yellow-400 shrink-0"/>
        <span className="text-white text-xs font-semibold tracking-wide">PLAYOFF BRACKET</span>
        <span className="ml-auto text-[10px] text-yellow-400/50">Top 2 mỗi bảng</span>
      </div>
      <div>
        {/* Round column headers */}
        <div className="flex border-b border-white/8" style={{width:PO_SVG_W+40,paddingLeft:20,paddingRight:20}}>
          {[{label:"Bán kết",raceTO:11},{label:"Chung kết",raceTO:13}].map((r,i)=>(
            <div key={i} className="flex-shrink-0 text-center py-2.5" style={{width:C_W,marginLeft:i>0?R_GAP:0}}>
              <p className="text-white text-xs font-semibold">{r.label}</p>
              <p className="text-white/35 text-[10px]">Race to {r.raceTO}</p>
            </div>
          ))}
        </div>
        {/* Cards */}
        <div className="relative" style={{width:PO_SVG_W+40,height:PO_SVG_H,margin:"16px 20px"}}>
          <svg className="absolute inset-0 pointer-events-none" width={PO_SVG_W} height={PO_SVG_H} style={{overflow:"visible"}}>
            {[0,1].map(i=><path key={i} d={poPath(i)} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={1.5}/>)}
          </svg>
          {sfMatches.map((m,mi)=>(
            <div key={m.id} className="absolute" style={{left:poXL(0),top:poTop(0,mi)}}>
              <BracketCard match={m} compact={false}/>
            </div>
          ))}
          <div className="absolute" style={{left:poXL(1),top:poTop(1,0)}}>
            <BracketCard match={gfMatch??null} compact={false}/>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   FORMAT BADGE — hiển thị thể thức ở góc trên
═══════════════════════════════════════════════════════════════════ */
const FORMAT_INFO = {
  single_elimination: { label:"Loại trực tiếp 1 lần thua", bg:"bg-blue-50",   text:"text-blue-600",   dot:"bg-blue-400"   },
  double_elimination: { label:"Loại trực tiếp 2 lần thua", bg:"bg-purple-50", text:"text-purple-600", dot:"bg-purple-400" },
  round_robin:        { label:"Vòng tròn đơn",             bg:"bg-green-50",  text:"text-green-600",  dot:"bg-green-400"  },
  group_stage:        { label:"Vòng bảng + Playoff",       bg:"bg-amber-50",  text:"text-amber-600",  dot:"bg-amber-400"  },
};
const FormatBadge = ({ format }) => {
  const info = FORMAT_INFO[format];
  if (!info) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-medium px-3 py-1 rounded-full ${info.bg} ${info.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${info.dot}`}/>
      {info.label}
    </span>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   MatchesTab — MAIN EXPORT
═══════════════════════════════════════════════════════════════════ */
const MatchesTab = ({ tournament }) => {
  const format  = detectFormat(tournament);
  const views   = VIEWS[format] || VIEWS.single_elimination;

  /* choose data source based on format + completion status */
  const isCompleted = tournament?.status === "COMPLETED";
  const MATCHES = format==="double_elimination" ? (isCompleted ? DE_MATCHES_DONE : DE_MATCHES)
                : format==="round_robin"        ? (isCompleted ? RR_MATCHES_DONE : RR_MATCHES)
                : format==="group_stage"        ? (isCompleted ? GS_MATCHES_DONE : GS_MATCHES)
                : (isCompleted ? SE_MATCHES_DONE : SE_MATCHES);
  const ROUNDS  = format==="double_elimination" ? DE_ROUNDS
                : format==="round_robin"        ? RR_ROUNDS
                : SE_ROUNDS;

  const [view,        setView]        = useState(views[0].id);
  const [nameSearch,  setNameSearch]  = useState("");
  const [roundFilter, setRoundFilter] = useState("");

  /* reset view when format changes (guards against stale view id) */
  const validView = views.find(v=>v.id===view) ? view : views[0].id;

  const filteredMatches = useMemo(()=>(
    MATCHES.filter(m=>{
      const q = nameSearch.toLowerCase();
      const inName  = !q || m.p1.name.toLowerCase().includes(q) || m.p2.name.toLowerCase().includes(q);
      const inRound = !roundFilter || m.roundId===roundFilter;
      return inName && inRound;
    })
  ),[MATCHES,nameSearch,roundFilter]);

  const showFilters = validView==="list";

  return (
    <div className="space-y-4">

      {/* ── Header row: format badge + view toggle ── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <FormatBadge format={format}/>
        <div className="flex gap-1.5">
          {views.map(({id,label,Icon})=>(
            <button key={id} onClick={()=>setView(id)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-200 ${
                      validView===id
                        ?"bg-[#0d1b2e] text-white shadow-sm"
                        :"bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
                    }`}>
              <Icon size={14}/>{label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Filters (list/schedule view only) ── */}
      {showFilters && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm px-5 py-4">
          <div className="flex flex-wrap gap-2.5">
            {/* Search */}
            <div className="relative flex-1 min-w-[160px]">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
              <input type="text" placeholder="Tìm tên cơ thủ..." value={nameSearch}
                     onChange={e=>setNameSearch(e.target.value)}
                     className="w-full bg-[#f8f9fb] border border-transparent text-[#0d1b2e] text-sm font-light rounded-2xl pl-8 pr-4 py-2 placeholder:text-gray-400 focus:outline-none focus:border-[#0d1b2e]/15 focus:bg-white transition-all"/>
            </div>
            {/* Round filter — chỉ hiện với SE/DE/RR, không hiện với group_stage */}
            {format!=="group_stage" && (
              <div className="relative min-w-[140px]">
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
                <select value={roundFilter} onChange={e=>setRoundFilter(e.target.value)}
                        className="w-full appearance-none bg-[#f8f9fb] border border-transparent text-[#0d1b2e] text-sm font-light rounded-2xl pl-4 pr-8 py-2 focus:outline-none focus:border-[#0d1b2e]/15 transition-all cursor-pointer">
                  <option value="">Tất cả vòng</option>
                  {ROUNDS.map(r=><option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
              </div>
            )}
            <div className="flex items-center px-1">
              <span className="text-[11px] text-gray-400 font-light">
                {filteredMatches.length} trận
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── CONTENT — routed by format + view ── */}

      {/* Single elimination */}
      {format==="single_elimination" && validView==="list" && (
        filteredMatches.length>0
          ? <ListView matches={filteredMatches} rounds={SE_ROUNDS}/>
          : <EmptyState onClear={()=>{setNameSearch("");setRoundFilter("");}}/>
      )}
      {format==="single_elimination" && validView==="bracket" && <BracketView matches={MATCHES}/>}

      {/* Double elimination */}
      {format==="double_elimination" && validView==="list" && (
        filteredMatches.length>0
          ? <ListView matches={filteredMatches} rounds={DE_ROUNDS}/>
          : <EmptyState onClear={()=>{setNameSearch("");setRoundFilter("");}}/>
      )}
      {format==="double_elimination" && validView==="bracket" && <DoubleEliminationBracketView matches={MATCHES}/>}

      {/* Round robin */}
      {format==="round_robin" && validView==="list" && (
        filteredMatches.length>0
          ? <ListView matches={filteredMatches} rounds={RR_ROUNDS}/>
          : <EmptyState onClear={()=>{setNameSearch("");setRoundFilter("");}}/>
      )}
      {format==="round_robin" && validView==="standing" && <RoundRobinStandingsView matches={MATCHES}/>}

      {/* Group stage */}
      {format==="group_stage" && validView==="list"    && <GroupStageListView matches={filteredMatches}/>}
      {format==="group_stage" && validView==="standing" && <GroupStageStandingsView matches={MATCHES}/>}
      {format==="group_stage" && validView==="bracket"  && <GroupStagePlayoffView matches={MATCHES}/>}

    </div>
  );
};

/* ── empty state helper ── */
const EmptyState = ({ onClear }) => (
  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm text-center py-16">
    <p className="text-gray-400 text-sm font-light">Không tìm thấy trận đấu phù hợp.</p>
    <button onClick={onClear} className="mt-2 text-[#ef342a] text-xs hover:underline">Xóa bộ lọc</button>
  </div>
);

export default MatchesTab;
