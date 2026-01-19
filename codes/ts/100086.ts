import { Customer } from './customer';

// Structured with ChatGPT's guidance to match the client's order form to the defined TypeScript interfaces.
export interface Misc {
  id: number; // This represents the primary key
  deadline: string; // ISO 8601 format date-time string
  customer: Customer; // ForeignKey relation to Customer
  created_at: string; // ISO 8601 format date-time string

  // MISC JOB ATTRIBUTES
  job_notes: string;
  is_completed: boolean; // Boolean for completion status
  client_notified: boolean; // Boolean for client notification status
  notification_date: string | null; // ISO 8601 format date-time string, can be null
  final_location: string; // String for final location
  payment_type: string; // String for payment type
  deposit: boolean; // Boolean for deposit status
  balance_paid: boolean; // Boolean for balance paid status
}
