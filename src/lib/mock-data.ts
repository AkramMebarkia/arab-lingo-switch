// KFUPM Parking System — permit-aware data per spec.
// Coordinates approximate KFUPM Dhahran campus (~26.305°N, 50.144°E).

export type UserType =
  | "male-resident"
  | "female-resident"
  | "male-non-resident"
  | "female-non-resident"
  | "faculty"
  | "staff"
  | "handicap";

export type SlotStatus = "available" | "occupied" | "limited";
export type LotKind = "covered" | "uncovered" | "general";

export interface ParkingLot {
  id: string;
  number: string;
  name: string;
  kind: LotKind;
  zone: string;
  coordinates: [number, number]; // [lng, lat]
  total: number;
  available: number;
  status: SlotStatus;
  walkingMin: number;
  distanceM: number;
  eligibleFor: UserType[];
  prediction: string;
  predictionTone: "good" | "warn" | "bad";
  notes?: string;
  curfewExit?: boolean;
  prohibited?: boolean;
}

export const CAMPUS_CENTER: [number, number] = [50.1441, 26.3055];

const c = (dLng: number, dLat: number): [number, number] => [
  CAMPUS_CENTER[0] + dLng,
  CAMPUS_CENTER[1] + dLat,
];

// Permit eligibility per KFUPM spec
const ALL: UserType[] = ["faculty", "staff", "handicap"];
const MR_NR_ALL: UserType[] = ["male-resident", "male-non-resident", ...ALL];
const ALL_STUDENTS: UserType[] = [
  "male-resident",
  "female-resident",
  "male-non-resident",
  "female-non-resident",
  ...ALL,
];

