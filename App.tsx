
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { SchoolData, Notice, AdmissionApplication, Faculty } from './types';
import { INITIAL_SCHOOL_DATA, STORAGE_KEY } from './constants';
import Home from './components/Home';
import AdminDashboard from './components/AdminDashboard';
import Login from './components/Login';
import StudentView from './components/StudentView';
import { loadDataFromCloud, getDisplayUrl } from './cloudStorage';

// Robust persistence helper using IndexedDB to handle large media blobs (Base64)
const dbHelper = {
  save: async (data: SchoolData): Promise<boolean> => {
    return new Promise((resolve) => {
      try {
        const request = indexedDB.open('SchoolPortalDB', 1);
        request.onupgradeneeded = () => {
          if (!request.result.objectStoreNames.contains('data')) {
            request.result.createObjectStore('data');
          }
        };
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction('data', 'readwrite');
          tx.objectStore('data').put(data, 'current');
          tx.oncomplete = () => {
            db.close();
            resolve(true);
          };
          tx.onerror = () => resolve(false);
        };
        request.onerror = () => resolve(false);
      } catch (e) {
        resolve(false);
      }
    });
  },
  load: async (): Promise<SchoolData | null> => {
    return new Promise((resolve) => {
      try {
        const request = indexedDB.open('SchoolPortalDB', 1);
        request.onupgradeneeded = () => {
          if (!request.result.objectStoreNames.contains('data')) {
            request.result.createObjectStore('data');
          }
        };
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction('data', 'readonly');
          const getReq = tx.objectStore('data').get('current');
          getReq.onsuccess = () => {
            db.close();
            resolve(getReq.result || null);
          };
          getReq.onerror = () => resolve(null);
        };
        request.onerror = () => resolve(null);
      } catch (e) {
        resolve(null);
      }
    });
  }
};

const NavLink: React.FC<{ to: string; children: React.ReactNode; onClick?: () => void; className?: string; hasArrow?: boolean }> = ({ to, children, onClick, className = "", hasArrow = false }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link 
      to={to} 
      onClick={onClick}
      className={`px-3 py-2 transition-all duration-300 font-bold text-[13px] flex items-center gap-1 border-r border-white/5 last:border-none ${
        isActive 
          ? 'text-accent bg-white/10 backdrop-blur-md' 
          : 'text-nav-text hover:text-accent'
      } ${className}`}
    >
      {children}
      {hasArrow && <span className="text-[10px] transform translate-y-0.5">▼</span>}
    </Link>
  );
};

