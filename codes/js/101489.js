const pool = require('../db');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

// Updated database schema description for LLM
const dbSchemaDescription = `
you are an expert in converting English questions to SQL query!
given below is the schema of the database on which you will have to answer all questions.
this is a Indian medical store database the products here are medicines. all the prices are in Indian rupees. remember to outupt all prices as rupees.
Schema description for a PostgreSQL database:
- Table: products (product_id, product_name, company_name, formula, mrp, cost_price, tabs_per_strip, quantity_strips, total_pills, discount_percent, sale_price)
- Table: suppliers (supplier_id, supplier_name, lead_time_claimed, lead_time_actual, reliability, contact)
- Table: product_suppliers (product_supplier_id, product_id, supplier_id, claimed_lead_time_avg, actual_lead_time_avg, cost_price)
- Table: supplier_product_reliability (supplier_product_reliability_id, supplier_id, product_id, claimed_lead_time, actual_lead_time, reliability_score)
- Table: orders (order_id, order_date, product_id, quantity, supplier_id, total_cost, status, claimed_lead_time, actual_delivery_date, actual_lead_time)
- Table: inventory (inventory_id, product_id, quantity, reorder_level)
- Table: sales (sale_id, product_id, quantity_sold, sale_date, total_amount, customer_name)
- Table: customer_requests (request_id, customer_name, product_id, request_date, quantity_requested, status)

Common query patterns for this database:
- To filter by a specific year and month for dates, use:
    "WHERE DATE_TRUNC('month', sale_date) = 'YYYY-MM-01'"
- To get total sales for a specific period (e.g., total sales in January 2023):
    "SELECT SUM(total_amount) FROM sales WHERE DATE_TRUNC('month', sale_date) = '2023-01-01'"
- To filter by product name:
    "SELECT * FROM products WHERE product_name ILIKE '%product_name%'"
- To get the most reliable suppliers for a product:
    "SELECT supplier_name FROM suppliers s JOIN supplier_product_reliability spr ON s.supplier_id = spr.supplier_id WHERE spr.product_id = X ORDER BY reliability_score DESC"
- Always ensure proper joins for cross-referenced tables.
- The sale_date, order_date, and request_date columns are DATE types, ensure date functions are used accordingly.

Ensure that:
- SQL queries should be compatible with PostgreSQL syntax.
- Avoid using unsupported functions like STRFTIME, use DATE_TRUNC instead for date filtering.
- Validate that table and column names exist and are correctly referenced.

Relationships:
- sales.product_id references products.product_id
- sales.customer_id references customers.customer_id
- orders.product_id references products.product_id
- orders.supplier_id references suppliers.supplier_id
- inventory.product_id references products.product_id
- product_suppliers.product_id references products.product_id
- product_suppliers.supplier_id references suppliers.supplier_id
- supplier_product_reliability.product_id references products.product_id
- supplier_product_reliability.supplier_id references suppliers.supplier_id
- customer_requests.product_id references products.product_id
`;


// Function to clean SQL query from Markdown artifacts
const cleanSqlQuery = (query) => {
    query = query.replace(/```sql/g, '').replace(/```/g, '');
    query = query.trim();
    return query;
};

// Function to validate if the generated SQL query is safe to execute
const validateSqlQuery = (query) => {
    // Basic validation: check for SQL injection patterns and prohibited keywords
    const prohibitedKeywords = ['DROP', 'ALTER', 'DELETE'];
    const lowerCaseQuery = query.toLowerCase();

    for (const keyword of prohibitedKeywords) {
        if (lowerCaseQuery.includes(keyword.toLowerCase())) {
            return false; // Prohibit queries that could alter or delete schema
        }
    }
    // Check if the query is empty
    if (!query || query.length === 0) {
        return false;
    }

    return true;
};

// Execute LLM query with error handling and validation
const executeLLMQuery = async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ message: 'No prompt provided.' });
    }

    try {
        // Combine schema context with natural language prompt
        const fullPrompt = `${dbSchemaDescription}\n all prices will be in indian rupees \nTranslate this natural language query into an SQL query: "${prompt}"`;

        console.log('Full Prompt:', fullPrompt);

        // Use Gemini API to generate SQL query
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        let sqlQuery = response.text().trim();

        // Clean and validate the SQL query
        sqlQuery = cleanSqlQuery(sqlQuery);

        console.log('Generated SQL Query:', sqlQuery);

        // Validate SQL query
        if (!validateSqlQuery(sqlQuery)) {
            return res.status(400).json({ message: 'Invalid or unsafe SQL query generated.' });
        }

        // Execute SQL query on the database
        const dbResult = await pool.query(sqlQuery);

        // Check if it's a SELECT query
        if (sqlQuery.toLowerCase().startsWith('select')) {
            // Handle SELECT queries: Convert result to natural language
            const dbResultString = JSON.stringify(dbResult.rows);
            const nlResult = await model.generateContent(`Convert this SQL result into a natural language response in english (all this information is in regaurds inventory management): "${dbResultString}"`);
            const nlResponse = await nlResult.response;
            const naturalLanguageResponse = nlResponse.text().trim();

            console.log('Natural Language Response:', naturalLanguageResponse);

            res.json({ naturalLanguageResponse, sqlQuery, dbResult: dbResult.rows });
        } else {
            // Handle non-SELECT queries (INSERT, UPDATE, DELETE)
            res.json({ message: 'Query executed successfully.', sqlQuery });
        }
    } catch (err) {
        console.error('Error processing the query:', err);
        // Catch query errors and prevent server crash
        if (err.code === '42601') {
            // SQL syntax error
            res.status(400).json({ message: 'Syntax error in generated SQL query.', error: err.message });
        } else {
            res.status(500).json({ message: 'Error processing the query.', error: err.message });
        }
    }
};

module.exports = { executeLLMQuery };