export const PARKING_LOTS: ParkingLot[] = [
  // ── Mosques (faculty/staff) ───────────────────────────────
  {
    id: "L-MOSQUE-DHAHRAN",
    number: "Dhahran Mosque",
    name: "Dhahran Mosque",
    kind: "general",
    zone: "Mosques",
    coordinates: c(-0.0028, 0.0012),
    total: 122,
    available: 41,
    status: "available",
    walkingMin: 6,
    distanceM: 480,
    eligibleFor: ALL,
    prediction: "Stable — busy after Asr prayer",
    predictionTone: "good",
  },
  {
    id: "L-MOSQUE-ZUBAIR",
    number: "Al-Zubair Mosque",
    name: "Al-Zubair Mosque",
    kind: "general",
    zone: "Mosques",
    coordinates: c(0.0018, 0.0019),
    total: 245,
    available: 88,
    status: "available",
    walkingMin: 7,
    distanceM: 560,
    eligibleFor: ALL,
    prediction: "Best chance before 11:30 AM",
    predictionTone: "good",
  },

  // ── Named locations ───────────────────────────────────────
  {
    id: "L-STUDENT-MALL",
    number: "Student Mall",
    name: "Student Mall",
    kind: "general",
    zone: "Central",
    coordinates: c(0.0004, -0.0006),
    total: 92,
    available: 12,
    status: "limited",
    walkingMin: 3,
    distanceM: 220,
    eligibleFor: ["male-resident", "female-resident", ...ALL],
    prediction: "Likely full in 10 min",
    predictionTone: "warn",
  },
  {
    id: "L-MEDICAL-27",
    number: "27",
    name: "Medical Center",
    kind: "general",
    zone: "Medical",
    coordinates: c(0.002, -0.0014),
    total: 91,
    available: 33,
    status: "available",
    walkingMin: 5,
    distanceM: 410,
    eligibleFor: ["male-non-resident", "female-non-resident", ...ALL],
    prediction: "Stable for 30 min",
    predictionTone: "good",
    curfewExit: true,
  },
  {
    id: "L-FEMALE-HOUSING",
    number: "Female Housing",
    name: "Female Housing",
    kind: "general",
    zone: "Residence",
    coordinates: c(-0.0034, -0.0021),
    total: 134,
    available: 58,
    status: "available",
    walkingMin: 4,
    distanceM: 320,
    eligibleFor: ["female-resident", ...ALL],
    prediction: "Reserved priority for residents",
    predictionTone: "good",
  },
  {
    id: "L-UNI-SQUARE",
    number: "University Square",
    name: "University Square",
    kind: "general",
    zone: "Central",
    coordinates: c(0.0006, 0.0008),
    total: 79,
    available: 21,
    status: "available",
    walkingMin: 4,
    distanceM: 300,
    eligibleFor: ["female-resident", "female-non-resident", ...ALL],
    prediction: "Filling steadily",
    predictionTone: "good",
    curfewExit: true,
  },

  // ── Uncovered Lots ────────────────────────────────────────
  {
    id: "L-19",
    number: "19",
    name: "Lot 19",
    kind: "uncovered",
    zone: "Academic Perimeter",
    coordinates: c(-0.0016, 0.0006),
    total: 33,
    available: 9,
    status: "limited",
    walkingMin: 5,
    distanceM: 380,
    eligibleFor: ["male-non-resident", ...ALL],
    prediction: "Likely full in 12 min",
    predictionTone: "warn",
    curfewExit: true,
  },
  {
    id: "L-20",
    number: "20",
    name: "Lot 20",
    kind: "uncovered",
    zone: "Academic Perimeter",
    coordinates: c(-0.0012, 0.0014),
    total: 268,
    available: 87,
    status: "available",
    walkingMin: 6,
    distanceM: 460,
    eligibleFor: MR_NR_ALL,
    prediction: "High availability next 20 min",
    predictionTone: "good",
    curfewExit: true,
  },
  {
    id: "L-23",
    number: "23",
    name: "Lot 23 — 3rd Floor",
    kind: "covered",
    zone: "Female Zone",
    coordinates: c(-0.0026, 0.0004),
    total: 471,
    available: 156,
    status: "available",
    walkingMin: 4,
    distanceM: 310,
    eligibleFor: ["female-resident", ...ALL],
    prediction: "Steady inflow",
    predictionTone: "good",
    notes: "Strictly 3rd floor for female residents",
  },
  {
    id: "L-25",
    number: "25",
    name: "Lot 25 — 2nd Floor",
    kind: "covered",
    zone: "Female Zone",
    coordinates: c(-0.0022, 0.0001),
    total: 274,
    available: 92,
    status: "available",
    walkingMin: 4,
    distanceM: 320,
    eligibleFor: ["female-resident", ...ALL],
    prediction: "Good availability",
    predictionTone: "good",
    notes: "Strictly 2nd floor for female residents",
  },
  {
    id: "L-39",
    number: "39",
    name: "Lot 39",
    kind: "uncovered",
    zone: "Female Zone",
    coordinates: c(-0.0024, -0.0009),
    total: 75,
    available: 28,
    status: "available",
    walkingMin: 5,
    distanceM: 390,
    eligibleFor: ["female-non-resident", ...ALL],
    prediction: "Stable for 25 min",
    predictionTone: "good",
    curfewExit: true,
  },
  {
    id: "L-57",
    number: "57",
    name: "Lot 57",
    kind: "uncovered",
    zone: "Academic Perimeter",
    coordinates: c(0.0009, 0.0017),
    total: 172,
    available: 64,
    status: "available",
    walkingMin: 6,
    distanceM: 470,
    eligibleFor: ALL_STUDENTS,
    prediction: "Good chance now",
    predictionTone: "good",
    curfewExit: true,
  },
  {
    id: "L-59U",
    number: "59 (Uncovered)",
    name: "Lot 59 — Uncovered",
    kind: "uncovered",
    zone: "Academic Perimeter",
    coordinates: c(0.0014, 0.0011),
    total: 626,
    available: 0,
    status: "occupied",
    walkingMin: 7,
    distanceM: 540,
    eligibleFor: ["male-non-resident", ...ALL],
    prediction: "Spots opening at 10:20 AM",
    predictionTone: "bad",
    curfewExit: true,
  },
  {
    id: "L-60",
    number: "60",
    name: "Lot 60",
    kind: "uncovered",
    zone: "Academic Perimeter",
    coordinates: c(0.0019, 0.0006),
    total: 827,
    available: 312,
    status: "available",
    walkingMin: 8,
    distanceM: 620,
    eligibleFor: ALL_STUDENTS,
    prediction: "Plenty of space now",
    predictionTone: "good",
    curfewExit: true,
  },
  {
    id: "L-64U",
    number: "64 (Uncovered)",
    name: "Lot 64 — Uncovered",
    kind: "uncovered",
    zone: "Academic Perimeter",
    coordinates: c(-0.0008, -0.0017),
    total: 52,
    available: 22,
    status: "available",
    walkingMin: 7,
    distanceM: 540,
    eligibleFor: ["male-resident", ...ALL],
    prediction: "Open evenings only",
    predictionTone: "good",
    notes: "Available 5:00 PM – 7:00 AM only",
  },
  {
    id: "L-64C",
    number: "64 (Covered)",
    name: "Lot 64 — Covered",
    kind: "covered",
    zone: "Academic Perimeter",
    coordinates: c(-0.0007, -0.0019),
    total: 558,
    available: 240,
    status: "available",
    walkingMin: 6,
    distanceM: 480,
    eligibleFor: ["male-resident", ...ALL],
    prediction: "Open evenings only",
    predictionTone: "good",
    notes: "Available 5:00 PM – 7:00 AM only",
  },
  {
    id: "L-71",
    number: "71",
    name: "Lot 71",
    kind: "covered",
    zone: "Covered Garages",
    coordinates: c(0.0011, -0.0008),
    total: 1170,
    available: 412,
    status: "available",
    walkingMin: 5,
    distanceM: 380,
    eligibleFor: MR_NR_ALL,
    prediction: "Plenty of covered space",
    predictionTone: "good",
    curfewExit: true,
  },
  {
    id: "L-72",
    number: "72",
    name: "Lot 72",
    kind: "covered",
    zone: "Covered Garages",
    coordinates: c(0.0014, -0.0004),
    total: 1100,
    available: 290,
    status: "available",
    walkingMin: 5,
    distanceM: 400,
    eligibleFor: MR_NR_ALL,
    prediction: "Filling fast after 9 AM",
    predictionTone: "good",
    curfewExit: true,
  },
  {
    id: "L-73",
    number: "73",
    name: "Lot 73",
    kind: "covered",
    zone: "Covered Garages",
    coordinates: c(0.0016, 0),
    total: 1008,
    available: 88,
    status: "limited",
    walkingMin: 6,
    distanceM: 460,
    eligibleFor: MR_NR_ALL,
    prediction: "Likely full in 8 min",
    predictionTone: "warn",
    curfewExit: true,
  },
  {
    id: "L-74",
    number: "74",
    name: "Lot 74",
    kind: "covered",
    zone: "Covered Garages",
    coordinates: c(-0.0014, -0.0011),
    total: 1150,
    available: 504,
    status: "available",
    walkingMin: 6,
    distanceM: 470,
    eligibleFor: ["male-resident", "female-resident", ...ALL],
    prediction: "High availability",
    predictionTone: "good",
  },
  {
    id: "L-77",
    number: "77",
    name: "Lot 77 — Levels 1 & 2",
    kind: "covered",
    zone: "Covered Garages",
    coordinates: c(-0.0009, 0.0014),
    total: 558,
    available: 187,
    status: "available",
    walkingMin: 5,
    distanceM: 400,
    eligibleFor: ALL_STUDENTS,
    prediction: "Most popular — book a level early",
    predictionTone: "good",
    curfewExit: true,
  },
  {
    id: "L-400",
    number: "400",
    name: "Lot 400",
    kind: "uncovered",
    zone: "South Lot",
    coordinates: c(-0.0042, -0.0029),
    total: 342,
    available: 198,
    status: "available",
    walkingMin: 12,
    distanceM: 920,
    eligibleFor: ["female-non-resident", ...ALL],
    prediction: "Always reliable",
    predictionTone: "good",
    curfewExit: true,
  },

  // ── 24/7 Prohibited (shown but blocked for students) ─────
  ...(["5", "11", "14", "21"].map((n, i) => ({
    id: `L-PR${n}`,
    number: n,
    name: `Lot ${n} — Prohibited`,
    kind: "uncovered" as LotKind,
    zone: "Restricted",
    coordinates: c(0.0024 + i * 0.0006, -0.0024 - i * 0.0004),
    total: 0,
    available: 0,
    status: "occupied" as SlotStatus,
    walkingMin: 0,
    distanceM: 0,
    eligibleFor: ALL,
    prediction: "24/7 prohibited for students",
    predictionTone: "bad" as const,
    prohibited: true,
  })) satisfies ParkingLot[]),
  ...(["18", "59", "68"].map((n, i) => ({
    id: `L-PRC${n}`,
    number: `${n} (Covered)`,
    name: `Lot ${n} — Covered Prohibited`,
    kind: "covered" as LotKind,
    zone: "Restricted",
    coordinates: c(-0.0034 - i * 0.0004, 0.0021 + i * 0.0005),
    total: 0,
    available: 0,
    status: "occupied" as SlotStatus,
    walkingMin: 0,
    distanceM: 0,
    eligibleFor: ALL,
    prediction: "24/7 prohibited for students",
    predictionTone: "bad" as const,
    prohibited: true,
  })) satisfies ParkingLot[]),
];

