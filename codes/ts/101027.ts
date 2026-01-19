import {Pool} from 'pg';
import * as dotenv from 'dotenv';
import {IncomingMessage, ServerResponse} from 'http';
const bcrypt = require('bcrypt');

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
            if (!body.email || !body.password) {
                res.statusCode = 400;
                res.end(JSON.stringify({message: 'All fields are required.'}));
                return;
            }
            const hashedPassword: string = await bcrypt.hash(<string>body.password, 12);
            try {
                await pool.query('SELECT CREATE_ACCOUNT($1, $2, $3, $4);', [<string>body.email, hashedPassword, <string>body.firstName, <string>body.lastName]);
            } catch (err) {
                res.statusCode = 502;
                res.end(JSON.stringify({message: "Internal server error."}));
                return;
            }
            res.statusCode = 201;
            res.end(JSON.stringify({message: 'Account created successfully!'}));
            return;
        } catch (err) {
            console.error('Error creating account:', err);
            res.statusCode = 500;
            res.end(JSON.stringify({message: 'Internal server error.'}));
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