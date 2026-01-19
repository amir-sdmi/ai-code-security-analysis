let output = document.getElementById("output");
let input = document.getElementById("input")
let commands = ["go to", "examine", "interact", "start", "clear", "look", "escape"]; 
let currentRoom = "start";
let exits = [];
let entrance = null;
let nextRoom = null;
let burialRoom = null;
let treasureRoom = null;
let inscriptionRoom = null;
let gameExit = null;
let guardRoom = null;
let started = 0;
let torch = null;
let suitsOfArmor = null;
let greed = null;
let key = null;
let eyes = null;
let stoneCoffin = null;
let statue = null;
let royalChest = null;
let pirateChest = null;
let guardianChest = null;
let goldKey = null;
let sword = null;
let keyHole = null;

//initializing all variables, rooms, and items, so that they can be assinged to each other later and have all of them global.

let gameProgress = ["close", false, "close", false, false, false, false] //keeps tracks of milestones thoughout the game
//[coffin status, knowledge of the sword being a key, exit open or close, chest collected? true or false,
//knowledge of the eyes, sword found?, exit found?]

const exitsArray = []; 
for (let i = 0; i < 7; i++) { 
    exitsArray[i] = []; 
    for (let j = 0; j < 7; j++) {
        exitsArray[i][j] = 0; 
    }
} 

function updateExits(x, y) 
{
    exitsArray[x][y] = 1;
    exitsArray[y][x] = 1;
}

updateExits(0, 1);
updateExits(2, 3);
updateExits(4, 3);
updateExits(3, 5);

for(let i = 0; i < 7; i++) // makes sure that if the player tries to go to the room they are in, it doesnt break the game
{
    updateExits(i, i);
}

document.getElementById('input-form').addEventListener('submit', function(event) { 
    //written by chatGPT, runs the code whenever something is submitted in the input box
    event.preventDefault(); // Prevent form submission
    processCommand(input.value);
    input.value = '';
});


function processCommand(userInput) {
    updateOutput("<br>>" + userInput + "<br>"); //places the users input in the output so they can see it
    userInput = userInput.toLowerCase(); //lowercase everything
    var userInputArray = userInput.split(' '); //make the words into an array
    let command = null;
    command = returnCommand(userInputArray); //return what their command is 
    if(command == "clear")
    {
        clearScreen();
    }
    let target = returnTarget(userInputArray, command); // return what their target is
    if(target != null) //if everything so far is valid then do the command
    {
        doCommand(command, target);
    }
}

function updateOutput(string) // add the string to the output
{
    output.innerHTML += "<br>" + string; // Append the message to the existing content
    output.scrollTop = output.scrollHeight; //line written by chatGPT
}



function returnCommand(userInput) {
    userInput = userInput.join(' '); 
    for(let i = 0; i < commands.length; i++) { 
        if (userInput.startsWith(commands[i])) {
            return commands[i];
        }
    }
    updateOutput("Invalid command: " + userInput);
    return null;
}

function returnTarget(array, command)
{
    if(command == null) //null handling
    {
        return null;
    }
    
    if(command == "go to") // gets all the words after the first two words "go to" and assumes it's the target
    {
        let target = array.slice(2).join(' ');
        return target;
    }
    else if(array.length > 1)
    {
        if(command == "examine" || command == "interact") // makes the words after the command the target
        {
            let target = array.slice(1).join(' ');
            return target;
        }

    }
    else
    {
        if(command == "look" || command == "clear" || command == "start" || 
        command == "continue" || command == "escape") //commands that don't require targets
        {
            return command;
        }
    }
}

function clearScreen()
{
    output.textContent = " ";
}

