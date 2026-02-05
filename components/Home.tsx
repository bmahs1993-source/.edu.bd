
import React, { useState, useEffect } from 'react';
import { SchoolData, Notice, NewsEvent } from '../types';
import { Link } from 'react-router-dom';
import { getDisplayUrl } from '../cloudStorage';

interface HomeProps {
  schoolData: SchoolData;
}

const SkeletonHomeBanner = () => (
  <div className="aspect-video w-full rounded-[35px] bg-slate-200 dark:bg-slate-800 animate-pulse relative overflow-hidden">
    <div className="absolute bottom-12 left-12 space-y-4">
      <div className="h-10 w-64 bg-slate-300 dark:bg-slate-700 rounded-xl"></div>
      <div className="h-6 w-48 bg-slate-300 dark:bg-slate-700 rounded-lg"></div>
    </div>
  </div>
);

const SkeletonEvent = () => (
  <div className="flex gap-8 animate-pulse">
    <div className="w-32 h-24 bg-slate-200 dark:bg-slate-800 rounded-3xl shrink-0"></div>
    <div className="space-y-3 flex-grow pt-2">
      <div className="h-6 w-full bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
      <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
    </div>
  </div>
);

const Home: React.FC<HomeProps> = ({ schoolData }) => {
  const [currentBanner, setCurrentBanner] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<{ title: string; date: string; content: string; attachmentUrl?: string; fileName?: string } | null>(null);
  
  const headMaster = schoolData.headTeacher;
  const assistantHeadMaster = schoolData.assistantHeadTeachers?.[0];
  const headMasterMsg = schoolData.sections.find(s => s.id === 'headMasterMsg')?.body;
  const assistantHeadMasterMsg = schoolData.sections.find(s => s.id === 'assistantHeadMasterMsg')?.body;

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (schoolData.banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % schoolData.banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [schoolData.banners.length]);

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

  const statsList = [
    { icon: '👥', label: 'Students', count: schoolData.stats.students, color: 'bg-blue-600/90' },
    { icon: '👨‍🏫', label: 'Teachers', count: schoolData.stats.teachers, color: 'bg-emerald-600/90' },
    { icon: '👤', label: 'Staffs', count: schoolData.stats.staff, color: 'bg-purple-600/90' },
    { icon: '🏢', label: 'Buildings', count: schoolData.stats.buildings, color: 'bg-orange-600/90' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-24">
      {/* Hero & Messages Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
           <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl p-3 rounded-[45px] shadow-2xl border border-white dark:border-slate-800/50">
              <div className="aspect-video w-full relative overflow-hidden rounded-[35px] group shadow-2xl bg-slate-100 dark:bg-slate-800">
                 {isLoading ? (
                   <SkeletonHomeBanner />
                 ) : schoolData.banners.length > 0 ? (
                   <>
                     {schoolData.banners.map((banner, idx) => (
                       <div
                         key={banner.id}
                         className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === currentBanner ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                       >
                         <img src={getDisplayUrl(banner.imageUrl)} className="w-full h-full object-cover" alt={banner.title} />
                         <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent p-12 text-white">
                            <h3 className="text-2xl md:text-5xl font-black uppercase tracking-tighter drop-shadow-2xl mb-2">{banner.title}</h3>
                            <p className="text-base md:text-xl font-bold text-accent drop-shadow-xl">{banner.subtitle}</p>
                         </div>
                       </div>
                     ))}
                     <div className="absolute bottom-8 right-10 z-20 flex gap-4">
                        {schoolData.banners.map((_, idx) => (
                          <button 
                            key={idx}
                            onClick={() => setCurrentBanner(idx)}
                            className={`w-3 h-3 rounded-full transition-all duration-500 ${idx === currentBanner ? 'bg-accent w-10 shadow-lg' : 'bg-white/40 hover:bg-white/80'}`}
                          />
                        ))}
                     </div>
                   </>
                 ) : (
                   <div className="w-full h-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-black uppercase text-slate-400">Institutional Banner</div>
                 )}
              </div>
           </div>
           <div className="mt-12">
             {isLoading ? (
               <div className="space-y-4 animate-pulse px-10">
                 <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                 <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                 <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
               </div>
             ) : (
               <p className="text-xl font-medium text-primary-text leading-relaxed italic border-l-8 border-accent pl-10 dark:text-slate-200">
                  {schoolData.aboutContent}
               </p>
             )}
           </div>
        </div>

        <aside className="lg:col-span-4 space-y-10">
          {[
            { label: 'Head Master Message', person: headMaster, msg: headMasterMsg },
            { label: 'Assistant Head Master Message', person: assistantHeadMaster, msg: assistantHeadMasterMsg }
          ].map((box, i) => (
            <div key={i} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white dark:border-slate-800/50 rounded-[45px] overflow-hidden shadow-2xl group transition-all hover:shadow-accent/10">
               <div className="bg-heading text-white px-8 py-5 font-black text-xs uppercase tracking-widest flex items-center gap-3">
                  <span className="bg-white/20 p-2 rounded-xl text-lg">✉️</span> {box.label}
               </div>
               <div className="p-10 space-y-8">
                  <div className="flex gap-8 items-center">
                    {isLoading ? (
                      <div className="w-24 h-24 rounded-[30px] bg-slate-200 dark:bg-slate-800 animate-pulse"></div>
                    ) : (
                      <img src={getDisplayUrl(box.person?.image) || 'https://via.placeholder.com/200'} className="w-24 h-24 object-cover rounded-[30px] border-4 border-white dark:border-slate-800 shadow-2xl group-hover:scale-105 transition-transform" alt={box.person?.name} />
                    )}
                    <div className="space-y-2 flex-grow">
                       {isLoading ? (
                         <>
                           <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse"></div>
                           <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse"></div>
                         </>
                       ) : (
                         <>
                           <h4 className="font-black text-heading text-xl leading-tight uppercase tracking-tighter">{box.person?.name}</h4>
                           <p className="text-[10px] text-secondary-text font-black uppercase tracking-[0.2em]">{box.person?.designation}</p>
                         </>
                       )}
                    </div>
                  </div>
                  {isLoading ? (
                    <div className="space-y-2 animate-pulse">
                      <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                      <div className="h-3 w-5/6 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                    </div>
                  ) : (
                    <p className="text-sm text-secondary-text font-bold line-clamp-4 leading-relaxed italic border-l-2 border-slate-100 dark:border-slate-800 pl-4">{box.msg}</p>
                  )}
                  <Link to="/about" className="block w-full text-center bg-heading/90 backdrop-blur-xl text-white py-4 rounded-3xl text-xs font-black uppercase tracking-widest hover:scale-[1.05] transition-all shadow-xl">Read Message</Link>
               </div>
            </div>
          ))}
        </aside>
      </div>

      {/* Stats & Boards Section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-12 border-t border-slate-200 dark:border-slate-800">
        <div className="md:col-span-3 space-y-5">
          {statsList.map((stat, i) => (
            <div key={i} className={`${stat.color} backdrop-blur-2xl text-white p-7 flex items-center gap-6 rounded-[35px] shadow-2xl hover:translate-x-3 transition-all cursor-default group border border-white/20`}>
              <span className="text-4xl group-hover:scale-125 transition-transform duration-500 drop-shadow-xl">{stat.icon}</span>
              <div className="font-black text-2xl tracking-tighter uppercase leading-none">{stat.count}<br/><span className="text-[10px] tracking-[0.3em] opacity-80 mt-1 block">{stat.label}</span></div>
            </div>
          ))}
        </div>

        <div className="md:col-span-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white dark:border-slate-800/50 rounded-[50px] overflow-hidden shadow-2xl h-full flex flex-col">
          <div className="bg-heading text-white px-10 py-5 font-black text-xs uppercase tracking-widest flex items-center gap-3">
            <span className="bg-white/20 p-2 rounded-xl text-lg">📅</span> Featured Events
          </div>
          <div className="p-10 space-y-10 flex-grow">
            {isLoading ? (
              [...Array(3)].map((_, i) => <SkeletonEvent key={i} />)
            ) : schoolData.newsEvents.slice(0, 3).map(event => (
              <div key={event.id} className="flex gap-8 border-b border-slate-100 dark:border-slate-800/50 pb-8 last:border-0 last:pb-0 group">
                {event.imageUrl && (
                  <img src={getDisplayUrl(event.imageUrl)} className="w-32 h-24 object-cover rounded-3xl border-4 border-white dark:border-slate-800 shadow-xl group-hover:scale-110 transition-transform duration-500" alt={event.title} />
                )}
                <div className="space-y-2 flex-grow">
                  <div className="flex justify-between items-start">
                    <h5 className="font-black text-heading text-lg leading-tight group-hover:text-accent transition-colors uppercase tracking-tight">{event.title}</h5>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2 text-red-500 text-[10px] font-black uppercase tracking-widest">
                      <span>📅</span> {event.date}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setSelectedItem({ title: event.title, date: event.date, content: event.content, attachmentUrl: event.attachmentUrl, fileName: event.fileName })}
                        className="px-4 py-1.5 bg-emerald-500 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:scale-105 transition-all shadow-md"
                      >
                        View
                      </button>
                      {event.attachmentUrl && (
                        <button 
                          onClick={() => handleDownload(event.attachmentUrl, event.fileName || 'event-attachment')}
                          className="px-4 py-1.5 bg-indigo-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:scale-105 transition-all shadow-md"
                        >
                          Download
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-10 pt-0 text-right mt-auto">
            <Link to="/corner" className="bg-heading/90 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-2xl">Browse All News</Link>
          </div>
        </div>

        <div className="md:col-span-4 space-y-8">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white dark:border-slate-800/50 rounded-[50px] overflow-hidden shadow-2xl flex flex-col">
            <div className="bg-heading text-white px-10 py-5 font-black text-xs uppercase tracking-widest flex items-center gap-3">
              <span className="bg-white/20 p-2 rounded-xl text-lg">📢</span> Notice Board
            </div>
            <div className="p-10 space-y-8 flex-grow">
              {isLoading ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-2 animate-pulse">
                    <div className="h-5 w-full bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                    <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                  </div>
                ))
              ) : schoolData.notices.slice(0, 4).map(notice => (
                <div key={notice.id} className="border-b border-slate-100 dark:border-slate-800/50 pb-6 last:border-0 group">
                  <div className="flex justify-between items-start mb-3">
                    <h5 className="font-black text-heading text-base leading-tight group-hover:text-accent transition-colors uppercase tracking-tighter">{notice.title}</h5>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-secondary-text text-[9px] font-black uppercase tracking-widest opacity-60">
                      <span className="text-red-500">📅</span> {notice.date}
                    </div>
                    <div className="flex gap-2">
                       <button 
                        onClick={() => setSelectedItem({ title: notice.title, date: notice.date, content: notice.content, attachmentUrl: notice.attachmentUrl, fileName: notice.fileName })}
                        className="px-4 py-1.5 bg-amber-500 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:scale-105 transition-all shadow-md"
                      >
                        View
                      </button>
                      {notice.attachmentUrl && (
                        <button 
                          onClick={() => handleDownload(notice.attachmentUrl, notice.fileName || 'notice-attachment')}
                          className="px-4 py-1.5 bg-indigo-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:scale-105 transition-all shadow-md"
                        >
                          Download
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-10 pt-0 text-right mt-auto">
              <Link to="/corner" className="bg-heading/90 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest inline-block shadow-2xl hover:scale-105 transition-all">Official Board</Link>
            </div>
          </div>
          
          <div className="bg-heading text-white rounded-[45px] overflow-hidden shadow-2xl group border border-white/10 p-1">
             <div className="h-40 bg-slate-900 rounded-[40px] relative overflow-hidden group">
                <img src="https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=400" className="w-full h-full object-cover opacity-30 group-hover:scale-125 transition-transform duration-[2s]" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                   <h6 className="font-black text-white uppercase tracking-tighter text-xl mb-1">ICT Cell</h6>
                   <p className="text-[10px] font-black text-accent uppercase tracking-widest">Innovation & Support</p>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Media & Location Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 pt-16 border-t border-slate-200 dark:border-slate-800">
         {/* National Anthem Section */}
         <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl p-10 md:p-14 rounded-[70px] border border-slate-200 dark:border-slate-800 shadow-2xl space-y-10">
            <div className="flex items-center gap-6">
               <div className="w-20 h-20 bg-red-600 rounded-[35px] flex items-center justify-center text-white text-4xl shadow-2xl">🎵</div>
               <div>
                  <h3 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">National Anthem</h3>
                  <p className="text-xs font-black text-red-500 uppercase tracking-widest mt-2">Amar Shonar Bangla 🇧🇩</p>
               </div>
            </div>
            <div className="aspect-video rounded-[45px] overflow-hidden shadow-2xl border-4 border-slate-100 dark:border-slate-800">
               <iframe 
                width="100%" 
                height="100%" 
                src={`https://www.youtube.com/embed/${schoolData.nationalAnthemYoutubeId}`} 
                title="National Anthem" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
               ></iframe>
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-bold italic text-center px-10">
               "Amar shonar Bangla, ami tomay bhalobashi..."
            </p>
         </div>

         {/* Contact & Map Section */}
         <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl p-10 md:p-14 rounded-[70px] border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col">
            <div className="flex items-center gap-6 mb-10">
               <div className="w-20 h-20 bg-sky-600 rounded-[35px] flex items-center justify-center text-white text-4xl shadow-2xl">📍</div>
               <div>
                  <h3 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Visit Us</h3>
                  <p className="text-xs font-black text-sky-600 uppercase tracking-widest mt-2">Institutional Campus</p>
               </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 mb-10 flex-grow">
               <div className="space-y-6">
                  <div className="flex gap-4">
                     <span className="text-2xl">🏠</span>
                     <div>
                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Campus Address</span>
                        <p className="font-black text-slate-800 dark:text-white text-lg leading-tight mt-1">{schoolData.locationText}</p>
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                     <div className="flex gap-4">
                        <span className="text-2xl">📞</span>
                        <div>
                           <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">General Office</span>
                           <p className="font-black text-slate-800 dark:text-white">{schoolData.phone}</p>
                        </div>
                     </div>
                     <div className="flex gap-4">
                        <span className="text-2xl">✉️</span>
                        <div>
                           <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Official Email</span>
                           <p className="font-black text-slate-800 dark:text-white truncate">{schoolData.email}</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
            <div className="aspect-video rounded-[45px] overflow-hidden shadow-2xl border-4 border-slate-100 dark:border-slate-800">
               <iframe 
                src={schoolData.locationMapUrl}
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen={true} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
               ></iframe>
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

export default Home;