export interface TradeListing {
  id: string;
  ownerName: string;
  ownerType: "Faculty" | "Staff";
  lot: string;
  lotId: string; // canonical lot id for permit filtering
  distanceM: number;
  windowStart: string;
  windowEnd: string;
  priceCredits: number;
}

export const TRADE_LISTINGS: TradeListing[] = [
  {
    id: "T-1",
    ownerName: "Dr. Khalid Al-Otaibi",
    ownerType: "Faculty",
    lot: "Lot 23 · Slot 14 (3rd fl)",
    lotId: "L-23",
    distanceM: 310,
    windowStart: "10:30",
    windowEnd: "13:00",
    priceCredits: 12,
  },
  {
    id: "T-2",
    ownerName: "S. Al-Harbi",
    ownerType: "Staff",
    lot: "Lot 73 · Slot 03",
    lotId: "L-73",
    distanceM: 460,
    windowStart: "11:00",
    windowEnd: "15:30",
    priceCredits: 8,
  },
  {
    id: "T-3",
    ownerName: "Prof. Noura Al-Qahtani",
    ownerType: "Faculty",
    lot: "Lot 77 · Slot 22 (L1)",
    lotId: "L-77",
    distanceM: 400,
    windowStart: "09:45",
    windowEnd: "12:15",
    priceCredits: 15,
  },
  {
    id: "T-4",
    ownerName: "Eng. Faisal Al-Dossari",
    ownerType: "Staff",
    lot: "Lot 20 · Slot 41",
    lotId: "L-20",
    distanceM: 460,
    windowStart: "08:00",
    windowEnd: "11:00",
    priceCredits: 6,
  },
  {
    id: "T-5",
    ownerName: "Dr. Layla Al-Shamri",
    ownerType: "Faculty",
    lot: "Lot 39 · Slot 07",
    lotId: "L-39",
    distanceM: 390,
    windowStart: "12:30",
    windowEnd: "16:00",
    priceCredits: 10,
  },
];

