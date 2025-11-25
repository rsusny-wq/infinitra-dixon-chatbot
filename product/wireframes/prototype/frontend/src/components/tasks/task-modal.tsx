import { Task } from '@/store/app-store'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { TaskForm } from './task-form'

interface TaskModalProps {
  isOpen: boolean
  onClose: () => void
  task?: Task
}

export function TaskModal({ isOpen, onClose, task }: TaskModalProps) {
  const isEditMode = !!task
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Task' : 'Create New Task'}</DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? 'Update the details of your task below.'
              : 'Fill out the form below to create a new task.'}
          </DialogDescription>
        </DialogHeader>
        <TaskForm initialData={task} onSuccess={onClose} />
      </DialogContent>
    </Dialog>
  )
} 