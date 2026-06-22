import { useState, useEffect, useRef, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";

const BIRTHDAY = new Date(2005, 11, 25);

function toArabicNum(n: number) {
  return n.toString().replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[+d]);
}

function calcAge(birthday: Date, today: Date) {
  let years  = today.getFullYear() - birthday.getFullYear();
  let months = today.getMonth()    - birthday.getMonth();
  let days   = today.getDate()     - birthday.getDate();
  if (days < 0) {
    months--;
    days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
  }
  if (months < 0) { years--; months += 12; }
  return { years, months, days };
}

const START_YEAR = 2005;
const END_YEAR   = 2106;
const YEARS  = Array.from({ length: END_YEAR - START_YEAR + 1 }, (_, i) => START_YEAR + i);
const MONTHS = [
  "يناير","فبراير","مارس","أبريل","مايو","يونيو",
  "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر",
];
const DAY_ABBR_BY_JS = ["ح","إ","ث","ر","خ","ج","س"];

/* ─────────────────────────── Home ─────────────────────────── */
export default function Home() {
  const [level,         setLevel]         = useState<1|2|3>(1);
  const [selectedYear,  setSelectedYear]  = useState<number|null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string|null>(null);

  /* ── مواضع الاسترجاع ── */
  const [restoreL1, setRestoreL1] = useState<number|null>(null);
  const [restoreL2, setRestoreL2] = useState<number|null>(null);
  const [restoreL3, setRestoreL3] = useState<number|null>(null);

  /* ── مخازن السكرول في الذاكرة (تُعاد عند refresh) ── */
  const l1Scroll = useRef<number>(0);
  const l2Scroll = useRef<Map<number, number>>(new Map());
  const l3Scroll = useRef<Map<string, number>>(new Map());

  /* مراجع الـ containers */
  const l1Ref = useRef<HTMLDivElement|null>(null);
  const l2Ref = useRef<HTMLDivElement|null>(null);
  const l3Ref = useRef<HTMLDivElement|null>(null);

  const now          = new Date();
  const currentYear  = now.getFullYear();
  const currentMonth = now.getMonth();

  /* ── الإطار نشيط لو "الحالي" موجود في هذا المستوى ── */
  const ringActive =
    level === 1 ? true
    : level === 2 ? selectedYear === currentYear
    : selectedYear === currentYear && selectedMonth === MONTHS[currentMonth];

  /* ── حفظ السكرول للمستوى الحالي قبل مغادرته ── */
  const saveCurrentScroll = () => {
    if (level === 1 && l1Ref.current) {
      l1Scroll.current = l1Ref.current.scrollLeft;
    } else if (level === 2 && l2Ref.current && selectedYear !== null) {
      l2Scroll.current.set(selectedYear, l2Ref.current.scrollLeft);
    } else if (level === 3 && l3Ref.current && selectedYear !== null && selectedMonth !== null) {
      l3Scroll.current.set(`${selectedYear}-${selectedMonth}`, l3Ref.current.scrollLeft);
    }
  };

  /* ── دخول ── */
  const handleYearClick = (year: number) => {
    saveCurrentScroll();
    setRestoreL2(l2Scroll.current.get(year) ?? null);
    setSelectedYear(year);
    setLevel(2);
  };

  const handleMonthClick = (month: string) => {
    saveCurrentScroll();
    const key = `${selectedYear}-${month}`;
    setRestoreL3(l3Scroll.current.get(key) ?? null);
    setSelectedMonth(month);
    setLevel(3);
  };

  /* ── خروج ── */
  const goBackToLevel1 = () => {
    saveCurrentScroll();
    setRestoreL1(l1Scroll.current);
    setLevel(1);
    setTimeout(() => { setSelectedYear(null); setSelectedMonth(null); }, 500);
  };

  const goBackToLevel2 = () => {
    saveCurrentScroll();
    setRestoreL2(selectedYear !== null ? (l2Scroll.current.get(selectedYear) ?? null) : null);
    setLevel(2);
    setTimeout(() => { setSelectedMonth(null); }, 500);
  };

  /* ── الإطار: سكرول سلس للحالي في المستوى الحالي ── */
  const handleRing = () => {
    if (!ringActive) return;
    const container =
      level === 1 ? l1Ref.current
      : level === 2 ? l2Ref.current
      : l3Ref.current;
    if (container) scrollToDataToday(container);
  };

  /* ── تحديث مخازن السكرول باستمرار أثناء التمرير ── */
  useEffect(() => {
    if (level !== 1) return;
    const el = l1Ref.current;
    if (!el) return;
    const h = () => { l1Scroll.current = el.scrollLeft; };
    el.addEventListener("scroll", h, { passive: true });
    return () => el.removeEventListener("scroll", h);
  });

  useEffect(() => {
    if (level !== 2 || selectedYear === null) return;
    const el = l2Ref.current;
    if (!el) return;
    const year = selectedYear;
    const h = () => { l2Scroll.current.set(year, el.scrollLeft); };
    el.addEventListener("scroll", h, { passive: true });
    return () => el.removeEventListener("scroll", h);
  });

  useEffect(() => {
    if (level !== 3 || selectedYear === null || selectedMonth === null) return;
    const el = l3Ref.current;
    if (!el) return;
    const key = `${selectedYear}-${selectedMonth}`;
    const h = () => { l3Scroll.current.set(key, el.scrollLeft); };
    el.addEventListener("scroll", h, { passive: true });
    return () => el.removeEventListener("scroll", h);
  });

  return (
    <div className="min-h-screen w-full bg-white text-black relative overflow-hidden" dir="rtl">

      {/* ── Breadcrumb ── */}
      <header className="absolute top-0 right-0 px-12 pt-8 z-50">
        <nav
          className="flex items-center gap-4 select-none"
          style={{ fontFamily:"'Rakkas', serif", fontSize:"2.7rem", lineHeight:1.2, fontWeight:400 }}
        >
          <span
            onClick={() => level > 1 && goBackToLevel1()}
            className={`transition-colors duration-300 ${
              level > 1 ? "text-black/30 hover:text-black cursor-pointer" : "text-black"
            }`}
          >
            عمري
          </span>

          {selectedYear && level >= 2 && (
            <>
              <span className="text-black/20" style={{ fontSize:"1.6rem" }}>›</span>
              <span
                onClick={() => level > 2 && goBackToLevel2()}
                className={`transition-colors duration-300 ${
                  level > 2 ? "text-black/30 hover:text-black cursor-pointer" : "text-black"
                }`}
              >
                {selectedYear}
              </span>
            </>
          )}

          {selectedMonth && level === 3 && (
            <>
              <span className="text-black/20" style={{ fontSize:"1.6rem" }}>›</span>
              <span className="text-black">{selectedMonth}</span>
            </>
          )}
        </nav>
      </header>

      {/* ── الإطار + العمر ── */}
      <div className="absolute right-12 top-[90px] z-50 flex items-center gap-3">
        <button
          onClick={handleRing}
          className={`w-5 h-5 rounded-full bg-white ring-2 ring-offset-2 flex-shrink-0 transition-all duration-500 ${
            ringActive
              ? "ring-black hover:scale-125 cursor-pointer"
              : "ring-black/20 cursor-default"
          }`}
          title={ringActive ? "انتقل للحالي" : ""}
        />
        <AgeDisplay />
      </div>

      {/* ── Main ── */}
      <main className="w-full h-screen flex flex-col justify-center items-center relative">
        <AnimatePresence mode="wait">

          {level === 1 && (
            <motion.div
              key="level-1"
              initial={{ opacity:0, y:-16 }}
              animate={{ opacity:1, y:0 }}
              exit={{ opacity:0, y:16 }}
              transition={{ duration:0.5, ease:[0.22,1,0.36,1] }}
              className="w-full"
            >
              <TimelineBlock
                restoreScroll={restoreL1}
                setScrollRef={(el) => { l1Ref.current = el; }}
              >
                <YearDots years={YEARS} onYearClick={handleYearClick} />
              </TimelineBlock>
            </motion.div>
          )}

          {level === 2 && selectedYear && (
            <motion.div
              key="level-2"
              initial={{ opacity:0, y:-16 }}
              animate={{ opacity:1, y:0 }}
              exit={{ opacity:0, y:16 }}
              transition={{ duration:0.5, ease:[0.22,1,0.36,1] }}
              className="w-full"
            >
              <TimelineBlock
                restoreScroll={restoreL2}
                setScrollRef={(el) => { l2Ref.current = el; }}
              >
                <MonthDots months={MONTHS} year={selectedYear} onMonthClick={handleMonthClick} />
              </TimelineBlock>
            </motion.div>
          )}

          {level === 3 && selectedYear && selectedMonth && (
            <motion.div
              key={`level-3-${selectedYear}-${selectedMonth}`}
              initial={{ opacity:0, y:-16 }}
              animate={{ opacity:1, y:0 }}
              exit={{ opacity:0, y:16 }}
              transition={{ duration:0.5, ease:[0.22,1,0.36,1] }}
              className="w-full"
            >
              <TimelineBlock
                restoreScroll={restoreL3}
                setScrollRef={(el) => { l3Ref.current = el; }}
              >
                <DayDots year={selectedYear} monthIndex={MONTHS.indexOf(selectedMonth)} />
              </TimelineBlock>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}

/* ── easing ── */
function easeOutExpo(t: number) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

/* ── scrollToDataToday: حركة مخصصة بـ easing احترافي ── */
function scrollToDataToday(container: HTMLDivElement) {
  const el = container.querySelector("[data-today]") as HTMLElement|null;
  if (!el) return;
  setTimeout(() => {
    const cRect    = container.getBoundingClientRect();
    const eRect    = el.getBoundingClientRect();
    const delta    = (eRect.left + eRect.width / 2) - (cRect.left + cRect.width / 2);
    if (Math.abs(delta) < 1) return;

    const start     = container.scrollLeft;
    const target    = start + delta;
    const duration  = 900;
    const startTime = performance.now();

    container.style.scrollBehavior = "auto";

    function step(now: number) {
      const elapsed  = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      container.scrollLeft = start + delta * easeOutExpo(progress);
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        container.scrollLeft = target;
        container.style.scrollBehavior = "";
      }
    }

    requestAnimationFrame(step);
  }, 80);
}

/* ── TimelineBlock ── */
function TimelineBlock({
  children,
  restoreScroll,
  setScrollRef,
}: {
  children: React.ReactNode;
  restoreScroll?: number|null;
  setScrollRef?: (el: HTMLDivElement|null) => void;
}) {
  const scrollRef = useRef<HTMLDivElement|null>(null);

  const handleRef = (el: HTMLDivElement|null) => {
    scrollRef.current = el;
    setScrollRef?.(el);
  };

  useEffect(() => {
    const c = scrollRef.current;
    if (!c) return;
    c.style.scrollBehavior = "auto";
    if (restoreScroll != null) {
      c.scrollLeft = restoreScroll;
    } else {
      c.scrollLeft = c.scrollWidth;
    }
    requestAnimationFrame(() => { c.style.scrollBehavior = ""; });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full py-8">
      <div
        ref={handleRef}
        className="w-full overflow-x-auto hide-scrollbar"
        style={{ scrollBehavior:"smooth" }}
      >
        <div className="flex items-start min-w-max relative pl-16 pr-40 pt-4 pb-12">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ── useToday ── */
function useToday() {
  const [today, setToday] = useState(() => new Date());
  useEffect(() => {
    function schedule() {
      const now      = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const t = setTimeout(() => { setToday(new Date()); schedule(); }, tomorrow.getTime() - now.getTime());
      return t;
    }
    const t = schedule();
    return () => clearTimeout(t);
  }, []);
  return today;
}

/* ── AgeDisplay ── */
function AgeDisplay() {
  const today = useToday();
  const { years, months, days } = calcAge(BIRTHDAY, today);
  return (
    <p
      className="text-black/70 select-none"
      style={{ fontFamily:"'Rakkas', serif", fontSize:"1.15rem", lineHeight:1.3 }}
    >
      {toArabicNum(years)} سنة{"   "}{toArabicNum(months)} شهر{"   "}{toArabicNum(days)} يوم
    </p>
  );
}

/* ── Dot ── */
function Dot({ state, letter }: { state:"past"|"current"|"future"; letter?: string }) {
  return (
    <div className={`w-7 h-7 rounded-full transition-all duration-300 flex items-center justify-center ${
      state === "current" ? "bg-black ring-2 ring-offset-2 ring-black"
      : state === "past"  ? "bg-black"
      : "border-[1.5px] border-black/40 bg-white"
    }`}>
      {letter && (
        <span className={`text-[13px] leading-none select-none ${
          state === "past" || state === "current" ? "text-white" : "text-black/40"
        }`}>
          {letter}
        </span>
      )}
    </div>
  );
}

/* ── YearDots ── */
function YearDots({ years, onYearClick }: { years: number[]; onYearClick: (y: number) => void }) {
  const today       = useToday();
  const currentYear = today.getFullYear();
  return (
    <>
      <div className="absolute top-[30px] left-0 right-20 h-[2px] bg-black/40 z-0" />
      <div className="flex items-start gap-36 z-10">
        {years.map((year) => {
          const state = year < currentYear ? "past" : year === currentYear ? "current" : "future";
          return (
            <button
              key={year}
              onClick={() => onYearClick(year)}
              className="flex flex-col items-center group outline-none cursor-pointer"
              {...(state === "current" ? { "data-today": true } : {})}
            >
              <div className="group-hover:scale-150 transition-transform duration-300">
                <Dot state={state} />
              </div>
              <span className={`mt-4 text-lg font-medium whitespace-nowrap transition-colors duration-300 ${
                state === "current" ? "font-bold text-black"
                : state === "past"  ? "text-black/70 group-hover:text-black"
                : "text-black/30 group-hover:text-black/60"
              }`}>
                {year}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

/* ── MonthDots ── */
function MonthDots({
  months, year, onMonthClick,
}: { months: string[]; year: number; onMonthClick: (m: string) => void }) {
  const today        = useToday();
  const currentYear  = today.getFullYear();
  const currentMonth = today.getMonth();
  return (
    <>
      <div className="absolute top-[30px] left-0 right-20 h-[2px] bg-black/40 z-0" />
      <div className="flex items-start gap-12 z-10">
        {months.map((month, idx) => {
          const state =
            year < currentYear || (year === currentYear && idx < currentMonth) ? "past"
            : year === currentYear && idx === currentMonth ? "current"
            : "future";
          return (
            <button
              key={month}
              onClick={() => onMonthClick(month)}
              className="flex flex-col items-center group outline-none cursor-pointer"
              {...(state === "current" ? { "data-today": true } : {})}
            >
              <div className="group-hover:scale-150 transition-transform duration-300">
                <Dot state={state} />
              </div>
              <span className={`mt-4 text-lg font-medium whitespace-nowrap transition-colors duration-300 ${
                state === "current" ? "font-bold text-black"
                : state === "past"  ? "text-black/70 group-hover:text-black"
                : "text-black/30 group-hover:text-black/60"
              }`}>
                {month}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

/* ── DayDots ── */
function DayDots({ year, monthIndex }: { year: number; monthIndex: number }) {
  const today       = useToday();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const days        = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getState = (day: number): "past"|"current"|"future" => {
    const d          = new Date(year, monthIndex, day);
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (d < todayStart) return "past";
    if (d.getTime() === todayStart.getTime()) return "current";
    return "future";
  };

  return (
    <>
      <div className="absolute top-[30px] left-0 right-20 h-[2px] bg-black/40 z-0" />
      <div className="flex items-start gap-4 z-10">
        {days.map((day) => {
          const state = getState(day);
          const isCur = state === "current";
          const isSat = new Date(year, monthIndex, day).getDay() === 6;
          return (
            <Fragment key={day}>
              {isSat && (
                <div
                  className="self-stretch w-px flex-shrink-0 mx-2"
                  style={{
                    background:
                      "repeating-linear-gradient(to bottom,rgba(0,0,0,.18) 0px,rgba(0,0,0,.18) 4px,transparent 4px,transparent 8px)",
                  }}
                />
              )}
              <div
                className="flex flex-col items-center"
                {...(isCur ? { "data-today": true } : {})}
              >
                <Dot state={state} letter={DAY_ABBR_BY_JS[new Date(year, monthIndex, day).getDay()]} />
                <span className={`mt-1 text-xs font-medium whitespace-nowrap ${
                  isCur              ? "font-bold text-black"
                  : state === "past" ? "text-black/60"
                  : "text-black/30"
                }`}>
                  {day}
                </span>
              </div>
            </Fragment>
          );
        })}
      </div>
    </>
  );
}
