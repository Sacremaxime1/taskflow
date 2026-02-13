'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { DeleteBoardButton } from './delete-board-button';
import { createBoard } from '@/app/actions/action';

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

  const { data: boards } = useQuery<Board[]>({
    queryKey: ['boards', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('boards')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    initialData: initialBoards,
  });
  const createBoardMutation = useMutation({
    mutationFn: async (title: string) => {
      // Crée un FormData artificiel pour appeler la Server Action
      const formData = new FormData();
      formData.append('title', title.trim());
  
      // Appel de la Server Action (c'est ça le tour de magie)
      const board = await createBoard(formData);
  
      return board; // retourne le board créé pour l'optimistic update
    },
    onSuccess: (newBoard) => {
      queryClient.setQueryData<Board[]>(['boards', userId], (old = []) => [newBoard, ...old]);
      setNewTitle('');
      toast.success('Board créé avec ses 3 colonnes !');
    },
    onError: (error) => {
      console.error(error);
      toast.error('Erreur lors de la création du board');
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex gap-4 max-w-xl">
        <Input
          placeholder="Nouveau board..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newTitle.trim()) {
              createBoardMutation.mutate(newTitle.trim());
            }
          }}
        />
        <Button
          onClick={() => newTitle.trim() && createBoardMutation.mutate(newTitle.trim())}
          disabled={createBoardMutation.isPending || !newTitle.trim()}
        >
          Créer
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {boards?.map((board) => (
          <div key={board.id} className="relative group rounded-lg overflow-hidden">
            <Link
              href={`/board/${board.id}`}
              className="block"
              aria-label={`Ouvrir le board ${board.title}`}
            >
              <Card className="p-6 hover:shadow-lg transition-all h-full">
                <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                  {board.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Créé le {new Date(board.created_at).toLocaleDateString('fr-FR')}
                </p>
              </Card>
            </Link>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer ce board ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est irréversible. Toutes les listes et tâches associées seront perdues.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <DeleteBoardButton boardId={board.id} userId={userId} />
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ))}
      </div>
    </div>
  );
}

