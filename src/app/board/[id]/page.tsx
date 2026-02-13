// src/app/board/[id]/page.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { KanbanBoard } from '@/components/kanban-board';
import { CreateTaskDialog } from '@/components/create-task-dial';

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

  const { data: board, error: boardError } = await supabase
    .from('boards')
    .select('*')
    .eq('id', id)
    .eq('user_id', session.user.id)
    .single();

  if (boardError || !board) notFound();

  const { data: rawLists } = await supabase
    .from('lists')
    .select('*')
    .eq('board_id', id)
    .order('position', { ascending: true });

  const { data: rawTasks } = await supabase
    .from('tasks')
    .select('*')
    .in('list_id', rawLists?.map(l => l.id) || []);

  const lists: List[] = (rawLists || []).map((list) => ({
    ...list,
    tasks: (rawTasks || [])
      .filter((t) => t.list_id === list.id)
      .sort((a, b) => a.position - b.position),
  }));

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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold">{board.title}</h1>
          <p className="text-muted-foreground mt-1">
            Créé le {new Date(board.created_at).toLocaleDateString('fr-FR')}
          </p>
        </div>
        <CreateTaskDialog boardId={board.id}/>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KanbanBoard initialLists={lists} boardId={board.id} ></KanbanBoard>
      </div>
    </div>
  );
}