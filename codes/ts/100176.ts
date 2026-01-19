import { Scan } from './scan';
import { Print } from './print';
import { Frame } from './frames';
import { Misc } from './misc';

// Structured with ChatGPT's guidance to match the client's order form to the defined TypeScript interfaces.
export interface Address {
    id: number;
    customer: number;
    street: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
  }
  
  export interface Customer {
    id: number | null;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    shipping_addresses: Address[];
    scans?: Scan[];
    prints?: Print[];
    frames?: Frame[];
    misc?: Misc[];
  }