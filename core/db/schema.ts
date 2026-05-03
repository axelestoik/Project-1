
import { UserRole } from '../auth/roles.ts';

export interface Jurisdiction {
  id: string;
  countryCode: string;
  regionCode: string;
  configOverrides: Record<string, string | number | boolean>;
  createdAt: string;
  updatedAt: string;
}

export type BranchStatus = 'active' | 'inactive' | 'deleted';

export interface Branch {
  id: string;
  organizationId: string;
  jurisdictionId: string;
  name: string;
  status: BranchStatus;
  createdAt: string;
  updatedAt: string;
}

export interface BranchAssignment {
  userId: string;
  branchId: string;
  assignedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  createdAt: string;
}

export interface Membership {
  userId: string;
  organizationId: string;
  role: UserRole;
  status: 'Active' | 'Inactive';
  createdAt: string;
  updatedAt: string;
  assignedBy: string;
  branchIds?: string[]; // Para acceso rápido a sucursales asignadas
}

export interface Invitation {
  id: string;
  organizationId: string;
  email: string;
  role: UserRole;
  token: string;
  expiresAt: string;
  createdAt: string;
  createdBy: string;
  status: 'Pending' | 'Accepted' | 'Expired';
}

export interface Property {
  id: string;
  organizationId: string;
  branchId: string;
  name: string;
  address: string;
  type: 'House' | 'Apartment' | 'Commercial';
  status: 'Occupied' | 'Available' | 'Maintenance';
}

export interface Transaction {
  id: string;
  organizationId: string;
  branchId: string;
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
  organizationId: string;
  branchId: string;
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
  organizationId: string;
  branchId: string;
  propertyId: string;
  tenantName: string;
  date: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Overdue';
  items: InvoiceItem[];
}

export interface Quote {
  id: string;
  organizationId: string;
  branchId: string;
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
  organizationId: string;
  branchId: string;
  propertyId: string;
  tenantName: string;
  amount: number;
  frequency: 'Monthly' | 'Quarterly' | 'Yearly';
  nextDate: string;
  status: 'Active' | 'Paused';
}

export interface Payment {
  id: string;
  organizationId: string;
  branchId: string;
  invoiceId?: string;
  propertyId: string;
  amount: number;
  date: string;
  method: 'Transfer' | 'Cash' | 'Card' | 'Check';
  reference: string;
}

export interface Lease {
  id: string;
  organizationId: string;
  branchId: string;
  propertyId: string;
  tenantName: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  securityDeposit: number;
  status: 'Active' | 'Expiring' | 'Terminated' | 'Pending';
}
