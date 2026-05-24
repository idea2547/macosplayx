'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getPocketBase, Product, getImageUrl } from '@/lib/pocketbase';
import { Search, MapPin, ArrowLeft } from 'lucide-react';

export default function ShopPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const pb = getPocketBase();
        let filter = 'status = "published"';
        if (search) filter += ` && (title ~ "${search}" || character_text ~ "${search}" || series_text ~ "${search}")`;
        const res = await pb.collection('products').getList(1, 30, { filter, sort: '-created', expand: 'seller,store' });
        setProducts(res.items as unknown as Product[]);
      } catch (err) { console.warn('[Shop]', err); }
      finally { setLoading(false); }
    };
    load();
  }, [search]);

  return (
    <div className="min-h-screen bg-bg">
      <div className="sticky top-0 z-10 bg-bg/80 backdrop-blur-lg border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 max-w-4xl mx-auto">
          <button onClick={() => router.back()} className="text-text-secondary"><ArrowLeft size={20} /></button>
          <h1 className="text-text-primary font-semibold flex-1">Shop</h1>
        </div>
        <div className="flex items-center gap-2 bg-surface rounded-full px-4 py-2 mt-3 max-w-4xl mx-auto border border-border">
          <Search size={16} className="text-text-muted" />
          <input className="flex-1 bg-transparent text-text-primary text-sm placeholder-text-muted focus:outline-none"
            placeholder="Search outfits, characters, series..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4 max-w-6xl mx-auto">
        {loading
          ? Array.from({length:8}).map((_,i) => <div key={i} className="bg-surface rounded-xl aspect-square animate-pulse" />)
          : products.length === 0
            ? <div className="col-span-full text-center py-20"><span className="text-5xl">👗</span><p className="text-text-secondary mt-4">No outfits found</p></div>
            : products.map(p => {
                const img = p.images?.[0] ? getImageUrl(p, p.images[0], '300x300') : '';
                const price = p.listing_type === 'rental' ? `฿${p.rental_price_per_day}/day` : `฿${p.price}`;
                return (
                  <div key={p.id} className="bg-surface border border-border rounded-xl overflow-hidden hover:border-primary/40 transition-colors group cursor-pointer">
                    {img
                      ? <img src={img} alt={p.title} className="w-full aspect-square object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                      : <div className="w-full aspect-square flex items-center justify-center bg-bg-elevated"><span className="text-4xl">🎭</span></div>
                    }
                    <div className="p-3">
                      <p className="text-text-primary text-sm font-semibold truncate">{p.title}</p>
                      {p.character_text && <p className="text-text-muted text-xs truncate mt-0.5">{p.character_text}</p>}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-primary-light text-sm font-bold">{price}</span>
                        {p.size_label && <span className="text-text-muted text-xs bg-bg-elevated px-2 py-0.5 rounded">{p.size_label}</span>}
                      </div>
                      {p.location_province && <div className="flex items-center gap-1 mt-1.5"><MapPin size={10} className="text-text-muted" /><span className="text-text-muted text-xs">{p.location_province}</span></div>}
                    </div>
                  </div>
                );
              })
        }
      </div>
    </div>
  );
}