function doCommand(command, target)
{
    if(command == "go to")
    {
        target = fixSyntax(target);
        currentRoom = fixSyntax(currentRoom);

        if(exitsArray[currentRoom][target] == 1 && target != null) 
        {
            target = fixSyntax(target);
            currentRoom = fixSyntax(currentRoom);
            changeRoomTo(target);
        }
        else{
            updateOutput(fixSyntax(target) + " does not exist or is not nearby.")
        }

    }
    else if(command == "look")
    {
        look();
    }
    else if(command == "clear")
    {
        clearScreen();
    }
    else if(command == "start")
    {
        console.log("Game started.");
        uploadRooms();
        clearScreen();
        gameContext();
        commands.splice(3, 1);
        commands.splice(3, 0, "continue");
        console.log(commands);
    }
    else if(command == "continue")
    {
        clearScreen();
        changeRoomTo(entrance);
        commands.splice(3, 1);
    }
    else if(command == "examine")
    {
        console.log(target);
        console.log(checkIfItemIsInRoom(target));
        if(checkIfItemIsInRoom(target) == true)
        {
            let newTarget = fixSyntax(target); 
            //checks what the string of the target is equal to, 
            //and then outputs it's string when the player examines it
            if(newTarget == suitsOfArmor && gameProgress[5] == false)
            {
                gameProgress[5] = true;
                currentRoom.addItemToRoom(sword);
            }
            if(newTarget == key)
            {
                gameProgress[1] = true;
            }
            if(newTarget == eyes)
            {
                gameProgress[4] = true;
            }
            updateOutput(newTarget.getExamineItem())
            
        }
        else
        {
            updateOutput("There is not an item in the room called, \"" + target + "\"")
        }
    }
    else if(command == "interact") // all the special commands that happen when you interact with different items.
    {
        if(checkIfItemIsInRoom(target) == true)
        {
            let newTarget = fixSyntax(target);
            if(newTarget == torch)
            {
                updateOutput("You push the torch and you hear a loud click sounds, followed by the sound of gears. "+
                "Then a secret passage opens up in the wall leading to the GUARD ROOM.")
                currentRoom.updateRoomDescription("The room is pretty much empty. Behind you is a path leading back to the ENTRANCE, " +
                "and straight a head there is an opening in the wall that leads to the GUARD ROOM.")
                updateExits(2, 1);
            }
            if(newTarget == greed || newTarget == key || newTarget == eyes || newTarget == suitsOfArmor)
            {
                updateOutput("You cannot interact with " + target);
            }
            if(newTarget == stoneCoffin)
            {
                if(gameProgress[0] == "close")
                {
                    gameProgress[0] = "open";
                    updateOutput("You push with all your might and the coffin slides open revealing a skeleton of the once powerful king. "+
                    "He is wearing a GOLD KEY around his neck.")
                    stoneCoffin.updateItemDescription("In the middle of the room there is a STONE COFFIN inside there is the skeleton of the king.")
                    stoneCoffin.updateItemExamine("The Coffin lays open revealing the skeleton of the king. Around the kings neck lays a GOLD KEY."); 
                    currentRoom.addItemToRoom(goldKey);
                }
                else{
                    updateOutput("The coffin is already open.");
                }
            }
            if(newTarget == pirateChest || newTarget == royalChest || newTarget == guardianChest)
            {
                if(gameProgress[2] == "close") // the exit isnt even open
                {
                    updateOutput("You have no where to take the chest.");
                }
                else if(gameProgress[3] != false) // they have already collected a chest
                {
                    greedEnding(target);
                }
                else{ //runs if they havent got a chest yet and the exit is open
                    updateOutput("You pick up the " + target + " and carry it to the exit.");
                    changeRoomTo(gameExit);
                    gameProgress[3] = newTarget;

                }
            }
            if(newTarget == sword)
            {
                if(gameProgress[5] == false) //they havent found the sword yet
                {
                    updateOutput("You do not know of a \"sword\" in this room.")
                }
                else if(gameProgress[1] == false || gameProgress[6] == false) 
                // they don't know the sword can be used as a key or they don't know where the key can be used
                {
                    updateOutput("You don't know what to do with the sword.");
                }
                else // they have found the sword, know what it does, and have found the key hole
                {
                    updateOutput("You take the sword over to where they statues eyes lay and slide it into the hole. "+
                    "You hear a mechanism working behind the wall and after a few seconds the wall slides open, revealing the EXIT.<br>")
                    burialRoom.updateRoomDescription("From this room you can go to the GUARD ROOM, TREASURE ROOM, "+ 
                    "the INSCRIPTION ROOM, and the EXIT of the crypt.");
                    burialRoom.removeLastItem();
                    changeRoomTo(burialRoom);
                    updateExits(3, 6);
                    gameProgress[2] = "open";

                }
            }
            if(newTarget == goldKey)
            {
                if(gameProgress[6] == true)
                {
                    updateOutput("You take the key and try it in hole where the statue's eyes lay. "+
                    "The hole is too big for this key, you put back where you found it.")
                }
                else{
                    updateOutput("You don't know where to use the key.")
                }
            }
            if(newTarget == statue)
            {
                if(gameProgress[4] == true)
                {
                    updateOutput("You follow the eyes of the statue and find that they are pointing to an empty wall."+
                    " You go over to the wall where the eyes were pointing and brush off the dust revealing a KEY HOLE.");
                    currentRoom.addItemToRoom(keyHole);
                    gameProgress[6] = true;
                }
                else
                {
                    updateOutput("There is nothing to interact with the statue.")
                }
            }
            if(newTarget == keyHole)
            {
                updateOutput("You don't have any key to place in the KEY HOLE.")
            }
        }
        else
        {
            updateOutput("There is not an item in the room called, \"" + target + "\"")
        }
    }
    else if(command == "escape") // escape the dungeon
    {
        if(currentRoom == gameExit)
        {
            if(gameProgress[3] != false)
            {
                chestEnding(gameProgress[3]);
            }
            else{
                noChestEnding();
            }
        }
        else{
            updateOutput("\"escape\" is not a valid command.")
        }
    }
    else{
        updateOutput("No function has been made for that command yet.")
    }
}

