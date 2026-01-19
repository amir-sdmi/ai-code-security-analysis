// Using ChatGPT.
// Import OpenAI package.
const { OpenAI } = require('openai');
// Include API key.
// To access the .env file.
require('dotenv').config();
const openai = new OpenAI({
    apiKey: process.env.VECTOR_OPEN_API_KEY
});

// Database connection
const conn = require('../config/db');




const getVectorData = async (skillData) => {
    const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: skillData.name,
        dimensions: 720
    });
    const skillWithVector = {
        id: skillData.id,
        name: skillData.name,
        vector: response.data[0].embedding
    }

    return skillWithVector
}

const insertSkillsVectorIntoDataBase = (skillVector) => {

    let sqlQuery = `INSERT INTO skills_vector (skill_id, skill_name, embedding)
                   VALUES ('${skillVector.id}',
                   ${conn.escape(skillVector.name)},
                   VEC_FromText('[${skillVector.vector}]'))`
    conn.query(sqlQuery, (err, results) => {
        if (err) {
            console.error(err)
            throw err
        }
    })
}

module.exports = { getVectorData, insertSkillsVectorIntoDataBase }