'use client'

import { Print } from '../types/print';
import { useRouter } from 'next/navigation';

export const createPrint = async (form: Print, customerId: number, router: any) => {
   
    const URL = `${process.env.NEXT_PUBLIC_API_URL}/customers/${customerId}/add_print/`;
    const URL_REDIRECT = `${process.env.NEXT_PUBLIC_API_URL}/customers/${customerId}`;

    // Adjusted with ChatGPT's assistance to send customerId instead of customer object.
    const adjustedData = {
        ...form,
        customer: customerId,
    };

    try{
        console.log('Sending data:', adjustedData);
        const response = await fetch(URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                "Authorization": `Token ${process.env.NEXT_PUBLIC_API_TOKEN}`
            },
            credentials: 'include',
            body: JSON.stringify(adjustedData),
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        return data;

    } catch (error) {
        console.error('Failed to create the print:', error);
        throw error;
    }
};

export const updatePrint = async (form: Print, id: number, print_id: number) => {
    const URL = `${process.env.NEXT_PUBLIC_API_URL}/customers/${id}/prints/${print_id}/`;

    await fetch(URL, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Token ${process.env.NEXT_PUBLIC_API_TOKEN}`
        }, 
        credentials: 'include',
        body: JSON.stringify(form),
    });
};

export const deletePrint = async (print_id: number, customerId: number, router: any) => {
    
    const URL = `${process.env.NEXT_PUBLIC_API_URL}/customers/${customerId}/delete_print/`;
    const URL_REDIRECT = `${process.env.NEXT_PUBLIC_API_URL_REDIRECT}/customers/${customerId}`;
   

    try{
        const response = await fetch(URL, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Token ${process.env.NEXT_PUBLIC_API_TOKEN}`
            }, 
            credentials: 'include',
            body: JSON.stringify({print_id, customerId }),
        });

        if (response.ok) {
            router.push(URL_REDIRECT);
        } else {
            console.error("Failed to delete the print");
        }
    } catch(error) {
        console.error("error", error);
    }
};
