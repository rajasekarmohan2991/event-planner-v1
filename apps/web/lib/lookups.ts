import { db } from '@/lib/db'

/**
 * Lookup Helper Functions
 * Use these to fetch dynamic lookup values throughout your application
 */

export interface LookupValue {
  id: string
  value: string
  label: string
  description?: string
  colorCode?: string
  icon?: string
  sortOrder: number
  isActive: boolean
  isDefault: boolean
  metadata?: any
}

/**
 * Get all active values for a lookup category
 * @param categoryCode - The category code (e.g., 'BOOTH_TYPE', 'REGISTRATION_STATUS')
 * @param tenantId - Optional tenant ID for tenant-specific overrides
 */
export async function getLookupValues(
  categoryCode: string,
  tenantId?: string
): Promise<LookupValue[]> {
  try {
    const category = await db.query(
      `SELECT id FROM lookup_categories WHERE code = $1`,
      [categoryCode]
    )

    if (!category.rows[0]) {
      console.warn(`Lookup category not found: ${categoryCode}`)
      return []
    }

    const result = await db.query(
      `SELECT 
        id, value, label, description, 
        color_code as "colorCode", 
        icon, sort_order as "sortOrder",
        is_active as "isActive", 
        is_default as "isDefault",
        metadata
       FROM lookup_values 
       WHERE category_id = $1 
         AND is_active = true
         AND (tenant_id IS NULL OR tenant_id = $2)
       ORDER BY sort_order, label`,
      [category.rows[0].id, tenantId || null]
    )

    return result.rows
  } catch (error) {
    console.error(`Error fetching lookup values for ${categoryCode}:`, error)
    return []
  }
}

/**
 * Get a single lookup value by its code
 */
export async function getLookupValue(
  categoryCode: string,
  valueCode: string
): Promise<LookupValue | null> {
  try {
    const category = await db.query(
      `SELECT id FROM lookup_categories WHERE code = $1`,
      [categoryCode]
    )

    if (!category.rows[0]) return null

    const result = await db.query(
      `SELECT 
        id, value, label, description, 
        color_code as "colorCode", 
        icon, sort_order as "sortOrder",
        is_active as "isActive", 
        is_default as "isDefault",
        metadata
       FROM lookup_values 
       WHERE category_id = $1 AND value = $2`,
      [category.rows[0].id, valueCode]
    )

    return result.rows[0] || null
  } catch (error) {
    console.error(`Error fetching lookup value ${categoryCode}.${valueCode}:`, error)
    return null
  }
}

/**
 * Get the default value for a category
 */
export async function getDefaultLookupValue(
  categoryCode: string
): Promise<LookupValue | null> {
  try {
    const category = await db.query(
      `SELECT id FROM lookup_categories WHERE code = $1`,
      [categoryCode]
    )

    if (!category.rows[0]) return null

    const result = await db.query(
      `SELECT 
        id, value, label, description, 
        color_code as "colorCode", 
        icon, sort_order as "sortOrder",
        is_active as "isActive", 
        is_default as "isDefault",
        metadata
       FROM lookup_values 
       WHERE category_id = $1 AND is_default = true AND is_active = true
       LIMIT 1`,
      [category.rows[0].id]
    )

    return result.rows[0] || null
  } catch (error) {
    console.error(`Error fetching default lookup value for ${categoryCode}:`, error)
    return null
  }
}

/**
 * Get lookup values formatted for dropdown/select components
 */
export async function getLookupOptions(
  categoryCode: string,
  tenantId?: string
): Promise<Array<{ value: string; label: string; color?: string }>> {
  const values = await getLookupValues(categoryCode, tenantId)
  return values.map(v => ({
    value: v.value,
    label: v.label,
    color: v.colorCode
  }))
}

/**
 * Validate if a value exists in a lookup category
 */
export async function isValidLookupValue(
  categoryCode: string,
  valueCode: string
): Promise<boolean> {
  const value = await getLookupValue(categoryCode, valueCode)
  return value !== null && value.isActive
}

/**
 * Get lookup label from value code
 */
export async function getLookupLabel(
  categoryCode: string,
  valueCode: string
): Promise<string> {
  const value = await getLookupValue(categoryCode, valueCode)
  return value?.label || valueCode
}

/**
 * Client-side hook for fetching lookup values
 * Use this in React components
 */
export function useLookupValues(categoryCode: string) {
  // This would be implemented as a React hook in a separate file
  // For now, this is a placeholder for the pattern
  return {
    values: [],
    loading: true,
    error: null
  }
}
