
const defaultEntries = [
  {
    id: Date.now(),
    videoGameName: "Celeste",
    entryTitle: "My wrist hurts but I'm having fun",
    date: "April 19th, 2025",
    overallThoughtsImg:"https://assets.nintendo.com/image/upload/ar_16:9,c_lpad,w_1240/b_white/f_auto/q_auto/ncom/software/switch/70010000006442/691ba3e0801180a9864cc8a7694b6f98097f9d9799bc7e3dc6db92f086759252",
    overallThoughtsImgCaption:"Strawberry with wings 🪽 ",
    // Written by ChatGPT: https://chatgpt.com/share/68059580-f2a4-8009-b99e-80a6c641d11e
    overallThoughtsParagraph:"Celeste was one of those rare games that felt like it was speaking directly to me. The precision platforming was intense—frustrating at times—but every death felt like part of the process rather than a failure. The difficulty never felt unfair; instead, it felt like a challenge to push forward, much like the game’s central theme of climbing your own personal mountain. The story hit me in a surprising way, especially how it explored anxiety, self-doubt, and resilience without being heavy-handed. The music, the art, the quiet little moments—it all came together to create something honest and moving. It wasn’t just about beating a level, it was about understanding why you’re climbing in the first place.",
    keyMomentImg:" https://assets.nintendo.com/image/upload/ar_16:9,b_auto:border,c_lpad/b_white/f_auto/q_auto/dpr_1.5/c_scale,w_700/ncom/software/switch/70010000006442/dd649ca9811831baff09db2e1adbab93f9ac2bbe058d76759c1aef8a2b20b2a6",
    keyMomentImgCaption:"Almost reached the summit 🏔️",
    // Written by ChatGPT: https://chatgpt.com/share/68059580-f2a4-8009-b99e-80a6c641d11e
    keyMomentParagraph:"One key moment in Celeste that really stuck with me was when Madeline literally confronts the darker version of herself—her anxiety and self-doubt—during the hotel chapter and especially in Chapter 6, “Reflection.” There’s a moment when she falls down the mountain, emotionally and physically at her lowest, and finally realizes she can’t just reject this part of herself. She needs to listen, understand, and accept it. That shift—from trying to escape or suppress that inner darkness to integrating it—is such a powerful metaphor for mental health. And when Madeline and her “dark” self team up in Chapter 7, the mechanics even reflect that unity. It’s not just clever—it’s deeply human. That moment felt like the emotional turning point, both for the narrative and for the player.",
    conclusionImg:"https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/504230/ss_832ef0f27c3d6efdaa4b5d1cc896dce0999bc9e8.600x338.jpg?t=1714089525",
    conclusionImgCaption:"There's still more?",
    // Written by ChatGPT: https://chatgpt.com/share/68059580-f2a4-8009-b99e-80a6c641d11e
    conclusionParagraph:"Climbing that mountain wasn’t just a test of skill—it was a reflection of something deeper. Celeste reminded me that the journey through doubt, fear, and struggle is just as important as reaching the summit. It’s not about perfection; it’s about persistence, and learning to embrace every part of yourself, even the ones you wish you could push away. It left me feeling seen, challenged, and ultimately uplifted.",
    tags: "Playing"
  },
  {
    id: Date.now() + 1,
    videoGameName: "Persona 3 Reload",
    entryTitle: "Being emo has never been so cool",
    date: "February 2nd, 2024",
    overallThoughtsImg:"https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/2161700/header.jpg?t=1744328458",
    overallThoughtsImgCaption:"So much blue, I don't even like blue that much",
    // Written by ChatGPT:https://chatgpt.com/share/68059580-f2a4-8009-b99e-80a6c641d11e
    overallThoughtsParagraph:"Persona 3 Reload felt like coming back to an old friend, but one who had grown up. It takes the original’s moody, melancholic core and gives it a fresh coat of polish without losing what made it special. The story hits deep—with its themes of mortality and the inevitability of death—but it also gives you light through its social links and character interactions. The new visuals and QoL changes really elevate the whole experience, making Tartarus exploration more bearable and the combat smoother. Spending your limited time wisely, choosing who to talk to, what to study, and when to fight—it all carries this weight that makes your choices feel meaningful. It’s a game that lingers with you, long after the credits roll.",
    keyMomentImg:"https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/2161700/ss_b5b93089686b45d6abee593d025c91389c7dc20e.1920x1080.jpg?t=1744328458",
    keyMomentImgCaption:"So cool ⭐️",
    // Written by ChatGPT: https://chatgpt.com/share/68059580-f2a4-8009-b99e-80a6c641d11e
    keyMomentParagraph:"In Persona 3 Reload, the key moment that absolutely gutted me—still does—is when Shinjiro dies. Even knowing it was coming from the original, the way it’s handled in Reload hits harder with the upgraded visuals, voice acting, and pacing. His arc was all about guilt, redemption, and doing what little he could with the time he had left. His death isn’t just a tragic event; it’s a brutal reminder of the game’s core theme: that death is inevitable, but how we live until that moment matters. The silence after he’s gone, the reactions of the team—especially Akihiko—it all feels so raw. It’s one of those moments that makes you sit with the weight of it, not just as a plot point, but as something that feels painfully real.",
    conclusionImg:"https://i.scdn.co/image/ab67616d0000b273d8ff4bc4a6a3f1beefbeb26c",
    conclusionImgCaption:"Playing this soundtrack rn 🎧",
    // Written by ChatGPT: https://chatgpt.com/share/68059580-f2a4-8009-b99e-80a6c641d11e
    conclusionParagraph:"Persona 3 Reload is a beautiful, melancholic meditation on time, death, and the bonds we forge in between. It doesn’t offer easy answers, but it gives weight to every choice, every relationship, every quiet night under a starless sky. In the end, it’s not just a game about fighting shadows—it’s about finding light in fleeting moments and facing the inevitable with courage. It stayed with me like a memory I lived through, not just played.",
    tags: "Played"
  }];

