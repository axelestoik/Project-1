
import { Jurisdiction } from '../db/schema.ts';

/**
 * Defines the contract for jurisdiction-specific business rules.
 */
export interface JurisdictionConfig {
  taxRate: number;
  isRentControlEnabled: boolean;
  mandatoryInspection: boolean;
  currency: string;
  dateFormat: string;
}

/**
 * Base implementation with default values.
 */
export class DefaultJurisdictionConfig implements JurisdictionConfig {
  taxRate = 0;
  isRentControlEnabled = false;
  mandatoryInspection = false;
  currency = 'USD';
  dateFormat = 'MM/DD/YYYY';
}

/**
 * California Specific Rules.
 */
export class CaliforniaJurisdictionConfig extends DefaultJurisdictionConfig {
  taxRate = 0.08;
  mandatoryInspection = true;
}

/**
 * New York Specific Rules.
 */
export class NewYorkJurisdictionConfig extends DefaultJurisdictionConfig {
  taxRate = 0.088;
  isRentControlEnabled = true;
}

/**
 * Factory and Strategy Manager for Jurisdictions.
 */
export class JurisdictionManager {
  private static strategies: Record<string, JurisdictionConfig> = {
    'jur-usa-ca': new CaliforniaJurisdictionConfig(),
    'jur-usa-ny': new NewYorkJurisdictionConfig(),
  };

  /**
   * Retrieves the strategy for a specific jurisdiction.
   * Leverages overrides from the database if provided.
   */
  static getConfig(jurisdiction: Jurisdiction | null): JurisdictionConfig {
    if (!jurisdiction) return new DefaultJurisdictionConfig();

    const baseStrategy = this.strategies[jurisdiction.id] || new DefaultJurisdictionConfig();

    // Apply configuration overrides from the database record
    return {
      ...baseStrategy,
      ...(jurisdiction.configOverrides as unknown as Partial<JurisdictionConfig>)
    };
  }
}
