import { useState } from 'react'
import { useAppStore, Task } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { TaskTable } from '@/components/tasks/task-table'
import { TaskModal } from '@/components/tasks/task-modal'
import { RadialChart } from '@/components/ui/charts'

// Sample data for radial charts
const taskStatusData = [
  { name: "completed", value: 8 },
]

const priorityData = [
  { name: "high", value: 6 },
]

const categoryData = [
  { name: "work", value: 8 },
]

const progressData = [
  { name: "in-progress", value: 5 },
]

// Chart configurations
const statusConfig = {
  completed: {
    label: "Completed Tasks",
    color: "hsl(var(--chart-1))",
  },
}

const priorityConfig = {
  high: {
    label: "High Priority",
    color: "hsl(var(--chart-4))",
  },
}

const categoryConfig = {
  work: {
    label: "Work Tasks",
    color: "hsl(var(--chart-2))",
  },
}

const progressConfig = {
  "in-progress": {
    label: "In Progress",
    color: "hsl(var(--chart-3))",
  },
}

export function DashboardPage() {
  const { user } = useAppStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined)

  const handleAddTask = () => {
    setSelectedTask(undefined)
    setIsModalOpen(true)
  }

  const handleEditTask = (task: Task) => {
    setSelectedTask(task)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedTask(undefined)
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome{user?.username ? `, ${user.username}` : ''}! Manage your tasks below.
          </p>
        </div>
        <Button onClick={handleAddTask}>
          <Plus className="mr-2 h-4 w-4" />
          Create Task
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <RadialChart 
          data={taskStatusData} 
          config={statusConfig} 
          title="Task Completion" 
          description="January - June 2024"
          showTrend={true}
          trendValue={4.2}
          trendDirection="up"
          subtitle="Out of 16 total tasks"
        />
        <RadialChart 
          data={priorityData} 
          config={priorityConfig} 
          title="Priority Tasks" 
          description="January - June 2024"
          showTrend={true}
          trendValue={2.7}
          trendDirection="down"
          subtitle="Out of 15 total tasks"
        />
        <RadialChart 
          data={categoryData} 
          config={categoryConfig} 
          title="Work Category" 
          description="January - June 2024"
          showTrend={true}
          trendValue={3.5}
          trendDirection="up"
          subtitle="Out of 16 total tasks"
        />
        <RadialChart 
          data={progressData} 
          config={progressConfig} 
          title="Task Progress" 
          description="January - June 2024"
          showTrend={true}
          trendValue={2.1}
          trendDirection="up"
          subtitle="Out of 16 total tasks"
        />
      </div>
      
      <div className="mt-12">
        <h3 className="text-lg font-medium mb-4">Task Management</h3>
        <TaskTable onEdit={handleEditTask} />
      </div>
      
      <TaskModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        task={selectedTask} 
      />
    </div>
  )
} 