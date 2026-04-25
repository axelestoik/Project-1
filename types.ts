
export interface Property {
  id: string;
  name: string;
  address: string;
  type: 'House' | 'Apartment' | 'Commercial';
  status: 'Occupied' | 'Available' | 'Maintenance';
}

export interface Transaction {
  id: string;
  date: string;
  propertyId: string;
  description: string;
  amount: number;
  category: 'Rent' | 'Maintenance' | 'Utilities' | 'Taxes' | 'Other';
  type: 'Income' | 'Expense';
}

export type MaintenanceStatus = 
  | 'Identified' 
  | 'Assessing' 
  | 'Quote' 
  | 'Tech Review' 
  | 'Approved by Tech' 
  | 'Owner Review' 
  | 'Approved by Owner' 
  | 'Shop Materials' 
  | 'Coordinate' 
  | 'Scheduled' 
  | 'Complete';

export interface MaintenanceTask {
  id: string;
  propertyId: string;
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High';
  status: MaintenanceStatus;
  dueDate: string;
  assessmentDate?: string;
  scheduledDate?: string;
}

export interface InvoiceItem {
  description: string;
  price: number;
}

export interface Invoice {
  id: string;
  propertyId: string;
  tenantName: string;
  date: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Overdue';
  items: InvoiceItem[];
}

export interface Quote {
  id: string;
  propertyId: string;
  clientName: string;
  date: string;
  expiryDate: string;
  amount: number;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Declined';
  items: InvoiceItem[];
}

export interface RecurringInvoice {
  id: string;
  propertyId: string;
  tenantName: string;
  amount: number;
  frequency: 'Monthly' | 'Quarterly' | 'Yearly';
  nextDate: string;
  status: 'Active' | 'Paused';
}

export interface Payment {
  id: string;
  invoiceId?: string;
  propertyId: string;
  amount: number;
  date: string;
  method: 'Transfer' | 'Cash' | 'Card' | 'Check';
  reference: string;
}

export interface Lease {
  id: string;
  propertyId: string;
  tenantName: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  securityDeposit: number;
  status: 'Active' | 'Expiring' | 'Terminated' | 'Pending';
}

export enum View {
  Dashboard = 'dashboard',
  Accounting = 'accounting',
  Maintenance = 'maintenance',
  Billing = 'billing',
  Properties = 'properties',
  Leases = 'leases'
}
