import { Card } from '@/components/ui/card';

interface Task {
  id: string;
  title: string;
  description?: string | null;
}

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing">
      <h4 className="font-medium">{task.title}</h4>
      {task.description && (
        <p className="text-sm text-muted-foreground mt-2">{task.description}</p>
      )}
    </Card>
  );
}