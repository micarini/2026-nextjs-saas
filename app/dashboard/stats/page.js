import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import { listUserBooks } from "@/lib/books/books";
import BottomNav from "@/components/nav/BottomNav";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // 1. OBTENER LOS DATOS REALES DEL USUARIO
  const books = await listUserBooks(user.uid);

  // 2. PROCESAMIENTO DE DATOS
  const currentYear = new Date().getFullYear();
  const currentMonthIndex = new Date().getMonth(); // 0-11
  
  // Filtrar libros terminados este año (de forma segura)
  const finishedBooksThisYear = books.filter((book) => {
    if (book.status !== "read") return false;
    if (!book.finishDate) return true;

    try {
      const finishDateObj = typeof book.finishDate.toDate === 'function' 
        ? book.finishDate.toDate() 
        : new Date(book.finishDate);
        
      return finishDateObj.getFullYear() === currentYear;
    } catch (e) {
      return true;
    }
  });

  const totalBooksFinished = finishedBooksThisYear.length;
  
  // ============================================================================
  // FIX: Cálculo de páginas a prueba de balas usando parseInt
  // ============================================================================
  const totalPagesReadThisYear = finishedBooksThisYear.reduce((total, book) => {
    // Convertimos explícitamente a número entero, por si Firebase lo guardó como String ("300")
    const totalP = parseInt(book.totalPages, 10);
    const currentP = parseInt(book.currentPage, 10);
    
    // Si totalPages es válido y mayor a 0, lo usamos. Si no, intentamos con currentPage. Si no, sumamos 0.
    const pagesToAdd = (!isNaN(totalP) && totalP > 0) ? totalP : ((!isNaN(currentP) && currentP > 0) ? currentP : 0);
    
    return total + pagesToAdd;
  }, 0);

  // Meta anual
  const yearlyGoal = totalBooksFinished > 30 ? totalBooksFinished + 10 : 30; 

  // 3. GENERAR DATOS MENSUALES PARA EL TIMELINE
  const monthsNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  const monthlyStats = Array.from({ length: 12 }, (_, i) => ({
    month: monthsNames[i],
    count: 0,
    width: "0%",
    books: [],
  }));

  finishedBooksThisYear.forEach((book) => {
    let finishMonth = currentMonthIndex; 
    
    if (book.finishDate) {
      try {
        const d = typeof book.finishDate.toDate === 'function' 
          ? book.finishDate.toDate() 
          : new Date(book.finishDate);
        finishMonth = d.getMonth();
      } catch (e) {
        // Fallback
      }
    }

    if (finishMonth >= 0 && finishMonth <= 11) {
      monthlyStats[finishMonth].count += 1;
      monthlyStats[finishMonth].books.push(book);
    }
  });

  const maxMonthlyCount = Math.max(...monthlyStats.map(m => m.count), 1);
  monthlyStats.forEach(stat => {
    if (stat.count > 0) {
      const percentage = Math.max((stat.count / maxMonthlyCount) * 100, 15);
      stat.width = `${percentage}%`;
    }
  });

  const visibleMonthlyStats = monthlyStats.slice(0, currentMonthIndex + 1);

  // 4. GENERAR CALENDARIO DE RACHAS (Mes Actual)
  const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
  const streakDays = Array(daysInMonth).fill(false);

  books.forEach(book => {
    if (!book.startDate) return;
    try {
      const start = typeof book.startDate.toDate === 'function' ? book.startDate.toDate() : new Date(book.startDate);
      const end = book.finishDate 
        ? (typeof book.finishDate.toDate === 'function' ? book.finishDate.toDate() : new Date(book.finishDate))
        : new Date();

      for (let day = 1; day <= daysInMonth; day++) {
        const currentDay = new Date(currentYear, currentMonthIndex, day);
        if (currentDay >= start && currentDay <= end) {
          streakDays[day - 1] = true;
        }
      }
    } catch (e) {
      // Ignorar
    }
  });

  let currentStreak = 0;
  let bestStreak = 0;
  streakDays.forEach(read => {
    if (read) {
      currentStreak++;
      bestStreak = Math.max(bestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  });

  const firstDayOfMonth = new Date(currentYear, currentMonthIndex, 1).getDay();
  const paddedStreakDays = [
    ...Array(firstDayOfMonth).fill(null),
    ...streakDays
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#FAFAFA] pb-28 text-gray-900">
      {/* BACKGROUND BLOBS */}
      <div className="absolute right-0 top-0 -z-10 h-80 w-80 bg-gradient-to-bl from-purple-200/40 via-pink-100/40 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-40 left-0 -z-10 h-72 w-72 bg-gradient-to-tr from-[#322F7A]/15 to-[#EDEBF7]/40 blur-3xl pointer-events-none" />

      <div className="relative z-10 mx-auto w-full max-w-3xl px-6 pt-10">
        
        {/* HEADER */}
        <header className="mb-8">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
            {currentYear} Reading wrapped
          </p>
          <h1 className="mt-1 text-3xl font-extrabold text-gray-900">
            Your Stats
          </h1>
        </header>

        {/* =====================================
            TOP WIDGETS (GOAL & PAGES)
        ====================================== */}
        <div className="mb-6 grid grid-cols-2 gap-4">
          {/* Yearly Goal Card */}
          <div className="flex flex-col items-center justify-center rounded-[2rem] border border-gray-50 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center">
            <div className="relative mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-[#EDEBF7]/70">
              <span className="text-2xl font-extrabold text-[#322F7A]">{totalBooksFinished}</span>
              <svg className="absolute inset-0 h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="46" fill="none" stroke="#EDEBF7" strokeWidth="8" />
                <circle cx="50" cy="50" r="46" fill="none" stroke="#322F7A" strokeWidth="8" strokeDasharray={`${(totalBooksFinished/yearlyGoal)*289} 289`} strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-2xl font-extrabold text-gray-900">
              <span className="text-[#322F7A]">{totalBooksFinished}</span> of {yearlyGoal}
            </p>
            <p className="mt-1 text-xs font-bold uppercase tracking-wider text-gray-400">
              Books finished
            </p>
          </div>

          {/* Pages Read Card */}
          <div className="flex flex-col items-center justify-center rounded-[2rem] border border-gray-50 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center">
            <div className="mb-3 flex h-20 w-20 items-center justify-center">
              <div className="relative h-16 w-12 rounded bg-purple-100 shadow-sm rotate-[-10deg]"></div>
              <div className="absolute h-16 w-12 rounded bg-[#C9E265] shadow-md rotate-[5deg]"></div>
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Pages read
            </p>
            <p className="mt-1 text-2xl font-extrabold text-[#322F7A]">
              {totalPagesReadThisYear.toLocaleString()}
            </p>
            <p className="text-xs font-medium text-gray-500">this year</p>
          </div>
        </div>

        {/* =====================================
            FINISHED BOOKS TIMELINE
        ====================================== */}
        <section className="mb-6 rounded-[2rem] border border-gray-50 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Finished</p>
              <h2 className="text-4xl font-extrabold text-[#322F7A] leading-none mt-1">{totalBooksFinished}</h2>
              <p className="mt-1 text-sm font-extrabold text-gray-900">books so far this year</p>
            </div>
          </div>

          <div className="space-y-4">
            {visibleMonthlyStats.map((stat, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="w-8 text-sm font-bold text-gray-400">{stat.month}</span>
                
                <div className="relative h-14 flex-1 rounded-full bg-gray-50 flex items-center">
                  {stat.count > 0 && (
                    <div 
                      className={`h-full min-w-[4rem] rounded-r-3xl rounded-l-md bg-[#EDEBF7] border border-[#322F7A]/15 flex items-center pl-2 pr-4 overflow-hidden relative`}
                      style={{ width: stat.width }}
                    >
                      <div className="flex">
                        {stat.books.map((book, bIdx) => (
                          <div 
                            key={bIdx} 
                            className={`h-10 w-7 shrink-0 rounded-sm border border-white/40 shadow-sm overflow-hidden bg-[#322F7A] ${bIdx > 0 ? '-ml-3' : ''}`}
                            style={{ zIndex: stat.books.length - bIdx }}
                          >
                            {book.coverUrl && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={book.coverUrl} alt={book.title} className="h-full w-full object-cover" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {visibleMonthlyStats.every(s => s.count === 0) && (
              <p className="text-sm font-medium text-gray-400 py-4 text-center">No books finished yet this year.</p>
            )}
          </div>

          {/* Reader Insight */}
          {totalBooksFinished > 0 && (
            <div className="mt-6 rounded-3xl bg-[#EDEBF7]/60 p-5 border border-[#322F7A]/15">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-extrabold text-[#322F7A]">Reader insight</h3>
              </div>
              <p className="text-sm font-medium text-[#322F7A]/80">
                You are currently averaging <span className="font-extrabold text-[#1C1B1F]">{Math.round(totalBooksFinished / (currentMonthIndex + 1))} books</span> per month. Keep it going!
              </p>
            </div>
          )}
        </section>

        {/* =====================================
            READING CALENDAR / STREAKS
        ====================================== */}
        <section className="mb-6 rounded-[2rem] border border-gray-50 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Active reading days</p>
            <h2 className="text-4xl font-extrabold text-[#322F7A] leading-none mt-1">{bestStreak}</h2>
            <p className="mt-1 text-sm font-extrabold text-gray-900">longest streak this month</p>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-4 hide-scrollbar">
            <button className="px-5 py-2 rounded-full text-sm font-extrabold bg-[#322F7A] text-white">
              {monthsNames[currentMonthIndex]}
            </button>
          </div>

          <div className="mt-2">
            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-gray-400">
              <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {paddedStreakDays.map((read, idx) => (
                <div 
                  key={idx} 
                  className={`aspect-square rounded-xl flex items-center justify-center shadow-sm transition-all
                    ${read === true ? "bg-[#322F7A] text-white font-extrabold border border-[#322F7A]/30" :
                      read === false ? "bg-gray-100 border border-gray-200/50" : "bg-transparent"}`}
                >
                  {read !== null && (
                    <span className={`text-[10px] ${read === true ? "text-white/60" : "text-gray-400"}`}>
                      {(idx - firstDayOfMonth) + 1}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Leyenda */}
          <div className="mt-6 flex justify-between px-2 text-xs font-bold text-gray-500">
            <div className="flex items-center gap-2">
              <div className="h-3 w-4 rounded bg-[#322F7A]"></div>
              <span>Active</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-4 border border-gray-200 bg-gray-100 rounded"></div>
              <span>Inactive</span>
            </div>
          </div>
        </section>

      </div>

      <BottomNav active="stats" />
    </main>
  );
}