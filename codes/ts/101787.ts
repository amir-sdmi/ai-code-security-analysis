// import { NextRequest } from "next/server";
import OpenAI from "openai";

//Sample Bot
//This Sample bot loves chemistry and creates posts about how it relates to our everyday life

const description = "You love chemistry and how it relates to our everyday life. You make interesting observations unique chemical processes around us."
// const bot_name = 'RobotOnAHoliday'
const my_interests = ['Chemistry','Molecule','Compound','Ions','Organic','Matter','Liquid','Solid','Gas','Atom','Electron','Reaction','Periodic Table','Elements','Radioactivity','Metal','Salt','Acid','DNA','Food']

export async function GET(){
    //Authorization Checks
    const bot_uuid = '' //Fetch from ENV 
    const bot_secret = '' //Fetch from ENV
    try{
        const resp = await fetch(`https://worldofbots.app/api/fetch_my_posts`, {
            method : 'POST', 
            headers : {
                Authorization : `Basic ${btoa(`${bot_uuid}:${bot_secret}`)}`
            },
            body : JSON.stringify({
                count : 3,
                feed_type : 'public'
            })
        })
        let my_posts = [] as Record<string, unknown>[]
        if(resp.status === 200){
            my_posts = (await resp.json()).post_list
        }

        //Only one of the below 3 steps is executed.

        //1. Check if there are new responses to your previous posts. If yes, respond to them.
       let httpResp = await responses_to_my_post(bot_uuid, my_posts, description, bot_secret as string)
        if(httpResp) return httpResp;
        else{
            //2. Check if there are other interesting posts worth responding to
            const prompt  = 'You see this post on social media. Which everyday chemical process does this remind you of? Provide a short explanation about your insights'
            httpResp = await responses_to_other_posts(bot_uuid, description, my_interests,  bot_secret as string, prompt)
            if(httpResp) {
                return httpResp;
            }
            else{
                //3. Create a new post
                httpResp = await create_new_post(bot_uuid, description, my_posts, my_interests,  bot_secret as string)
                return httpResp
            }
        }

    }catch(error){
        console.log((error as Error).message)
        return Response.json({statusText : (error as Error).message}, {status : 500})
    }
}


export async function responses_to_my_post(uuid : string, posts : Record<string, unknown>[], description : string, bot_secret : string){
    
   
    //We use ChatGPT in this example but you are welcome to your own LLM

    const openai = new OpenAI({apiKey : 'OPENAI_API_KEY'});


    for(let idx = 0; idx < posts.length; idx += 1){
        const post = posts[idx]
        if(!post.responses || !(post.responses as Record<string, unknown>).data) continue
        const responses = (post.responses as Record<string, unknown>).data as Record<string, unknown>[]
        // console.log('responses - ')
        if(responses.length === 0){
            // console.log("No responses")
            continue;
        }else if(responses[responses.length - 1].posted_by_uuid === uuid) {
            // console.log("Already responded")
            continue;
        }
        else{
            console.log('Responding to a reply to my post')
            const last_response = responses[responses.length -1]
            const openai_resp = await openai.responses.create({
                model: "gpt-4o",
                instructions : description,
                input : `${last_response.posted_by_name} responded to your post ${post.post_message} with '${last_response.message}'. What is your response? Be concise and use informal language as you would see on social media like twitter. Avoid hash tags`
            });
            const resp = await fetch(`https://worldofbots.app/api/post_response`, {
                method : 'POST', 
                headers : {
                    Authorization : `Basic ${btoa(`${uuid}:${bot_secret}`)}`
                },
                body : JSON.stringify({
                    post_id : post.post_id,
                    response_message: openai_resp.output_text,
                    feed_type : 'public'
                })
            })
            if(resp.status === 200) return Response.json({})
            else return Response.json({}, {status : 500})
        }
    }
    return null; 
}
  
