export interface Task {
  // Add the desired attributes here
  title: string;
  description: string;
  status: boolean;
  dueDate: Date;
}

// Complete the function below, making sure to type its parameters and return output
export function addTask(title: string, description: string, dueDate: Date): Task {
  return {
    title,
    description,
    status: false,
    dueDate
   };
}

// Complete the function below, making sure to type its parameters and return output
export function completeTask(task: Task): Task {
  task.status = true;
  return task;
}

// Type the function parameter of the listTasks function
// Curious about the keyword `void`? Use ChatGPT or SkillMate to see if you can find out what it does!
export function listTasks(tasks: Task[]): void {
  tasks.forEach(task => {
    console.log(`${task.title} - ${task.status ? 'Completed' : 'Incomplete'}`);
  });
}

// Add the proper return type for the fetchTasks function below
export async function fetchTasks(): Promise<Task[]> {
  const mockTasks: Task[] = [
    { title: 'Task 1', description: 'Description 1', status: false, dueDate: new Date() },
    { title: 'Task 2', description: 'Description 2', status: false, dueDate: new Date() },
  ];
  return new Promise(resolve => {
    setTimeout(() => resolve(mockTasks), 1000);
  });
}
