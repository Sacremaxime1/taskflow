'use server';

import { createClient } from '@/lib/supabase/server';
import { error } from 'console';
import { revalidatePath } from 'next/cache';

export async function createBoard(formData: FormData) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const title = formData.get('title') as String
  if (!title?.trim()) {
    throw error('title required');
  }
  if (!session?.user?.id) {
    throw new Error('Utilisateur non authentifié');
  }

  const { data: board, error: boardError } = await supabase
    .from('boards')
    .insert({ title, user_id: session.user.id })
    .select()
    .single();

  if (boardError || !board) {
    throw boardError || new Error('Échec création board');
  }

  const defaultLists = [
    { title: 'À faire', position: 0 },
    { title: 'En cours', position: 1 },
    { title: 'Terminé', position: 2 },
  ];

  const { error: listsError } = await supabase
    .from('lists')
    .insert(
      defaultLists.map((list) => ({
        ...list,
        board_id: board.id,
      }))
    );

  if (listsError) {
    console.error('Erreur listes :', listsError);
    throw listsError;
  }

  revalidatePath('/dashboard');
  return board;
}

export async function deleteBoard(boardId: string) {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Non authentifié');
  
    const { error } = await supabase
      .from('boards')
      .delete()
      .eq('id', boardId)
      .eq('user_id', session.user.id);
  
    if (error) throw error;
  
    revalidatePath('/dashboard');
  }
  export async function createTask(formData: FormData) {
    const title = formData.get('title') as string;
    const description = (formData.get('description') as string) || null;
    const boardId = formData.get('boardId') as string;
  
    if (!title?.trim() || !boardId) {
      throw new Error('Titre et board requis');
    }
  
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Non authentifié');
  
    // On récupère l'ID de la liste "À faire" (position 0)
    const { data: todoList } = await supabase
      .from('lists')
      .select('id')
      .eq('board_id', boardId)
      .eq('position', 0)
      .single();
  
    if (!todoList) throw new Error('Liste À faire non trouvée');
  
    // Position : dernière tâche dans "À faire" + 1
    const { data: lastTask } = await supabase
      .from('tasks')
      .select('position')
      .eq('list_id', todoList.id)
      .order('position', { ascending: false })
      .limit(1)
      .single();
  
    const position = lastTask ? lastTask.position + 1 : 0;
  
    const { error } = await supabase
      .from('tasks')
      .insert({
        title: title.trim(),
        description,
        list_id: todoList.id,
        position,
      });
  
    if (error) throw error;
  
    revalidatePath(`/board/${boardId}`);
  }