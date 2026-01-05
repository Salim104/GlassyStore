
import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, MoreHorizontal, Edit, Trash2, Loader2, PackageOpen, RefreshCw } from 'lucide-react';
import { useUIStore } from '../lib/store';
import { Product, Category } from '../types';
import { supabase, withTimeout } from '../lib/supabase';
import { mockCategories } from '../lib/mockData';

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>(mockCategories);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { openDrawer, refreshTrigger } = useUIStore();

  const fetchData = async () => {
    setLoading(true);
    try {
      // Increased timeout to handle slower initial queries after auth
      const { data: productsData, error: prodErr } = await withTimeout(
        supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false }),
        20000
      ) as any;
      
      if (prodErr) throw prodErr;
      
      const { data: catData } = await withTimeout(
        supabase.from('categories').select('*'),
        15000
      ) as any;
      
      setProducts(productsData || []);
      if (catData && catData.length > 0) setCategories(catData);
    } catch (err: any) {
      console.error("Fetch products error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and listen for triggers
  useEffect(() => {
    fetchData();
  }, [refreshTrigger]);

  const deleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete product from database. Check your permissions.");
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Products</h2>
          <p className="text-slate-400 mt-1">Manage your live inventory and product catalogue.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={fetchData}
            className="p-3 bg-white/5 hover:bg-white/10 text-slate-400 rounded-xl transition-all"
            title="Refresh List"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin text-indigo-400' : ''} />
          </button>
          <button 
            onClick={() => openDrawer('add')}
            className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-indigo-600/20"
          >
            <Plus size={20} />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>
        <button className="flex items-center space-x-2 glass-card px-4 py-3 rounded-xl text-slate-300 hover:text-white transition-all">
          <Filter size={18} />
          <span>Filters</span>
        </button>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden min-h-[400px]">
        {loading && products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin text-indigo-500 mb-4" size={40} />
            <p className="text-slate-400 font-medium">Querying database...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-xs uppercase text-slate-500 bg-white/5 tracking-wider border-b border-white/5">
                <tr>
                  <th className="px-6 py-4 font-semibold">Product</th>
                  <th className="px-6 py-4 font-semibold">Category</th>
                  <th className="px-6 py-4 font-semibold text-right">Price</th>
                  <th className="px-6 py-4 font-semibold text-right">Stock</th>
                  <th className="px-6 py-4 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredProducts.length > 0 ? filteredProducts.map((product) => (
                  <tr key={product.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-white/10 bg-white/5">
                          <img 
                            src={product.image_url || `https://picsum.photos/seed/${product.id}/400`} 
                            alt={product.name} 
                            className="w-full h-full object-cover" 
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400?text=No+Image'; }}
                          />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-200">{product.name}</div>
                          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{product.brand}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs px-2 py-1 bg-white/5 rounded-md text-slate-400">
                        {categories.find(c => c.id === product.category_id)?.name || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-200">${Number(product.price).toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex items-center text-xs font-bold ${product.stock < 10 ? 'text-amber-400' : 'text-slate-400'}`}>
                        {product.stock} units
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button 
                          onClick={() => openDrawer('edit', product)}
                          className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-lg transition-all"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => deleteProduct(product.id)}
                          className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center opacity-50">
                        <PackageOpen size={48} className="mb-4 text-slate-600" />
                        <p className="text-slate-400 font-medium">Your inventory is empty.</p>
                        <button onClick={() => openDrawer('add')} className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm font-bold">Add your first product</button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
