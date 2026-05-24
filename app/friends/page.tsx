'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getPocketBase, User, FriendConnection } from '@/lib/pocketbase';
import { ArrowLeft, UserPlus } from 'lucide-react';

export default function FriendsPage() {
  const router = useRouter();
  const pb = getPocketBase();
  const [users, setUsers] = useState<User[]>([]);
  const [connections, setConnections] = useState<FriendConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'discover' | 'friends' | 'requests'>('discover');
  const userId = pb.authStore.record?.id;

  useEffect(() => {
    const load = async () => {
      try {
        const [usersRes, connsRes] = await Promise.all([
          pb.collection('users').getList(1, 50, { sort: '-created', filter: userId ? `id != "${userId}"` : '' }),
          userId ? pb.collection('friend_connections').getFullList({
            filter: `user_a = "${userId}" || user_b = "${userId}"`,
            expand: 'user_a,user_b',
          }) : Promise.resolve([]),
        ]);
        setUsers(usersRes.items as unknown as User[]);
        setConnections(connsRes as unknown as FriendConnection[]);
      } catch (err) { console.warn('[Friends]', err); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const friends = connections.filter(c => c.status === 'accepted');
  const pending = connections.filter(c => c.status === 'pending');
  const friendIds = new Set(friends.flatMap(c => [c.user_a, c.user_b]));
  const pendingIds = new Set(pending.filter(c => c.initiated_by === userId).map(c => c.user_a === userId ? c.user_b : c.user_a));

  const sendRequest = async (targetId: string) => {
    if (!userId) return;
    try {
      await pb.collection('friend_connections').create({
        user_a: userId, user_b: targetId, status: 'pending', initiated_by: userId,
      });
      setConnections(prev => [...prev, {
        id: `t_${Date.now()}`, user_a: userId!, user_b: targetId,
        status: 'pending', initiated_by: userId!, created: '', updated: '',
      }]);
    } catch {}
  };

  const list = tab === 'friends'
    ? users.filter(u => friendIds.has(u.id))
    : tab === 'requests'
      ? users.filter(u => pending.some(r => r.user_b === userId && r.user_a === u.id))
      : users;

  return (
    <div className="min-h-screen bg-bg">
      <div className="sticky top-0 bg-bg/80 backdrop-blur-lg border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <button onClick={() => router.back()} className="text-text-secondary"><ArrowLeft size={20} /></button>
          <h1 className="text-text-primary font-semibold flex-1">Friends</h1>
        </div>
        <div className="flex gap-2 mt-3 max-w-2xl mx-auto">
          {(['discover', 'friends', 'requests'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${tab === t ? 'bg-primary/20 text-primary-light' : 'bg-surface text-text-muted'}`}>
              {t === 'discover' ? 'Discover' : t === 'friends' ? `Friends (${friends.length})` : `Requests (${pending.length})`}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-2">
        {loading ? <p className="text-text-muted text-center py-10">Loading...</p>
          : list.length === 0
            ? <div className="text-center py-20"><span className="text-5xl">👥</span><p className="text-text-secondary mt-4">No users found</p></div>
            : list.map(u => (
                <div key={u.id} className="flex items-center gap-3 bg-surface border border-border rounded-xl p-4">
                  <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg">
                    {u.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-text-primary font-semibold text-sm truncate">{u.name || 'Cosplayer'}</p>
                    <p className="text-text-muted text-xs truncate">{u.email}</p>
                  </div>
                  {friendIds.has(u.id) ? (
                    <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full">Friends</span>
                  ) : pendingIds.has(u.id) ? (
                    <span className="text-xs font-medium text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full">Pending</span>
                  ) : (
                    <button onClick={() => sendRequest(u.id)} className="p-2 text-primary-light hover:bg-primary/10 rounded-full transition-colors">
                      <UserPlus size={18} />
                    </button>
                  )}
                </div>
              ))
        }
      </div>
    </div>
  );
}
