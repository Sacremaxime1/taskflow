'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

type List = {
  id: string;
  title: string;
  position: number;
  created_at: string;
};

interface ListsListProps {
  boardId: string;
  initialLists: List[];
}

export function ListsList({ boardId, initialLists }: ListsListProps) {
  const queryClient = useQueryClient();
  const [newTitle, setNewTitle] = useState('');

  const supabase = createClient();

  const { data: lists } = useQuery<List[]>({
    queryKey: ['lists', boardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lists')
        .select('*')
        .eq('board_id', boardId)
        .order('position', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    initialData: initialLists,
  });

  const createListMutation = useMutation({
    mutationFn: async (title: string) => {
      const position = lists?.length ? Math.max(...lists.map(l => l.position)) + 1 : 0;
      const { data, error } = await supabase
        .from('lists')
        .insert({ title, board_id: boardId, position })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (newList) => {
      queryClient.setQueryData(['lists', boardId], (old: List[] = []) => [...old, newList]);
      setNewTitle('');
      toast.success('Liste créée !');
    },
    onError: () => toast.error('Erreur lors de la création'),
  });

  return (
    <div className="space-y-6">
      {/* Formulaire création */}
      <div className="flex gap-4 max-w-md">
        <Input
          placeholder="Nouvelle liste (ex: À faire)"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && newTitle.trim() && createListMutation.mutate(newTitle.trim())}
        />
        <Button
          onClick={() => newTitle.trim() && createListMutation.mutate(newTitle.trim())}
          disabled={createListMutation.isPending || !newTitle.trim()}
        >
          Ajouter
        </Button>
      </div>

      {/* Affichage des listes */}
      <div className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory">
        {lists?.length ? (
          lists.map((list) => (
            <div
              key={list.id}
              className="min-w-[320px] bg-card border rounded-lg p-4 shadow-sm snap-start"
            >
              <h3 className="font-semibold text-lg mb-3">{list.title}</h3>
              <div className="bg-muted/50 rounded h-32 flex items-center justify-center text-muted-foreground">
                Aucune tâche pour le moment
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground w-full">
            Aucune liste pour le moment. Créez-en une ci-dessus !
          </div>
        )}
      </div>
    </div>
  );
}