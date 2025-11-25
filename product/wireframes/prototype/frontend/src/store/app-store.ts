import { create } from 'zustand'
import { getCurrentUser, signOut } from 'aws-amplify/auth'

export interface Task {
  id: string
  title: string
  description: string
  status: 'todo' | 'in-progress' | 'completed'
  createdAt: Date
  updatedAt: Date
}

interface AuthState {
  user: any | null
  isAuthenticated: boolean
  isLoading: boolean
}

interface TaskState {
  tasks: Task[]
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateTask: (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>) => void
  deleteTask: (id: string) => void
}

interface AppState extends AuthState, TaskState {
  setUser: (user: any | null) => void
  clearUser: () => void
  checkAuthStatus: () => Promise<void>
  signOut: () => Promise<void>
}

// Sample tasks data
const sampleTasks: Task[] = [
  {
    id: '1',
    title: 'Complete project documentation',
    description: 'Write up the technical documentation for the new feature',
    status: 'todo',
    createdAt: new Date('2023-05-01'),
    updatedAt: new Date('2023-05-01')
  },
  {
    id: '2',
    title: 'Review pull requests',
    description: 'Go through open PRs and provide feedback',
    status: 'in-progress',
    createdAt: new Date('2023-05-02'),
    updatedAt: new Date('2023-05-03')
  },
  {
    id: '3',
    title: 'Fix login bug',
    description: 'Address the authentication issue reported by users',
    status: 'completed',
    createdAt: new Date('2023-04-28'),
    updatedAt: new Date('2023-05-04')
  }
];

export const useAppStore = create<AppState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  tasks: sampleTasks,

  setUser: (user) => 
    set({ user, isAuthenticated: !!user, isLoading: false }),
  
  clearUser: () => 
    set({ user: null, isAuthenticated: false, isLoading: false }),
  
  checkAuthStatus: async () => {
    try {
      const user = await getCurrentUser()
      set({ user, isAuthenticated: true, isLoading: false })
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },

  signOut: async () => {
    try {
      await signOut()
      set({ user: null, isAuthenticated: false })
    } catch (error) {
      console.error('Error signing out:', error)
    }
  },

  addTask: (taskData) => set((state) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      ...taskData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return { tasks: [...state.tasks, newTask] };
  }),

  updateTask: (id, updates) => set((state) => {
    const updatedTasks = state.tasks.map(task => 
      task.id === id ? { ...task, ...updates, updatedAt: new Date() } : task
    );
    return { tasks: updatedTasks };
  }),

  deleteTask: (id) => set((state) => ({
    tasks: state.tasks.filter(task => task.id !== id)
  }))
})) 