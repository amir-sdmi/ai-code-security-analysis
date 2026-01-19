import { Customer } from './customer';

// Structured with ChatGPT's guidance to match the client's order form to the defined TypeScript interfaces.
export interface Frame {
  id: number; // This represents the primary key
  deadline: string; // ISO 8601 format date-time string
  customer: Customer; // ForeignKey relation to Customer
  created_at: string; // ISO 8601 format date-time string

  // FRAME JOB ATTRIBUTES
  image_height: number; // Decimal value
  image_width: number; // Decimal value
  frame_height: number; // Decimal value
  frame_width: number; // Decimal value
  moulding: string; // String for moulding type
  moulding_number: bigint; //Integer
  mat: string; // String for mat type
  mat_number: bigint; //integer
  mat_ply: string; // String for mat ply
  mat_window: boolean; // Boolean for mat window
  mat_double: boolean; // Boolean for double mat
  mat_in_visible: number; // Decimal value for mat in visible
  mat_in_total: number;
  mat_inside_height: number; // Decimal value for mat inside height
  mat_inside_width: number; // Decimal value for mat inside width
  mat_outside_height: number; // Decimal value for mat outside height
  mat_outside_width: number; // Decimal value for mat outside width
  float_type: string; // String for float type
  float_in_visible: number; // Decimal value for float in visible
  float_in_total: number; // Decimal value for float in total
  glazing: string; // String for glazing type
  thumbnail: string; // URL to the thumbnail image
  glazing_type: string; // String for glazing type
  spacers: boolean; // Boolean for spacers
  spacers_type: string; // String for spacers type
  canvas_floater: number; // Decimal value for canvas floater
  straight_to_frame: boolean; // Boolean for straight to frame
  art_location: string; // String for art location
  art_condition: string; // Text for art condition
  is_completed: boolean; // Boolean for completion status
  client_notified: boolean; // Boolean for client notification status
  notification_date: string | null; // ISO 8601 format date-time string, can be null
  final_location: string; // String for final location
  payment_type: string; // String for payment type
  deposit: boolean; // Boolean for deposit status
  balance_paid: boolean; // Boolean for balance paid status
}