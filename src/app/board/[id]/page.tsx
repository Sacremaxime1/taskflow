import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';

interface BoardPageProps {
  params: Promise<{ id: string }>;
}

export default async function BoardPage({ params }: BoardPageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) redirect('/login');

  const { data: board, error } = await supabase
    .from('boards')
    .select('*')
    .eq('id', id)
    .eq('user_id', session.user.id)
    .single();

  if (error || !board) {
    notFound();
  }

  return (
    <div className="container py-8">
      <h1 className="text-4xl font-bold mb-8">{board.title}</h1>

      <div className="text-muted-foreground mb-6">
        Créé le {new Date(board.created_at).toLocaleDateString('fr-FR')}
      </div>

      {/* Ici on ajoutera bientôt les listes et tâches */}
      <div className="bg-muted/50 rounded-lg p-8 text-center">
        <p className="text-lg mb-4">Aucune liste pour le moment</p>
        <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
          Ajouter une liste
        </button>
      </div>
    </div>
  );
}