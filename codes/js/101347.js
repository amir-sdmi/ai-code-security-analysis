const Main = ()=>{
    return(
        <>
        <main style={{backgroundColor:'#04151d',height:'100%'}}>
            <div className="container mx-auto lg:container">
                <div className="main-navbar justify-between">                
                    <ul className="container flex flex-row justify-between text-1xl lg:container ">  
                        <li className="p-1 my-3 text-xl">Tags:</li>                      
                        <li className="rounded-xl border-2 border-greens p-1 my-3 hover:bg-greens hover:text-black">ChatGPT</li>
                        <li className="rounded-lg border-2 border-greens p-1 my-3 hover:bg-greens hover:text-black">Brainstorming</li>
                        <li className="rounded-lg border-2 border-greens p-1 my-3 hover:bg-greens hover:text-black">Marketing</li>
                        <li className="rounded-lg border-2 border-greens p-1 my-3 hover:bg-greens hover:text-black">Social Media</li>
                        <li className="rounded-lg border-2 border-greens p-1 my-3 hover:bg-greens hover:text-black">content Creation</li>
                    </ul>
                </div>

            <div className="cardbox">
                <div className="card box1 bg-card_bg border-card_bg my-6 border-2 rounded-md h-auto flex flex-row w-full">
                    <div className="imageset p-4">
                        <img src="https://www.cio.com/wp-content/uploads/2024/06/data-analytics-thinkstock-100577221-orig-1.jpg?resize=1024%2C1024&quality=50&strip=all" className="h-80 rounded-lg" style={{height:"450px","width":"550px"}}></img>
                    </div>
                    <div className="syntex flex flex-col w-full mx-5 my-5 p-5 h-full">
                        <div className="first_links">
                            <ul className="flex flex-row space-x-5">
                                <li className="rounded-xl border-2 border-greens text-greens p-2 my-3 hover:bg-greens hover:text-black">ChatGPT</li>
                                <li className="rounded-xl border-2 border-greens text-greens p-2 my-3 hover:bg-greens hover:text-black">Brainstorming</li>
                            </ul>
                        </div>
                        <div className="card-header">
                            <p className="text-white text-3xl my-3">A 3-Step Guide to Using ChatGPT for Brainstorming</p>
                        </div>
                        <div className="card-main">
                            <p className="text-white text-1xl my-3">In today's fast-paced and innovation-driven wirld, Brainstorming plays a crucial role in problem-solving, idea generation, and creative exploration. However, traditional brainstorming Sessions can sometimes be limited by our own perspectives and experience. That's where ChatGPT...</p>
                        </div>
                        <div className="card-footer mx-4 my-1 flex flex-row">
                            <div className="card-footer-right">
                                <img src='https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTBZprHbNP1Aw_KUC6zFd5mj-iPu5SGZrQoL9hfxire8_JYHlGiDDM9TxRqrAI_Td8_Mtc&usqp=CAU' classname='rounded-md mx-4 my-4' style={{height:'150px','borderRadius':'50%'}}></img>
                            </div>
                            <div className="card-footer-right mx-6 my-3">
                                <p className="text-white   text-2xl">Mr.Bean</p>
                                <p className="text-white    text-2xl">Bean.com</p>
                                <p className="text-sky-500    text-2xl">July 13,2023</p>
                            </div>
                        </div>
                    </div>
                </div>


                <div className="card box1 bg-card_bg border-card_bg my-6 border-2 rounded-md h-auto flex flex-row w-full">
                    <div className="imageset p-4">
                        <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ9gRI0mVJpxOP9L9nNfstgseEJF62iPsFjcCFJYM_cQjf_JkJJOPssFEVNSQZXP6KWS2A&usqp=CAU" className="h-80 rounded-lg" style={{height:"450px","width":"550px"}}></img>
                    </div>
                    <div className="syntex flex flex-col w-full mx-5 my-5 p-5 h-full">
                        <div className="first_links">
                            <ul className="flex flex-row space-x-5">
                                <li className="rounded-xl border-2 border-greens text-greens p-2 my-3 hover:bg-greens hover:text-black">ChatGPT</li>
                                <li className="rounded-xl border-2 border-greens text-greens p-2 my-3 hover:bg-greens hover:text-black">Brainstorming</li>
                            </ul>
                        </div>
                        <div className="card-header">
                            <p className="text-white text-3xl my-3">Prompting with Purpose: How Strateegic Narrative will Change the Way you use ChatGPT</p>
                        </div>
                        <div className="card-main">
                            <p className="text-white text-1xl my-3">In the realm of artificial intelligence, ChatGPT has rmerged as a groundbreaking language model that can engage in intelligent conversations and provide valuable insights.its potential for various applications is vast,including assisting in ...
                                
                            </p>
                        </div>
                        <div className="card-footer mx-4 my-1 flex flex-row">
                            <div className="card-footer-right">
                                <img src='https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRAWLJWkPZpgIh_aOjpVS3z69p2HMEwrQb0lXX86VPoU9f-HfIH0jvr17xjfmubEkayqTU&usqp=CAU' classname='rounded-md mx-4 my-4' style={{height:'150px','borderRadius':'50%',width:'150px'}}></img>
                            </div>
                            <div className="card-footer-right mx-6 my-3">
                                <p className="text-white   text-2xl">Mr.Bean</p>
                                <p className="text-white    text-2xl">Bean.com</p>
                                <p className="text-sky-500    text-2xl">July 13,2023</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card box1 bg-card_bg border-card_bg my-6 border-2 rounded-md h-auto flex flex-row w-full">
                    <div className="imageset p-4">
                        <img src="https://cdn.prod.website-files.com/64777aba152490066806f29a/65d8b4032a4b06d38cf94f79_AdobeStock_399473340%20(1)-p-1600.jpeg" className="h-80rounded-lg" style={{height:"450px","width":"550px"}}></img>
                    </div>
                    <div className="syntex flex flex-col w-full mx-5 my-5 p-5 h-ful">
                        <div className="first_links">
                            <ul className="flex flex-row space-x-5">
                                <li className="rounded-xl border-2 border-greens text-greens p-2 my-3 hover:bg-greens hover:text-black">ChatGPT</li>
                                <li className="rounded-xl border-2 border-greens text-greens p-2 my-3 hover:bg-greens hover:text-black">Brainstorming</li>
                            </ul>
                        </div>
                        <div className="card-header">
                            <p className="text-white text-3xl my-3">A 3-Step Guide to Using ChatGPT for Brainstorming</p>
                        </div>
                        <div className="card-main">
                            <p className="text-white text-1xl my-3">In today's fast-paced and innovation-driven wirld, Brainstorming plays a crucial role in problem-solving, idea generation, and creative exploration. However, traditional brainstorming Sessions can sometimes be limited by our own perspectives and experience. That's where ChatGPT...</p>
                        </div>
                        <div className="card-footer mx-4 my-1 flex flex-row">
                            <div className="card-footer-right">
                                <img src='https://www.eliteveterinarystaff.co.uk/wp-content/uploads/2023/02/Olivia.jpg' classname='rounded-md mx-4 my-4' style={{height:'150px','width':'150px','borderRadius':'50%'}}></img>
                            </div>
                            <div className="card-footer-right mx-6 my-3">
                                <p className="text-white   text-2xl">Mr.Bean</p>
                                <p className="text-white    text-2xl">Bean.com</p>
                                <p className="text-sky-500    text-2xl">July 13,2023</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>                
            </div>
        </main>
        </>
    )
}

export default Main;