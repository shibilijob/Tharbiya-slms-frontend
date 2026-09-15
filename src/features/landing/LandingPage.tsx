import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { ProgressGauge } from '../../components/charts/ProgressGauge';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { PWAInstallModal } from '../../components/common/PWAInstallModal';
import {
  BookOpen,
  CalendarCheck2,
  HeartHandshake,
  Award,
  ChevronRight,
  GraduationCap,
  Download,
  Wifi,
  Battery,
  Bell
} from 'lucide-react';
import { motion } from 'framer-motion';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    isInstallable,
    isInstalled,
    isIOS,
    isInstructionModalOpen,
    promptInstall,
    closeInstructionModal
  } = usePWAInstall();

  const featureCards = [
    {
      id: 1,
      icon: <GraduationCap className="w-6 h-6 text-[#0F6B50]" />,
      emoji: "📚",
      malayalamTitle: "പഠനം",
      englishTitle: "Academic Progress Tracking",
      description: "വിവിധ വിഷയങ്ങളിലെ പരീക്ഷാ മാർക്കുകൾ, ഗ്രേഡുകൾ, പഠന നിലവാരം എന്നിവ സുതാര്യമായി രക്ഷിതാക്കൾക്ക് ലഭ്യമാക്കുന്നു."
    },
    {
      id: 2,
      icon: <BookOpen className="w-6 h-6 text-[#0F6B50]" />,
      emoji: "🕌",
      malayalamTitle: "ഖുർആൻ & ഹിഫ്ള്",
      englishTitle: "Quran, Hifz & Tajweed",
      description: "സൂറത്ത്, ആയത്ത് പുരോഗതി, തജ്‌വീദ് കൃത്യത എന്നിവ രേഖപ്പെടുത്തുന്നു."
    },
    {
      id: 3,
      icon: <CalendarCheck2 className="w-6 h-6 text-[#0F6B50]" />,
      emoji: "📅",
      malayalamTitle: "ഹാജർ",
      englishTitle: "Daily Attendance Tracking",
      description: "മദ്റസയിലെ കൃത്യമായ ഹാജർ നിലവാരവും അവധികളും വിരൽത്തുമ്പിൽ നിരീക്ഷിക്കാൻ സൗകര്യം."
    },
    {
      id: 4,
      icon: <HeartHandshake className="w-6 h-6 text-[#C9A227]" />,
      emoji: "🌱",
      malayalamTitle: "പ്രാക്ടിക്കൽ സ്കോർ",
      englishTitle: "Practical Score & Adab",
      description: "അച്ചടക്കം, ബഹുമാനം, ശുചിത്വം, സഹകരണം, ഉത്തരവാദിത്തം, പങ്കാളിത്തം എന്നീ തലങ്ങളിലുള്ള കുട്ടിയുടെ പ്രായോഗിക പ്രവർത്തന മികവ്."
    },
    {
      id: 5,
      icon: <Award className="w-6 h-6 text-[#C9A227]" />,
      emoji: "🏆",
      malayalamTitle: "നേട്ടങ്ങൾ",
      englishTitle: "Achievements & Milestones",
      description: "വാരാദ്യ ഹിഫ്ള് പൂർത്തീകരണം, പ്രതിമാസ പ്രാക്ടിക്കൽ സ്കോർ ടോപ്പർ, പ്രതിമാസ ഹാജർ ടോപ്പർ എന്നിവയ്ക്കുള്ള സവിശേഷ ബാഡ്ജുകൾ."
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Muallim Updates",
      description: "Muallim records the child's progress, Quran recitation, and attendance directly from class."
    },
    {
      number: "02",
      title: "System",
      description: "The information is securely organized and calculated into insightful student growth metrics."
    },
    {
      number: "03",
      title: "Parent Views",
      description: "Parents monitor their child's daily learning, attendance, and achievements seamlessly from mobile."
    },
    {
      number: "04",
      title: "Better Growth",
      description: "Muallims and parents stay aligned to nurture the child's spiritual, academic, and practical excellence."
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F2] flex flex-col font-sans selection:bg-[#DDEDE5] selection:text-[#084C3A]">
      <Navbar />

      {/* HERO SECTION */}
      <section id="home" className="relative pt-10 pb-16 md:pt-16 md:pb-24 overflow-hidden bg-islamic-pattern">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            {/* Left Hero Column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-6 space-y-6 text-center lg:text-left"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#DDEDE5] border border-[#bbdcd0] text-[#084C3A] text-xs font-bold shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#0F6B50]" />
                <span>Darunnajath Mundambra</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#1F2933] leading-tight tracking-tight font-malayalam">
                ഓരോ കുട്ടിയുടെയും വളർച്ചയിൽ — <br />
                <span className="text-[#0F6B50]">ഒരു പടി കൂടി മുന്നോട്ട്.</span>
              </h1>

              <p className="text-base sm:text-lg text-[#667085] leading-relaxed max-w-xl mx-auto lg:mx-0">
                <span className='font-bold text-[#0F6B50]'>DARUNNAJATH MUNDAMBRA</span> യിലെ ഓരോ കുട്ടിയുടെയും പഠനം, ഖുർആൻ പുരോഗതി, ഹാജർ, സ്വഭാവവികസനം, നേട്ടങ്ങൾ എന്നിവ എളുപ്പത്തിൽ നിരീക്ഷിക്കാൻ സഹായിക്കുന്ന ഡിജിറ്റൽ പ്ലാറ്റ്‌ഫോം.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
                <Button
                  size="lg"
                  variant="secondary"
                  leftIcon={<Download className="w-5 h-5 text-[#0F6B50]" />}
                  onClick={() => promptInstall()}
                  className="shadow-md hover:shadow-lg transition-all"
                >
                  {isInstalled ? "Tharbiyah Installed ✓" : "Add Tharbiya to Home Screen"}
                </Button>
                <a href="#how-it-works">
                  <Button size="lg" variant="outline">
                    How It Works
                  </Button>
                </a>
              </div>

              {/* Quick Trust Points */}
              <div className="pt-6 border-t border-[#E3EAE6] grid grid-cols-3 gap-4 text-center lg:text-left">
                <div>
                  <p className="text-xl sm:text-2xl font-black text-[#0F6B50]">100%</p>
                  <p className="text-xs text-[#667085] font-semibold mt-0.5">Mobile-first Parent View</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-black text-[#0F6B50]">114</p>
                  <p className="text-xs text-[#667085] font-semibold mt-0.5">Surahs & Hifz Tracker</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-black text-[#C9A227]">5 Pillars</p>
                  <p className="text-xs text-[#667085] font-semibold mt-0.5">Practical & Adab Score</p>
                </div>
              </div>
            </motion.div>

            {/* Right Hero Column: Realistic Interactive Parent Mobile Mockup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="lg:col-span-6 flex justify-center items-center"
            >
              {/* Realistic Smartphone Chassis Frame */}
              <div className="relative w-full max-w-[340px] sm:max-w-[350px] bg-[#FAF8F2] rounded-[48px] shadow-2xl shadow-[#084C3A]/25 border-[10px] border-[#084C3A] overflow-hidden flex flex-col text-[#1F2933] ring-1 ring-black/10 select-none">

                {/* Dynamic Island Pill Notch & Status Bar */}
                <div className="pt-3 px-5 pb-2 flex items-center justify-between text-[11px] font-bold text-[#1F2933] bg-[#FAF8F2]">
                  <span>9:41</span>
                  {/* Speaker & Dynamic Island Notch */}
                  <div className="w-24 h-4 bg-[#084C3A] rounded-full flex items-center justify-center gap-1.5 shadow-inner">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0F6B50]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                  </div>
                  <div className="flex items-center gap-1.5 text-[#1F2933]">
                    <Wifi className="w-3.5 h-3.5" />
                    <Battery className="w-4 h-4" />
                  </div>
                </div>

                {/* Mobile App Screen Content */}
                <div className="px-4 pt-1.5 pb-3 space-y-2.5 flex-1 flex flex-col justify-between bg-[#FAF8F2]">

                  {/* Top Bar inside App */}
                  <div className="flex items-center justify-between pb-2 border-b border-[#E3EAE6]">
                    <div>
                      <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wider block">Parent Portal</span>
                      <h3 className="text-sm font-bold text-[#1F2933] leading-none mt-0.5">Assalamu Alaikum 👋</h3>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="green" size="sm">Active Term</Badge>
                      <div className="w-7 h-7 rounded-full bg-white border border-[#E3EAE6] flex items-center justify-center text-[#084C3A] relative shadow-xs">
                        <Bell className="w-3.5 h-3.5" />
                        <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#C9A227] rounded-full" />
                      </div>
                    </div>
                  </div>

                  {/* Student Hero Card */}
                  <div className="p-3.5 bg-gradient-to-br from-[#0F6B50] to-[#084C3A] rounded-2xl text-white shadow-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-base font-extrabold leading-tight">Muhammad</h4>
                        <p className="text-xs text-[#DDEDE5] font-semibold">Class 5 A • Darunnajath</p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black text-[#FAF8F2]">86%</span>
                        <p className="text-[9px] text-[#DDEDE5] uppercase font-bold tracking-wider">Overall Progress</p>
                      </div>
                    </div>

                    {/* 4 Core Progress Metrics */}
                    <div className="grid grid-cols-4 gap-1.5 mt-3 pt-3 border-t border-white/15 text-center">
                      <div className="bg-white/10 rounded-xl py-1.5 px-1">
                        <p className="text-[9px] text-[#DDEDE5] font-bold">Quran</p>
                        <p className="text-xs font-extrabold text-[#FAF8F2]">91%</p>
                      </div>
                      <div className="bg-white/10 rounded-xl py-1.5 px-1">
                        <p className="text-[9px] text-[#DDEDE5] font-bold">Studies</p>
                        <p className="text-xs font-extrabold text-[#FAF8F2]">86%</p>
                      </div>
                      <div className="bg-white/10 rounded-xl py-1.5 px-1">
                        <p className="text-[9px] text-[#DDEDE5] font-bold">Attendance</p>
                        <p className="text-xs font-extrabold text-[#FAF8F2]">94%</p>
                      </div>
                      <div className="bg-white/10 rounded-xl py-1.5 px-1">
                        <p className="text-[9px] text-[#DDEDE5] font-bold">Practical</p>
                        <p className="text-xs font-extrabold text-[#FAF8F2]">90%</p>
                      </div>
                    </div>
                  </div>

                  {/* Daily Quran Progress Card */}
                  <div className="p-3 bg-white rounded-2xl border border-[#E3EAE6] shadow-xs space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#1F2933] flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-[#0F6B50]" /> Today&apos;s Quran Hifz
                      </span>
                      <span className="text-[10px] font-bold text-[#0F6B50] bg-[#DDEDE5] px-2 py-0.5 rounded-full">Mumtaz</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#667085] pt-1.5 border-t border-[#F2F5F3]">
                      <span>Surah Al-Mulk (Ayah 1-15)</span>
                      <span className="font-bold text-[#0F6B50]">Passed (95%)</span>
                    </div>
                  </div>

                  {/* Achievement Badge Card */}
                  <div className="p-2.5 bg-gradient-to-r from-white to-[#FBF4DE]/60 rounded-2xl border border-[#C9A227]/30 flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#C9A227]/20 text-[#9A7B1C] flex items-center justify-center shrink-0">
                        <Award className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#1F2933]">Monthly Attendance Topper</p>
                        <p className="text-[10px] text-[#667085]">100% Punctuality & Attendance</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-[#9A7B1C] bg-white px-2 py-0.5 rounded-full border border-[#C9A227]/30">
                      Badge
                    </span>
                  </div>

                  {/* Muallim Feedback Snippet */}
                  <div className="p-2.5 bg-white rounded-2xl border border-[#E3EAE6] text-xs flex items-center gap-2 shadow-xs">
                    <div className="w-7 h-7 rounded-full bg-[#DDEDE5] text-[#084C3A] flex items-center justify-center shrink-0 font-bold text-[10px]">
                      മു
                    </div>
                    <div className="truncate flex-1">
                      <p className="text-[10px] font-bold text-[#667085]">Usthad Remark:</p>
                      <p className="text-[11px] font-semibold text-[#1F2933] truncate">നല്ല അച്ചടക്കവും പാരായണ മികവും.</p>
                    </div>
                  </div>

                  {/* Mockup Button */}
                  <Link to="/login?role=PARENT" className="block pt-1">
                    <Button size="sm" className="w-full text-xs font-bold shadow-md hover:shadow-lg" variant="primary">
                      Open Parent Portal
                    </Button>
                  </Link>
                </div>

                {/* Mobile Bottom App Navigation Bar */}
                <div className="bg-white border-t border-[#E3EAE6] px-4 py-2 flex items-center justify-around text-[#667085]">
                  <div className="flex flex-col items-center gap-0.5 text-[#0F6B50]">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#0F6B50]" />
                    <span className="text-[9px] font-bold">Home</span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span className="text-[9px]">Quran</span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <CalendarCheck2 className="w-3.5 h-3.5" />
                    <span className="text-[9px]">Attendance</span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <Award className="w-3.5 h-3.5" />
                    <span className="text-[9px]">Awards</span>
                  </div>
                </div>

                {/* Home Indicator Bar */}
                <div className="py-1.5 bg-white flex justify-center">
                  <div className="w-28 h-1 bg-[#1F2933]/25 rounded-full" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 6 FEATURES GRID */}
      <section id="features" className="py-16 md:py-24 bg-white border-y border-[#E3EAE6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0F6B50] bg-[#DDEDE5] px-3.5 py-1 rounded-full">
              Holistic Madrasa Platform
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#1F2933] mt-3 font-malayalam">
              "ഓരോ കുട്ടിയുടെയും വളർച്ച ശ്രദ്ധിക്കാം"
            </h2>
            <p className="text-sm sm:text-base text-[#667085] mt-3 leading-relaxed">
              Designed specifically for the authentic needs of Darunnajath Mundambra, nurturing Deen, Akhlaq, and knowledge.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {featureCards.map(f => (
              <div
                key={f.id}
                className="bg-[#FAF8F2] rounded-2xl p-6 border border-[#E3EAE6] hover:border-[#0F6B50]/40 hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-white border border-[#E3EAE6] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                    {f.icon}
                  </div>
                  <span className="text-2xl">{f.emoji}</span>
                </div>
                <h3 className="text-lg font-bold text-[#1F2933] font-malayalam group-hover:text-[#0F6B50] transition-colors">
                  {f.malayalamTitle}
                </h3>
                <p className="text-xs font-bold text-[#0F6B50] uppercase tracking-wider mt-0.5">
                  {f.englishTitle}
                </p>
                <p className="text-xs sm:text-sm text-[#667085] mt-3 leading-relaxed">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS (4-STEP FLOW) */}
      <section id="how-it-works" className="py-16 md:py-24 bg-[#FAF8F2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0F6B50] bg-[#DDEDE5] px-3.5 py-1 rounded-full">
              Seamless Workflow
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#1F2933] mt-3">
              How Tharbiyah Works
            </h2>
            <p className="text-sm sm:text-base text-[#667085] mt-2">
              A transparent 4-step loop connecting educators and parents every day.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map(step => (
              <div
                key={step.number}
                className="bg-white rounded-2xl p-6 border border-[#E3EAE6] relative shadow-xs"
              >
                <span className="text-3xl font-black text-[#DDEDE5] block mb-2">
                  {step.number}
                </span>
                <h3 className="text-base font-bold text-[#084C3A] mb-2">
                  {step.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#667085] leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MADRASA VALUES & IDENTITY */}
      <section id="about" className="py-16 md:py-20 bg-gradient-to-br from-[#0F6B50] to-[#084C3A] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#C9A227] bg-white/10 px-4 py-1.5 rounded-full inline-block">
              Darunnajath Mundambra
            </span>
            <h2 className="text-2xl sm:text-4xl font-black leading-tight font-malayalam">
              "ഇസ്‌ലാമിക മൂല്യങ്ങളോടെ ഉത്തമ തലമുറയെ വളർത്തിയെടുക്കാം"
            </h2>
            <p className="text-sm sm:text-base text-[#DDEDE5] leading-relaxed pt-2">
              Tharbiyah is not a generic ERP; it is an educational companion custom-built for Madrasa traditions, focusing on Quran recitation, Practical Score, and Muallim-parent harmony.
            </p>
            <div className="pt-6 flex flex-wrap justify-center gap-4">
              <Link to="/login?role=PARENT">
                <Button size="lg" variant="gold" rightIcon={<ChevronRight className="w-4 h-4" />}>
                  Access Parent Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* PWA Cross-Platform Install Instruction Modal */}
      <PWAInstallModal
        isOpen={isInstructionModalOpen}
        onClose={closeInstructionModal}
        isIOS={isIOS}
        isInstalled={isInstalled}
        isInstallable={isInstallable}
        onNativeInstallPrompt={() => promptInstall()}
      />

      <Footer />
    </div>
  );
};
