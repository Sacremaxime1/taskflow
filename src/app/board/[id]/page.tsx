// src/app/board/[id]/page.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { TaskCard } from '@/components/task-card';
import { createTask } from '@/app/actions/action';

interface Task {
  id: string;
  title: string;
  description: string | null;
  position: number;
  list_id: string;
}

interface List {
  id: string;
  title: string;
  position: number;
  tasks: Task[];
}

interface BoardPageProps {
  params: Promise<{ id: string }>;
}

export default async function BoardPage({ params }: BoardPageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) redirect('/login');

  // Récupérer le board
  const { data: board, error: boardError } = await supabase
    .from('boards')
    .select('*')
    .eq('id', id)
    .eq('user_id', session.user.id)
    .single();

  if (boardError || !board) notFound();

  // Récupérer toutes les listes du board
  const { data: rawLists } = await supabase
    .from('lists')
    .select('*')
    .eq('board_id', id)
    .order('position', { ascending: true });

  // Récupérer toutes les tâches du board
  const { data: rawTasks } = await supabase
    .from('tasks')
    .select('*')
    .in('list_id', rawLists?.map(l => l.id) || []);

  // Associer les tâches à leur liste
  const lists: List[] = (rawLists || []).map((list) => ({
    ...list,
    tasks: (rawTasks || [])
      .filter((t) => t.list_id === list.id)
      .sort((a, b) => a.position - b.position),
  }));

  // Si jamais les 3 listes n'existent pas (cas rare), on fallback avec des placeholders
  while (lists.length < 3) {
    lists.push({
      id: `placeholder-${lists.length}`,
      title: ['À faire', 'En cours', 'Terminé'][lists.length],
      position: lists.length,
      tasks: [],
    });
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold">{board.title}</h1>
          <p className="text-muted-foreground mt-1">
            Créé le {new Date(board.created_at).toLocaleDateString('fr-FR')}
          </p>
        </div>

        {/* Bouton Nouvelle tâche */}
        <Dialog>
          <DialogTrigger asChild>
            <Button size="lg">+ Nouvelle tâche</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Nouvelle tâche</DialogTitle>
            </DialogHeader>
            <form action={createTask} className="space-y-4 mt-4">
              <input type="hidden" name="boardId" value={board.id} />
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">
                  Titre
                </label>
                <Input id="title" name="title" placeholder="Ex: Faire les courses" required />
              </div>
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description (facultatif)
                </label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Détails, notes, liens..."
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button type="submit">Créer dans « À faire »</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Les 3 colonnes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {lists.slice(0, 3).map((list) => (  // on limite à 3 pour l'instant
          <div key={list.id} className="bg-muted/30 rounded-xl p-4 border min-h-[400px] flex flex-col">
            <h2 className="font-semibold text-lg mb-4 pb-2 border-b">
              {list.title}
            </h2>

            <div className="flex-1 space-y-3 overflow-y-auto">
              {list.tasks.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  Glissez des tâches ici
                </div>
              ) : (
                list.tasks.map((task: Task) => (
                  <TaskCard key={task.id} task={task} />
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}