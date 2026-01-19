// Define language configuration
export const SUPPORTED_LANGUAGES = [
  { identifier: "en", name: "English" },
  { identifier: "np", name: "Nepali" },
  { identifier: "fr", name: "French" },
];

// Define translations
const lang = {
  en: {
    search: "Search",
    play: "Play",
    moreInfo: "More Info",
    gptSearchPlaceholder: "Search with ChatGPT",
    nowPlaying: "Now Playing",
    popular: "Popular Movies",
    topRated: "Today's Top Picks for you",
    newOnNetflix: "New On Netflix",
    actionMovies: "Action Movies",
  },
  np: {
    search: "खोजी",
    play: "खेल्नुहोस्",
    moreInfo: "थप जानकारी",
    gptSearchPlaceholder: "ChatGPT सँग खोजी गर्नुहोस्",
    nowPlaying: "हाल चलिरहेको",
    popular: "प्रसिद्ध चलचित्रहरू",
    topRated: "आजको शीर्ष छनोटहरू",
    newOnNetflix: "नेटफ्लिक्समा नयाँ",
    actionMovies: "क्रियाकलाप चलचित्रहरू",
  },
  fr: {
    search: "Recherche",
    play: "Jouer",
    moreInfo: "Plus d'infos",
    gptSearchPlaceholder: "Rechercher avec ChatGPT",
    nowPlaying: "Maintenant en cours",
    popular: "Films populaires",
    topRated: "Les meilleurs choix d'aujourd'hui",
    newOnNetflix: "Nouveau sur Netflix",
    actionMovies: "Films d'action",
  },
};

export default lang;
