
import React, { useState, useRef } from 'react';
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
  Upload
} from 'lucide-react';
import { useAuthStore } from '../lib/store';
import { supabase } from '../lib/supabase';

const Settings = () => {
  const { user, updateProfile } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [name, setName] = useState(user?.name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(user?.avatar_url || null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    const { error } = await updateProfile({ name });

    if (error) {
      setMessage({ type: 'error', text: error.message || "Failed to update profile." });
    } else {
      setMessage({ type: 'success', text: "Profile updated successfully!" });
    }
    setIsSaving(false);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      // Basic validation
      if (file.size > 2 * 1024 * 1024) {
        setMessage({ type: 'error', text: "File too large. Max size is 2MB." });
        return;
      }

      setUploading(true);
      setMessage(null);

      // Create a local preview immediately for better UX
      const localUrl = URL.createObjectURL(file);
      setPreviewUrl(localUrl);

      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to Supabase Storage (bucket: 'avatars')
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error("Supabase Storage Error:", uploadError);
        throw new Error(uploadError.message === "Bucket not found" 
          ? "The 'avatars' storage bucket does not exist. Please create it in your Supabase Dashboard."
          : uploadError.message);
      }

      // Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update Profile in DB with new image URL
      const { error: updateError } = await updateProfile({ avatar_url: publicUrl });
      if (updateError) throw updateError;

      setMessage({ type: 'success', text: "Profile picture updated!" });
    } catch (err: any) {
      console.error("Avatar upload process failed:", err);
      setMessage({ 
        type: 'error', 
        text: err.message || "Failed to upload image. Please check your connection and Supabase settings." 
      });
      // Revert preview if it failed
      setPreviewUrl(user?.avatar_url || null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <SettingsIcon className="text-indigo-400" />
          Account Settings
        </h2>
        <p className="text-slate-400 mt-1">Manage your administrator profile and preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="glass-panel p-6 rounded-2xl flex flex-col items-center text-center space-y-4">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-indigo-500/20 bg-slate-800 relative shadow-2xl">
                {previewUrl ? (
                  <img src={previewUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500">
                    <User size={64} />
                  </div>
                )}
                
                {uploading && (
                  <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
                    <Loader2 className="animate-spin text-indigo-400" size={32} />
                  </div>
                )}
              </div>
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-1 right-1 p-2 bg-indigo-600 rounded-full text-white shadow-lg hover:bg-indigo-500 transition-all group-hover:scale-110 active:scale-95"
                disabled={uploading}
              >
                <Camera size={16} />
              </button>
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleAvatarChange}
              />
            </div>

            <div>
              <h3 className="text-xl font-bold text-white">{user?.name}</h3>
              <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mt-1 flex items-center justify-center gap-1.5">
                <Shield size={12} />
                {user?.role} Access
              </p>
            </div>

            <div className="w-full pt-4 border-t border-white/5 space-y-2 text-left">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Status</span>
                <span className="text-emerald-400 font-bold">Active</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Member Since</span>
                <span className="text-slate-300">Nov 2023</span>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
            <h5 className="text-xs font-bold text-indigo-400 uppercase mb-2">Setup Tip</h5>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              To enable image uploads, ensure you have created a public bucket named <code className="text-indigo-300">avatars</code> in your Supabase Storage dashboard.
            </p>
          </div>
        </div>

        {/* Edit Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-8 rounded-2xl">
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <User size={14} className="text-indigo-400" />
                    Full Name
                  </label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    placeholder="Enter your name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-500 flex items-center gap-2">
                    <Mail size={14} />
                    Email Address
                  </label>
                  <input 
                    type="email" 
                    value={user?.email}
                    disabled
                    className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 text-slate-500 cursor-not-allowed"
                  />
                  <p className="text-[10px] text-slate-600 italic">Contact admin to change login email.</p>
                </div>
              </div>

              {message && (
                <div className={`p-4 rounded-xl border flex items-center gap-3 text-sm animate-in fade-in slide-in-from-top-2 ${
                  message.type === 'success' 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                }`}>
                  {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                  <span className="flex-1">{message.text}</span>
                </div>
              )}

              <div className="pt-4 flex items-center justify-end space-x-4">
                <button 
                  type="submit"
                  disabled={isSaving || uploading}
                  className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 active:scale-95"
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  <span>Save Profile</span>
                </button>
              </div>
            </form>
          </div>

          <div className="glass-panel p-8 rounded-2xl border-rose-500/10">
            <h4 className="text-lg font-bold text-white mb-2">Security</h4>
            <p className="text-sm text-slate-400 mb-6">Passwords are managed through the identity provider. We recommend using a strong, unique password.</p>
            <button className="text-sm font-bold text-slate-300 hover:text-white flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg border border-white/5 transition-all">
              <Shield size={16} />
              Reset Admin Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
