
import React, { useState, useEffect } from 'react';
import { SchoolData, Notice, Exam, Result, GalleryItem, NewsEvent } from '../types';
import { Link } from 'react-router-dom';
import { CLASS_LIST, SECTION_LIST } from '../constants';
import { getDisplayUrl } from '../cloudStorage';

interface StudentViewProps {
  schoolData: SchoolData;
}

const SkeletonCard = () => (
  <div className="bg-slate-100 dark:bg-slate-900/50 p-12 rounded-[60px] border border-slate-200 dark:border-slate-800 animate-pulse space-y-8">
    <div className="flex justify-between items-start">
      <div className="space-y-3">
        <div className="h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
      </div>
      <div className="h-12 w-12 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
    </div>
    <div className="h-24 bg-slate-200/50 dark:bg-slate-800/50 rounded-[35px]"></div>
    <div className="flex gap-4">
      <div className="h-12 flex-grow bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
      <div className="h-12 flex-grow bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
    </div>
  </div>
);

const SkeletonNotice = () => (
  <div className="bg-slate-100 dark:bg-slate-900/50 p-12 md:p-16 rounded-[70px] border border-slate-200 dark:border-slate-800 animate-pulse space-y-8">
    <div className="flex gap-4">
      <div className="h-6 w-24 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
      <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
    </div>
    <div className="h-10 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
    <div className="space-y-4">
      <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
      <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
      <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
    </div>
    <div className="flex gap-6">
      <div className="h-14 w-40 bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
      <div className="h-14 w-40 bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
    </div>
  </div>
);

