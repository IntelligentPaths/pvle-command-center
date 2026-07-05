// Shared Contacts constants + type. Mirrors the Contacts tab columns.
export const CONTACT_TYPES = ["Internal", "Vendor", "Partner", "Prospect"] as const;

export interface Contact {
  id: string;
  name: string;
  role: string;
  org: string;
  type: string;
  email: string;
  phone: string;
  entity: string;
  notes: string;
  updated_at: string;
}
