import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TaskCard } from './task-card';

interface List {
    id: string;
    title: string;
    tasks: Task[];
  }
  
  interface Task {
    id: string;
    title: string;
    description: string | null;
    list_id: string;
    position: number;
  }

interface ListProps {
    list: List
}

export function Column({ list }: ListProps) {
  // On rend la colonne "détectable" par dnd-kit
  const { setNodeRef } = useDroppable({
    id: list.id,
  });

  return (
    <div 
      ref={setNodeRef} // Indispensable !
      className="bg-muted/40 rounded-xl p-4 border min-h-[500px] flex flex-col"
    >
      <h2 className="font-bold text-lg mb-4 pb-2 border-b">{list.title}</h2>
      
      <SortableContext
        id={list.id}
        items={list.tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex-1 space-y-3">
          {list.tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}