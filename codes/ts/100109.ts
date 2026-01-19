import { Customer } from './customer';

// Structured with ChatGPT's guidance to match the client's order form to the defined TypeScript interfaces.
export interface Print {
  id: number;
  deadline: string;
  customer: Customer;
  created_at: string;
  image_height: number;
  image_width: number;
  paper_height: number;
  paper_width: number;
  thumbnail: string;
  print_style: string;
  quantity: number;
  job_notes: string;
  is_completed: boolean;
  balance_paid: boolean;
  deposit: boolean;
  notification_date: string;
  client_notified: boolean;
}