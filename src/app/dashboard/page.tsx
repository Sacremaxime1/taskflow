import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { BoardsList } from '@/components/boards-list';

export default async function Dashboard() {
  const supabase = await createClient();

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) redirect('/login');

  const { data: boards } = await supabase
    .from('boards')
    .select('*')
    .eq('user_id', session.user.id!)
    .order('created_at', { ascending: false });

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Mes boards</h1>
      <BoardsList initialBoards={boards ?? []} userId={session.user.id ?? ''} />
    </div>
  );
}