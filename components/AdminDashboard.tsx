
import React, { useState, useEffect } from 'react';
import { SchoolData, Notice, Faculty, Banner, GalleryItem, SectionContent, Exam, Result, AdmissionApplication, NewsEvent, TickerConfig, AcademicFile, ClassTeacherAssignment, ThemeConfig, SchoolStats } from '../types';
import { CLASS_LIST, SECTION_LIST } from '../constants';
import { uploadToCloud, getDisplayUrl, saveDataToCloud, deleteFromCloud } from '../cloudStorage';

interface AdminDashboardProps {
  schoolData: SchoolData;
  updateSchoolData: (newData: Partial<SchoolData>) => void;
}

interface PendingDelete {
  id?: string;
  category: keyof SchoolData;
  label: string;
  isSingleField?: boolean;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ schoolData, updateSchoolData }) => {
  const [localData, setLocalData] = useState<SchoolData>(schoolData);
  const [activeTab, setActiveTab] = useState<'home' | 'about' | 'administration' | 'teachers' | 'academics' | 'co-curricular' | 'admission' | 'gallery' | 'corner' | 'settings'>('home');
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [isEditMode, setIsEditMode] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Use a ref to track if we're the ones who triggered the schoolData update
  const isLocalUpdateRef = React.useRef(false);

  useEffect(() => {
    // Only sync from parent if this wasn't triggered by our own save
    if (!isLocalUpdateRef.current) {
      setLocalData(schoolData);
    }
    isLocalUpdateRef.current = false;
  }, [schoolData]);

  useEffect(() => {
    if (saveStatus === 'success' || saveStatus === 'error') {
      const timer = setTimeout(() => setSaveStatus('idle'), 4000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  // Cloud Save Helper
  const pushToCloud = async (data: SchoolData) => {
    if (!data.cloudScriptUrl) return true;
    try {
      // mode: 'no-cors' allows sending data to Google Script without CORS errors.
      await fetch(data.cloudScriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });
      return true;
    } catch (err) {
      console.error("Cloud push failed:", err);
      return false;
    }
  };

  const handleSave = async () => {
    setSaveStatus('saving');

    // 1. Save locally for the current browser
    // Mark that we're the source of this update to prevent useEffect from resetting localData
    isLocalUpdateRef.current = true;
    updateSchoolData(localData);

    // 2. Save to Netlify Blobs cloud storage (primary)
    const cloudSuccess = await saveDataToCloud(localData);

    // 3. Also broadcast to Google Drive for legacy users (if configured)
    if (localData.cloudScriptUrl) {
      await pushToCloud(localData);
    }

    if (cloudSuccess) {
      setSaveStatus('success');
    } else {
      setSaveStatus('error');
    }
  };

  const updateLocalField = (field: keyof SchoolData, value: any) => {
    setLocalData(prev => ({ ...prev, [field]: value }));
  };

  const updateStats = (field: keyof SchoolStats, value: string) => {
    setLocalData(prev => ({
      ...prev,
      stats: { ...prev.stats, [field]: value }
    }));
  };

  const updateTickerConfig = (field: keyof TickerConfig, value: any) => {
    setLocalData(prev => ({
      ...prev,
      tickerConfig: { ...prev.tickerConfig, [field]: value }
    }));
  };

  const updateThemeConfig = (field: keyof ThemeConfig, value: any) => {
    setLocalData(prev => ({
      ...prev,
      themeConfig: { ...prev.themeConfig, [field]: value }
    }));
  };

  const initiateDelete = (id: string | undefined, category: keyof SchoolData, label: string, isSingleField: boolean = false) => {
    if (!isEditMode) return;
    setPendingDelete({ id, category, label, isSingleField });
  };

  const executeDelete = () => {
    if (!pendingDelete) return;
    const { id, category, isSingleField } = pendingDelete;
    
    if (isSingleField) {
      updateLocalField(category, undefined);
    } else {
      const list = localData[category] as any[];
      if (Array.isArray(list)) {
        updateLocalField(category, list.filter(item => item.id !== id));
      }
    }
    setPendingDelete(null);
  };

  const addItem = (key: keyof SchoolData, newItem: any) => {
    if (!isEditMode) return;
    const list = (localData[key] as any[]) || [];
    updateLocalField(key, [{ ...newItem, id: Date.now().toString() }, ...list]);
  };

  const updateItem = (key: keyof SchoolData, id: string, updatedFields: any) => {
    if (!isEditMode) return;
    const list = localData[key] as any[];
    updateLocalField(key, list.map(item => item.id === id ? { ...item, ...updatedFields } : item));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string, fileName: string) => void, category: string = 'general') => {
    if (!isEditMode) return;
    const file = e.target.files?.[0];
    if (!file) return;

    // File size warning (prevent cloud sync issues with extremely large files)
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert("Warning: This file is large (" + (file.size / 1024 / 1024).toFixed(1) + "MB). Large files may take longer to upload.");
    }

    setUploading(true);

    try {
      // Upload to Netlify Blobs cloud storage
      const result = await uploadToCloud(file, category);

      if (result.success && result.key) {
        callback(result.key, file.name);
      } else {
        // Fallback to base64 if cloud upload fails
        console.warn('Cloud upload failed, falling back to base64:', result.error);
        const reader = new FileReader();
        reader.onloadend = () => {
          callback(reader.result as string, file.name);
          setUploading(false);
        };
        reader.readAsDataURL(file);
        return;
      }
    } catch (error) {
      console.error('Upload error:', error);
      // Fallback to base64 encoding
      const reader = new FileReader();
      reader.onloadend = () => {
        callback(reader.result as string, file.name);
        setUploading(false);
      };
      reader.readAsDataURL(file);
      return;
    }

    setUploading(false);
  };

  const handleMultipleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isEditMode) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    const newItems: GalleryItem[] = [];

    for (const file of Array.from(files)) {
      try {
        // Upload to Netlify Blobs cloud storage
        const result = await uploadToCloud(file, 'gallery');

        if (result.success && result.key) {
          newItems.push({
            id: Math.random().toString(36).substr(2, 9),
            url: result.key,
            type: file.type.startsWith('video') ? 'video' : 'image',
            caption: ''
          });
        } else {
          // Fallback to base64 for this file
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
          newItems.push({
            id: Math.random().toString(36).substr(2, 9),
            url: dataUrl,
            type: file.type.startsWith('video') ? 'video' : 'image',
            caption: ''
          });
        }
      } catch (error) {
        console.error('Gallery upload error:', error);
        // Fallback to base64 for this file
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        newItems.push({
          id: Math.random().toString(36).substr(2, 9),
          url: dataUrl,
          type: file.type.startsWith('video') ? 'video' : 'image',
          caption: ''
        });
      }
    }

    updateLocalField('gallery', [...localData.gallery, ...newItems]);
    setUploading(false);
  };

  const updateSectionText = (id: string, body: string) => {
    const newSections = localData.sections.map(s => s.id === id ? { ...s, body } : s);
    updateLocalField('sections', newSections);
  };

  // Data Portability Logic
  const handleExportData = () => {
    const dataStr = JSON.stringify(localData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `school_backup_${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const importedData = JSON.parse(evt.target?.result as string);
        if (importedData.schoolName && importedData.adminUsername) {
          setLocalData(importedData);
          alert('Success! Configuration imported. Click "Save Changes" to sync to all devices.');
        } else {
          alert('Error: Invalid backup file.');
        }
      } catch (err) {
        alert('Error: Failed to read file.');
      }
    };
    reader.readAsText(file);
  };

  const tabs = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'about', label: 'About', icon: 'ℹ️' },
    { id: 'administration', label: 'Administration', icon: '🏢' },
    { id: 'teachers', label: 'Teachers', icon: '👨‍🏫' },
    { id: 'academics', label: 'Academics', icon: '🎓' },
    { id: 'co-curricular', label: 'Co-Curricular', icon: '⚽' },
    { id: 'admission', label: 'Admission', icon: '📩' },
    { id: 'gallery', label: 'Gallery', icon: '📸' },
    { id: 'corner', label: 'Notice Board', icon: '📰' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  const PageEditor = ({ title, contentField, pdfField }: { title: string, contentField: keyof SchoolData, pdfField: keyof SchoolData }) => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className={`p-10 rounded-[50px] border transition-all ${isEditMode ? 'bg-white border-sky-400/50 shadow-2xl' : 'bg-white/70 dark:bg-slate-900/70 border-slate-200 dark:border-slate-800/50 backdrop-blur-md'}`}>
        <h4 className="font-black text-2xl text-slate-900 dark:text-sky-400 uppercase tracking-tighter mb-8">{title} Content Editor</h4>
        {isEditMode ? (
          <textarea
            value={(localData as any)[contentField] || ''}
            onChange={(e) => updateLocalField(contentField, e.target.value)}
            className="w-full p-10 bg-slate-100 dark:bg-slate-950 rounded-[40px] border border-slate-200 dark:border-slate-800 outline-none font-bold text-slate-800 dark:text-slate-200 h-96 text-lg shadow-inner focus:ring-4 focus:ring-sky-100 transition-all"
            placeholder={`Tell the world about ${title}...`}
          />
        ) : (
          <div className="p-10 bg-white/30 dark:bg-slate-800/30 backdrop-blur-md rounded-[40px] border border-slate-100 dark:border-slate-700/20 font-bold text-slate-900 dark:text-slate-200 min-h-96 overflow-y-auto whitespace-pre-wrap leading-relaxed italic">
            {(localData as any)[contentField]}
          </div>
        )}
      </div>
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-10 rounded-[50px] border border-slate-200 dark:border-slate-800 shadow-xl">
        <h4 className="font-black text-xl text-slate-900 dark:text-sky-400 uppercase tracking-tighter mb-6">Document Attachment</h4>
        <div className="flex flex-col md:flex-row items-center gap-8">
           {isEditMode && (
             <div className="flex-grow w-full">
                <input type="file" accept="application/pdf" onChange={(e) => handleFileUpload(e, (url, name) => updateLocalField(pdfField, url), 'pdfs')} className="w-full p-5 bg-white dark:bg-slate-950 rounded-3xl border-2 border-dashed border-sky-400 dark:border-sky-800 font-black cursor-pointer shadow-inner" title="Select PDF" />
             </div>
           )}
           {(localData as any)[pdfField] && (
             <div className="flex gap-4 w-full md:w-auto">
                <a href={getDisplayUrl((localData as any)[pdfField])} target="_blank" rel="noreferrer" className="bg-slate-800 text-white px-10 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl whitespace-nowrap hover:scale-105 transition-all">View PDF</a>
                {isEditMode && <button onClick={() => initiateDelete(undefined, pdfField, `PDF attachment for ${title}`, true)} className="bg-red-500 text-white px-6 py-5 rounded-2xl font-black text-lg shadow-xl hover:bg-red-600 transition-all">🗑️</button>}
             </div>
           )}
        </div>
      </div>
    </div>
  );

  const PersonnelCard = ({ person, category, onUpdate, onDelete }: { person: Faculty, category: keyof SchoolData, onUpdate: (fields: Partial<Faculty>) => void, onDelete: () => void }) => (
    <div className="bg-white dark:bg-slate-950 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col items-center group relative overflow-hidden">
      <div className="w-32 h-32 rounded-full overflow-hidden mb-6 border-4 border-sky-100 dark:border-sky-900/30 relative">
        <img src={getDisplayUrl(person.image) || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" />
        {isEditMode && (
          <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
            <span className="text-white text-xs font-black uppercase">Change</span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, (url) => onUpdate({ image: url }), 'faculty')} />
          </label>
        )}
      </div>
      {isEditMode ? (
        <div className="w-full space-y-3">
          <input
            value={person.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            className="w-full p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 font-black text-xs text-center"
            placeholder="Name"
          />
          <input
            value={person.designation}
            onChange={(e) => onUpdate({ designation: e.target.value })}
            className="w-full p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-[10px] text-center"
            placeholder="Designation"
          />
        </div>
      ) : (
        <div className="text-center">
          <h5 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter">{person.name}</h5>
          <p className="text-[10px] font-bold text-sky-500 uppercase tracking-widest mt-1">{person.designation}</p>
        </div>
      )}
      {isEditMode && (
        <button onClick={onDelete} className="mt-6 text-red-500 hover:text-red-700 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      )}
    </div>
  );

  const PersonnelManager = ({ title, category }: { title: string, category: keyof SchoolData }) => {
    const list = (localData[category] as Faculty[]) || [];
    return (
      <div className="space-y-10 p-10 bg-slate-50 dark:bg-slate-900/20 rounded-[60px] border border-slate-200 dark:border-slate-800 shadow-inner">
        <div className="flex justify-between items-center">
          <h4 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{title}</h4>
          {isEditMode && (
            <button 
              onClick={() => addItem(category, { name: 'New Member', designation: 'Designation', image: '' })}
              className="px-6 py-3 bg-sky-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-sky-600 transition-all shadow-xl"
            >
              + Add Member
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {list.map(person => (
            <PersonnelCard 
              key={person.id} 
              person={person} 
              category={category} 
              onUpdate={(fields) => updateItem(category, person.id, fields)}
              onDelete={() => initiateDelete(person.id, category, person.name)}
            />
          ))}
          {list.length === 0 && (
            <div className="col-span-full py-20 text-center border-4 border-dashed border-slate-200 dark:border-slate-800 rounded-[40px]">
              <p className="text-slate-400 font-black uppercase text-xs tracking-widest">No personnel added to this section.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const AcademicFileManager = ({ title, category }: { title: string, category: 'syllabuses' | 'classRoutines' }) => {
    const list = localData[category] || [];
    return (
      <div className="space-y-10 p-10 bg-slate-50 dark:bg-slate-950/30 rounded-[60px] border border-slate-200 dark:border-slate-800 shadow-inner">
        <div className="flex justify-between items-center">
          <h4 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{title}</h4>
          {isEditMode && (
            <button 
              onClick={() => addItem(category, { title: `New ${title}`, targetClass: 'All', url: '' })}
              className="px-6 py-3 bg-sky-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-sky-600 transition-all shadow-xl"
            >
              + Add {title}
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {list.map(file => (
            <div key={file.id} className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-xl space-y-5">
              {isEditMode ? (
                <>
                  <input 
                    value={file.title} 
                    onChange={(e) => updateItem(category, file.id, { title: e.target.value })}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-700 font-black text-sm"
                    placeholder="File Title (e.g. Annual Syllabus)"
                  />
                  <select 
                    value={file.targetClass}
                    onChange={(e) => updateItem(category, file.id, { targetClass: e.target.value })}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold text-xs"
                  >
                    {CLASS_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-400 px-2">File Upload</label>
                    <div className="flex gap-4">
                      <input 
                        type="file" 
                        accept="application/pdf,image/*" 
                        onChange={(e) => handleFileUpload(e, (url, name) => updateItem(category, file.id, { url, fileName: name }))}
                        className="hidden" 
                        id={`file-up-${category}-${file.id}`}
                      />
                      <label 
                        htmlFor={`file-up-${category}-${file.id}`}
                        className="flex-grow p-4 bg-sky-50 dark:bg-sky-900/20 border-2 border-dashed border-sky-300 dark:border-sky-800 rounded-2xl text-center cursor-pointer font-black text-[10px] uppercase hover:bg-sky-100 transition-all"
                      >
                        {file.url ? 'Change File' : 'Select File'}
                      </label>
                      {file.url && <button onClick={() => updateItem(category, file.id, { url: '', fileName: '' })} className="bg-red-100 text-red-500 px-4 rounded-2xl">🗑️</button>}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-[9px] font-black bg-sky-100 dark:bg-sky-900/50 text-sky-600 px-3 py-1 rounded-full uppercase tracking-widest">{file.targetClass}</span>
                  <h5 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">{file.title}</h5>
                  {file.url && <p className="text-[10px] text-slate-400 italic">📎 {file.fileName || 'Attached resource'}</p>}
                </>
              )}
              <div className="flex gap-4 pt-4">
                {file.url && <a href={file.url} target="_blank" rel="noreferrer" className="flex-grow py-3 bg-slate-800 text-white rounded-2xl text-center font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all">Preview</a>}
                {isEditMode && <button onClick={() => initiateDelete(file.id, category, file.title)} className="bg-red-500 text-white px-5 rounded-2xl shadow-xl">🗑️</button>}
              </div>
            </div>
          ))}
          {list.length === 0 && (
            <div className="col-span-full py-16 text-center border-4 border-dashed border-slate-200 dark:border-slate-800 rounded-[40px]">
              <p className="text-slate-400 font-black uppercase text-xs tracking-widest">No files uploaded yet.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const ClassTeacherManager = () => {
    const list = localData.classTeachers || [];
    return (
      <div className="space-y-10 p-10 bg-slate-50 dark:bg-slate-950/30 rounded-[60px] border border-slate-200 dark:border-slate-800 shadow-inner">
        <div className="flex justify-between items-center">
          <h4 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Class Teacher Assignments</h4>
          {isEditMode && (
            <button 
              onClick={() => addItem('classTeachers', { targetClass: 'Class 6', section: 'Morning', teacherName: 'Teacher Name' })}
              className="px-6 py-3 bg-purple-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-purple-600 transition-all shadow-xl"
            >
              + Assign Teacher
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {list.map(item => (
            <div key={item.id} className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
              {isEditMode ? (
                <>
                  <select 
                    value={item.targetClass}
                    onChange={(e) => updateItem('classTeachers', item.id, { targetClass: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs"
                  >
                    {CLASS_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select 
                    value={item.section}
                    onChange={(e) => updateItem('classTeachers', item.id, { section: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs"
                  >
                    {SECTION_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <input 
                    value={item.teacherName} 
                    onChange={(e) => updateItem('classTeachers', item.id, { teacherName: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-700 font-black text-sm"
                    placeholder="Teacher Name"
                  />
                  <button onClick={() => initiateDelete(item.id, 'classTeachers', `${item.teacherName} for ${item.targetClass}`)} className="w-full py-3 bg-red-100 text-red-500 rounded-xl font-black text-[10px] uppercase">Remove</button>
                </>
              ) : (
                <div className="text-center">
                  <span className="text-[9px] font-black bg-purple-100 dark:bg-purple-900/50 text-purple-600 px-3 py-1 rounded-full uppercase tracking-widest mb-2 inline-block">{item.targetClass} • {item.section}</span>
                  <h5 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{item.teacherName}</h5>
                </div>
              )}
            </div>
          ))}
          {list.length === 0 && (
            <div className="col-span-full py-10 text-center border-4 border-dashed border-slate-200 dark:border-slate-800 rounded-[30px]">
              <p className="text-slate-400 font-black uppercase text-xs tracking-widest">No assignments made.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 flex flex-col lg:flex-row gap-12">
      <aside className="w-full lg:w-72 shrink-0">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-[50px] p-10 shadow-2xl border border-slate-200 dark:border-slate-800 sticky top-24">
          <div className="flex flex-col items-center mb-10 text-center px-4">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-accent/20 mb-4 shadow-xl">
              <img 
                src={getDisplayUrl(localData.adminProfilePic) || 'https://via.placeholder.com/150'} 
                className={`w-full h-full ${localData.adminProfilePicFit === 'contain' ? 'object-contain' : 'object-cover'}`} 
                alt="Admin" 
              />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-tight">Admin Portal</h2>
            <p className="text-[10px] font-black text-accent uppercase tracking-widest mt-1 opacity-70">Authorized Office</p>
            
            <div className="mt-4 flex flex-col gap-2 w-full">
              <div className="bg-green-100 dark:bg-green-900/20 text-green-600 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-green-200">
                ● Live Visibility Active
              </div>
              <div className="bg-sky-100 dark:bg-sky-900/20 text-sky-600 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-sky-200">
                ☁ Cloud Sync Linked
              </div>
            </div>
          </div>
          
          <div className="mb-10 px-4 bg-slate-100 dark:bg-slate-950 p-6 rounded-[30px] border border-slate-200 dark:border-white/10 shadow-inner">
             <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Edit Mode</span>
                  <span className={`text-[9px] font-bold ${isEditMode ? 'text-accent' : 'text-slate-400'}`}>{isEditMode ? 'ACTIVE' : 'LOCKED'}</span>
                </div>
                <button 
                  onClick={() => setIsEditMode(!isEditMode)}
                  className={`relative inline-flex h-8 w-16 items-center rounded-full transition-all focus:outline-none shadow-xl ${isEditMode ? 'bg-accent' : 'bg-slate-400 dark:bg-slate-800'}`}
                >
                  <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-2xl transition-transform ${isEditMode ? 'translate-x-9' : 'translate-x-1'}`} />
                </button>
             </div>
          </div>

          <nav className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible gap-4 no-scrollbar pb-6 lg:pb-0 mb-10">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`shrink-0 lg:w-full text-left px-8 py-5 rounded-3xl transition-all flex items-center gap-5 font-black text-xs uppercase tracking-widest ${activeTab === tab.id ? 'bg-slate-800 text-white shadow-2xl scale-105' : 'bg-slate-50 dark:bg-white/5 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10'}`}>
                <span className="text-2xl">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
          
          <div className="px-4 pt-10 border-t border-slate-200 dark:border-white/10">
             <button 
               onClick={handleSave} 
               disabled={saveStatus === 'saving'} 
               className={`w-full py-6 rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl transition-all flex flex-col items-center justify-center gap-2 ${
                 saveStatus === 'success' ? 'bg-green-600 text-white' : 
                 saveStatus === 'error' ? 'bg-red-600 text-white' : 
                 'bg-accent text-white hover:scale-105'
               } disabled:opacity-50`}
             >
               {saveStatus === 'saving' ? (
                 <>
                   <div className="animate-spin w-6 h-6 border-4 border-white border-t-transparent rounded-full"></div>
                   <span>Syncing to Public...</span>
                 </>
               ) : saveStatus === 'success' ? (
                 <>
                   <span>✅ Updated Publicly</span>
                 </>
               ) : saveStatus === 'error' ? (
                 <>
                   <span>❌ Sync Error</span>
                 </>
               ) : (
                 <>
                   <span>💾 Save & Sync Cloud</span>
                   <span className="text-[8px] opacity-60">Visible to all visitors</span>
                 </>
               )}
             </button>
          </div>
        </div>
      </aside>

      <main className="flex-grow bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl p-10 md:p-16 rounded-[60px] shadow-2xl border border-slate-200 dark:border-slate-800 relative min-h-[800px]">
        {uploading && (
          <div className="absolute inset-0 z-[110] flex items-center justify-center bg-white/90 dark:bg-slate-950/90 backdrop-blur-3xl rounded-[60px]">
            <div className="text-center space-y-6">
              <div className="animate-spin w-20 h-20 border-8 border-accent border-t-transparent rounded-full mx-auto shadow-2xl"></div>
              <p className="font-black text-2xl text-slate-900 dark:text-white uppercase tracking-widest">Processing Media...</p>
              <p className="text-xs font-bold text-slate-500 uppercase">This turns your file into a cloud-ready string.</p>
            </div>
          </div>
        )}

        <header className="mb-16 flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
           <div className="space-y-2">
              <h3 className="text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Manage {tabs.find(t => t.id === activeTab)?.label}</h3>
              {!isEditMode && <p className="text-slate-400 dark:text-slate-500 font-black text-[10px] uppercase tracking-[0.4em] px-1">Current view is locked</p>}
           </div>
           
           {isEditMode && (
             <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 p-6 rounded-[30px] flex items-center gap-4">
                <span className="text-3xl">⚠️</span>
                <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase leading-tight">
                  Unsaved changes are only visible to you.<br/>
                  Click <span className="font-black">"Save & Sync"</span> to make them public.
                </p>
             </div>
           )}
        </header>

        {activeTab === 'home' && (
          <div className="space-y-16 animate-in fade-in duration-500">
             {/* Latest News Ticker Settings */}
             <div className={`p-10 rounded-[50px] border transition-all ${isEditMode ? 'bg-white border-amber-200 dark:bg-slate-900/50 shadow-2xl' : 'bg-slate-50 dark:bg-white/5 border-slate-200'}`}>
                <h4 className="font-black text-2xl mb-8 uppercase text-slate-900 dark:text-amber-500 tracking-tighter flex items-center gap-4">
                  <span>📢</span> Latest News Ticker Configuration
                </h4>
                <div className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] px-2">Ticker Scrolling Text</label>
                    {isEditMode ? (
                      <textarea 
                        value={localData.marqueeText} 
                        onChange={(e) => updateLocalField('marqueeText', e.target.value)} 
                        className="w-full p-6 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl font-black text-sm text-slate-800 shadow-inner h-24" 
                        placeholder="Enter the scrolling message for the home page..."
                      />
                    ) : (
                      <div className="w-full p-6 bg-white dark:bg-slate-800/50 rounded-3xl font-black text-slate-900 dark:text-white border border-slate-200 dark:border-transparent italic">
                        {localData.marqueeText}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] px-2">Scroll Duration (sec)</label>
                      {isEditMode ? (
                        <div className="flex items-center gap-4">
                          <input 
                            type="range" min="5" max="100" step="5"
                            value={localData.tickerConfig.speed} 
                            onChange={(e) => updateTickerConfig('speed', parseInt(e.target.value))} 
                            className="flex-grow accent-amber-500"
                          />
                          <span className="font-black text-sm text-slate-700 w-8">{localData.tickerConfig.speed}s</span>
                        </div>
                      ) : (
                        <div className="p-4 bg-white dark:bg-slate-800/50 rounded-2xl font-black text-slate-900 dark:text-white border border-slate-200 dark:border-transparent">{localData.tickerConfig.speed} seconds</div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] px-2">Font Size (px)</label>
                      {isEditMode ? (
                        <select 
                          value={localData.tickerConfig.fontSize} 
                          onChange={(e) => updateTickerConfig('fontSize', e.target.value)} 
                          className="w-full p-4 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl font-black text-sm text-slate-800 shadow-inner"
                        >
                          {['12px', '14px', '16px', '18px', '20px', '24px'].map(sz => <option key={sz} value={sz}>{sz}</option>)}
                        </select>
                      ) : (
                        <div className="p-4 bg-white dark:bg-slate-800/50 rounded-2xl font-black text-slate-900 dark:text-white border border-slate-200 dark:border-transparent">{localData.tickerConfig.fontSize}</div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] px-2">Background Color</label>
                      {isEditMode ? (
                        <div className="flex items-center gap-4 p-4 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
                          <input 
                            type="color"
                            value={localData.tickerConfig.backgroundColor} 
                            onChange={(e) => updateTickerConfig('backgroundColor', e.target.value)} 
                            className="w-full h-8 cursor-pointer rounded-lg overflow-hidden border-none"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-transparent font-black">
                          <div className="w-6 h-6 rounded-full border border-slate-200" style={{ backgroundColor: localData.tickerConfig.backgroundColor }}></div>
                          <span>{localData.tickerConfig.backgroundColor}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] px-2">Text Color</label>
                      {isEditMode ? (
                        <div className="flex items-center gap-4 p-4 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
                          <input 
                            type="color"
                            value={localData.tickerConfig.textColor} 
                            onChange={(e) => updateTickerConfig('textColor', e.target.value)} 
                            className="w-full h-8 cursor-pointer rounded-lg overflow-hidden border-none"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-transparent font-black">
                          <div className="w-6 h-6 rounded-full border border-slate-200" style={{ backgroundColor: localData.tickerConfig.textColor }}></div>
                          <span>{localData.tickerConfig.textColor}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
             </div>

             <div className={`p-10 rounded-[50px] border transition-all ${isEditMode ? 'bg-white border-sky-200 dark:bg-slate-900/50 shadow-2xl' : 'bg-slate-50 dark:bg-white/5 border-slate-200'}`}>
                <h4 className="font-black text-2xl mb-8 uppercase text-slate-900 dark:text-sky-400 tracking-tighter">Quick Stats</h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                   {Object.keys(localData.stats).map((key) => (
                     <div key={key} className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] px-2">{key}</label>
                        {isEditMode ? (
                          <input value={(localData.stats as any)[key]} onChange={(e) => updateStats(key as any, e.target.value)} className="w-full p-4 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl font-black text-sm text-slate-800 shadow-inner" />
                        ) : (
                          <div className="w-full p-4 bg-white dark:bg-slate-800/50 rounded-2xl font-black text-slate-900 dark:text-white border border-slate-200 dark:border-transparent">{(localData.stats as any)[key]}</div>
                        )}
                     </div>
                   ))}
                </div>
             </div>

             <div className="space-y-8">
                <div className="flex justify-between items-center px-6">
                  <h4 className="font-black text-2xl uppercase text-slate-900 dark:text-white tracking-tighter">Main Slider Banners</h4>
                  {isEditMode && (
                    <button onClick={() => addItem('banners', { imageUrl: 'https://via.placeholder.com/1200x600', title: 'New Banner', subtitle: 'Add a description' })} className="px-6 py-3 bg-accent text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">+ Add Banner</button>
                  )}
                </div>
                <div className="grid gap-10">
                  {localData.banners.map((banner) => (
                    <div key={banner.id} className={`p-10 rounded-[55px] border flex flex-col md:flex-row gap-10 transition-all ${isEditMode ? 'bg-white border-sky-200 dark:bg-slate-900/50 shadow-2xl' : 'bg-slate-50 dark:bg-white/5 border-slate-200 shadow-sm'}`}>
                       <div className="w-72 h-40 shrink-0 space-y-5">
                          <div className="relative group rounded-[40px] overflow-hidden border-4 border-white dark:border-slate-800 shadow-2xl h-full bg-slate-200">
                            <img src={getDisplayUrl(banner.imageUrl)} className="w-full h-full object-cover" />
                          </div>
                          {isEditMode && (
                             <div className="relative">
                               <input type="file" id={`banner-up-${banner.id}`} className="hidden" onChange={(e) => handleFileUpload(e, (url) => updateItem('banners', banner.id, { imageUrl: url }), 'banners')} />
                               <label htmlFor={`banner-up-${banner.id}`} className="w-full py-4 bg-sky-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 cursor-pointer hover:bg-sky-700 transition-all shadow-xl">
                                 📷 Change Image
                               </label>
                             </div>
                          )}
                       </div>
                       <div className="flex-grow space-y-5">
                          {isEditMode ? (
                            <>
                              <input value={banner.title} onChange={e => updateItem('banners', banner.id, { title: e.target.value })} className="w-full p-4 border border-slate-200 rounded-2xl font-black text-lg bg-slate-100 text-slate-800" placeholder="Banner Heading" />
                              <input value={banner.subtitle} onChange={e => updateItem('banners', banner.id, { subtitle: e.target.value })} className="w-full p-4 border border-slate-200 rounded-2xl text-sm font-bold bg-slate-100 text-slate-600" placeholder="Sub-text" />
                            </>
                          ) : (
                            <>
                              <h5 className="font-black text-3xl text-slate-900 dark:text-white uppercase tracking-tight leading-none pt-4">{banner.title}</h5>
                              <p className="text-lg font-bold text-slate-600 dark:text-slate-400">{banner.subtitle}</p>
                            </>
                          )}
                       </div>
                       {isEditMode && <button onClick={() => initiateDelete(banner.id, 'banners', banner.title)} className="bg-red-500 text-white p-8 rounded-[40px] self-center hover:bg-red-600 transition-all shadow-2xl">🗑️</button>}
                    </div>
                  ))}
                </div>
             </div>

             <div className="space-y-8 pt-12 border-t border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center px-6">
                  <h4 className="font-black text-2xl uppercase text-slate-900 dark:text-white tracking-tighter">Featured News & Events</h4>
                  {isEditMode && (
                    <button onClick={() => addItem('newsEvents', { title: 'New Event Title', date: new Date().toLocaleDateString(), content: 'Event details...', imageUrl: 'https://via.placeholder.com/400x300' })} className="px-6 py-3 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">+ Add Event</button>
                  )}
                </div>
                <div className="grid gap-10">
                  {localData.newsEvents.map((event) => (
                    <div key={event.id} className={`p-10 rounded-[55px] border flex flex-col md:flex-row gap-10 transition-all ${isEditMode ? 'bg-white border-emerald-200 dark:bg-slate-900/50 shadow-2xl' : 'bg-slate-50 dark:bg-white/5 border-slate-200 shadow-sm'}`}>
                       <div className="w-64 h-48 shrink-0 space-y-4">
                          <img src={getDisplayUrl(event.imageUrl) || 'https://via.placeholder.com/400x300'} className="w-full h-full object-cover rounded-[35px] border-4 border-white shadow-xl" />
                          {isEditMode && (
                             <label className="w-full py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 cursor-pointer hover:bg-emerald-700 shadow-xl">
                               📷 Photo
                               <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, (url) => updateItem('newsEvents', event.id, { imageUrl: url }), 'events')} />
                             </label>
                          )}
                       </div>
                       <div className="flex-grow space-y-4">
                          {isEditMode ? (
                            <>
                              <input value={event.title} onChange={e => updateItem('newsEvents', event.id, { title: e.target.value })} className="w-full p-4 border border-slate-200 rounded-2xl font-black text-lg bg-slate-100 text-slate-800" placeholder="Event Title" />
                              <div className="flex gap-4">
                                <input value={event.date} onChange={e => updateItem('newsEvents', event.id, { date: e.target.value })} className="flex-grow p-4 border border-slate-200 rounded-2xl text-xs font-black bg-slate-100 text-slate-800" placeholder="Date" />
                                <div className="flex gap-2">
                                  <input type="file" id={`event-file-${event.id}`} className="hidden" onChange={(e) => handleFileUpload(e, (url, name) => updateItem('newsEvents', event.id, { attachmentUrl: url, fileName: name }), 'pdfs')} />
                                  <label htmlFor={`event-file-${event.id}`} className="px-6 py-4 bg-slate-800 text-white rounded-2xl text-[9px] font-black uppercase cursor-pointer flex items-center">📎 File</label>
                                  {event.attachmentUrl && <button onClick={() => updateItem('newsEvents', event.id, { attachmentUrl: undefined, fileName: undefined })} className="bg-red-100 text-red-600 px-4 rounded-2xl">🗑️</button>}
                                </div>
                              </div>
                              <textarea value={event.content} onChange={e => updateItem('newsEvents', event.id, { content: e.target.value })} className="w-full p-4 border border-slate-200 rounded-2xl text-sm font-bold bg-slate-100 text-slate-600 h-24" placeholder="Full details..." />
                            </>
                          ) : (
                            <>
                              <h5 className="font-black text-2xl text-slate-900 dark:text-white uppercase tracking-tight">{event.title}</h5>
                              <p className="text-xs font-black text-emerald-500 uppercase tracking-widest">{event.date}</p>
                              <p className="text-sm font-bold text-slate-600 dark:text-slate-400 line-clamp-3">{event.content}</p>
                              {event.attachmentUrl && <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">📎 Attachment Uploaded</span>}
                            </>
                          )}
                       </div>
                       {isEditMode && <button onClick={() => initiateDelete(event.id, 'newsEvents', event.title)} className="bg-red-500 text-white p-8 rounded-[40px] self-center hover:bg-red-600 transition-all shadow-2xl">🗑️</button>}
                    </div>
                  ))}
                </div>
             </div>
          </div>
        )}

        {activeTab === 'academics' && (
          <div className="space-y-16 animate-in fade-in duration-500">
            <PageEditor title="Academics" contentField="academicsContent" pdfField="academicsPdfUrl" />
            
            <AcademicFileManager title="Syllabuses" category="syllabuses" />
            <AcademicFileManager title="Class Routines" category="classRoutines" />
            <ClassTeacherManager />
          </div>
        )}

        {activeTab === 'corner' && (
           <div className="space-y-24 animate-in fade-in duration-500">
              {/* Notices Section */}
              <section className="space-y-12">
                <div className="flex justify-between items-center px-6">
                  <h4 className="font-black text-3xl uppercase text-slate-900 dark:text-white tracking-tighter">Official Notices</h4>
                  {isEditMode && (
                    <button onClick={() => addItem('notices', { title: 'Notice Headline', date: new Date().toLocaleDateString(), content: 'Type message here...', important: false })} className="px-8 py-4 bg-amber-500 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl">+ Post Notice</button>
                  )}
                </div>
                {localData.notices.map(n => (
                  <div key={n.id} className={`p-12 rounded-[60px] border flex flex-col md:flex-row gap-10 transition-all ${isEditMode ? 'bg-white border-amber-400 shadow-2xl' : 'bg-slate-50 dark:bg-slate-800/20 border-slate-200 dark:border-slate-800 shadow-sm'}`}>
                    <div className="flex-grow space-y-6">
                      {isEditMode ? (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Notice Headline (Full Title)</label>
                              <textarea 
                                value={n.title} 
                                onChange={e => updateItem('notices', n.id, { title: e.target.value })} 
                                className="w-full p-8 border-2 border-slate-200 rounded-[40px] font-black text-2xl shadow-inner bg-slate-50 text-slate-800 focus:border-amber-400 focus:ring-4 focus:ring-amber-50 outline-none transition-all resize-none h-32"
                                placeholder="Enter a descriptive headline for this notice..."
                              />
                            </div>
                            <div className="space-y-3">
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Digital Attachment (PDF/Image)</label>
                              <div className="flex flex-col gap-4">
                                <input type="file" id={`notice-file-${n.id}`} className="hidden" onChange={(e) => handleFileUpload(e, (url, name) => updateItem('notices', n.id, { attachmentUrl: url, fileName: name }))} />
                                <label htmlFor={`notice-file-${n.id}`} className="w-full p-8 bg-white dark:bg-slate-950 border-2 border-dashed border-slate-200 rounded-[40px] font-black text-sm uppercase text-center cursor-pointer shadow-sm hover:border-amber-400 hover:bg-amber-50/30 transition-all flex flex-col items-center justify-center gap-2">
                                  <span className="text-3xl">{n.attachmentUrl ? '✅' : '📤'}</span>
                                  <span>{n.attachmentUrl ? 'Change Attachment' : 'Upload Resource File'}</span>
                                </label>
                                {n.attachmentUrl && (
                                  <button onClick={() => updateItem('notices', n.id, { attachmentUrl: undefined, fileName: undefined })} className="w-full py-4 bg-red-50 text-red-600 rounded-3xl font-black text-[10px] uppercase border border-red-100">
                                    🗑️ Remove Current File
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Detailed Notice Message Body</label>
                            <textarea value={n.content} onChange={e => updateItem('notices', n.id, { content: e.target.value })} className="w-full p-8 border-2 border-slate-200 rounded-[40px] font-bold text-lg h-64 bg-slate-50 text-slate-700 focus:border-amber-400 focus:ring-4 focus:ring-amber-50 outline-none transition-all" placeholder="Write the full message content here..." />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-4 mb-4">
                            {n.important && <span className="bg-red-500 text-white text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">Priority</span>}
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{n.date}</span>
                          </div>
                          <h5 className="font-black text-3xl text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-4">{n.title}</h5>
                          <p className="text-lg font-bold text-slate-700 dark:text-slate-300 italic border-l-4 border-accent pl-6">{n.content}</p>
                        </>
                      )}
                    </div>
                    {isEditMode && (
                      <div className="flex flex-col gap-4 min-w-[200px] justify-center">
                        <button onClick={() => updateItem('notices', n.id, { important: !n.important })} className={`w-full py-5 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all ${n.important ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-500'}`}>{n.important ? 'Remove Priority' : 'Mark Priority'}</button>
                        <button onClick={() => initiateDelete(n.id, 'notices', n.title)} className="w-full py-5 bg-red-100 text-red-600 rounded-3xl font-black text-[10px] uppercase hover:bg-red-600 hover:text-white transition-all">Delete</button>
                      </div>
                    )}
                  </div>
                ))}
              </section>

              {/* Exam Routines Section */}
              <section className="space-y-12">
                <div className="flex justify-between items-center px-6">
                  <h4 className="font-black text-3xl uppercase text-slate-900 dark:text-white tracking-tighter">Exam Routines</h4>
                  {isEditMode && (
                    <button onClick={() => addItem('exams', { title: 'Exam Routine', date: new Date().toLocaleDateString(), subject: 'Full', targetClass: 'All', targetSection: 'All' })} className="px-8 py-4 bg-sky-500 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl">+ Add Routine</button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {localData.exams.map(e => (
                    <div key={e.id} className={`p-10 rounded-[50px] border transition-all ${isEditMode ? 'bg-white border-sky-400 shadow-2xl' : 'bg-slate-50 dark:bg-slate-800/20 border-slate-200 dark:border-slate-800 shadow-sm'}`}>
                       {isEditMode ? (
                         <div className="space-y-4">
                            <input value={e.title} onChange={val => updateItem('exams', e.id, { title: val.target.value })} className="w-full p-4 border border-slate-200 rounded-2xl font-black text-lg bg-slate-100" placeholder="Routine Title" />
                            <div className="grid grid-cols-2 gap-4">
                               <select value={e.targetClass} onChange={val => updateItem('exams', e.id, { targetClass: val.target.value })} className="p-4 border border-slate-200 rounded-2xl text-xs font-black">{CLASS_LIST.map(c => <option key={c} value={c}>{c}</option>)}</select>
                               <select value={e.targetSection} onChange={val => updateItem('exams', e.id, { targetSection: val.target.value })} className="p-4 border border-slate-200 rounded-2xl text-xs font-black">{SECTION_LIST.map(s => <option key={s} value={s}>{s}</option>)}</select>
                            </div>
                            <div className="flex gap-4">
                               <input type="file" id={`exam-up-${e.id}`} className="hidden" onChange={(evt) => handleFileUpload(evt, (url, name) => updateItem('exams', e.id, { attachmentUrl: url, fileName: name }))} />
                               <label htmlFor={`exam-up-${e.id}`} className="flex-grow p-4 bg-white border border-slate-200 rounded-2xl text-center cursor-pointer font-black text-[10px] uppercase shadow-sm">
                                 {e.attachmentUrl ? '✅ Routine Uploaded' : '📤 Upload File'}
                               </label>
                               <button onClick={() => initiateDelete(e.id, 'exams', e.title)} className="bg-red-100 text-red-500 px-6 rounded-2xl">🗑️</button>
                            </div>
                         </div>
                       ) : (
                         <div className="flex flex-col h-full justify-between">
                            <div className="space-y-2 mb-6">
                               <span className="text-[9px] font-black bg-sky-100 text-sky-600 px-3 py-1 rounded-full uppercase">{e.targetClass} • {e.targetSection}</span>
                               <h5 className="text-2xl font-black text-slate-900 dark:text-white uppercase leading-tight">{e.title}</h5>
                               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Published: {e.date}</p>
                            </div>
                            {e.attachmentUrl && <a href={e.attachmentUrl} target="_blank" rel="noreferrer" className="w-full py-4 bg-slate-800 text-white rounded-2xl text-center font-black text-[10px] uppercase hover:scale-105 transition-all">Download Routine</a>}
                         </div>
                       )}
                    </div>
                  ))}
                </div>
              </section>

              {/* Exam Results Section */}
              <section className="space-y-12">
                <div className="flex justify-between items-center px-6">
                  <h4 className="font-black text-3xl uppercase text-slate-900 dark:text-white tracking-tighter">Exam Results</h4>
                  {isEditMode && (
                    <button onClick={() => addItem('results', { studentName: 'Student Name', studentRoll: 'Roll ID', targetClass: 'Class 6', targetSection: 'Morning', gpa: '5.00', date: new Date().toLocaleDateString() })} className="px-8 py-4 bg-accent text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl">+ Add Result</button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {localData.results.map(r => (
                    <div key={r.id} className={`p-10 rounded-[50px] border transition-all ${isEditMode ? 'bg-white border-accent shadow-2xl' : 'bg-slate-50 dark:bg-slate-800/20 border-slate-200 dark:border-slate-800 shadow-sm'}`}>
                       {isEditMode ? (
                         <div className="space-y-4">
                            <input value={r.studentName} onChange={val => updateItem('results', r.id, { studentName: val.target.value })} className="w-full p-4 border border-slate-200 rounded-2xl font-black text-sm" placeholder="Student Name" />
                            <div className="grid grid-cols-2 gap-4">
                               <input value={r.studentRoll} onChange={val => updateItem('results', r.id, { studentRoll: val.target.value })} className="p-4 border border-slate-200 rounded-2xl text-xs font-black" placeholder="Roll ID" />
                               <input value={r.gpa} onChange={val => updateItem('results', r.id, { gpa: val.target.value })} className="p-4 border border-slate-200 rounded-2xl text-xs font-black" placeholder="GPA / Grade" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                               <select value={r.targetClass} onChange={val => updateItem('results', r.id, { targetClass: val.target.value })} className="p-4 border border-slate-200 rounded-2xl text-xs font-black">{CLASS_LIST.map(c => <option key={c} value={c}>{c}</option>)}</select>
                               <select value={r.targetSection} onChange={val => updateItem('results', r.id, { targetSection: val.target.value })} className="p-4 border border-slate-200 rounded-2xl text-xs font-black">{SECTION_LIST.map(s => <option key={s} value={s}>{s}</option>)}</select>
                            </div>
                            <div className="flex gap-4">
                               <input type="file" id={`res-up-${r.id}`} className="hidden" onChange={(evt) => handleFileUpload(evt, (url, name) => updateItem('results', r.id, { attachmentUrl: url, fileName: name }))} />
                               <label htmlFor={`res-up-${r.id}`} className="flex-grow p-4 bg-white border border-slate-200 rounded-2xl text-center cursor-pointer font-black text-[10px] uppercase shadow-sm">
                                 {r.attachmentUrl ? '✅ Sheet Uploaded' : '📤 Upload Sheet'}
                               </label>
                               <button onClick={() => initiateDelete(r.id, 'results', r.studentName)} className="bg-red-100 text-red-500 px-6 rounded-2xl">🗑️</button>
                            </div>
                         </div>
                       ) : (
                         <div className="space-y-6">
                            <div className="flex justify-between items-start">
                               <div>
                                  <h6 className="text-xl font-black text-slate-900 dark:text-white uppercase leading-none">{r.studentName}</h6>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Roll: {r.studentRoll}</p>
                               </div>
                               <span className="text-3xl font-black text-accent drop-shadow-sm">{r.gpa}</span>
                            </div>
                            <div className="bg-slate-100 p-4 rounded-3xl text-[9px] font-black uppercase text-slate-500 flex justify-between">
                               <span>{r.targetClass}</span>
                               <span>{r.targetSection}</span>
                            </div>
                            {r.attachmentUrl && <a href={r.attachmentUrl} target="_blank" rel="noreferrer" className="block w-full py-3 bg-heading text-white rounded-2xl text-center font-black text-[9px] uppercase hover:bg-slate-800">Preview Result Sheet</a>}
                         </div>
                       )}
                    </div>
                  ))}
                </div>
              </section>
           </div>
        )}

        {activeTab === 'gallery' && (
           <div className="space-y-12 animate-in fade-in duration-500">
              <h4 className="font-black text-3xl uppercase text-slate-900 dark:text-white px-6 tracking-tighter">Media Gallery Management</h4>
              
              {isEditMode && (
                <div className="p-10 border-4 border-dashed border-sky-400/30 rounded-[60px] bg-sky-50 dark:bg-sky-950/20 text-center space-y-6 hover:bg-sky-50 transition-all">
                  <div className="text-5xl">📤</div>
                  <h5 className="text-xl font-black uppercase tracking-tighter text-slate-800 dark:text-white">Mass Media Upload</h5>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Select multiple images or videos at once</p>
                  <label className="inline-block px-12 py-5 bg-sky-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest cursor-pointer shadow-xl hover:bg-sky-700 transition-all">
                    Browse Files
                    <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleMultipleGalleryUpload} />
                  </label>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                 {localData.gallery.map(item => (
                   <div key={item.id} className="bg-slate-50 dark:bg-slate-950 rounded-[45px] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-lg flex flex-col group">
                      <div className="aspect-square relative overflow-hidden bg-black">
                        {item.type === 'video' ? (
                          <div className="w-full h-full flex items-center justify-center text-white text-5xl">🎬</div>
                        ) : (
                          <img src={getDisplayUrl(item.url)} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                        )}
                        {isEditMode && (
                          <button onClick={() => initiateDelete(item.id, 'gallery', item.caption || 'Gallery Item')} className="absolute top-4 right-4 bg-red-500 text-white p-4 rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity">🗑️</button>
                        )}
                      </div>
                      <div className="p-6 space-y-4">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-2">Image Caption</label>
                        {isEditMode ? (
                          <input 
                            value={item.caption} 
                            onChange={(e) => updateItem('gallery', item.id, { caption: e.target.value })} 
                            className="w-full p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold text-xs shadow-inner"
                            placeholder="Type a descriptive caption..."
                          />
                        ) : (
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200 italic px-2">{item.caption || 'No caption added.'}</p>
                        )}
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        )}

        {activeTab === 'administration' && (
          <div className="space-y-20 animate-in fade-in duration-500">
            <PageEditor title="General Administration" contentField="administrationContent" pdfField="administrationPdfUrl" />
            
            <div className="space-y-16">
              <h4 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter border-b-4 border-sky-400 inline-block px-4 pb-2">Institutional Personnel</h4>
              
              <div className="space-y-12 p-10 bg-sky-50 dark:bg-sky-950/20 rounded-[60px] border border-sky-100 dark:border-sky-900/30">
                <h5 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Head Teacher</h5>
                <div className="max-w-md">
                  <PersonnelCard 
                    person={localData.headTeacher || { id: 'head', name: 'Head Teacher Name', designation: 'Head Teacher', image: '' }}
                    category="headTeacher"
                    onUpdate={(fields) => updateLocalField('headTeacher', { ...localData.headTeacher, ...fields })}
                    onDelete={() => initiateDelete(undefined, 'headTeacher', localData.headTeacher?.name || 'Head Teacher', true)}
                  />
                  {!localData.headTeacher && isEditMode && (
                    <button 
                      onClick={() => updateLocalField('headTeacher', { id: 'head', name: 'New Head Teacher', designation: 'Head Teacher', image: '' })}
                      className="mt-6 w-full py-4 bg-sky-500 text-white rounded-3xl font-black text-xs uppercase tracking-widest"
                    >
                      + Assign Head Teacher
                    </button>
                  )}
                </div>
              </div>

              {/* Head Master's Message Editor */}
              <div className="space-y-6">
                <h5 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Head Master's Official Message</h5>
                {isEditMode ? (
                  <textarea 
                    value={localData.sections.find(s => s.id === 'headMasterMsg')?.body || ''} 
                    onChange={(e) => updateSectionText('headMasterMsg', e.target.value)} 
                    className="w-full p-8 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[40px] font-bold text-slate-700 dark:text-slate-200 h-40 shadow-inner"
                    placeholder="Enter Head Master's message for home page side box..."
                  />
                ) : (
                  <div className="p-8 bg-slate-100 dark:bg-slate-800/30 rounded-[40px] font-bold text-slate-600 dark:text-slate-400 italic">
                    {localData.sections.find(s => s.id === 'headMasterMsg')?.body}
                  </div>
                )}
              </div>

              <PersonnelManager title="Assistant Head Teachers" category="assistantHeadTeachers" />

              {/* Assistant Head Master's Message Editor */}
              <div className="space-y-6">
                <h5 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Assistant Head Master's Official Message</h5>
                {isEditMode ? (
                  <textarea 
                    value={localData.sections.find(s => s.id === 'assistantHeadMasterMsg')?.body || ''} 
                    onChange={(e) => updateSectionText('assistantHeadMasterMsg', e.target.value)} 
                    className="w-full p-8 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[40px] font-bold text-slate-700 dark:text-slate-200 h-40 shadow-inner"
                    placeholder="Enter Assistant Head Master's message for home page side box..."
                  />
                ) : (
                  <div className="p-8 bg-slate-100 dark:bg-slate-800/30 rounded-[40px] font-bold text-slate-600 dark:text-slate-400 italic">
                    {localData.sections.find(s => s.id === 'assistantHeadMasterMsg')?.body}
                  </div>
                )}
              </div>

              <PersonnelManager title="School Committee Members" category="committeeMembers" />
              <PersonnelManager title="Governing Body" category="governingBody" />
            </div>
          </div>
        )}

        {activeTab === 'about' && <PageEditor title="About School" contentField="aboutContent" pdfField="aboutPdfUrl" />}
        {activeTab === 'teachers' && <PersonnelManager title="Faculty Members" category="faculty" />}
        {activeTab === 'co-curricular' && <PageEditor title="Extra Activities" contentField="coCurricularContent" pdfField="coCurricularPdfUrl" />}
        {activeTab === 'admission' && <PageEditor title="Enrollment Info" contentField="admissionInfo" pdfField="admissionPdfUrl" />}
        
        {activeTab === 'settings' && (
          <div className="space-y-16 animate-in fade-in duration-500 pb-20">
             {/* Cloud Sync Setup */}
             <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl p-12 rounded-[60px] border-4 border-accent shadow-2xl">
                <h4 className="font-black text-3xl uppercase text-slate-900 dark:text-white tracking-tighter mb-8 flex items-center gap-5">
                   <span className="bg-accent/20 p-4 rounded-3xl text-accent">☁️</span> Google Drive Synchronization
                </h4>
                <div className="space-y-6">
                   <div className="bg-slate-50 dark:bg-slate-950 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-inner">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Apps Script Web App URL</label>
                      <input 
                        value={localData.cloudScriptUrl || ''} 
                        onChange={(e) => updateLocalField('cloudScriptUrl', e.target.value)} 
                        className="w-full mt-2 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-sm text-sky-500 shadow-sm"
                        placeholder="https://script.google.com/macros/s/.../exec"
                      />
                      <p className="mt-4 text-[10px] font-bold text-slate-500 uppercase tracking-tight leading-relaxed">
                        Pasting your script URL here enables multi-device sync. <br/>
                        When you click <span className="text-accent">"Save & Sync"</span>, every visitor globally sees your newest updates.
                      </p>
                   </div>
                </div>
             </div>

             {/* Profile & Identity */}
             <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl p-12 rounded-[60px] border border-slate-200 dark:border-slate-800 shadow-2xl">
                <h4 className="font-black text-3xl uppercase text-slate-900 dark:text-white tracking-tighter mb-12 flex items-center gap-5">
                   <span className="bg-heading/10 dark:bg-white/5 p-4 rounded-3xl text-heading dark:text-white">🛡️</span> Admin Profile & Identity
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                   {/* Institutional Identity Details */}
                   <div className="space-y-8">
                      <h5 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 px-2">Institutional Branding Info</h5>
                      
                      <div className="p-8 bg-slate-50 dark:bg-slate-950 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-inner mb-6 space-y-8">
                        <div className="flex flex-col items-center">
                          <div className="w-40 h-40 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center p-2 border-4 border-white dark:border-slate-700 shadow-2xl relative overflow-hidden group">
                             <img 
                               src={getDisplayUrl(localData.logoUrl)} 
                               className={`w-full h-full rounded-full ${localData.logoFit === 'contain' ? 'object-contain' : 'object-cover'}`} 
                               alt="School Logo" 
                             />
                             {isEditMode && (
                               <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                 <span className="text-white text-[10px] font-black uppercase">Change Logo</span>
                                 <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, (url) => updateLocalField('logoUrl', url))} />
                               </label>
                             )}
                          </div>
                          <p className="mt-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Institutional Logo</p>
                        </div>
                        
                        {isEditMode && (
                          <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-slate-400 px-2">Logo Fitting Mode</label>
                            <div className="grid grid-cols-2 gap-4">
                              <button 
                                onClick={() => updateLocalField('logoFit', 'contain')}
                                className={`py-3 rounded-2xl font-black text-[10px] uppercase border transition-all ${localData.logoFit === 'contain' ? 'bg-accent text-white border-accent' : 'bg-white text-slate-500 border-slate-200'}`}
                              >
                                Scale to Fit
                              </button>
                              <button 
                                onClick={() => updateLocalField('logoFit', 'cover')}
                                className={`py-3 rounded-2xl font-black text-[10px] uppercase border transition-all ${localData.logoFit === 'cover' ? 'bg-accent text-white border-accent' : 'bg-white text-slate-500 border-slate-200'}`}
                              >
                                Fill Circle
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-5">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">School Name</label>
                           {isEditMode ? (
                             <input value={localData.schoolName} onChange={(e) => updateLocalField('schoolName', e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl font-black text-slate-800 dark:text-white shadow-inner" />
                           ) : (
                             <div className="p-4 bg-white/50 dark:bg-slate-800/50 rounded-2xl font-black text-slate-900 dark:text-white border border-slate-100 dark:border-transparent">{localData.schoolName}</div>
                           )}
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Motto / Slogan</label>
                           {isEditMode ? (
                             <input value={localData.motto} onChange={(e) => updateLocalField('motto', e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl font-black text-slate-800 dark:text-white shadow-inner" />
                           ) : (
                             <div className="p-4 bg-white/50 dark:bg-slate-800/50 rounded-2xl font-black text-slate-900 dark:text-white border border-slate-100 dark:border-transparent italic">{localData.motto}</div>
                           )}
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">School Code</label>
                              {isEditMode ? (
                                <input value={localData.schoolCode} onChange={(e) => updateLocalField('schoolCode', e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl font-black text-slate-800 dark:text-white shadow-inner" />
                              ) : (
                                <div className="p-4 bg-white/50 dark:bg-slate-800/50 rounded-2xl font-black text-slate-900 dark:text-white border border-slate-100 dark:border-transparent">{localData.schoolCode || '---'}</div>
                              )}
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">College Code</label>
                              {isEditMode ? (
                                <input value={localData.collegeCode} onChange={(e) => updateLocalField('collegeCode', e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl font-black text-slate-800 dark:text-white shadow-inner" />
                              ) : (
                                <div className="p-4 bg-white/50 dark:bg-slate-800/50 rounded-2xl font-black text-slate-900 dark:text-white border border-slate-100 dark:border-transparent">{localData.collegeCode || '---'}</div>
                              )}
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">EIIN</label>
                              {isEditMode ? (
                                <input value={localData.eiin} onChange={(e) => updateLocalField('eiin', e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl font-black text-slate-800 dark:text-white shadow-inner" />
                              ) : (
                                <div className="p-4 bg-white/50 dark:bg-slate-800/50 rounded-2xl font-black text-slate-900 dark:text-white border border-slate-100 dark:border-transparent">{localData.eiin || '---'}</div>
                              )}
                           </div>
                        </div>
                      </div>
                   </div>

                   {/* Admin Profile Credentials */}
                   <div className="space-y-8 bg-slate-50 dark:bg-white/5 p-8 rounded-[40px] border border-slate-200 dark:border-white/5 shadow-inner">
                      <h5 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 px-2">Administrative Credentials</h5>
                      
                      <div className="p-8 bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-md mb-6 space-y-8">
                        <div className="flex flex-col items-center">
                          <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-accent/20 shadow-2xl relative group">
                             <img 
                               src={getDisplayUrl(localData.adminProfilePic) || 'https://via.placeholder.com/150'} 
                               className={`w-full h-full rounded-full ${localData.adminProfilePicFit === 'contain' ? 'object-contain' : 'object-cover'}`} 
                               alt="Admin Profile" 
                             />
                             {isEditMode && (
                               <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                 <span className="text-white text-[10px] font-black uppercase">Upload Photo</span>
                                 <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, (url) => updateLocalField('adminProfilePic', url))} />
                               </label>
                             )}
                          </div>
                          <p className="mt-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Administrator Photo</p>
                        </div>

                        {isEditMode && (
                          <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-slate-400 px-2">Photo Fitting Mode</label>
                            <div className="grid grid-cols-2 gap-4">
                              <button 
                                onClick={() => updateLocalField('adminProfilePicFit', 'contain')}
                                className={`py-3 rounded-2xl font-black text-[10px] uppercase border transition-all ${localData.adminProfilePicFit === 'contain' ? 'bg-accent text-white border-accent' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
                              >
                                Scale to Fit
                              </button>
                              <button 
                                onClick={() => updateLocalField('adminProfilePicFit', 'cover')}
                                className={`py-3 rounded-2xl font-black text-[10px] uppercase border transition-all ${localData.adminProfilePicFit === 'cover' ? 'bg-accent text-white border-accent' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
                              >
                                Fill Circle
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-5">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Admin Username</label>
                           {isEditMode ? (
                             <input value={localData.adminUsername} onChange={(e) => updateLocalField('adminUsername', e.target.value)} className="w-full p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl font-black text-slate-800 dark:text-white shadow-inner" />
                           ) : (
                             <div className="p-4 bg-white/50 dark:bg-slate-800/50 rounded-2xl font-black text-slate-900 dark:text-white border border-slate-100 dark:border-transparent flex items-center justify-between">
                               <span>{localData.adminUsername}</span>
                               <span className="text-[9px] opacity-40 font-bold uppercase">Authorized ID</span>
                             </div>
                           )}
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Admin Password</label>
                           {isEditMode ? (
                             <div className="relative">
                               <input 
                                 type={showPass ? 'text' : 'password'}
                                 value={localData.adminPassword} 
                                 onChange={(e) => updateLocalField('adminPassword', e.target.value)} 
                                 className="w-full p-4 pr-16 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl font-black text-slate-800 dark:text-white shadow-inner" 
                               />
                               <button 
                                 onClick={() => setShowPass(!showPass)}
                                 className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-sky-500 bg-white/10 p-2 rounded-lg"
                               >
                                 {showPass ? 'HIDE' : 'SHOW'}
                               </button>
                             </div>
                           ) : (
                             <div className="p-4 bg-white/50 dark:bg-slate-800/50 rounded-2xl font-black text-slate-900 dark:text-white border border-slate-100 dark:border-transparent">••••••••••••••</div>
                           )}
                        </div>
                      </div>
                   </div>
                </div>
             </div>

             {/* Global Contact & Location Info */}
             <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl p-12 rounded-[60px] border border-slate-200 dark:border-slate-800 shadow-2xl">
                <h4 className="font-black text-3xl uppercase text-slate-900 dark:text-white tracking-tighter mb-12 flex items-center gap-5">
                   <span className="bg-sky-100 dark:bg-sky-900/30 p-4 rounded-3xl text-sky-600 dark:text-sky-400">📍</span> Contact & Global Reach
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                   <div className="space-y-8">
                      <h5 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 px-2">Contact Directory</h5>
                      <div className="space-y-5">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Primary Address (Footer)</label>
                           {isEditMode ? (
                             <input value={localData.address} onChange={(e) => updateLocalField('address', e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl font-black text-slate-800 dark:text-white shadow-inner" />
                           ) : (
                             <div className="p-4 bg-white/50 dark:bg-slate-800/50 rounded-2xl font-black text-slate-900 dark:text-white border border-slate-100 dark:border-transparent">{localData.address}</div>
                           )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Office Phone</label>
                              {isEditMode ? (
                                <input value={localData.phone} onChange={(e) => updateLocalField('phone', e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl font-black text-slate-800 dark:text-white shadow-inner" />
                              ) : (
                                <div className="p-4 bg-white/50 dark:bg-slate-800/50 rounded-2xl font-black text-slate-900 dark:text-white border border-slate-100 dark:border-transparent">{localData.phone}</div>
                              )}
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Support Email</label>
                              {isEditMode ? (
                                <input value={localData.email} onChange={(e) => updateLocalField('email', e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl font-black text-slate-800 dark:text-white shadow-inner" />
                              ) : (
                                <div className="p-4 bg-white/50 dark:bg-slate-800/50 rounded-2xl font-black text-slate-900 dark:text-white border border-slate-100 dark:border-transparent">{localData.email}</div>
                              )}
                           </div>
                        </div>
                      </div>
                   </div>

                   <div className="space-y-8">
                      <h5 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 px-2">Interactive Map & Media</h5>
                      <div className="space-y-5">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Location Descriptor (Detailed)</label>
                           {isEditMode ? (
                             <textarea value={localData.locationText} onChange={(e) => updateLocalField('locationText', e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl font-black text-slate-800 dark:text-white shadow-inner h-20" placeholder="e.g. Near Bagpur Bazar, Pirganj..." />
                           ) : (
                             <div className="p-4 bg-white/50 dark:bg-slate-800/50 rounded-2xl font-black text-slate-900 dark:text-white border border-slate-100 dark:border-transparent italic leading-relaxed">{localData.locationText}</div>
                           )}
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Google Map Embed URL</label>
                           {isEditMode ? (
                             <input value={localData.locationMapUrl} onChange={(e) => updateLocalField('locationMapUrl', e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl font-black text-slate-800 dark:text-white shadow-inner" placeholder="Paste iframe src URL here..." />
                           ) : (
                             <div className="p-4 bg-white/50 dark:bg-slate-800/50 rounded-2xl font-black text-slate-900 dark:text-white border border-slate-100 dark:border-transparent truncate">{localData.locationMapUrl}</div>
                           )}
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">National Anthem YouTube ID</label>
                           {isEditMode ? (
                             <input value={localData.nationalAnthemYoutubeId} onChange={(e) => updateLocalField('nationalAnthemYoutubeId', e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl font-black text-slate-800 dark:text-white shadow-inner" placeholder="e.g. UoX7o_SkaS0" />
                           ) : (
                             <div className="p-4 bg-white/50 dark:bg-slate-800/50 rounded-2xl font-black text-slate-900 dark:text-white border border-slate-100 dark:border-transparent">{localData.nationalAnthemYoutubeId}</div>
                           )}
                        </div>
                      </div>
                   </div>
                </div>
             </div>

             {/* Global Data Portability - Fix for Multi-device Sync */}
             <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl p-12 rounded-[60px] border border-emerald-200 dark:border-emerald-800 shadow-2xl">
                <h4 className="font-black text-3xl uppercase text-slate-900 dark:text-emerald-400 tracking-tighter mb-8 flex items-center gap-5">
                   <span className="bg-emerald-100 dark:bg-emerald-900/30 p-4 rounded-3xl text-emerald-600 dark:text-emerald-400">💾</span> Data Portability & Backup
                </h4>
                <p className="text-slate-500 font-bold mb-10 text-sm italic leading-relaxed">
                  Use these tools for manual backups or to move data between browsers without cloud sync.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="bg-slate-50 dark:bg-slate-950 p-8 rounded-[40px] border border-slate-200 dark:border-white/5 flex flex-col justify-between">
                      <div>
                         <h5 className="font-black text-slate-900 dark:text-white uppercase text-xl">Export Configuration</h5>
                         <p className="text-xs text-slate-400 mt-2 font-bold uppercase tracking-tight">Download everything as a backup file</p>
                      </div>
                      <button onClick={handleExportData} className="mt-8 py-5 bg-emerald-600 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-3">
                         <span>📥</span> Download Backup File
                      </button>
                   </div>
                   <div className="bg-slate-50 dark:bg-slate-950 p-8 rounded-[40px] border border-slate-200 dark:border-white/5 flex flex-col justify-between">
                      <div>
                         <h5 className="font-black text-slate-900 dark:text-white uppercase text-xl">Import Configuration</h5>
                         <p className="text-xs text-slate-400 mt-2 font-bold uppercase tracking-tight">Load data from another device backup</p>
                      </div>
                      <label className="mt-8 py-5 bg-slate-800 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 cursor-pointer">
                         <span>📤</span> Upload Backup File
                         <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
                      </label>
                   </div>
                </div>
             </div>

             <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl p-12 rounded-[60px] border border-slate-200 dark:border-slate-800 shadow-2xl">
                <h4 className="font-black text-3xl uppercase text-slate-900 dark:text-white tracking-tighter mb-12 flex items-center gap-5">
                   <span className="bg-sky-100 dark:bg-sky-900/30 p-4 rounded-3xl text-sky-600 dark:text-sky-400">🎨</span> Institutional Branding & Theme
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
                  <div className="space-y-8">
                    <h5 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 px-2">Typography & Content Colors</h5>
                    <div className="space-y-4">
                      {[
                        { label: 'Primary Text', field: 'primaryTextColor', desc: 'Main paragraphs & content' },
                        { label: 'Secondary Text', field: 'secondaryTextColor', desc: 'Captions & labels' },
                        { label: 'Headings', field: 'headingColor', desc: 'Large titles & branding' },
                      ].map(color => (
                        <div key={color.field} className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-5 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
                           <div className="flex flex-col">
                             <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{color.label}</span>
                             <span className="text-[10px] text-slate-400 font-bold">{color.desc}</span>
                           </div>
                           <input 
                             type="color" 
                             value={(localData.themeConfig as any)[color.field]} 
                             onChange={(e) => updateThemeConfig(color.field as any, e.target.value)}
                             className="w-12 h-12 rounded-xl border-none cursor-pointer shadow-lg"
                           />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-8">
                    <h5 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 px-2">Navigation & Global Theme</h5>
                    <div className="space-y-4">
                      {[
                        { label: 'Nav Link Color', field: 'navTextColor', desc: 'Main menu items' },
                        { label: 'Footer Text', field: 'footerTextColor', desc: 'Bottom copyright area' },
                        { label: 'Accent Color', field: 'accentColor', desc: 'Buttons & highlights' },
                      ].map(color => (
                        <div key={color.field} className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-5 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
                           <div className="flex flex-col">
                             <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{color.label}</span>
                             <span className="text-[10px] text-slate-400 font-bold">{color.desc}</span>
                           </div>
                           <input 
                             type="color" 
                             value={(localData.themeConfig as any)[color.field]} 
                             onChange={(e) => updateThemeConfig(color.field as any, e.target.value)}
                             className="w-12 h-12 rounded-xl border-none cursor-pointer shadow-lg"
                           />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-12 border-t border-slate-100 dark:border-slate-800">
                  <h5 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 px-2 mb-8">Interface Experience</h5>
                  <div className="bg-slate-50 dark:bg-slate-950 p-10 rounded-[50px] border border-slate-200 dark:border-white/10 shadow-inner flex items-center justify-between">
                     <div>
                        <h6 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter text-2xl">Dark Mode Interface</h6>
                        <p className="text-xs font-bold text-slate-500 tracking-wide mt-1">Force dark theme across the portal</p>
                     </div>
                     <button 
                       onClick={() => updateThemeConfig('isDarkMode', !localData.themeConfig.isDarkMode)}
                       className={`relative inline-flex h-12 w-24 items-center rounded-full transition-all shadow-2xl ${localData.themeConfig.isDarkMode ? 'bg-slate-800' : 'bg-sky-400'}`}
                     >
                        <span className={`inline-block h-10 w-10 transform rounded-full bg-white transition-transform shadow-2xl flex items-center justify-center text-xl ${localData.themeConfig.isDarkMode ? 'translate-x-12' : 'translate-x-1'}`}>
                           {localData.themeConfig.isDarkMode ? '🌙' : '☀️'}
                        </span>
                     </button>
                  </div>
                </div>
             </div>
          </div>
        )}
      </main>

      {pendingDelete && (
        <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-3xl flex items-center justify-center p-8">
          <div className="bg-white p-16 rounded-[60px] shadow-2xl text-center max-w-md w-full border border-slate-200 animate-in zoom-in duration-300">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center text-5xl mx-auto mb-10">⚠️</div>
            <h4 className="text-3xl font-black mb-4 uppercase text-slate-900 tracking-tighter leading-none">Confirm Deletion</h4>
            <p className="text-slate-500 font-bold mb-12 uppercase text-[11px] tracking-widest leading-relaxed">
              Are you sure you want to remove:<br/>
              <span className="text-red-600">"{pendingDelete.label}"</span>?
            </p>
            <div className="grid grid-cols-2 gap-6">
              <button onClick={() => setPendingDelete(null)} className="py-6 bg-slate-100 text-slate-700 rounded-[30px] font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
              <button onClick={executeDelete} className="py-6 bg-red-600 text-white rounded-[30px] font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-red-700 transition-all">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
