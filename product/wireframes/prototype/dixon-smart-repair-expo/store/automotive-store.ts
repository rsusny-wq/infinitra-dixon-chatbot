import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { storage } from './storage'

// Types
export interface Vehicle {
  id: string;
  vin?: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  mileage?: number;
  color?: string;
  nickname?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceRecord {
  id: string;
  vehicleId: string;
  date: Date;
  mileage?: number;
  serviceType: 'maintenance' | 'repair' | 'inspection' | 'other';
  description: string;
  mechanicName?: string;
  shopName?: string;
  cost?: number;
  parts?: string[];
  notes?: string;
  photos?: string[];
  createdAt: Date;
}

export interface Invoice {
  id: string;
  vehicleId: string;
  serviceRecordId?: string;
  date: Date;
  invoiceNumber?: string;
  shopName: string;
  mechanicName?: string;
  subtotal: number;
  tax?: number;
  total: number;
  status: 'paid' | 'pending' | 'overdue';
  paymentMethod?: string;
  items: InvoiceItem[];
  createdAt: Date;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  type: 'labor' | 'parts' | 'other';
}

export interface PreferredMechanic {
  id: string;
  name: string;
  shopName: string;
  address?: string;
  phone?: string;
  email?: string;
  specialties: string[];
  rating?: number;
  notes?: string;
  createdAt: Date;
}

export interface MaintenanceReminder {
  id: string;
  vehicleId: string;
  type: 'oil_change' | 'tire_rotation' | 'brake_inspection' | 'general_inspection' | 'custom';
  title: string;
  description?: string;
  dueDate?: Date;
  dueMileage?: number;
  isCompleted: boolean;
  completedDate?: Date;
  createdAt: Date;
}

interface AutomotiveStore {
  // State
  vehicles: Vehicle[];
  serviceHistory: ServiceRecord[];
  invoices: Invoice[];
  preferredMechanics: PreferredMechanic[];
  maintenanceReminders: MaintenanceReminder[];
  
