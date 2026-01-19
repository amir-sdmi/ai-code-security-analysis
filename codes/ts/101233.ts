import {Pool} from 'pg';
import * as dotenv from 'dotenv';
import {IncomingMessage, ServerResponse} from 'http';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
});

// Helper function to parse JSON body - written by ChatGPT
const parseJsonBody = (req: IncomingMessage) =>
    new Promise<any>((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk;
        });
        req.on('end', () => {
            try {
                resolve(JSON.parse(body)); // Parse body as JSON
            } catch (err) {
                reject(err); // Reject if there is an error parsing JSON
            }
        });
    });

// Vercel's CORS wrapper
const allowCors = (fn: (req: IncomingMessage, res: ServerResponse) => Promise<void>) =>
    async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Origin', '*'); // Or use a specific frontend URL
        res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
        res.setHeader(
            'Access-Control-Allow-Headers',
            'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
        );

        if (req.method === 'OPTIONS') {
            res.statusCode = 200;
            res.end();
            return;
        }

        return await fn(req, res);
    };

const handler = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    if (req.method === 'POST') {
        try {
            const body = await parseJsonBody(req);
            //using email sent from frontend
            if(!body.email){
                res.statusCode = 402;
                res.end(JSON.stringify({message: 'All fields are required.'}));
                return;
            }
            const result = await pool.query('SELECT GET_PUBLIC_EVENTS();');

            // Map through the results and parse the event string into a structured object
            const publicEvents = result.rows.map(row => {
                const eventString = row.get_public_events; // This is the raw string from the function
                const eventFields = eventString.match(/\(([^)]+)\)/)[1].split(',');

                return {
                    event_id: eventFields[0],
                    email: eventFields[1],
                    event_name: eventFields[2],
                    event_address: eventFields[3],
                    event_date: eventFields[4],
                    created_at: eventFields[5],
                    updated_at: eventFields[6],
                    timezone: eventFields[7],
                    location: eventFields[8],
                    is_active: eventFields[9] === 't',
                    primary_color: eventFields[10],
                    secondary_color: eventFields[11],
                    font: eventFields[12],
                    is_published: eventFields[13] === 't'
                };
            });

// Send the cleaned and structured events back to the frontend
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(publicEvents));

            res.statusCode = 200;
            res.end(JSON.stringify(publicEvents));
            return;
        } catch (err) {
            console.error('Error fetching public events:', err);
            res.statusCode = 500;
            res.end(JSON.stringify({message: err}));
            console.log(err);
            return;
        }
    } else {
        res.statusCode = 405;
        res.end(JSON.stringify({message: 'Method Not Allowed'}));
        console.log("Method: "+req.method);
        return;
    }
};
export default allowCors(handler);