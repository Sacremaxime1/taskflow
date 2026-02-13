'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { List } from 'lucide-react';
import { Column } from './column';


interface Task {
  id: string;
  title: string;
  description: string | null;
  list_id: string;
  position: number;
}

interface List {
  id: string;
  title: string;
  tasks: Task[];
}

interface KanbanBoardProps {
  initialLists: List[];
  boardId: string;
}

export function KanbanBoard({ initialLists, boardId }: KanbanBoardProps) {
  const [lists, setLists] = useState<List[]>(initialLists);
  useEffect(() => {
    setLists(initialLists);
  }, [initialLists]);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );
  
  const supabase = createClient();

  const handleDragEnd = async (event: DragEndEvent) => {
    
    const { active, over } = event;
  
    if (!over) return;
  
    const activeId = active.id as string;
    const overId = over.id as string;
  
    let sourceList: List | undefined;
    let taskIndex: number | undefined;
    let task: Task | undefined;
  
    lists.forEach((list) => {
      const index = list.tasks.findIndex((t) => t.id === activeId);
      if (index !== -1) {
        sourceList = list;
        taskIndex = index;
        task = list.tasks[index];
      }
    });

    if (!sourceList || taskIndex === undefined || !task) {
      console.warn('Tâche source introuvable', activeId);
      return;
    }
  
    // Même colonne
    if (sourceList.id === overId) {
      const newTasks = arrayMove(sourceList.tasks, taskIndex, over.data.current?.sortable?.index ?? taskIndex);
      const updatedTasks = newTasks.map((t, idx) => ({ ...t, position: idx }));
  
      setLists((prev) =>
        prev.map((l) => (l.id === sourceList.id ? { ...l, tasks: updatedTasks } : l))
      );
  
      // Sauvegarde
      const updates = updatedTasks.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        list_id: t.list_id,
        position: t.position,
      }));
  
      const { error } = await supabase.from('tasks').upsert(updates, { onConflict: 'id' });
  
      if (error) {
        console.error('Erreur sauvegarde:', error);
        toast.error('Erreur lors du déplacement');
      } else {
        toast.success('Réordonné');
      }
      return;
    }

    const targetList = lists.find((l) => l.id === overId);
    
    if (!targetList) {
      console.warn('Liste cible introuvable', overId);
      return;
    }
  
    const newSourceTasks = sourceList.tasks.filter((_, i) => i !== taskIndex);
    const updatedSource = newSourceTasks.map((t, idx) => ({ ...t, position: idx }));
  
    const targetIndex = over.data.current?.sortable?.index ?? targetList.tasks.length;
    const newTargetTasks = [...targetList.tasks];
    newTargetTasks.splice(targetIndex, 0, { ...task, list_id: targetList.id });
  
    const updatedTarget = newTargetTasks.map((t, idx) => ({ ...t, position: idx }));
  
    setLists((prev) =>
      prev.map((l) => {
        if (l.id === sourceList.id) return { ...l, tasks: updatedSource };
        if (l.id === targetList.id) return { ...l, tasks: updatedTarget };
        return l;
      })
    );

    const allUpdates = [...updatedSource, ...updatedTarget].map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      list_id: t.list_id,
      position: t.position,
    }));
  
    const { error } = await supabase.from('tasks').upsert(allUpdates, { onConflict: 'id' });
  
    if (error) {
      console.error('Erreur sauvegarde inter-colonnes:', error);
      toast.error('Erreur lors du déplacement');
    } else {
      toast.success('Tâche déplacée');
    }
  };
   return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {lists.map((list) => (
            <Column key={list.id} list={list}/>
        ))}
      </div>
    </DndContext>
  );
}