function changeRoomTo(room)
{
    
    currentRoom = room;
    updateOutput(room.description);
    if (currentRoom.items.length > 0) { //if statement written by chat GPT
        for (let item of room.items) {
            updateOutput(item.itemDescription);
        }
    }


}

class Room {
    constructor(description, items, num) {
        this.description = description;
        this.num = num;
        this.items = items;
    }

    updateRoomDescription(newDescription)
    {
        this.description = newDescription;
    }
    addItemToRoom(itemToAdd)
    {
        this.items.push(itemToAdd);
    }
    removeLastItem()
    {
        this.items.pop();
    }
}

class Item {
    constructor(itemDescription, name, examineItem) {
        this.itemDescription = itemDescription;
        this.name = name;
        this.examineItem = examineItem;
    }

    getExamineItem()
    {
        return this.examineItem;
    }
    updateItemDescription(newItemDescription)
    {
        this.itemDescription = newItemDescription;
    }
    updateItemExamine(newItemExamine)
    {
        this.examineItem = newItemExamine;
    }
}


function uploadRooms() //all details here written by me except for GREED, KEY and EYES
{
    suitsOfArmor = new Item(
        "There are two SUITS OF ARMOR guarding the entrance to the burial room.", "suits of armor", 
        "There is nothing inside the suits of armor, they're empty. One of the suits of armor has a SWORD in it's hand."
    )
    greed = new Item(
        "There is an inscription on the wall about GREED.", "greed", 
        "The inscription says: \"Beware the covetous eye that seeks to claim all treasures within these walls, "+
        "for the weight of greed may lead to a fate far darker than the shadows that lurk within.\""
    )
    key = new Item(
        "There is an inscription on the wall about the KEY.", "key", 
        "The inscription says: \"Look not to the key of gold, but to the blade of steel held by the guardian of stone. "+
        "Only through courage and wit shall the path to freedom be revealed.\""
    )
    eyes = new Item(
        "There is an inscription on the wall about the EYES.", "eyes", 
        "The inscription says: \"Follow the gaze of the king's watchful eyes, "+
        "for within their silent vigil lies the path to liberation, concealed amidst the shadows of their eternal gaze.\""
    )
    torch = new Item(
        "You see a lit TORCH on the wall beside you, it's whats providing the light for the room.", "torch", 
        "Examining the torch you notice that the torch is attached to the wall weirdly, like it's connected to a mechanism."
    )
    stoneCoffin = new Item(
        "In the middle of the room there is a STONE COFFIN sealed shut with a stone lid on top.", "stone coffin", 
        "On closer examination the lid looks like it can be pushed open."
    )
    statue = new Item(
        "There is a large STATUE of the king looking over the coffin.", "statue", 
        "The statue is giant almost reaching the ceiling. "+
        "It has very detailed charactaristics such as eyes, hair, and details in the hands."
    )
    royalChest = new Item(
        "The ROYAL CHEST which is full of all the king's most valuable items,", "royal chest", 
        "The royal chest is purple with gold engravings on it. "+
        "Inside is all the most valuable gems and treasure the king was in possesion of when he died."
    )
    pirateChest = new Item(
        "and finally a PIRATE CHEST which is full of gold doubloons along with a map leading to a different location.", 
        "pirate chest", "The PIRATE CHEST is a wooden chest with a skull and crossbone symbol on the side. "+
        "Inside is full of gold doubloons and a treasure map."
    )
    guardianChest = new Item(
        "The GUARDIAN CHEST which has many powerful magic items,", "guardian chest", 
        "The guardian chest a silvery looking chest like it has it's own armor. Inside are very powerful magical items and weapons."
    )
    goldKey = new Item(
        "There is a GOLD KEY around the neck of the King's Skeleton.", "gold key", 
        "The GOLD KEY is tied around the neck of the skeleton with a super old looking string. "+
        "It looks like it could fall apart at any moment."
    )
    sword = new Item(
        "There is a SWORD being held by one of the SUITS OF ARMOR.", "sword", 
        "The sword on closer examination is very weirdly shaped, like it was made into a unique one of a kind shape, "+
        "but at the same time still looks like a normal sword."
    )
    keyHole = new Item(
        "Where the statues eyes lay is a KEY HOLE.", "key hole", 
        "The key hole is larger than you would expect. Maybe there is a key laying around here somewhere?"
    )


    entrance = new Room(
        "Behind you is a giant large door sealed shut blocking your path out. You can see a light up ahead forward into the NEXT ROOM.",
        [], 0
    );
    nextRoom = new Room(
        "The room is pretty much empty. Behind you is a path leading back to the ENTRANCE.", [torch], 1
    );
    guardRoom = new Room(
        "Standing in front of the entrance to the BURIAL ROOM.", 
        [suitsOfArmor], 2
    );
    burialRoom = new Room(
        "From this room you can go to the GUARD ROOM, TREASURE ROOM, and the INSCRIPTION ROOM.", 
        [stoneCoffin, statue], 3
    );
    treasureRoom = new Room(
        "Behind you is the way to the BURIAL ROOM. There are treasure chests "+
        "everywhere and a mountain of gold coins. There are 3 treasure chests that stand out to you;", 
        [royalChest, guardianChest, pirateChest], 4
    );
    inscriptionRoom = new Room(
        "In this room there are several inscriptions on the wall consisting mostly of text, "+
        "etched into the wall. Behind you is the way back to the BURIAL ROOM.", 
        [greed, eyes, key], 5
    );
    gameExit = new Room(
        "In front of you is the path to freedom, you see the sunlight at the end of the tunnel. "+
        "Behind you is the path back inside to the BURIAL ROOM. Type ESCAPE if you would like to escape.", 
        [], 6
    );
}


