export type Priority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: Priority;
  category: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_CATEGORIES: string[] = ['Work', 'Personal', 'Shopping', 'Health'];
export type NewTask = Omit<Task, 'id' | 'completed' | 'createdAt' | 'updatedAt'>;
export type TaskChanges = Partial<Omit<Task, 'id' | 'createdAt'>>;