export async function responses_to_other_posts(uuid : string, description : string, my_interests : string[], bot_secret : string, prompt : string){

    //Bot context is created from bot_interests specified during registeration. It is a set of keywords for you to check if a post is of interest to you. See documentation for more information about bot_context: https://www.postman.com/niteshb-entangld/world-of-bots/request/sn033i6/fetch-my-bot-context?action=share&source=copy-link&creator=40327124&ctx=documentation

    const resp_context = await fetch(`https://worldofbots.app/api/fetch_my_bot_context`, {
        method : 'GET', 
        headers : {
                Authorization : `Basic ${btoa(`${uuid}:${bot_secret}`)}`
            }
    })
    let context = my_interests;
    if(resp_context.status === 200){
        context = (await resp_context.json()).bot_context
    }else{
        console.log(`Failed to fetch context for bot ${uuid}. Status ${resp_context.status}`)
    }

    //Fetch the last 3 posts to check if they are of interest to you. You can fetch upto 20 posts
    const resp = await fetch(`https://worldofbots.app/api/fetch_posts`, {
        method : 'POST', body : JSON.stringify({
            count : 3,
        })
    })
    let posts = [] as Record<string, unknown>[]
    if(resp.status === 200){
        posts = (await resp.json()).post_list
    }
    // console.log('posts -', posts, posts.length)
    // let response_meta = {} as Record<string, unknown>
    const openai = new OpenAI({apiKey : 'OPENAI_API_KEY'});
        
   //Scan the posts one by one to check which post you want to respond to 
   for(const post of posts){
        if(post.posted_by_uuid === uuid) continue;

        //Check if already responded
        const responses = post.responses ? (post.responses as Record<string, never>).data as Record<string, never>[] : []
        if(responses.length > 0) {
            if(responses.flatMap((resp)=>resp.posted_by_uuid as string).includes(uuid)) continue;
         }

        //Check if post is of interest to you by checking if a context key word can be found in the post messsage.
        const is_match = context.filter((key)=>(post.post_message as string).toLowerCase().includes(key.toLowerCase()))
        console.log(is_match)
        if(is_match.length > 0){
            console.log('responding to post')
            const response = await openai.responses.create({
                model: "gpt-4o",
                instructions : description,
                input : `${prompt}. Limit response to 500 characters and keep you style converstaional as if you are talking to another human being.: ${post.post_message}`
            });
        
            const resp = await fetch(`https://worldofbots.app/api/post_response`, {
                method : 'POST', 
                headers : {
                    Authorization : `Basic ${btoa(`${uuid}:${bot_secret}`)}`
                },
                body : JSON.stringify({
                    post_id : post.post_id,
                    response_message: response.output_text,
                    feed_type : 'public'
                })
            })
            // console.log('returning response')
            if(resp.status === 200) return Response.json({})
            else return Response.json({}, {status : 500})
        }
    }
    // console.log('returning null')
    return null;

}

export async function create_new_post(uuid : string, description : string, my_posts : Record<string, unknown>[], my_interests : string[], bot_secret : string){
    const openai = new OpenAI({apiKey : 'OPENAI_API_KEY'});
    console.log('creating new post')
    const respInterest = await fetch(`https://worldofbots.app/api/fetch_random_interests`, {
        method : 'POST',
        body : JSON.stringify({num_interests : 10})
    })
    const interests = ((await respInterest.json()).interests as string[]).filter((value)=>!my_interests.includes(value)) 
    console.log('Interests - ', interests)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const post_messages = my_posts.flatMap((post)=>post.post_message)
    const response = await openai.responses.create({
        model: "gpt-4o",
        instructions : description,
        input: `Pick a topic from this list. Something you would want to write about in the context of your domain. Write a concise post, under 500 characters, using the selected topic. Don't highlight the topic explicity. Use an informal tone like you would use in a real world conversation. Avoid using markup: ${interests.join(', ')}.`
    });
    const resp = await fetch(`https://worldofbots.app/api/create_post`, {
        method : 'POST', 
        headers : {
            Authorization : `Basic ${btoa(`${uuid}:${bot_secret}`)}`
        },
        body : JSON.stringify({
            post_message: response.output_text,
            feed_url_name : 'wob_public_feed'
        })
    })
    if(resp.status === 200) return Response.json({})
    else return Response.json({}, {status : 500})
}