function look()
{
    updateOutput(currentRoom.description);

    if (currentRoom.items.length > 0) { //if statement written by chat GPT
        for (let item of currentRoom.items) {
            updateOutput(item.itemDescription);
        }
    }
}


function gameContext() //story written by chatgpt
{
    updateOutput("Deep in the heart of the enchanted forest lies a forgotten dungeon, rumored to be filled with "+
    "untold riches and ancient artifacts. An ancient King from long ago is rumored to be buried there with all his treasure.");
    updateOutput("You, a fearless explorer seeking fame and fortune, have decided to go to the Crypt and explore it for yourself. "+
    "You gather your courage and set out on a journey to uncover its secrets.");
    updateOutput("");
    updateOutput("After many days of travel you arrive at the entrance of the dungeon. Carefully you walk in, "+
    "but in doing so you step on a pressure plate and the entrance slams shut. Guess you will have to find another way to get out.")
    updateOutput("");
    updateOutput("Please type \"continue\" to continue.");
}

function fixSyntax(target) // connects rooms to their numbers, and entered strings to their room or items
{
    if (typeof target === 'number')
    {
        if(target == 0)
        {
            return entrance;
        }
        if(target == 1)
        {
            return nextRoom;
        }
        if(target == 2)
        {
            return guardRoom;
        }
        if(target == 3)
        {
            return burialRoom;
        }
        if(target == 4)
        {
            return treasureRoom;
        }
        if(target == 5)
        {
            return inscriptionRoom;
        }
        if(target == 6)
        {
            return gameExit;
        }
    }
    else
    {
        if(target == "next room" || target == "nextroom" || target == nextRoom)
        {
            return 1;
        }
        if(target == "entrance" || target == entrance)
        {
            return 0;
        }
        if(target == "guard room" || target == guardRoom || target == "guardroom")
        {
            return 2;
        }
        if(target == "burial room" || target == burialRoom || target == "burialroom")
        {
            return 3;
        }
        if(target == "treasure room" || target == treasureRoom || target == "treasureroom")
        {
            return 4;
        }
        if(target == "inscription room" || target == inscriptionRoom || target == "inscriptionroom")
        {
            return 5;
        }
        if(target == "exit" || target == gameExit)
        {
            return 6;
        }
        if(target == "torch")
        {
            return torch;
        }
        if(target == "greed")
        {
            return greed;
        }
        if(target == "key")
        {
            return key;
        }
        if(target == "eyes")
        {
            return eyes;
        }
        if(target == "suits of armor")
        {
            return suitsOfArmor;
        }
        if(target == "statue")
        {
            return statue;
        }
        if(target == "stone coffin")
        {
            return stoneCoffin;
        }
        if(target == "royal chest")
        {
            return royalChest;
        }
        if(target == "pirate chest")
        {
            return pirateChest;
        }
        if(target == "guardian chest")
        {
            return guardianChest;
        }
        if(target == "gold key")
        {
            return goldKey;
        }
        if(target == "sword")
        {
            return sword;
        }
        if(target == "key hole")
        {
            return keyHole;
        }
    }
    return null;
}


