import { 
  Property, Transaction, MaintenanceTask, Invoice, 
  Quote, RecurringInvoice, Payment, Lease, Branch, Jurisdiction 
} from './schema.ts';
import { 
  initialProperties, initialTransactions, initialTasks, 
  initialInvoices, initialQuotes, initialRecurringInvoices, 
  initialPayments, initialLeases, initialBranches, initialJurisdictions 
} from './seed.ts';

/**
 * ScopedRepository provides a way to access data filtered by organization and branch.
 */
export class ScopedRepository {
  private organizationId: string | null;
  private branchId: string | null;

  constructor(organizationId: string | null, branchId: string | null) {
    this.organizationId = organizationId;
    this.branchId = branchId;
  }

  private filterScoped<T extends { organizationId: string; branchId: string }>(data: T[]): T[] {
    return data.filter(item => {
      const orgMatch = !this.organizationId || item.organizationId === this.organizationId;
      const branchMatch = !this.branchId || item.branchId === this.branchId || item.branchId === 'br-none';
      return orgMatch && branchMatch;
    });
  }

  getProperties(): Property[] {
    return this.filterScoped(initialProperties);
  }

  getTransactions(): Transaction[] {
    return this.filterScoped(initialTransactions);
  }

  getTasks(): MaintenanceTask[] {
    return this.filterScoped(initialTasks);
  }

  getInvoices(): Invoice[] {
    return this.filterScoped(initialInvoices);
  }

  getQuotes(): Quote[] {
    return this.filterScoped(initialQuotes);
  }

  getRecurringInvoices(): RecurringInvoice[] {
    return this.filterScoped(initialRecurringInvoices);
  }

  getPayments(): Payment[] {
    return this.filterScoped(initialPayments);
  }

  getLeases(): Lease[] {
    return this.filterScoped(initialLeases);
  }

  getBranches(): Branch[] {
    return initialBranches.filter(b => !this.organizationId || b.organizationId === this.organizationId);
  }

  getJurisdictionForActiveBranch(): Jurisdiction | null {
    if (!this.branchId) return null;
    const branch = initialBranches.find(b => b.id === this.branchId);
    if (!branch) return null;
    return initialJurisdictions.find(j => j.id === branch.jurisdictionId) || null;
  }
}

/**
 * Utility to create a repository instance with current context.
 * In a real backend, this would be injected by a middleware.
 */
export const createRepository = (orgId: string | null, branchId: string | null) => {
  return new ScopedRepository(orgId, branchId);
};
