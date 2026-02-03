'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

type Board = {
  id: string;
  title: string;
  created_at: string;
};

interface BoardsListProps {
  initialBoards: Board[];
  userId: string;
}

export function BoardsList({ initialBoards, userId }: BoardsListProps) {
  const queryClient = useQueryClient();
  const [newTitle, setNewTitle] = useState('');

  const supabase = createClient();

  const { data: boards, isLoading } = useQuery<Board[]>({
    queryKey: ['boards', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('boards')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('Erreur lors du chargement des boards');
        throw error;
      }
      return data ?? [];
    },
    initialData: initialBoards,
    staleTime: 1000 * 60 * 5,
  });

  const createBoardMutation = useMutation({
    mutationFn: async (title: string) => {
      const { data, error } = await supabase
        .from('boards')
        .insert({ title, user_id: userId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (newBoard) => {
      queryClient.setQueryData<Board[]>(['boards', userId], (old = []) => [
        newBoard,
        ...old,
      ]);
      setNewTitle('');
      toast.success('Board créé !');
    },
    onError: () => {
      toast.error('Erreur lors de la création');
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Chargement des boards...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row gap-4 max-w-xl">
        <Input
          placeholder="Titre du nouveau board..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newTitle.trim()) {
              createBoardMutation.mutate(newTitle.trim());
            }
          }}
        />
        <Button
          onClick={() => {
            if (newTitle.trim()) {
              createBoardMutation.mutate(newTitle.trim());
            }
          }}
          disabled={createBoardMutation.isPending || !newTitle.trim()}
          className="min-w-[120px]"
        >
          {createBoardMutation.isPending ? 'Création...' : 'Créer'}
        </Button>
      </div>

      {boards?.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Aucun board pour le moment. Créez-en un !
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {boards?.map((board) => (
            <Card
              key={board.id}
              className="p-6 hover:shadow-lg transition-all cursor-pointer group"
            >
              <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                {board.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                Créé le {new Date(board.created_at).toLocaleDateString('fr-FR')}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}