  // Vehicle Actions
  addVehicle: (vehicle: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateVehicle: (id: string, updates: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => void;
  setDefaultVehicle: (id: string) => void;
  getDefaultVehicle: () => Vehicle | null;
  
  // Service History Actions
  addServiceRecord: (record: Omit<ServiceRecord, 'id' | 'createdAt'>) => void;
  updateServiceRecord: (id: string, updates: Partial<ServiceRecord>) => void;
  deleteServiceRecord: (id: string) => void;
  getServiceHistoryForVehicle: (vehicleId: string) => ServiceRecord[];
  
  // Invoice Actions
  addInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt'>) => void;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  getInvoicesForVehicle: (vehicleId: string) => Invoice[];
  
  // Mechanic Actions
  addPreferredMechanic: (mechanic: Omit<PreferredMechanic, 'id' | 'createdAt'>) => void;
  updatePreferredMechanic: (id: string, updates: Partial<PreferredMechanic>) => void;
  deletePreferredMechanic: (id: string) => void;
  
  // Reminder Actions
  addMaintenanceReminder: (reminder: Omit<MaintenanceReminder, 'id' | 'createdAt'>) => void;
  updateMaintenanceReminder: (id: string, updates: Partial<MaintenanceReminder>) => void;
  deleteMaintenanceReminder: (id: string) => void;
  completeMaintenanceReminder: (id: string) => void;
  getRemindersForVehicle: (vehicleId: string) => MaintenanceReminder[];
  getUpcomingReminders: () => MaintenanceReminder[];
  
  // Utility Actions
  clearAllData: () => void;
}

export const useAutomotiveStore = create<AutomotiveStore>()(
  persist(
    (set, get) => ({
      vehicles: [],
      serviceHistory: [],
      invoices: [],
      preferredMechanics: [],
      maintenanceReminders: [],
      
      // Vehicle Actions
      addVehicle: (vehicleData) => {
        const vehicle: Vehicle = {
          ...vehicleData,
          id: Date.now().toString(),
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        
        set((state) => ({
          vehicles: [...state.vehicles, vehicle]
        }))
      },
      
      updateVehicle: (id, updates) => {
        set((state) => ({
          vehicles: state.vehicles.map(vehicle =>
            vehicle.id === id 
              ? { ...vehicle, ...updates, updatedAt: new Date() }
              : vehicle
          )
        }))
      },
      
      deleteVehicle: (id) => {
        set((state) => ({
          vehicles: state.vehicles.filter(v => v.id !== id),
          serviceHistory: state.serviceHistory.filter(s => s.vehicleId !== id),
          invoices: state.invoices.filter(i => i.vehicleId !== id),
          maintenanceReminders: state.maintenanceReminders.filter(r => r.vehicleId !== id),
        }))
      },
      
      setDefaultVehicle: (id) => {
        set((state) => ({
          vehicles: state.vehicles.map(vehicle => ({
            ...vehicle,
            isDefault: vehicle.id === id,
            updatedAt: vehicle.id === id ? new Date() : vehicle.updatedAt,
          }))
        }))
      },
      
      getDefaultVehicle: () => {
        return get().vehicles.find(v => v.isDefault) || null
      },
      
      // Service History Actions
      addServiceRecord: (recordData) => {
        const record: ServiceRecord = {
          ...recordData,
          id: Date.now().toString(),
          createdAt: new Date(),
        }
        
        set((state) => ({
          serviceHistory: [...state.serviceHistory, record]
        }))
      },
      
      updateServiceRecord: (id, updates) => {
        set((state) => ({
          serviceHistory: state.serviceHistory.map(record =>
            record.id === id ? { ...record, ...updates } : record
          )
        }))
      },
      
      deleteServiceRecord: (id) => {
        set((state) => ({
          serviceHistory: state.serviceHistory.filter(r => r.id !== id)
        }))
      },
      
      getServiceHistoryForVehicle: (vehicleId) => {
        return get().serviceHistory
          .filter(record => record.vehicleId === vehicleId)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      },
      
      // Invoice Actions
      addInvoice: (invoiceData) => {
        const invoice: Invoice = {
          ...invoiceData,
          id: Date.now().toString(),
          createdAt: new Date(),
        }
        
        set((state) => ({
          invoices: [...state.invoices, invoice]
        }))
      },
      
      updateInvoice: (id, updates) => {
        set((state) => ({
          invoices: state.invoices.map(invoice =>
            invoice.id === id ? { ...invoice, ...updates } : invoice
          )
        }))
      },
      
      deleteInvoice: (id) => {
        set((state) => ({
          invoices: state.invoices.filter(i => i.id !== id)
        }))
      },
      
      getInvoicesForVehicle: (vehicleId) => {
        return get().invoices
          .filter(invoice => invoice.vehicleId === vehicleId)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      },
      
      // Mechanic Actions
      addPreferredMechanic: (mechanicData) => {
        const mechanic: PreferredMechanic = {
          ...mechanicData,
          id: Date.now().toString(),
          createdAt: new Date(),
        }
        
        set((state) => ({
          preferredMechanics: [...state.preferredMechanics, mechanic]
        }))
      },
      
      updatePreferredMechanic: (id, updates) => {
        set((state) => ({
          preferredMechanics: state.preferredMechanics.map(mechanic =>
            mechanic.id === id ? { ...mechanic, ...updates } : mechanic
          )
        }))
      },
      
      deletePreferredMechanic: (id) => {
        set((state) => ({
          preferredMechanics: state.preferredMechanics.filter(m => m.id !== id)
        }))
      },
      
      // Reminder Actions
      addMaintenanceReminder: (reminderData) => {
        const reminder: MaintenanceReminder = {
          ...reminderData,
          id: Date.now().toString(),
          createdAt: new Date(),
        }
        
        set((state) => ({
          maintenanceReminders: [...state.maintenanceReminders, reminder]
        }))
      },
      
      updateMaintenanceReminder: (id, updates) => {
        set((state) => ({
          maintenanceReminders: state.maintenanceReminders.map(reminder =>
            reminder.id === id ? { ...reminder, ...updates } : reminder
          )
        }))
      },
      
      deleteMaintenanceReminder: (id) => {
        set((state) => ({
          maintenanceReminders: state.maintenanceReminders.filter(r => r.id !== id)
        }))
      },
      
      completeMaintenanceReminder: (id) => {
        set((state) => ({
          maintenanceReminders: state.maintenanceReminders.map(reminder =>
            reminder.id === id 
              ? { ...reminder, isCompleted: true, completedDate: new Date() }
              : reminder
          )
        }))
      },
      
      getRemindersForVehicle: (vehicleId) => {
        return get().maintenanceReminders
          .filter(reminder => reminder.vehicleId === vehicleId)
          .sort((a, b) => {
            if (a.isCompleted !== b.isCompleted) {
              return a.isCompleted ? 1 : -1
            }
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          })
      },
      
      getUpcomingReminders: () => {
        const now = new Date()
        return get().maintenanceReminders
          .filter(reminder => !reminder.isCompleted)
          .filter(reminder => {
            if (reminder.dueDate) {
              return new Date(reminder.dueDate) <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days
            }
            return true
          })
          .sort((a, b) => {
            if (a.dueDate && b.dueDate) {
              return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
            }
            return 0
          })
      },
      
      clearAllData: () => {
        set({
          vehicles: [],
          serviceHistory: [],
          invoices: [],
          preferredMechanics: [],
          maintenanceReminders: [],
        })
      },
    }),
    {
      name: 'dixon-automotive-storage',
      storage: createJSONStorage(() => storage),
    }
  )
)
