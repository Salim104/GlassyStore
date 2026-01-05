
import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Sparkles, Loader2, Upload, Image as ImageIcon, Trash2, AlertCircle } from 'lucide-react';
import { useUIStore } from '../lib/store';
import { generateProductDescription } from '../lib/geminiService';
import { mockCategories } from '../lib/mockData';
import { supabase, isSupabaseConfigured, withTimeout } from '../lib/supabase';
import { Category } from '../types';

export const ProductDrawer = () => {
  const { isDrawerOpen, closeDrawer, drawerType, drawerData, triggerRefresh } = useUIStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [categories, setCategories] = useState<Category[]>(mockCategories);
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    price: '',
    stock: '',
    brand: '',
    description: '',
    image_url: ''
  });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      if (isSupabaseConfigured()) {
        try {
          const { data } = await withTimeout(supabase.from('categories').select('*'), 3000) as any;
          if (data && data.length > 0) setCategories(data);
        } catch (err) {
          console.warn("Failed to load categories from DB");
        }
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    setError(null);
    if (drawerType === 'edit' && drawerData) {
      setFormData({
        name: drawerData.name,
        category_id: drawerData.category_id || '',
        price: drawerData.price.toString(),
        stock: drawerData.stock.toString(),
        brand: drawerData.brand || '',
        description: drawerData.description || '',
        image_url: drawerData.image_url || ''
      });
      setPreviewUrl(drawerData.image_url || null);
    } else {
      setFormData({
        name: '',
        category_id: '',
        price: '',
        stock: '',
        brand: '',
        description: '',
        image_url: ''
      });
      setPreviewUrl(null);
      setSelectedFile(null);
    }
  }, [drawerType, drawerData, isDrawerOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setFormData(prev => ({ ...prev, image_url: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAiDescription = async () => {
    if (!formData.name) return;
    setIsGenerating(true);
    const description = await generateProductDescription(formData.name, formData.brand || "modern features");
    setFormData(prev => ({ ...prev, description: description || '' }));
    setIsGenerating(false);
  };

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `products/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    
    try {
      let finalImageUrl = formData.image_url;
      
      if (selectedFile && isSupabaseConfigured()) {
        try {
          finalImageUrl = await uploadImage(selectedFile);
        } catch (err: any) {
          console.error("Storage upload failed", err);
          throw new Error("Image upload failed: " + err.message);
        }
      }

      const payload = {
        name: formData.name,
        category_id: formData.category_id || null,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        brand: formData.brand,
        description: formData.description,
        image_url: finalImageUrl
      };

      if (isSupabaseConfigured()) {
        let dbError: any = null;
        if (drawerType === 'edit') {
          if (!drawerData?.id) throw new Error("Missing product ID for update.");
          const res = await withTimeout(supabase.from('products').update(payload).eq('id', drawerData.id), 8000) as any;
          dbError = res.error;
        } else {
          const res = await withTimeout(supabase.from('products').insert([payload]), 8000) as any;
          dbError = res.error;
        }
        
        if (dbError) {
          console.error("Database error during save:", dbError);
          throw new Error(`Database Error: ${dbError.message || 'Unknown error'}`);
        }
      } else {
        console.log("Mock Submit:", payload);
      }
      
      triggerRefresh();
      closeDrawer();
    } catch (error: any) {
      console.error("Error saving product:", error);
      setError(error.message || "Failed to save product to database.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      <div 
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={closeDrawer}
      ></div>

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md transform transition-transform duration-500 ease-in-out sm:duration-700">
          <div className="flex h-full flex-col bg-slate-900 shadow-2xl border-l border-white/10">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-semibold text-white">
                {drawerType === 'add' ? 'Add New Product' : 'Edit Product'}
              </h2>
              <button onClick={closeDrawer} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/5">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {error && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start space-x-3">
                  <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                  <span className="flex-1">{error}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Product Image</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative w-full aspect-video rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center ${
                      previewUrl ? 'border-transparent' : 'border-white/10 hover:border-indigo-500/50 hover:bg-white/5'
                    }`}
                  >
                    {previewUrl ? (
                      <>
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center space-x-3">
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                            className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20"
                          >
                            <Upload size={18} />
                          </button>
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleRemoveImage(); }}
                            className="p-2 bg-red-500/20 backdrop-blur-md rounded-full text-red-400 hover:bg-red-500/30"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-6">
                        <div className="inline-flex p-3 rounded-xl bg-white/5 text-slate-400 mb-3">
                          <ImageIcon size={28} />
                        </div>
                        <p className="text-sm font-medium text-slate-300">Click to upload product image</p>
                        <p className="text-xs text-slate-500 mt-1">Supports JPG, PNG, WEBP (Max 5MB)</p>
                      </div>
                    )}
                  </div>
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleFileChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Product Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    placeholder="e.g. Neural Headphones"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Category</label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    >
                      <option value="">Select Category</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id} className="bg-slate-900">{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Brand</label>
                    <input
                      type="text"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      placeholder="e.g. SonicFlow"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Stock</label>
                    <input
                      type="number"
                      required
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-slate-300">Description</label>
                    <button
                      type="button"
                      onClick={handleAiDescription}
                      disabled={isGenerating || !formData.name}
                      className="flex items-center space-x-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
                    >
                      {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      <span>Generate with AI</span>
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                    placeholder="Describe your product..."
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-white/10">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-all duration-300 shadow-lg shadow-indigo-600/20 disabled:opacity-70"
                >
                  {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                  <span>{drawerType === 'add' ? 'Create Product' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
