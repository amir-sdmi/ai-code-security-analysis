const InitListeners = () => {
    const clientURLTextfield = document.getElementById("clientURLTextfield")! as HTMLInputElement;
    const generateButton = document.getElementById("generatePlaybook")!;
    const playbookDiv = document.getElementById("playbook")!;
    generateButton.onclick = async () => {
        CONTEXT = [];
        playbookDiv.innerHTML = "";
        ClearConversationArea();

        const url = clientURLTextfield.value;
        console.log(`Fetching data for ${url}`);
        
        //make a call to the backend API providing the client URL and recieve HTML back
        const startTime = Date.now();

        let overallHTML = "";
        let responseRecieved = 0; //0 for false, 1 for true, anything above 1 is ignored

        await Playbook(url, async (deltaContent: string) => {
            const time = Date.now();
            const deltaTime = time - startTime;
            responseRecieved += 1;

            overallHTML += deltaContent;
            playbookDiv.innerHTML = overallHTML;

            //console.log(deltaContent, deltaTime);
            if (responseRecieved == 1) {
                const news = await GetNews();



            }
        });

        ShowPromptTextfield();
    }

    const promptTextfield = document.getElementById("promptField")! as HTMLInputElement;
    promptTextfield.onkeydown = async ($e) => {
        if ($e.key == "Enter") {
            const question = promptTextfield.value;
            promptTextfield.value = "";
            AppendQuestion(question);
            promptTextfield.blur();

            //sent this question alongside all other context to gpt and retreive response
            const responseBubble = AppendResponse("");
            let overallHTML = "";
            await GetChatGPTReply([question], (deltaContent: string) => {
                overallHTML += deltaContent;
                responseBubble.innerHTML = overallHTML;
            }, true);
        }
    }
}


//UI functionality
const ClearConversationArea = () => {
    const conversationDiv = document.getElementById("conversation")!;
    conversationDiv.innerHTML = "";

    //hide textfield
    const promptTextfield = document.getElementById("promptField")!;
    promptTextfield.style.display = "none";
}
const ShowPromptTextfield = () => {
    const promptTextfield = document.getElementById("promptField")!;
    promptTextfield.style.display = "";
}

const ShowLoader = () => { //gives user feedback while playbook is being generated
    const lodaer = document.getElementById("loader")!;
    lodaer.style.display = "";
}
const HideLoader = () => { //gives user feedback while playbook is being generated
    const lodaer = document.getElementById("loader")!;
    lodaer.style.display = "none";
}


//Creating chat functionality
const AppendQuestion = (question: string) => { //creates a message bubble from the user
    const conversationArea = document.getElementById("conversation")!;
    const questionDiv = document.createElement("div");
    questionDiv.className = "bubble question";
    questionDiv.innerText = question;
    
    const breakElement = document.createElement("br");

    conversationArea.append(questionDiv);
    conversationArea.append(breakElement);
    
}
const AppendResponse = (response: string) => { //message bubble for GPT's reply
    const conversationArea = document.getElementById("conversation")!;
    const responseDiv = document.createElement("div");
    responseDiv.className = "bubble response";
    responseDiv.innerHTML = response;

    const breakElement = document.createElement("br");

    conversationArea.append(responseDiv);
    conversationArea.append(breakElement);

    return responseDiv;
}



const Main = async () => {
    //clear conversation area and hide question box until user has generated sales strategy
    ClearConversationArea();
    InitListeners();
    HideLoader();

    //prompt textfield is shown again once user generates a sales strategy
}
Main();








//next step is to create a chat interface so the salesperson can interact with ChatGPT using the context already held