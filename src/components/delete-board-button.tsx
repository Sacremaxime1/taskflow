'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { deleteBoard } from '@/app/actions/action'; // importe ton Server Action

interface DeleteBoardButtonProps {
  boardId: string;
  userId: string;
}

type Board = {
    id: string;
    title: string;
    created_at: string;
};

export function DeleteBoardButton({ boardId, userId }: DeleteBoardButtonProps) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await deleteBoard(boardId);
    },
    onMutate: async () => {
      // Optimistic update : on retire le board de la liste avant confirmation serveur
      await queryClient.cancelQueries({ queryKey: ['boards', userId] });
      const previousBoards = queryClient.getQueryData<Board[]>(['boards', userId]);
      queryClient.setQueryData(['boards', userId], (old: Board[] = []) =>
        old.filter((b) => b.id !== boardId)
      );
      return { previousBoards };
    },
    onError: (err, _, context) => {
      // En cas d’erreur → rollback
      queryClient.setQueryData(['boards', userId], context?.previousBoards);
      toast.error('Erreur lors de la suppression du board');
    },
    onSettled: () => {
      // Re-fetch pour être sûr (et toast succès)
      queryClient.invalidateQueries({ queryKey: ['boards', userId] });
      toast.success('Board supprimé avec succès');
    },
  });

  return (
    <AlertDialogAction
      onClick={() => deleteMutation.mutate()}
      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
      disabled={deleteMutation.isPending}
    >
      {deleteMutation.isPending ? 'Suppression en cours...' : 'Supprimer définitivement'}
    </AlertDialogAction>
  );
}