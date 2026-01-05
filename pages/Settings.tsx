
import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Shield, 
  Camera, 
  Save, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Settings as SettingsIcon,
  Database,
  ExternalLink,
  Wrench,
  X,
  Link as LinkIcon,
  Upload,
  RefreshCw,
  Zap,
  Hammer
} from 'lucide-react';
import { useAuthStore, useUIStore } from '../lib/store';
import { supabase, isSupabaseConfigured, withTimeout } from '../lib/supabase';

const Settings = () => {
  const { user, updateProfile } = useAuthStore();
  const { addToast } = useUIStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [name, setName] = useState(user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [testingPerms, setTestingPerms] = useState(false);
  const [bucketMissing, setBucketMissing] = useState(false);
  const [showConfigWarning, setShowConfigWarning] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(user?.avatar_url || null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setAvatarUrl(user.avatar_url || '');
      setPreviewUrl(user.avatar_url || null);
    }
  }, [user]);

  const checkStorageStatus = async () => {
    if (!isSupabaseConfigured()) return;
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      if (error) throw error;
      const avatarBucket = buckets?.find(b => b.id === 'avatars');
      setBucketMissing(!avatarBucket);
      if (!avatarBucket) setShowConfigWarning(true);
    } catch (e) {
      console.warn("Storage check failed:", e);
      setBucketMissing(true);
    }
  };

  useEffect(() => {
    checkStorageStatus();
  }, []);

  const fixStorageBucket = async () => {
    setTestingPerms(true);
    try {
      console.log("Attempting to create 'avatars' bucket...");
      const { error } = await supabase.storage.createBucket('avatars', {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif'],
      });
      
      if (error) {
        // If it's just a permission error, we show the SQL guide
        console.error("Bucket creation error:", error);
        setShowConfigWarning(true);
        addToast('error', 'Manual Setup Required', 'Please run the SQL policies in Supabase.');
      } else {
        setBucketMissing(false);
        addToast('success', 'Bucket Created', 'The avatars storage is now ready.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTestingPerms(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);
    console.log("Saving profile changes...", { name, avatarUrl });

    try {
      // Fix: Cast withTimeout result to any to avoid "Property 'error' does not exist on type '{}'" error
      // We wrap the profile update in a timeout to prevent the "forever loading" state
      const { error } = await withTimeout(updateProfile({ name, avatar_url: avatarUrl }), 15000) as any;

      if (error) {
        console.error("Update error:", error);
        setMessage({ type: 'error', text: error.message || "Database update failed." });
        addToast('error', 'Save Failed', error.message || "Connection timeout");
      } else {
        console.log("Profile saved successfully.");
        setMessage({ type: 'success', text: "Your profile has been updated!" });
        addToast('success', 'Changes Saved', 'Admin profile is now in sync.');
      }
    } catch (err: any) {
      console.error("Catch block error:", err);
      setMessage({ type: 'error', text: "Request timed out. The database might be waking up." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 2 * 1024 * 1024) {
        addToast('error', 'File Too Large', 'Max size is 2MB.');
        return;
      }

      setUploading(true);
      console.log("Uploading file:", file.name);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id || 'admin'}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });

      if (uploadError) {
        console.error("Upload failed:", uploadError);
        if (uploadError.message?.toLowerCase().includes('violates row-level security')) {
          setShowConfigWarning(true);
        }
        throw uploadError;
      }

      console.log("Upload success, getting URL...");
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      
      setAvatarUrl(publicUrl);
      setPreviewUrl(publicUrl);
      
      // Auto-save the new URL to the profile immediately
      await updateProfile({ avatar_url: publicUrl });
      
      addToast('success', 'Image Uploaded', 'New profile picture is live.');
    } catch (err: any) {
      console.error("Avatar error:", err);
      addToast('error', 'Upload Error', err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <SettingsIcon className="text-indigo-400" />
            Account Settings
          </h2>
          <p className="text-slate-400 mt-1">Manage your administrator profile and database storage.</p>
        </div>
        <div className="flex gap-2">
          {bucketMissing && (
            <button 
              onClick={fixStorageBucket}
              disabled={testingPerms}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20 text-xs font-bold hover:bg-amber-500/20 transition-all"
            >
              {testingPerms ? <Loader2 size={14} className="animate-spin" /> : <Hammer size={14} />}
              Fix Missing Bucket
            </button>
          )}
          <button 
            onClick={checkStorageStatus}
            className="p-2.5 bg-white/5 text-slate-400 rounded-xl border border-white/10 hover:text-white transition-all"
            title="Refresh Connection Status"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {showConfigWarning && (
        <div className="glass-panel p-6 rounded-3xl border-rose-500/30 bg-rose-500/[0.03] animate-in slide-in-from-top-4 relative overflow-hidden">
          <button onClick={() => setShowConfigWarning(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white z-10"><X size={18} /></button>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-rose-500/20 rounded-2xl text-rose-400 shadow-xl shadow-rose-500/10"><Shield size={24} /></div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white">Missing Security Policies</h3>
              <p className="text-slate-300 text-sm mt-1 leading-relaxed">
                Your uploads are failing because Supabase storage RLS is restricted. You must run these SQL commands in your dashboard.
              </p>
              <div className="mt-4 p-4 bg-slate-950/80 rounded-2xl border border-white/5">
                <pre className="text-[10px] text-slate-400 font-mono overflow-x-auto">
{`CREATE POLICY "avatars_insert" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "avatars_update" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'avatars');
CREATE POLICY "avatars_select" ON storage.objects FOR SELECT TO public USING (bucket_id = 'avatars');`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="glass-panel p-8 rounded-3xl flex flex-col items-center text-center space-y-6 relative group border border-white/5">
            <div className="relative">
              <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-indigo-500/20 bg-slate-800 relative shadow-2xl transition-transform duration-500 group-hover:scale-105">
                <img 
                  src={previewUrl || `https://ui-avatars.com/api/?name=${user?.name || 'Admin'}&background=6366f1&color=fff`} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
                {uploading && (
                  <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center">
                    <Loader2 className="animate-spin text-indigo-400" size={36} />
                  </div>
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-1 right-1 p-3 rounded-2xl bg-indigo-600 text-white shadow-xl hover:bg-indigo-500 transition-all active:scale-90 border-2 border-slate-950"
                disabled={uploading}
              >
                <Upload size={20} />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-white tracking-tight">{user?.name}</h3>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">
                <Shield size={12} /> ADMIN PROFILE
              </div>
            </div>

            <div className="w-full pt-6 border-t border-white/5 space-y-3 text-left">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <span>Storage Sync</span>
                <span className={bucketMissing ? "text-rose-400 flex items-center gap-1" : "text-emerald-400 flex items-center gap-1"}>
                  <div className={`w-1.5 h-1.5 rounded-full ${bucketMissing ? 'bg-rose-400' : 'bg-emerald-400 animate-pulse'}`}></div>
                  {bucketMissing ? "OFFLINE" : "READY"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-8 rounded-3xl border border-white/5 shadow-xl">
            <form onSubmit={handleUpdateProfile} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">Full Name</label>
                  <input 
                    type="text" value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  />
                </div>
                <div className="space-y-3 opacity-60">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">Email</label>
                  <input type="email" value={user?.email} disabled className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-4 text-slate-400 cursor-not-allowed" />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">Avatar URL</label>
                <div className="relative group">
                  <input 
                    type="text" value={avatarUrl} 
                    onChange={(e) => { setAvatarUrl(e.target.value); setPreviewUrl(e.target.value || null); }}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono text-sm"
                    placeholder="https://..."
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"><LinkIcon size={18} /></div>
                </div>
              </div>

              {message && (
                <div className={`p-4 rounded-2xl border flex items-center gap-4 text-sm animate-in fade-in slide-in-from-top-2 ${
                  message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                }`}>
                  {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                  <span className="font-semibold">{message.text}</span>
                </div>
              )}

              <div className="pt-4 flex items-center justify-end">
                <button 
                  type="submit" disabled={isSaving}
                  className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-indigo-600/30 active:scale-95 disabled:opacity-70"
                >
                  {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                  <span>{isSaving ? "Saving Profile..." : "Save Profile"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
