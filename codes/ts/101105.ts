'use client'

import { Frame } from '../types/frames';
import { useRouter } from 'next/navigation';


export const createFrame = async (form: Frame, customerId: number, router: any) => {

    const URL = `${process.env.NEXT_PUBLIC_API_URL}/customers/${customerId}/add_frame/`;
    const URL_REDIRECT = `${process.env.NEXT_PUBLIC_API_URL}/customers/${customerId}`;

    // Adjusted with ChatGPT's help to send customerId instead of customer object.
    const adjustedData = {
        ...form,
        customer: customerId, // Only send customer ID if that's what the backend expects
    };

    try{
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
        console.error('Failed to create the frame:', error);
        throw error;
    }

};

export const updateFrame = async (form: Frame, id: number, frame_id: number) => {

    const URL = `${process.env.NEXT_PUBLIC_API_URL}/customers/${id}/frames/${frame_id}/`;

    //make post request to create people
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

export const deleteFrame = async (frame_id: number, customerId: number, router: any) => {

    const URL = `${process.env.NEXT_PUBLIC_API_URL}/customers/${customerId}/delete_frame/`
    const URL_REDIRECT = `${process.env.NEXT_PUBLIC_API_URL_REDIRECT}/customers/${customerId}`
   

    try{
        const response = await fetch(URL, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Token ${process.env.NEXT_PUBLIC_API_TOKEN}`
            }, 
            credentials: 'include',
            body: JSON.stringify({frame_id, customerId }),
        });

        if (response.ok) {
          
            router.push(URL_REDIRECT);
        } else {
            console.error("Failed to delete the frame");
        }

    }catch(error){
        console.error("error", error);
    }
    
};