export interface Transaction {
  id: string;
  label: string;
  amount: number;
  date: string;
}

export const TRANSACTIONS: Transaction[] = [
  { id: "x1", label: "Reserved Lot 23 · Slot 14", amount: -12, date: "Today, 09:42" },
  { id: "x2", label: "Top-up", amount: 50, date: "Yesterday, 18:10" },
  { id: "x3", label: "Reserved Lot 73 · Slot 03", amount: -8, date: "Mon, 08:30" },
  { id: "x4", label: "Refund · Lot full", amount: 8, date: "Sun, 14:20" },
];

export const USER_TYPE_META: Record<
  UserType,
  { label: string; emoji: string; tag: string; permitColor: string; curfew: boolean }
> = {
  "male-resident": { label: "Male Resident", emoji: "🟢", tag: "Green Permit", permitColor: "hsl(152 64% 44%)", curfew: false },
  "female-resident": { label: "Female Resident", emoji: "🩷", tag: "Pink Permit", permitColor: "hsl(340 75% 65%)", curfew: false },
  "male-non-resident": { label: "Male Commuter", emoji: "🟣", tag: "Purple Permit", permitColor: "hsl(265 70% 56%)", curfew: true },
  "female-non-resident": { label: "Female Commuter", emoji: "🩷", tag: "Striped Pink Permit", permitColor: "hsl(340 75% 65%)", curfew: true },
  faculty: { label: "Faculty", emoji: "🎓", tag: "Faculty", permitColor: "hsl(222 87% 56%)", curfew: false },
  staff: { label: "Staff", emoji: "💼", tag: "Staff", permitColor: "hsl(188 80% 48%)", curfew: false },
  handicap: { label: "Accessibility", emoji: "♿", tag: "Priority Permit", permitColor: "hsl(215 88% 60%)", curfew: false },
};
