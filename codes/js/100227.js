// ---------------------------------------Using ChatGPT-------------------------------------------------

// const OpenAI = require('openai');

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// const chat=async()=>{
//     const {prompt} = req.body
    
//     try {
//         const response = await openai.chat.completions.create({
//           model: "gpt-3.5-turbo-1106",
//           messages: [{"role":"assistant" ,"content":prompt}],
//           temperature: 1,
//           max_tokens: 256,
//           top_p: 1,
//           frequency_penalty: 0,
//           presence_penalty: 0,
//         }); 

//             res.status(200).json(response.data.choices[0].content);
//     } catch (error) {
//         console.log(error);
//         res.status(400).json(error);
 
//     }
// }


module.exports ={chat}