
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SchoolData } from '../types';

interface LoginProps {
  setIsAdmin: (val: boolean) => void;
  schoolData: SchoolData;
}

const Login: React.FC<LoginProps> = ({ setIsAdmin, schoolData }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === schoolData.adminUsername && password === schoolData.adminPassword) {
      setIsAdmin(true);
      localStorage.setItem('admin_session', 'active');
      navigate('/admin');
    } else {
      setError('Wrong ID or password! Try again.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 relative overflow-hidden transition-colors duration-300">
      {/* Dynamic Background elements */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-heading rounded-full blur-[100px] opacity-10 animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent rounded-full blur-[120px] opacity-10 animate-pulse" style={{animationDelay: '-1.5s'}}></div>

      <div className="max-w-xl w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl rounded-[50px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] p-12 border border-slate-200 dark:border-slate-800 relative z-10">
        <div className="text-center mb-12">
            <div className="w-24 h-24 bg-heading rounded-[40px] flex items-center justify-center text-white text-4xl font-black mx-auto mb-6 shadow-2xl border-4 border-white dark:border-slate-800">
                <img src={schoolData.logoUrl} className="w-16 h-16 object-contain" alt="Logo" />
            </div>
            <h2 className="text-4xl font-black text-slate-800 dark:text-white mb-2 uppercase tracking-tighter">Office Access</h2>
            <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs">{schoolData.schoolName}</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-8">
          <div className="space-y-3">
            <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] px-2">User ID / Username</label>
            <div className="relative">
                <input 
                type="text" 
                className="w-full p-5 bg-slate-50/50 dark:bg-slate-950/50 rounded-3xl border-2 border-transparent focus:border-accent dark:focus:border-accent focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-accent/10 outline-none transition-all font-black text-slate-700 dark:text-white shadow-inner"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Admin ID"
                required
                />
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] px-2">Secure Password</label>
            <div className="relative group">
                <input 
                type={showPassword ? "text" : "password"} 
                className="w-full p-5 pr-14 bg-slate-50/50 dark:bg-slate-950/50 rounded-3xl border-2 border-transparent focus:border-accent dark:focus:border-accent focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-accent/10 outline-none transition-all font-black text-slate-700 dark:text-white shadow-inner"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-accent transition-colors p-2"
                  title={showPassword ? "Hide Password" : "Show Password"}
                >
                  {showPassword ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.888 9.888L3 3m18 18l-6.876-6.876" /></svg>
                  )}
                </button>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-500 p-5 rounded-3xl font-black text-center border border-red-100 dark:border-red-900/50 animate-bounce">
                {error}
            </div>
          )}
          
          <button 
            type="submit" 
            className="w-full bg-heading text-white py-6 rounded-3xl font-black text-xl shadow-2xl hover:-translate-y-2 active:scale-95 transition-all uppercase tracking-tighter"
          >
            Authenticate Access
          </button>
        </form>

        <div className="mt-12 text-center border-t border-slate-100 dark:border-slate-800 pt-8">
            <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest leading-relaxed">
              Institutional Admin Hub<br/>
              <span className="text-slate-600 dark:text-slate-300 font-black">{schoolData.schoolName}</span>
            </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