function checkIfItemIsInRoom(target) //makes sure the item that the user is trying to interact with is there
{
    for(let i = 0; i < currentRoom.items.length; i++)
        {
            if(currentRoom.items[i].name == target)
            {
                return true;
            }
        }
    return false;
}

function greedEnding(chestYouTryToTake) //ending written by chatgpt
{
    clearScreen();
    updateOutput("As your hands grasp for the " + chestYouTryToTake + ", a deafening rumble fills the chamber. "+
    "With a sickening realization, you look up to see the ancient stones above you begin to crumble. "+
    "Your insatiable greed has sealed your fate. In the darkness, the weight of the collapsing crypt overwhelms you, "+
    "burying you beneath its ancient ruins. Your legacy, a cautionary tale of hubris and greed, "+
    "forever entombed within the depths of the cursed dungeon.");
    updateOutput("<br>The End")
}

function chestEnding(chestTheyTook) // endings written by chatgpt
{
    chestTheyTook = gameProgress[3];
    clearScreen();
    if(chestTheyTook == royalChest)
    {
        updateOutput("With a triumphant grin, you clutch the royal chest you collected tightly to your chest "+
        "as you emerge from the depths of the ancient tomb. The weight of gold and jewels pales in comparison "+
        "to the sense of accomplishment that fills your heart. As you step into the warm embrace of sunlight, "+
        "you know that your daring exploits will be whispered about for generations to come. With newfound riches "+
        "and stories to tell, you set off into the horizon, ready to embark on your next adventure, "+
        "forever remembered as the intrepid treasure hunter who bested the ancient crypt.");
        updateOutput("<br>The End")
    }
    else if(chestTheyTook == guardianChest)
    {
        updateOutput("With a triumphant grin, you clutch the guardian chest you collected tightly to your "+
        "chest as you emerge from the depths of the ancient tomb. The weight of magic items and weapons pales "+
        "in comparison to the sense of accomplishment that fills your heart. As you step into the warm embrace of sunlight, "+
        "you know that your daring exploits will be whispered about for generations to come. "+
        "With newfound riches and stories to tell, you set off into the horizon, ready to embark on your next adventure, "+
        "forever remembered as the intrepid treasure hunter who bested the ancient crypt.");
        updateOutput("<br>The End")
    }
    else{
        updateOutput("With a triumphant grin, you clutch the pirate chest you collected tightly to your chest "+
        "as you emerge from the depths of the ancient tomb. The weight of gold doubloons pales in comparison to "+
        "the sense of accomplishment that fills your heart. As you step into the warm embrace of sunlight, "+
        "you know that your daring exploits will be whispered about for generations to come. "+
        "With a map leading you to your next adventure, you set off into the horizon, "+
        "ready to conquer whatever else may stand in your way, forever remembered as the intrepid treasure hunter "+
        "who bested the ancient crypt.");
        updateOutput("<br>The End")
    }
}

function noChestEnding() //ending written by chatgpt
{
    clearScreen();
    updateOutput("As you emerge from the depths of the ancient tomb, you feel a sense of relief wash over you. "+
    "Though you leave empty-handed, the knowledge gained from your harrowing journey is a treasure in itself. "+
    "With a final glance back at the darkened entrance, you step into the sunlight, ready to embark on new adventures,"+
    " your courage and resilience shining brighter than any gold.");
    updateOutput("<br>The End");
}