const StudentView: React.FC<StudentViewProps> = ({ schoolData }) => {
  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedSection, setSelectedSection] = useState('All');
  const [searchRoll, setSearchRoll] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<{ title: string; date: string; content: string; attachmentUrl?: string; fileName?: string } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(timer);
  }, [selectedClass, selectedSection, searchRoll]);

  const handleDownload = (url?: string, name?: string) => {
    if (!url) return;
    const link = document.createElement('a');
    link.href = getDisplayUrl(url);
    link.download = name || 'csc-resource';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpen = (url?: string) => {
    if (!url) return;
    const displayUrl = getDisplayUrl(url);
    const win = window.open();
    if (win) {
      win.document.write(`<iframe src="${displayUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
    }
  };

  const filteredNotices = schoolData.notices.filter(n => 
    (selectedClass === 'All' || n.targetClass === selectedClass || n.targetClass === 'All') &&
    (selectedSection === 'All' || n.targetSection === selectedSection || n.targetSection === 'All')
  );

  const filteredExams = schoolData.exams.filter(e => 
    (selectedClass === 'All' || e.targetClass === selectedClass) &&
    (selectedSection === 'All' || e.targetSection === selectedSection)
  );

  const studentResults = schoolData.results.filter(r => 
    (selectedClass === 'All' || r.targetClass === selectedClass) &&
    (selectedSection === 'All' || r.targetSection === selectedSection) &&
    (searchRoll === '' || r.studentRoll.toLowerCase().includes(searchRoll.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-16 animate-in fade-in duration-500 overflow-x-hidden">
      {/* Digital Hub Header */}
      <div className="bg-heading/95 dark:bg-slate-900/95 backdrop-blur-3xl rounded-[60px] p-12 md:p-24 text-white shadow-2xl relative overflow-hidden border border-white/20 dark:border-slate-800">
        <div className="absolute top-0 right-0 p-12 opacity-5 hidden lg:block text-white">
           <svg className="w-[500px] h-[500px]" fill="currentColor" viewBox="0 0 20 20"><path d="M10.394 2.827a1 1 0 00-.788 0l-7 3a1 1 0 000 1.848l.394.169V11a1 1 0 00.553.894l4 2a1 1 0 00.894 0l4-2a1 1 0 00.553-.894V7.844l.394-.169a1 1 0 000-1.848l-7-3zM10 13.59L11.5 13.5l-4-2L6 11.5l4 2.09z" /></svg>
        </div>
        
        <div className="relative z-10 max-w-4xl">
          <h1 className="text-5xl md:text-9xl font-black mb-8 uppercase tracking-tighter text-white drop-shadow-2xl">Digital Hub 🏫</h1>
          <p className="text-accent font-black text-xl mb-16 uppercase tracking-[0.3em] opacity-90 drop-shadow-lg">Bagpur Masum Ali Pramanik High School</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-black/20 dark:bg-white/5 backdrop-blur-3xl p-10 rounded-[50px] border border-white/20 shadow-2xl">
             <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-white px-4 opacity-70">Class Level</label>
                <select value={selectedClass} onChange={(e) => { setSelectedClass(e.target.value); setIsLoading(true); }} className="w-full bg-white/10 dark:bg-slate-900/30 backdrop-blur-2xl text-white p-6 rounded-3xl font-black outline-none border border-white/20 shadow-xl focus:bg-white/20 transition-all appearance-none cursor-pointer">
                  {CLASS_LIST.map(c => <option key={c} value={c} className="text-slate-900">{c}</option>)}
                </select>
             </div>
             <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-white px-4 opacity-70">Shift/Section</label>
                <select value={selectedSection} onChange={(e) => { setSelectedSection(e.target.value); setIsLoading(true); }} className="w-full bg-white/10 dark:bg-slate-900/30 backdrop-blur-2xl text-white p-6 rounded-3xl font-black outline-none border border-white/20 shadow-xl focus:bg-white/20 transition-all appearance-none cursor-pointer">
                  {SECTION_LIST.map(s => <option key={s} value={s} className="text-slate-900">{s}</option>)}
                </select>
             </div>
             <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-white px-4 opacity-70">ID Verification</label>
                <input 
                  type="text" 
                  placeholder="Student Roll/ID..." 
                  className="w-full bg-white/10 dark:bg-slate-900/30 backdrop-blur-2xl text-white p-6 rounded-3xl font-black outline-none border border-white/20 shadow-xl placeholder:text-white/40 focus:bg-white/20 transition-all"
                  value={searchRoll}
                  onChange={(e) => { setSearchRoll(e.target.value); setIsLoading(true); }}
                />
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        <div className="lg:col-span-8 space-y-20">
          {/* News & Featured Events */}
          <section id="events" className="space-y-12">
            <h2 className="text-5xl font-black text-heading px-6 flex items-center gap-6 uppercase tracking-tighter">
              <span className="w-20 h-20 bg-emerald-500 rounded-[35px] flex items-center justify-center text-white text-4xl shadow-2xl">🗞️</span>
              Events & Highlights
            </h2>
            <div className="space-y-10">
               {isLoading ? (
                 [...Array(2)].map((_, i) => <SkeletonNotice key={i} />)
               ) : filteredNotices.length > 0 ? schoolData.newsEvents.map(event => (
                 <div key={event.id} className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl p-12 md:p-16 rounded-[70px] border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col md:flex-row gap-12 group transition-all hover:translate-y-[-10px]">
                    {event.imageUrl && (
                      <div className="w-full md:w-64 h-48 shrink-0 rounded-[40px] overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl">
                        <img src={event.imageUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                      </div>
                    )}
                    <div className="flex-grow space-y-4">
                       <div className="flex items-center gap-3">
                         <span className="text-[11px] font-black text-emerald-500 uppercase tracking-widest">{event.date}</span>
                       </div>
                       <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">{event.title}</h3>
                       <p className="text-slate-600 dark:text-slate-400 font-bold leading-relaxed line-clamp-3 italic">{event.content}</p>
                       <div className="pt-6 flex flex-wrap gap-4">
                          <button 
                            onClick={() => setSelectedItem({ title: event.title, date: event.date, content: event.content, attachmentUrl: event.attachmentUrl, fileName: event.fileName })}
                            className="px-8 py-3 bg-emerald-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2 shadow-lg"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            View Details
                          </button>
                          {event.attachmentUrl && (
                            <button 
                              onClick={() => handleDownload(event.attachmentUrl, event.fileName || 'event-resource')} 
                              className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2 shadow-xl border-b-4 border-indigo-800"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                              Download
                            </button>
                          )}
                       </div>
                    </div>
                 </div>
               )) : (
                 <p className="text-center py-10 opacity-40 font-black uppercase tracking-widest">No featured events to show.</p>
               )}
            </div>
          </section>

          {/* Results Section */}
          <section id="results" className="space-y-12">
            <h2 className="text-5xl font-black text-heading px-6 flex items-center gap-6 uppercase tracking-tighter">
              <span className="w-20 h-20 bg-accent rounded-[35px] flex items-center justify-center text-white text-4xl shadow-2xl">🏆</span>
              Exam Results
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               {isLoading ? (
                 [...Array(2)].map((_, i) => <SkeletonCard key={i} />)
               ) : studentResults.length > 0 ? studentResults.map(res => (
                 <div key={res.id} className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl p-12 rounded-[60px] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col h-full hover:scale-105 transition-all group overflow-hidden">
                    <div className="flex-grow">
                       <div className="flex justify-between items-start mb-10">
                          <div className="space-y-3">
                            <span className="text-[11px] font-black text-accent uppercase tracking-[0.2em] bg-accent/10 px-5 py-2 rounded-full border border-accent/20">{res.targetClass}</span>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white leading-none uppercase tracking-tighter">{res.studentName}</h3>
                          </div>
                          <div className="text-right">
                            <span className="block text-6xl font-black text-accent leading-none drop-shadow-xl">{res.gpa}</span>
                            <span className="text-[10px] font-black text-secondary-text uppercase tracking-widest opacity-60">SCORE</span>
                          </div>
                       </div>
                       <div className="bg-slate-100 dark:bg-slate-950 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 mb-12 shadow-inner">
                          <div className="flex justify-between items-center text-sm font-bold">
                             <span className="text-secondary-text uppercase tracking-widest text-[10px] font-black opacity-50">Roll ID:</span>
                             <span className="text-slate-900 dark:text-white font-black text-lg">{res.studentRoll}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm font-bold mt-4">
                             <span className="text-secondary-text uppercase tracking-widest text-[10px] font-black opacity-50">Published:</span>
                             <span className="text-slate-900 dark:text-white font-black">{res.date}</span>
                          </div>
                       </div>
                    </div>
                    
                    {res.attachmentUrl ? (
                      <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => handleOpen(res.attachmentUrl)} className="py-5 bg-heading text-white rounded-[25px] font-black text-[11px] uppercase tracking-widest shadow-2xl hover:bg-slate-800 transition-all">
                          Preview
                        </button>
                        <button onClick={() => handleDownload(res.attachmentUrl, res.fileName)} className="py-5 bg-indigo-600 text-white rounded-[25px] font-black text-[11px] uppercase tracking-widest hover:bg-indigo-700 transition-all border border-indigo-700">
                          Download
                        </button>
                      </div>
                    ) : (
                      <div className="text-center p-6 bg-slate-50 dark:bg-slate-950 rounded-[35px] border-2 border-dashed border-slate-200 dark:border-slate-800">
                        <p className="text-[10px] font-black text-secondary-text uppercase tracking-widest opacity-40">Sheet Unavailable</p>
                      </div>
                    )}
                 </div>
               )) : (
                 <div className="col-span-full py-32 text-center bg-white/40 dark:bg-slate-900/20 backdrop-blur-3xl rounded-[70px] border-4 border-dashed border-white/20">
                    <div className="text-8xl mb-8 opacity-40">📊</div>
                    <p className="text-secondary-text font-black text-2xl uppercase tracking-tighter opacity-70">No matching student records found.</p>
                 </div>
               )}
            </div>
          </section>

          {/* Notice Board */}
          <section id="notices" className="space-y-12">
            <h2 className="text-5xl font-black text-heading px-6 flex items-center gap-6 uppercase tracking-tighter">
              <span className="w-20 h-20 bg-amber-400 rounded-[35px] flex items-center justify-center text-white text-4xl shadow-2xl">📢</span>
              Notice Board
            </h2>
            <div className="space-y-10">
               {isLoading ? (
                 [...Array(2)].map((_, i) => <SkeletonNotice key={i} />)
               ) : filteredNotices.length > 0 ? filteredNotices.map(notice => (
                 <div key={notice.id} className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl p-12 md:p-16 rounded-[70px] border border-slate-200 dark:border-slate-800 shadow-2xl group transition-all hover:translate-y-[-10px]">
                    <div className="flex-grow">
                       <div className="flex items-center gap-5 mb-8">
                          {notice.important && <span className="px-6 py-2 bg-red-600 text-white text-[10px] font-black rounded-full uppercase tracking-[0.2em] animate-pulse shadow-xl">Urgent Action Required</span>}
                          <span className="text-[11px] font-black text-secondary-text uppercase tracking-[0.2em] opacity-60">{notice.date}</span>
                       </div>
                       <h3 className="text-4xl font-black text-slate-900 dark:text-white mb-8 uppercase tracking-tighter leading-none">{notice.title}</h3>
                       <p className="text-slate-800 dark:text-slate-200 text-xl leading-relaxed mb-12 font-medium italic border-l-8 border-accent pl-8 line-clamp-4">{notice.content}</p>
                       <div className="flex flex-wrap gap-6 pt-4">
                          <button 
                            onClick={() => setSelectedItem({ title: notice.title, date: notice.date, content: notice.content, attachmentUrl: notice.attachmentUrl, fileName: notice.fileName })} 
                            className="px-10 py-4 bg-amber-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            View Notice
                          </button>
                          {notice.attachmentUrl && (
                            <button 
                              onClick={() => handleDownload(notice.attachmentUrl, notice.fileName || 'notice-attachment')} 
                              className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl flex items-center gap-2 border-b-4 border-indigo-800"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                              Download
                            </button>
                          )}
                       </div>
                    </div>
                 </div>
               )) : (
                 <p className="text-secondary-text text-center py-20 font-black uppercase tracking-[0.4em] bg-white/30 dark:bg-slate-800/20 backdrop-blur-2xl rounded-[60px] border-2 border-dashed border-white/10 opacity-60">Board is currently empty.</p>
               )}
            </div>
          </section>
        </div>

        {/* Sidebar Content */}
        <div className="lg:col-span-4 space-y-12">
           <section className="bg-heading dark:bg-slate-800 text-white p-12 rounded-[70px] shadow-2xl border border-white/20 space-y-12 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-bl-[70px]"></div>
              <div className="space-y-4 relative z-10">
                <h3 className="text-4xl font-black uppercase tracking-tighter text-white">Exam Routines 📝</h3>
                <p className="text-[11px] text-accent font-black leading-relaxed uppercase tracking-[0.3em] opacity-80">Portal for {selectedClass}</p>
              </div>
              
              <div className="space-y-8 relative z-10">
                 {isLoading ? (
                   [...Array(2)].map((_, i) => (
                     <div key={i} className="bg-white/10 p-10 rounded-[50px] border border-white/10 animate-pulse space-y-4">
                        <div className="flex justify-between">
                           <div className="h-6 w-32 bg-white/20 rounded-lg"></div>
                           <div className="h-6 w-16 bg-white/20 rounded-full"></div>
                        </div>
                        <div className="h-4 w-24 bg-white/20 rounded-lg"></div>
                     </div>
                   ))
                 ) : filteredExams.length > 0 ? filteredExams.map(exam => (
                   <div key={exam.id} className="bg-white/10 backdrop-blur-3xl p-10 rounded-[50px] border border-white/10 hover:bg-white/20 transition-all group shadow-2xl">
                      <div className="flex justify-between items-start mb-6">
                         <h4 className="font-black text-2xl uppercase leading-none text-white tracking-tighter">{exam.title}</h4>
                         <span className="text-[10px] font-black bg-accent px-4 py-2 rounded-full text-white uppercase tracking-widest">{exam.date}</span>
                      </div>
                      <p className="text-xs font-black text-sky-200 mb-10 uppercase tracking-[0.3em]">{exam.subject || 'Full Syllabus'}</p>
                      {exam.attachmentUrl && (
                        <div className="grid grid-cols-2 gap-4">
                          <button onClick={() => handleOpen(exam.attachmentUrl)} className="py-4 bg-white/20 text-white rounded-[20px] font-black text-[9px] uppercase tracking-widest hover:bg-white/40 transition-all">View</button>
                          <button onClick={() => handleDownload(exam.attachmentUrl, exam.fileName)} className="py-4 bg-white text-heading rounded-[20px] font-black text-[9px] uppercase tracking-widest shadow-2xl hover:translate-y-[-5px] transition-all">Download</button>
                        </div>
                      )}
                   </div>
                 )) : (
                   <div className="text-center py-24 px-10 bg-white/5 rounded-[50px] border border-white/5 backdrop-blur-3xl">
                      <p className="text-[11px] text-white/40 font-black uppercase tracking-[0.5em]">No Pending Exams</p>
                   </div>
                 )}
              </div>
           </section>

           <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl p-14 rounded-[70px] shadow-2xl text-center space-y-10 border border-slate-200 dark:border-slate-800">
              <div className="w-28 h-28 bg-accent/20 rounded-[45px] flex items-center justify-center text-accent mx-auto border border-accent/30 shadow-2xl">
                <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              </div>
              <div className="space-y-4">
                <h4 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Smart Library</h4>
                <p className="text-secondary-text text-xs font-black leading-relaxed uppercase tracking-[0.3em] opacity-60">Digital Resource Portal</p>
              </div>
              <button className="w-full py-6 bg-heading text-white rounded-[35px] font-black text-[12px] uppercase tracking-[0.4em] shadow-2xl opacity-50 cursor-not-allowed">Offline Maintenance</button>
           </div>
        </div>
      </div>

      {/* Details Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[60px] p-10 md:p-16 shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-in zoom-in duration-300">
              <button onClick={() => setSelectedItem(null)} className="absolute top-8 right-8 w-12 h-12 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 transition-all font-black">✕</button>
              <div className="space-y-8">
                 <div className="space-y-2">
                    <span className="text-[11px] font-black text-emerald-500 uppercase tracking-widest">{selectedItem.date}</span>
                    <h3 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">{selectedItem.title}</h3>
                 </div>
                 <div className="p-8 bg-slate-50 dark:bg-slate-950 rounded-[40px] border border-slate-100 dark:border-slate-800">
                    <p className="text-xl font-medium text-slate-700 dark:text-slate-300 leading-relaxed italic border-l-4 border-accent pl-6">{selectedItem.content}</p>
                 </div>
                 <div className="flex flex-wrap gap-4 pt-4">
                    {selectedItem.attachmentUrl && (
                      <>
                        <button onClick={() => handleOpen(selectedItem.attachmentUrl)} className="flex-grow py-5 bg-accent text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-[1.02] transition-all">View File Preview</button>
                        <button onClick={() => handleDownload(selectedItem.attachmentUrl, selectedItem.fileName)} className="flex-grow py-5 bg-indigo-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-[1.02] transition-all">Download Attachment</button>
                      </>
                    )}
                    <button onClick={() => setSelectedItem(null)} className="w-full py-4 bg-slate-800 text-white rounded-3xl font-black text-xs uppercase tracking-widest opacity-50 hover:opacity-100 transition-all">Close Details</button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default StudentView;