const GenericPage: React.FC<{ title: string; content: string; pdfUrl?: string }> = ({ title, content, pdfUrl }) => (
  <div className="max-w-4xl mx-auto py-16 px-4">
    <h1 className="text-4xl font-black text-heading mb-8 uppercase border-b-4 border-yellow-400 inline-block tracking-tighter">{title}</h1>
    <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-2xl p-10 rounded-[40px] shadow-2xl border border-slate-200 dark:border-slate-800/50 space-y-8">
      <p className="text-slate-900 dark:text-slate-200 text-xl leading-relaxed whitespace-pre-wrap font-medium">{content}</p>
      {pdfUrl && (
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800/50">
          <h3 className="text-lg font-black text-heading mb-4 uppercase tracking-tight">Attachments / PDFs</h3>
          <a
            href={getDisplayUrl(pdfUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 transition-all shadow-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            View PDF Document
          </a>
        </div>
      )}
    </div>
  </div>
);

const AdministrationPage: React.FC<{ schoolData: SchoolData }> = ({ schoolData }) => {
  const PersonnelSection = ({ title, members, colorClass }: { title: string, members?: Faculty[], colorClass: string }) => {
    if (!members || members.length === 0) return null;
    return (
      <section className="space-y-10">
        <h3 className={`text-3xl font-black uppercase tracking-tighter inline-block border-b-4 pb-2 ${colorClass}`}>{title}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {members.map(f => (
            <div key={f.id} className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl p-8 rounded-[40px] shadow-xl text-center border border-slate-200 dark:border-slate-800/50 hover:-translate-y-2 transition-transform">
              <div className="w-32 h-32 rounded-full mx-auto mb-6 border-4 border-white dark:border-slate-700 shadow-xl overflow-hidden">
                <img src={getDisplayUrl(f.image) || 'https://via.placeholder.com/200'} className="w-full h-full object-cover" alt={f.name} />
              </div>
              <h4 className="font-black text-xl text-heading uppercase tracking-tight leading-none">{f.name}</h4>
              <p className="text-slate-600 dark:text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-3">{f.designation}</p>
            </div>
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="max-w-7xl mx-auto py-16 px-4 space-y-24">
      <div className="max-w-4xl">
        <h1 className="text-6xl md:text-8xl font-black text-heading mb-8 uppercase tracking-tighter leading-none">Administration</h1>
        <div className="h-4 w-32 bg-yellow-400 mb-8 rounded-full"></div>
        <p className="text-slate-900 dark:text-slate-200 text-2xl leading-relaxed font-medium bg-white/50 dark:bg-slate-900/50 backdrop-blur-3xl p-10 rounded-[50px] border border-slate-200 dark:border-slate-800 shadow-2xl">
          {schoolData.administrationContent}
        </p>
      </div>

      <div className="space-y-24">
        {schoolData.headTeacher && (
          <section className="space-y-10">
            <h3 className="text-3xl font-black uppercase tracking-tighter inline-block border-b-4 border-accent pb-2 text-accent">Head Teacher</h3>
            <div className="max-w-xl bg-heading/95 text-white p-12 rounded-[60px] shadow-2xl flex flex-col md:flex-row items-center gap-10 border border-white/10 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full"></div>
               <div className="w-48 h-48 shrink-0 rounded-[40px] overflow-hidden border-4 border-white/20 shadow-2xl group-hover:scale-105 transition-transform duration-500 relative z-10">
                 <img src={getDisplayUrl(schoolData.headTeacher.image) || 'https://via.placeholder.com/300'} className="w-full h-full object-cover" alt={schoolData.headTeacher.name} />
               </div>
               <div className="relative z-10">
                 <h4 className="text-4xl font-black uppercase tracking-tighter leading-tight mb-2">{schoolData.headTeacher.name}</h4>
                 <p className="text-accent text-xs font-black uppercase tracking-widest">{schoolData.headTeacher.designation}</p>
                 <div className="h-1 w-12 bg-accent mt-6"></div>
               </div>
            </div>
          </section>
        )}

        <PersonnelSection title="Assistant Head Teachers" members={schoolData.assistantHeadTeachers} colorClass="border-sky-500 text-sky-500" />
        <PersonnelSection title="School Committee" members={schoolData.committeeMembers} colorClass="border-purple-500 text-purple-500" />
        <PersonnelSection title="Governing Body" members={schoolData.governingBody} colorClass="border-amber-500 text-amber-500" />
      </div>

      {schoolData.administrationPdfUrl && (
        <div className="bg-slate-100 dark:bg-slate-900/50 p-12 rounded-[50px] border border-slate-200 dark:border-slate-800 text-center">
           <h4 className="text-xl font-black uppercase tracking-tighter text-heading mb-6">Full Administration Directory</h4>
           <a href={getDisplayUrl(schoolData.administrationPdfUrl)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-4 bg-heading text-white px-10 py-5 rounded-3xl font-black uppercase text-xs tracking-[0.2em] hover:scale-105 transition-all shadow-2xl">
             Download Official PDF
           </a>
        </div>
      )}
    </div>
  );
};

const AcademicsPage: React.FC<{ schoolData: SchoolData }> = ({ schoolData }) => (
  <div className="max-w-7xl mx-auto py-16 px-4 space-y-24">
    <div className="max-w-4xl">
      <h1 className="text-6xl md:text-8xl font-black text-heading mb-8 uppercase tracking-tighter leading-none">
        Academic <span className="text-sky-500">Center</span>
      </h1>
      <div className="h-4 w-32 bg-yellow-400 mb-8 rounded-full"></div>
      <p className="text-slate-900 dark:text-slate-200 text-2xl leading-relaxed font-medium bg-white/50 dark:bg-slate-900/50 backdrop-blur-3xl p-10 rounded-[50px] border border-slate-200 dark:border-slate-800 shadow-2xl">
        {schoolData.academicsContent}
      </p>
    </div>

    <div className="space-y-32">
      <section className="space-y-12">
        <div className="flex items-center gap-6">
           <div className="w-20 h-20 bg-sky-500 rounded-[35px] flex items-center justify-center text-white text-4xl shadow-2xl">📚</div>
           <h2 className="text-4xl md:text-6xl font-black text-heading uppercase tracking-tighter">Course Syllabus</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {schoolData.syllabuses?.length > 0 ? schoolData.syllabuses.map(item => (
            <div key={item.id} className="bg-white/95 dark:bg-slate-900/95 p-8 rounded-[45px] shadow-xl border border-slate-200 dark:border-slate-800 hover:scale-105 transition-all flex flex-col justify-between group">
               <div className="mb-6">
                 <span className="text-[10px] font-black text-sky-500 uppercase block mb-3 tracking-[0.3em] bg-sky-50 dark:bg-sky-900/30 px-4 py-1 rounded-full w-fit">{item.targetClass}</span>
                 <h4 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight leading-tight">{item.title}</h4>
               </div>
               <a href={getDisplayUrl(item.url)} target="_blank" rel="noreferrer" className="w-full bg-sky-500 text-white py-4 rounded-3xl text-xs font-black uppercase tracking-widest text-center shadow-lg hover:bg-sky-600 transition-colors">Download Syllabus</a>
            </div>
          )) : (
            <div className="col-span-full py-16 bg-slate-50 dark:bg-slate-900/30 rounded-[50px] border-2 border-dashed border-slate-200 dark:border-slate-800 text-center">
              <p className="text-secondary-text font-black uppercase tracking-widest opacity-50">No syllabuses currently available</p>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-12">
        <div className="flex items-center gap-6">
           <div className="w-20 h-20 bg-green-500 rounded-[35px] flex items-center justify-center text-white text-4xl shadow-2xl">📅</div>
           <h2 className="text-4xl md:text-6xl font-black text-heading uppercase tracking-tighter">Academic Schedules</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {schoolData.classRoutines?.length > 0 ? schoolData.classRoutines.map(item => (
            <div key={item.id} className="bg-white/95 dark:bg-slate-900/95 p-8 rounded-[45px] shadow-xl border border-slate-200 dark:border-slate-800 hover:scale-105 transition-all flex flex-col justify-between group">
               <div className="mb-6">
                 <span className="text-[10px] font-black text-green-500 uppercase block mb-3 tracking-[0.3em] bg-green-50 dark:bg-green-900/30 px-4 py-1 rounded-full w-fit">{item.targetClass}</span>
                 <h4 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight leading-tight">{item.title}</h4>
               </div>
               <a href={getDisplayUrl(item.url)} target="_blank" rel="noreferrer" className="w-full bg-green-500 text-white py-4 rounded-3xl text-xs font-black uppercase tracking-widest text-center shadow-lg hover:bg-green-600 transition-colors">View Routine</a>
            </div>
          )) : (
            <div className="col-span-full py-16 bg-slate-50 dark:bg-slate-900/30 rounded-[50px] border-2 border-dashed border-slate-200 dark:border-slate-800 text-center">
              <p className="text-secondary-text font-black uppercase tracking-widest opacity-50">No schedules uploaded yet</p>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-12">
        <div className="flex items-center gap-6">
           <div className="w-20 h-20 bg-purple-500 rounded-[35px] flex items-center justify-center text-white text-4xl shadow-2xl">👨‍🏫</div>
           <h2 className="text-4xl md:text-6xl font-black text-heading uppercase tracking-tighter">Class Leadership</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {schoolData.classTeachers?.length > 0 ? schoolData.classTeachers.map(item => (
            <div key={item.id} className="bg-heading/95 dark:bg-slate-800/90 backdrop-blur-xl p-10 rounded-[50px] text-white shadow-2xl border border-white/10 group flex flex-col items-center text-center">
               <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl mb-6">🧑‍🎓</div>
               <span className="text-[11px] font-black text-sky-200 uppercase block mb-2 tracking-[0.3em]">{item.targetClass} • {item.section}</span>
               <h4 className="text-2xl font-black tracking-tight leading-none text-white">{item.teacherName}</h4>
               <p className="mt-6 text-[9px] font-black uppercase tracking-widest opacity-60">Assigned Faculty</p>
            </div>
          )) : (
            <div className="col-span-full py-16 bg-slate-50 dark:bg-slate-900/30 rounded-[50px] border-2 border-dashed border-slate-200 dark:border-slate-800 text-center">
              <p className="text-secondary-text font-black uppercase tracking-widest opacity-50">No assignments configured</p>
            </div>
          )}
        </div>
      </section>
    </div>
  </div>
);

const App: React.FC = () => {
  const [schoolData, setSchoolData] = useState<SchoolData>(INITIAL_SCHOOL_DATA);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem('admin_session') === 'active';
  });

  // Fetch data from Google Apps Script with robust error handling
  const fetchCloudData = async (url: string) => {
    try {
      const response = await fetch(url);
      const text = await response.text();
      
      // Attempt to parse text as JSON. If it fails, the script is likely returning HTML (e.g., login page)
      try {
        const data = JSON.parse(text);
        if (data && data.schoolName) {
          return data;
        }
      } catch (jsonErr) {
        console.warn("Cloud Sync Warning: Received non-JSON response (likely an HTML error or login page). Please ensure the Google Script is deployed to 'Anyone'.", jsonErr);
      }
    } catch (err) {
      console.error("Cloud Sync Error (Network):", err);
    }
    return null;
  };

  // Logic to initialize data on page load
  useEffect(() => {
    const initData = async () => {
      // 1. Try loading from Netlify Blobs cloud storage first (primary source)
      const netlifyCloudData = await loadDataFromCloud();
      if (netlifyCloudData && netlifyCloudData.schoolName) {
        setSchoolData(netlifyCloudData);
        setIsDataLoaded(true);
        // Save to local cache for offline/faster subsequent loads
        dbHelper.save(netlifyCloudData);
        return;
      }

      // 2. Check URL for manual setup: ?sync=URL (legacy Google Script support)
      const params = new URLSearchParams(window.location.hash.split('?')[1] || window.location.search);
      const urlSync = params.get('sync');

      const savedLocal = await dbHelper.load();

      // Decide which URL to use (URL Param > Local Storage > Hardcoded Default)
      const targetUrl = urlSync || savedLocal?.cloudScriptUrl || INITIAL_SCHOOL_DATA.cloudScriptUrl;

      if (targetUrl) {
        const cloudData = await fetchCloudData(targetUrl);
        if (cloudData) {
          // Add the script URL to the data so it persists
          const enrichedData = { ...cloudData, cloudScriptUrl: targetUrl };
          setSchoolData(enrichedData);
          setIsDataLoaded(true);
          // Save to local cache for offline/faster subsequent loads
          dbHelper.save(enrichedData);
          return;
        }
      }

      // Fallback: If cloud fails, use local cache or hardcoded initial state
      if (savedLocal) {
        setSchoolData(savedLocal);
      }
      setIsDataLoaded(true);
    };
    initData();
  }, []);

  // Effect to handle dark mode and general persistence
  useEffect(() => {
    if (isDataLoaded) {
      dbHelper.save(schoolData);
      
      if (schoolData.themeConfig.isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [schoolData, isDataLoaded]);

  const updateSchoolData = (newData: Partial<SchoolData>) => {
    setSchoolData(prev => ({ ...prev, ...newData }));
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_session');
    setIsAdmin(false);
    window.location.hash = '/'; 
  };

  const toggleTheme = () => {
    const newDarkMode = !schoolData.themeConfig.isDarkMode;
    updateSchoolData({
      themeConfig: {
        ...schoolData.themeConfig,
        isDarkMode: newDarkMode
      }
    });
  };

  const tickerStyle = {
    backgroundColor: schoolData.tickerConfig?.backgroundColor || '#f8fafc',
    color: schoolData.tickerConfig?.textColor || '#004071',
    fontSize: schoolData.tickerConfig?.fontSize || '14px',
    fontWeight: schoolData.tickerConfig?.fontWeight || '900',
  };

  const marqueeStyle = {
    animationDuration: `${schoolData.tickerConfig?.speed || 25}s`,
  };

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const dynamicStyles = `
    :root {
      --primary-text: ${schoolData.themeConfig.primaryTextColor};
      --secondary-text: ${schoolData.themeConfig.secondaryTextColor};
      --heading-text: ${schoolData.themeConfig.headingColor};
      --nav-text: ${schoolData.themeConfig.navTextColor};
      --footer-text: ${schoolData.themeConfig.footerTextColor};
      --accent-color: ${schoolData.themeConfig.accentColor};
    }
    .text-primary-text { color: var(--primary-text) !important; }
    .text-secondary-text { color: var(--secondary-text) !important; }
    .text-heading { color: var(--heading-text) !important; }
    .text-nav-text { color: var(--nav-text) !important; }
    .text-footer-text { color: var(--footer-text) !important; }
    .text-accent { color: var(--accent-color) !important; }
    .bg-heading { background-color: var(--heading-text) !important; }
    .bg-accent { background-color: var(--accent-color) !important; }
    .border-accent { border-color: var(--accent-color) !important; }
    
    .dark .text-primary-text { color: #f1f5f9 !important; }
    .dark .text-secondary-text { color: #94a3b8 !important; }
    .dark .text-heading { color: #38bdf8 !important; }

    html:not(.dark) .bg-white\\/95 .text-primary-text,
    html:not(.dark) .bg-white\\/95 .text-slate-800,
    html:not(.dark) .bg-white\\/95 p,
    html:not(.dark) .bg-white\\/95 h3,
    html:not(.dark) .bg-white\\/95 h4 {
      color: #0f172a !important;
    }
  `;

  if (!isDataLoaded) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex items-center justify-center z-[9999]">
        <div className="text-center space-y-6">
          <div className="animate-spin w-20 h-20 border-4 border-accent border-t-transparent rounded-full mx-auto shadow-2xl"></div>
          <p className="text-white font-black uppercase tracking-[0.5em] animate-pulse">Establishing Portal Connectivity...</p>
        </div>
      </div>
    );
  }

  const identityString = [
    schoolData.schoolCode ? `School Code: ${schoolData.schoolCode}` : null,
    schoolData.collegeCode ? `College Code: ${schoolData.collegeCode}` : null,
    schoolData.eiin ? `EIIN: ${schoolData.eiin}` : null
  ].filter(Boolean).join(' | ');

  return (
    <HashRouter>
      <style>{dynamicStyles}</style>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-500 overflow-x-hidden">
        <header className="bg-heading text-white py-8 md:py-12 shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center gap-8 relative">
            <div className="shrink-0">
               <div className="w-28 h-28 md:w-36 md:h-36 bg-white/30 backdrop-blur-2xl rounded-full flex items-center justify-center border-4 border-white/50 shadow-2xl overflow-hidden">
                 <img
                  src={getDisplayUrl(schoolData.logoUrl)}
                  alt="CSC Logo"
                  className={`w-full h-full rounded-full ${schoolData.logoFit === 'cover' ? 'object-cover' : 'object-contain p-2'}`}
                 />
               </div>
            </div>
            <div className="text-center md:text-left flex-grow">
               <h1 className="text-3xl md:text-5xl font-black mb-3 tracking-tight uppercase leading-tight drop-shadow-lg text-white">{schoolData.schoolName}</h1>
               <p className="text-lg md:text-2xl font-bold opacity-90 mb-4 text-white uppercase tracking-tighter">{schoolData.motto}</p>
               <p className="text-sm md:text-lg font-bold opacity-80 text-white tracking-widest">{identityString}</p>
            </div>
            
            <div className="flex flex-col md:flex-row items-center gap-3">
              <button 
                onClick={toggleTheme}
                className="bg-white/20 backdrop-blur-xl border border-white/30 p-3 rounded-2xl shadow-xl hover:bg-white/40 transition-all text-xl"
                title="Toggle Day/Night Mode"
              >
                {schoolData.themeConfig.isDarkMode ? '☀️' : '🌙'}
              </button>
              {isAdmin && (
                <>
                  <Link to="/admin" className="bg-accent/30 backdrop-blur-xl text-white border border-white/20 px-5 py-2.5 rounded-xl font-black text-xs uppercase shadow-xl hover:bg-accent/50 hover:scale-105 transition-all text-center">Dashboard</Link>
                  <button onClick={handleLogout} className="bg-red-500/30 backdrop-blur-xl text-white border border-white/20 px-5 py-2.5 rounded-xl font-black text-xs uppercase shadow-xl hover:bg-red-500/50 hover:scale-105 transition-all">Logout</button>
                </>
              )}
            </div>
          </div>
        </header>

        <nav className="bg-slate-900/95 backdrop-blur-2xl sticky top-0 z-[100] border-y border-white/10">
          <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-center md:justify-start">
             <NavLink to="/">Home</NavLink>
             <NavLink to="/about">About</NavLink>
             <NavLink to="/administration">Administration</NavLink>
             <NavLink to="/teachers">Teachers</NavLink>
             <NavLink to="/academics">Academics</NavLink>
             <NavLink to="/co-curricular">Co-Curricular</NavLink>
             <NavLink to="/admission">Admission</NavLink>
             <NavLink to="/gallery">Gallery</NavLink>
             {!isAdmin && <NavLink to="/login">Login</NavLink>}
             <NavLink to="/corner" className="text-white bg-heading/40 backdrop-blur-md">নোটিশ বোর্ড</NavLink>
          </div>
        </nav>

        <div className="border-b border-white/10 overflow-hidden" style={tickerStyle}>
           <div className="max-w-7xl mx-auto flex items-stretch">
              <div className="bg-heading/95 backdrop-blur-xl text-red-600 px-5 py-3 font-black text-sm flex items-center shrink-0 uppercase tracking-widest">
                Latest News
              </div>
              <div className="flex-grow overflow-hidden flex items-center px-4">
                 <div className="animate-marquee whitespace-nowrap flex gap-10" style={marqueeStyle}>
                    <span className="font-bold">{schoolData.marqueeText}</span>
                    {schoolData.notices.map(n => (
                      <Link key={n.id} to="/corner" className="hover:underline font-black">{n.title}</Link>
                    ))}
                 </div>
              </div>
           </div>
        </div>

        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home schoolData={schoolData} />} />
            <Route path="/about" element={<GenericPage title="About Us" content={schoolData.aboutContent} pdfUrl={schoolData.aboutPdfUrl} />} />
            <Route path="/administration" element={<AdministrationPage schoolData={schoolData} />} />
            <Route path="/academics" element={<AcademicsPage schoolData={schoolData} />} />
            <Route path="/co-curricular" element={<GenericPage title="Co-Curricular" content={schoolData.coCurricularContent} pdfUrl={schoolData.coCurricularPdfUrl} />} />
            <Route path="/admission" element={
              <div className="max-w-5xl mx-auto py-16 px-4 space-y-12">
                <GenericPage title="Admission" content={schoolData.admissionInfo} pdfUrl={schoolData.admissionPdfUrl} />
                <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-2xl p-10 rounded-[40px] shadow-2xl border border-slate-200 dark:border-slate-800/50 text-center">
                   <h3 className="text-3xl font-black text-heading mb-6 uppercase tracking-tighter">Registration for Admission</h3>
                   <p className="text-slate-800 dark:text-slate-200 mb-8 font-bold">New academic session registration is officially open.</p>
                   <a href="https://forms.gle/NwJHeRphmkUqE6A16" target="_blank" rel="noopener noreferrer" className="inline-block bg-accent text-white px-12 py-5 rounded-2xl font-black text-lg hover:scale-105 transition-all shadow-xl">Apply Online Now</a>
                </div>
              </div>
            } />
            <Route path="/gallery" element={
              <div className="max-w-7xl mx-auto py-16 px-4">
                 <h1 className="text-4xl font-black text-heading mb-12 uppercase border-b-4 border-yellow-400 inline-block tracking-tighter">Institutional Gallery</h1>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                    {schoolData.gallery.map(item => (
                      <div key={item.id} className="group relative overflow-hidden rounded-[50px] shadow-2xl aspect-square border border-slate-200 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50">
                        <img src={getDisplayUrl(item.url)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={item.caption} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-10 opacity-0 group-hover:opacity-100 transition-all duration-500">
                           <p className="text-white font-black uppercase tracking-widest text-sm mb-6">{item.caption}</p>
                           <div className="flex gap-4">
                             <a href={getDisplayUrl(item.url)} target="_blank" rel="noreferrer" className="flex-grow bg-white text-slate-900 py-3 rounded-2xl font-black text-[10px] uppercase text-center hover:bg-sky-400 hover:text-white transition-colors">View Full</a>
                             <button onClick={() => handleDownload(getDisplayUrl(item.url), `csc-gallery-${item.id}.jpg`)} className="bg-accent text-white p-3 rounded-2xl shadow-xl hover:scale-110 transition-transform">
                               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                             </button>
                           </div>
                        </div>
                      </div>
                    ))}
                 </div>
              </div>
            } />
            <Route path="/corner" element={<StudentView schoolData={schoolData} />} />
            <Route path="/teachers" element={
               <div className="max-w-7xl mx-auto py-16 px-4">
                 <h1 className="text-4xl font-black mb-12 text-heading uppercase border-b-4 border-yellow-400 inline-block tracking-tighter">Our Faculty</h1>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                    {schoolData.faculty.map(f => (
                      <div key={f.id} className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-2xl p-8 rounded-[40px] shadow-xl text-center border border-slate-200 dark:border-slate-800/50 hover:-translate-y-2 transition-transform">
                        <img src={getDisplayUrl(f.image)} className="w-32 h-32 rounded-full mx-auto mb-6 object-cover border-4 border-white dark:border-slate-700 shadow-xl" />
                        <h3 className="font-black text-xl text-heading uppercase tracking-tight">{f.name}</h3>
                        <p className="text-slate-600 dark:text-slate-400 font-bold text-xs uppercase tracking-[0.2em] mt-2">{f.designation}</p>
                      </div>
                    ))}
                 </div>
               </div>
            } />
            <Route path="/login" element={isAdmin ? <Navigate to="/admin" /> : <Login setIsAdmin={setIsAdmin} schoolData={schoolData} />} />
            <Route path="/admin" element={isAdmin ? <AdminDashboard schoolData={schoolData} updateSchoolData={updateSchoolData} /> : <Navigate to="/login" />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        <footer className="bg-slate-900 text-footer-text py-16 mt-20 relative overflow-hidden">
          <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
          <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-16 relative z-10">
             <div className="space-y-6">
                <div className="flex items-center gap-4">
                   <img
                    src={getDisplayUrl(schoolData.logoUrl)}
                    className={`w-16 h-16 bg-white/30 backdrop-blur-xl rounded-full p-1 ${schoolData.logoFit === 'cover' ? 'object-cover' : 'object-contain'}`}
                   />
                   <h4 className="font-black text-2xl uppercase tracking-tighter text-white">{schoolData.schoolName}</h4>
                </div>
                <p className="opacity-70 font-medium">{schoolData.address}</p>
                <div className="space-y-1">
                  <p className="text-xs font-black uppercase tracking-widest text-accent">Office Contact</p>
                  <p className="font-bold opacity-80">{schoolData.phone}</p>
                  <p className="font-bold opacity-80">{schoolData.email}</p>
                </div>
             </div>
             <div>
                <h4 className="font-black text-xl mb-8 uppercase tracking-widest text-accent">Quick Navigation</h4>
                <ul className="space-y-4 font-bold opacity-80">
                   <li><Link to="/" className="hover:text-accent transition-colors">Home Landing</Link></li>
                   <li><Link to="/corner" className="hover:text-accent transition-colors">Official Notice Board</Link></li>
                   <li><Link to="/admission" className="hover:text-accent transition-colors">Admission Portal</Link></li>
                   <li><Link to="/teachers" className="hover:text-accent transition-colors">Faculty Directory</Link></li>
                </ul>
             </div>
             <div className="text-center md:text-right space-y-6">
                <h4 className="font-black text-xl mb-8 uppercase tracking-widest text-accent">Institutional Copyright</h4>
                <p className="text-sm opacity-50 font-bold tracking-tighter uppercase leading-relaxed">
                  {schoolData.schoolName}<br/>
                  All Rights Reserved &copy; {new Date().getFullYear()}
                </p>
                {!isAdmin && <Link to="/login" className="inline-block bg-white/10 px-6 py-2 rounded-lg text-xs font-black uppercase hover:bg-white/20">Authorized Login Only</Link>}
             </div>
          </div>
        </footer>
      </div>
    </HashRouter>
  );
};

export default App;
