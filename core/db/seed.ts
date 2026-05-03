
import { Property, Transaction, MaintenanceTask, Invoice, Quote, RecurringInvoice, Payment, Lease, Jurisdiction, Branch, User, Membership } from './schema.ts';
import bcrypt from 'bcryptjs';

export const initialJurisdictions: Jurisdiction[] = [
  { 
    id: 'jur-usa-ca', 
    countryCode: 'US', 
    regionCode: 'CA', 
    configOverrides: { taxRate: 0.08, mandatoryInspection: true },
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },
  { 
    id: 'jur-can-on', 
    countryCode: 'CA', 
    regionCode: 'ON', 
    configOverrides: { taxRate: 0.13, isHSTEnabled: true },
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  }
];

export const initialBranches: Branch[] = [
  { 
    id: 'br-ca-01', organizationId: 'org-01', jurisdictionId: 'jur-usa-ca', 
    name: 'California Branch', status: 'active', 
    createdAt: '2024-01-01', updatedAt: '2024-01-01' 
  },
  { 
    id: 'br-on-01', organizationId: 'org-01', jurisdictionId: 'jur-can-on', 
    name: 'Ontario Branch', status: 'active', 
    createdAt: '2024-01-01', updatedAt: '2024-01-01' 
  }
];

export const getInitialUsers = async (): Promise<User[]> => {
  const hash = await bcrypt.hash('password123', 10);
  return [
    { id: 'user-01', email: 'overlap@lot202.com', passwordHash: hash, firstName: 'Over', lastName: 'Lap', organizationId: 'org-01', createdAt: '2024-01-01', platformRole: 'None', status: 'Active' },
    { id: 'user-02', email: 'tenant@lot202.com', passwordHash: hash, firstName: 'Tenant', lastName: 'User', organizationId: 'org-01', createdAt: '2024-01-01', platformRole: 'None', status: 'Active' },
    { id: 'user-admin', email: 'admin@lot202.com', passwordHash: hash, firstName: 'Super', lastName: 'Admin', organizationId: 'org-01', createdAt: '2024-01-01', platformRole: 'PlatformAdmin', status: 'Active' },
  ] as unknown as User[];
};

export const initialMemberships: Membership[] = [
  { userId: 'user-01', organizationId: 'org-01', role: 'Staff', branchIds: ['br-ca-01'], status: 'Active', assignedBy: 'system', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { userId: 'user-01', organizationId: 'org-02', role: 'Tenant', branchIds: [], status: 'Active', assignedBy: 'system', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { userId: 'user-02', organizationId: 'org-01', role: 'Tenant', branchIds: [], status: 'Active', assignedBy: 'system', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
];

export const initialProperties: Property[] = [

  { id: '1', organizationId: 'org-01', branchId: 'br-ca-01', name: 'Hillside Manor', address: '123 Hill St.', type: 'House', status: 'Occupied' },
  { id: '2', organizationId: 'org-01', branchId: 'br-on-01', name: 'Central Park Apt', address: '10th Ave #20-30', type: 'Apartment', status: 'Maintenance' },
];

export const initialTransactions: Transaction[] = [
  { id: 't1', organizationId: 'org-01', branchId: 'br-01', date: '2024-05-01', propertyId: '1', description: 'May Rent Payment', amount: 1500, category: 'Rent', type: 'Income' },
  { id: 't2', organizationId: 'org-01', branchId: 'br-02', date: '2024-05-02', propertyId: '2', description: 'Pipe Repair', amount: 200, category: 'Maintenance', type: 'Expense' },
  { id: 't3', organizationId: 'org-01', branchId: 'br-01', date: '2024-05-05', propertyId: '1', description: 'Electricity Bill', amount: 80, category: 'Utilities', type: 'Expense' },
  { id: 't4', organizationId: 'org-02', branchId: 'br-none', date: '2024-05-10', propertyId: '3', description: 'Monthly Rent', amount: 5000, category: 'Rent', type: 'Income' },
];

export const initialTasks: MaintenanceTask[] = [
  { 
    id: 'm1', organizationId: 'org-01', branchId: 'br-02', propertyId: '2', title: 'Water Leak', description: 'Check main bathroom faucet', priority: 'High', 
    status: 'Assessing', assessmentDate: '2024-05-18T10:30', dueDate: '2024-05-20' 
  },
  { 
    id: 'm2', organizationId: 'org-02', branchId: 'br-none', propertyId: '3', title: 'Exterior Painting', description: 'Renew facade paint', priority: 'Medium', 
    status: 'Quote', dueDate: '2024-06-15' 
  },
  { 
    id: 'm3', organizationId: 'org-01', branchId: 'br-01', propertyId: '1', title: 'HVAC Service', description: 'Regular filter replacement', priority: 'Low', 
    status: 'Scheduled', scheduledDate: '2024-05-25T09:00', dueDate: '2024-05-30' 
}];

export const initialInvoices: Invoice[] = [
  { id: 'inv1', organizationId: 'org-01', branchId: 'br-01', propertyId: '1', tenantName: 'John Doe', date: '2024-05-01', amount: 1500, status: 'Paid', items: [{ description: 'Rent', price: 1500 }] },
  { id: 'inv2', organizationId: 'org-01', branchId: 'br-02', propertyId: '2', tenantName: 'Jane Smith', date: '2024-05-01', amount: 850, status: 'Pending', items: [{ description: 'Rent', price: 850 }] },
  { id: 'inv3', organizationId: 'org-02', branchId: 'br-none', propertyId: '3', tenantName: 'Global Corp', date: '2024-05-01', amount: 5000, status: 'Pending', items: [{ description: 'Rent', price: 5000 }] },
];

export const initialQuotes: Quote[] = [
  { id: 'q1', organizationId: 'org-02', branchId: 'br-none', propertyId: '3', clientName: 'Global Corp', date: '2024-05-10', expiryDate: '2024-06-10', amount: 5000, status: 'Sent', items: [{ description: 'Renovation Estimate', price: 5000 }] },
];

export const initialRecurringInvoices: RecurringInvoice[] = [
  { id: 'rec1', organizationId: 'org-01', branchId: 'br-01', propertyId: '1', tenantName: 'John Doe', amount: 1500, frequency: 'Monthly', nextDate: '2024-06-01', status: 'Active' },
];

export const initialPayments: Payment[] = [
  { id: 'pay1', organizationId: 'org-01', branchId: 'br-01', invoiceId: 'inv1', propertyId: '1', amount: 1500, date: '2024-05-02', method: 'Transfer', reference: 'TXN-99221' },
];

export const initialLeases: Lease[] = [
  { id: 'L1', organizationId: 'org-01', branchId: 'br-01', propertyId: '1', tenantName: 'John Doe', startDate: '2024-01-01', endDate: '2024-12-31', monthlyRent: 1500, securityDeposit: 3000, status: 'Active' },
  { id: 'L2', organizationId: 'org-01', branchId: 'br-02', propertyId: '2', tenantName: 'Jane Smith', startDate: '2024-03-01', endDate: '2025-02-28', monthlyRent: 850, securityDeposit: 1700, status: 'Active' },
  { id: 'L3', organizationId: 'org-02', branchId: 'br-none', propertyId: '3', tenantName: 'Global Corp', startDate: '2024-05-01', endDate: '2026-04-30', monthlyRent: 5000, securityDeposit: 10000, status: 'Active' },
];
