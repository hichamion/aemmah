import React from 'react';
import { MosqueIcon } from './MosqueIcon';
import { ImamProfile, MosqueJob } from '../types';
import { Users, TrendingUp, CheckCircle2, Sparkles, ArrowUpRight, FileCheck } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { MIN_ITEMS_FOR_STATS } from '../config';
import { isRtl, locale, t } from '../i18n';

interface DashboardProps {
  imams: ImamProfile[];
  mosques: MosqueJob[];
  onOpenImams: () => void;
  onOpenMosques: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  imams,
  mosques,
  onOpenImams,
  onOpenMosques,
}) => {
  const rtl = isRtl();
  if (imams.length + mosques.length < MIN_ITEMS_FOR_STATS) {
    // Empty charts look broken; show an invitation until there is enough real data.
    return (
      <section className="flex-1 py-16 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto w-full text-center space-y-5">
        <h1 className="text-3xl font-black text-parchment font-amiri">{t('إحصائيات المنصة')}</h1>
        <p className="text-white/75 leading-relaxed">
          {t('المنصة في بدايتها. ستظهر هنا الإحصائيات (الروايات، الدول، التسجيلات الجديدة…) عندما يكتمل عدد كافٍ من الملفات والإعلانات المعتمدة.')}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={onOpenImams}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-5 py-3 rounded-xl text-sm cursor-pointer"
          >
            {t('تصفح الأئمة')}
          </button>
          <button
            onClick={onOpenMosques}
            className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-5 py-3 rounded-xl text-sm cursor-pointer"
          >
            {t('تصفح إعلانات المساجد')}
          </button>
        </div>
      </section>
    );
  }

  // All figures are computed from real, approved data — nothing is invented.
  const activeMosquesCount = mosques.filter((m) => m.activeState !== 'closed').length;
  const availableImamsCount = imams.filter((i) => i.availabilityState !== 'paused').length;
  const closedMosquesCount = mosques.filter((m) => m.activeState === 'closed').length;
  const ramadanImamsCount = imams.filter((i) => i.availabilityState === 'busy_ramadan').length;

  // New registrations per month (last 6 months), from createdAt.
  const monthlyTrendsData = Array.from({ length: 6 }, (_, idx) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (5 - idx));
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return {
      month: d.toLocaleDateString(locale(), { month: 'short' }),
      imams: imams.filter((i) => (i.createdAt || '').startsWith(key)).length,
      mosques: mosques.filter((m) => (m.createdAt || '').startsWith(key)).length,
    };
  });

  const countBy = (pred: (r: string) => boolean) => imams.filter((i) => pred(i.riwaya)).length;
  const warshCount = countBy((r) => r.includes('ورش'));
  const hafsCount = countBy((r) => r.includes('حفص'));
  const qalunCount = countBy((r) => r.includes('قالون'));
  const tenQiraatCount = countBy((r) => r.includes('العشر'));
  const othersCount = Math.max(0, imams.length - (warshCount + hafsCount + qalunCount + tenQiraatCount));

  const riwayaData = [
    { name: t('ورش عن نافع'), value: warshCount, color: '#059669' },
    { name: t('حفص عن عاصم'), value: hafsCount, color: '#0284c7' },
    { name: t('قالون عن نافع'), value: qalunCount, color: '#f59e0b' },
    { name: t('القراءات العشر'), value: tenQiraatCount, color: '#8b5cf6' },
    { name: t('أخرى'), value: othersCount, color: '#94a3b8' },
  ].filter((d) => d.value > 0);

  // Country breakdown for mosques
  const countryCounts: { [key: string]: number } = {};
  mosques.forEach(m => {
    const c = m.country.trim() || t('غير محدد');
    countryCounts[c] = (countryCounts[c] || 0) + 1;
  });

  const countryData = Object.keys(countryCounts).map((c) => ({
    country: t(c),
    count: countryCounts[c],
  }));

  // Visa & Language capabilities
  const visaReadyCount = imams.filter(i => i.hasVisa === 'yes').length;
  const germanReadyCount = imams.filter(i => i.germanLevel && i.germanLevel !== 'none').length;
  const shariaDegreeCount = imams.filter(i => i.hasCerts === 'yes').length;

  const qualificationData = [
    { name: t('تأشيرة شنغن / إقامة أوروبية'), count: visaReadyCount, fill: '#0ea5e9' },
    { name: t('شهادة لغة ألمانية'), count: germanReadyCount, fill: '#10b981' },
    { name: t('شواهد وإجازات'), count: shariaDegreeCount, fill: '#f59e0b' },
  ];

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-sky-950 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-wrap justify-between items-center gap-6 border border-emerald-800/40">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-black px-3.5 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{t('إحصائيات منصة أئمة (بيانات حقيقية ومحدّثة)')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-amiri tracking-tight">
            {t('المؤشرات العامة للتوظيف الشرعي والربط بين الأئمة والمساجد')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {t('أرقام محسوبة مباشرة من الملفات والإعلانات المعتمدة في المنصة.')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onOpenImams}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-5 py-2.5 rounded-xl text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
          >
            <Users className="w-4 h-4" />
            <span>{t('تصفح الأئمة ({n})', { n: availableImamsCount })}</span>
          </button>
          <button
            onClick={onOpenMosques}
            className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black px-5 py-2.5 rounded-xl text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
          >
            <MosqueIcon className="w-4 h-4" />
            <span>{t('إعلانات المساجد ({n})', { n: activeMosquesCount })}</span>
          </button>
        </div>
      </div>

      {/* 4 Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* KPI 1: Active Ads */}
        <div className="bg-white rounded-2xl p-5 border-2 border-sky-100 shadow-sm hover:shadow-md transition space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500">{t('عدد الإعلانات النشطة للمساجد')}</span>
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
              <MosqueIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{activeMosquesCount}</span>
            <span className="text-xs text-slate-400">{t('إعلان مفتوح')}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-sky-700 font-bold bg-sky-50 p-2 rounded-xl">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{t('تحديث فوري لاحتياجات المساجد بأوروبا')}</span>
          </div>
        </div>

        {/* KPI 2: Available Imams */}
        <div className="bg-white rounded-2xl p-5 border-2 border-emerald-100 shadow-sm hover:shadow-md transition space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500">{t('عدد الأئمة المتاحين حالياً')}</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{availableImamsCount}</span>
            <span className="text-xs text-slate-400">{t('إمام وقارئ معتمد')}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 p-2 rounded-xl">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{t('ملفات راجعتها الإدارة')}</span>
          </div>
        </div>

        {/* KPI 3: Placement Success Rate */}
        <div className="bg-white rounded-2xl p-5 border-2 border-amber-100 shadow-sm hover:shadow-md transition space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500">{t('إعلانات أُغلقت (تم التعاقد)')}</span>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-700">{closedMosquesCount}</span>
            <span className="text-xs text-slate-400">{t('إعلان مغلق')}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-amber-800 font-bold bg-amber-50 p-2 rounded-xl">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>{t('المساجد التي أوقفت إعلانها بعد إيجاد إمام')}</span>
          </div>
        </div>

        {/* KPI 4: Applications & Interviews */}
        <div className="bg-white rounded-2xl p-5 border-2 border-purple-100 shadow-sm hover:shadow-md transition space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500">{t('أئمة ملتزمون في رمضان')}</span>
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{ramadanImamsCount}</span>
            <span className="text-xs text-slate-400">{t('متاحون بعد رمضان')}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-purple-700 font-bold bg-purple-50 p-2 rounded-xl">
            <FileCheck className="w-3.5 h-3.5" />
            <span>{t('متاحون للتعاقد الدائم بعد العيد')}</span>
          </div>
        </div>

      </div>

      {/* Main Charts Row 1: Monthly Trends (Area) + Riwaya Distribution (Pie) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Monthly Activity Area Chart */}
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base font-amiri">
                {t('📈 التسجيلات الجديدة (آخر 6 أشهر)')}
              </h3>
              <p className="text-xs text-slate-500">
                {t('عدد ملفات الأئمة وإعلانات المساجد المعتمدة حسب شهر التسجيل')}
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
                {t('الأئمة')}
              </span>
              <span className="flex items-center gap-1.5 text-sky-700 font-bold">
                <span className="w-3 h-3 rounded-full bg-sky-500"></span>
                {t('المساجد')}
              </span>
            </div>
          </div>

          <div className="h-72 w-full pt-2" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrendsData}>
                <defs>
                  <linearGradient id="colorPlacements" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} reversed={rtl} />
                <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} orientation={rtl ? "right" : "left"} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="mosques"
                  name={t('المساجد')} 
                  stroke="#0ea5e9" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorApps)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="imams"
                  name={t('الأئمة')} 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorPlacements)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Riwaya Pie Chart */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-black text-slate-900 text-sm sm:text-base font-amiri">
              {t('📖 توزيع الأئمة حسب الروايات القرآنية')}
            </h3>
            <p className="text-xs text-slate-500">
              {t('نسبة إتقان ورش وحفص والقراءات العشر')}
            </p>
          </div>

          <div className="h-56 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riwayaData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {riwayaData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
            {riwayaData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                <span className="font-semibold text-slate-700 truncate">{item.name}</span>
                <span className="text-slate-400 font-bold">({item.value})</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Main Charts Row 2: Countries Bar + Qualifications */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Countries Distribution */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="font-black text-slate-900 text-sm sm:text-base font-amiri">
              {t('🗺️ توزيع إعلانات المساجد حسب الدولة')}
            </h3>
            <p className="text-xs text-slate-500">
              {t('جميع الإعلانات المعتمدة')}
            </p>
          </div>

          <div className="h-64 w-full pt-2" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={countryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="country" stroke="#64748b" fontSize={12} reversed={rtl} />
                <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} orientation={rtl ? "right" : "left"} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="count" name={t('عدد المساجد')} fill="#0284c7" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Qualifications & Visa Readiness */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="font-black text-slate-900 text-sm sm:text-base font-amiri">
              {t('🛡️ التأشيرات والشواهد واللغة الألمانية')}
            </h3>
            <p className="text-xs text-slate-500">
              {t('كما صرّح بها الأئمة في ملفاتهم')}
            </p>
          </div>

          <div className="h-64 w-full pt-2" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={qualificationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" stroke="#64748b" fontSize={12} allowDecimals={false} reversed={rtl} />
                <YAxis dataKey="name" type="category" width={150} stroke="#64748b" fontSize={12} orientation={rtl ? "right" : "left"} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="count" name={t('عدد الأئمة')} radius={rtl ? [8, 0, 0, 8] : [0, 8, 8, 0]}>
                  {qualificationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};