// Grabbing the unique journal entry id from the search URL
const urlParams = new URLSearchParams(window.location.search);
// This is the unique ID for the journal entry taken from the search URL
const entryId = urlParams.get("id");
// Get the list of journal entries the user created from local storage
let entryList = localStorage.getItem('entry.list') ? JSON.parse(localStorage.getItem('entry.list')) : defaultEntries;
// Save default entries to localStorage if entry.list doesn't already exist
if (!localStorage.getItem("entry.list")) {
    localStorage.setItem("entry.list", JSON.stringify(defaultEntries));
}
// Finds a specific entry in the entryList array whose id matches a given entryId
const matchingEntry = entryList.find(entry => entry.id === Number(entryId));

// DOM Elements from entry page
const journalEntry = document.querySelector("#entryContainer")

/**
 * Creates a standardized HTML section block with optional image, caption, and paragraph content.
 * 
 * @param {string} title
 * Section name on the entry page
 * @param {string} img
 * The value of image URL input.
 * @param {string} caption
 * The value of caption input.
 * @param {string} paragraph
 * The value of paragraph input.
 * 
 * Function created by Chatgpt: https://chatgpt.com/share/6807bbd0-473c-8009-a182-9082acda3b7a
*/
const createSection = ({ title, img, caption, paragraph }) => {
  return `
    <section>
      ${img ? `
        <figure>
          <img src="${img}" alt="">
          <figcaption>${caption || ""}</figcaption>
        </figure>` : ""}
      <h2>${title}</h2>
      <p>${paragraph || "No Thoughts"}</p>
    </section>
  `;
};

/**
 * Displays information from local storage onto the page for a specific journal entry.
 * @param {Object} matchingEntry 
 * The journal entry object from local storage whose ID matches the ID in the URL.
*/
const renderEntry = (matchingEntry) => {
  if (!matchingEntry) {
    // Handles case where ID doesn't match any entry 
    console.error("No entry found with ID:", entryId);
    journalEntry.innerHTML = "<p>Entry not found.</p>";
    return;
  }

  document.querySelector(".entryHeader h1").innerHTML = matchingEntry.entryTitle;
  // Fallback image used if an entry is missing an image
  const defaultImg = "https://cdn.shopify.com/s/files/1/1083/2612/files/mymelody2_480x480.png?v=1721111506"
  
  // Adding entry information onto the page
  journalEntry.innerHTML += `      
    <section class="introduction">
      <h2>${matchingEntry.videoGameName}</h2>
      <p>${matchingEntry.date}</p>
      <p>${matchingEntry.tags}</p>
    </section>
    ` 
    journalEntry.innerHTML += createSection({
      title: "Overall Thoughts",
      img: matchingEntry.overallThoughtsImg || defaultImg,
      caption: matchingEntry.overallThoughtsImgCaption,
      paragraph: matchingEntry.overallThoughtsParagraph
    });

    journalEntry.innerHTML += createSection({
      title: "Key Moment(s)",
      img: matchingEntry.keyMomentImg || defaultImg,
      caption: matchingEntry.keyMomentImgCaption,
      paragraph: matchingEntry.keyMomentParagraph
    });
  
    journalEntry.innerHTML += createSection({
      title: "Conclusion",
      img: matchingEntry.conclusionImg || defaultImg,
      caption: matchingEntry.conclusionImgCaption,
      paragraph: matchingEntry.conclusionParagraph
    });
  };

// Renders chosen journal entry onto the page
renderEntry(matchingEntry);