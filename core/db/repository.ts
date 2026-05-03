import { db } from './drizzle-db.ts';
import { 
  properties, transactions, maintenanceTasks, invoices, 
  quotes, recurringInvoices, payments, leases, branches, jurisdictions 
} from './drizzle-schema.ts';
import { eq, and } from 'drizzle-orm';
import { 
  Property, Transaction, MaintenanceTask, Invoice, 
  Quote, RecurringInvoice, Payment, Lease, Branch, Jurisdiction 
} from './schema.ts';

/**
 * ScopedRepository provides a way to access data filtered by organization and branch.
 * Now integrated with PostgreSQL via Drizzle ORM.
 */
export class ScopedRepository {
  private organizationId: string | null;
  private branchId: string | null;

  constructor(organizationId: string | null, branchId: string | null) {
    this.organizationId = organizationId;
    this.branchId = branchId;
  }

  async getProperties(): Promise<Property[]> {
    if (!this.organizationId) return [];
    
    return await db.select().from(properties).where(
      and(
        eq(properties.organizationId, this.organizationId),
        this.branchId ? eq(properties.branchId, this.branchId) : undefined
      )
    ) as Property[];
  }

  async getTransactions(): Promise<Transaction[]> {
    if (!this.organizationId) return [];
    return await db.select().from(transactions).where(
      and(
        eq(transactions.organizationId, this.organizationId),
        this.branchId ? eq(transactions.branchId, this.branchId) : undefined
      )
    ) as unknown as Transaction[];
  }

  async getTasks(): Promise<MaintenanceTask[]> {
    if (!this.organizationId) return [];
    return await db.select().from(maintenanceTasks).where(
      and(
        eq(maintenanceTasks.organizationId, this.organizationId),
        this.branchId ? eq(maintenanceTasks.branchId, this.branchId) : undefined
      )
    ) as unknown as MaintenanceTask[];
  }

  async getInvoices(): Promise<Invoice[]> {
    if (!this.organizationId) return [];
    return await db.select().from(invoices).where(
      and(
        eq(invoices.organizationId, this.organizationId),
        this.branchId ? eq(invoices.branchId, this.branchId) : undefined
      )
    ) as unknown as Invoice[];
  }

  async getQuotes(): Promise<Quote[]> {
    if (!this.organizationId) return [];
    return await db.select().from(quotes).where(
      and(
        eq(quotes.organizationId, this.organizationId),
        this.branchId ? eq(quotes.branchId, this.branchId) : undefined
      )
    ) as unknown as Quote[];
  }

  async getRecurringInvoices(): Promise<RecurringInvoice[]> {
    if (!this.organizationId) return [];
    return await db.select().from(recurringInvoices).where(
      and(
        eq(recurringInvoices.organizationId, this.organizationId),
        this.branchId ? eq(recurringInvoices.branchId, this.branchId) : undefined
      )
    ) as unknown as RecurringInvoice[];
  }

  async getPayments(): Promise<Payment[]> {
    if (!this.organizationId) return [];
    return await db.select().from(payments).where(
      and(
        eq(payments.organizationId, this.organizationId),
        this.branchId ? eq(payments.branchId, this.branchId) : undefined
      )
    ) as unknown as Payment[];
  }

  async getLeases(): Promise<Lease[]> {
    if (!this.organizationId) return [];
    return await db.select().from(leases).where(
      and(
        eq(leases.organizationId, this.organizationId),
        this.branchId ? eq(leases.branchId, this.branchId) : undefined
      )
    ) as unknown as Lease[];
  }

  async getBranches(): Promise<Branch[]> {
    if (!this.organizationId) return [];
    return await db.select().from(branches).where(
      eq(branches.organizationId, this.organizationId)
    ) as unknown as Branch[];
  }

  async getJurisdictionForActiveBranch(): Promise<Jurisdiction | null> {
    if (!this.branchId) return null;
    const [branch] = await db.select().from(branches).where(eq(branches.id, this.branchId)).limit(1);
    if (!branch) return null;
    const [jur] = await db.select().from(jurisdictions).where(eq(jurisdictions.id, branch.jurisdictionId)).limit(1);
    return (jur as unknown as Jurisdiction) || null;
  }
}

export const createRepository = (orgId: string | null, branchId: string | null) => {
  return new ScopedRepository(orgId, branchId);
};
