import { useEffect } from "react";

function PreloadImages(imagePaths: string[]) {
    useEffect(() => imagePaths.forEach(path => (new Image()).src = path), [imagePaths]);
}

function AddPreloadImageHMTL(imagepath: string) {
    const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = imagepath;
      document.head.appendChild(link);
}

function PreloadFonts() { // Function written by chatGPT on 7/20/24
    const preconnectGoogleFonts1 = document.createElement('link');
    preconnectGoogleFonts1.rel = 'preconnect';
    preconnectGoogleFonts1.href = 'https://fonts.googleapis.com';
    document.head.appendChild(preconnectGoogleFonts1);

    const preconnectGoogleFonts2 = document.createElement('link');
    preconnectGoogleFonts2.rel = 'preconnect';
    preconnectGoogleFonts2.href = 'https://fonts.gstatic.com';
    preconnectGoogleFonts2.crossOrigin = 'anonymous';
    document.head.appendChild(preconnectGoogleFonts2);

    // Preload the fonts
    const preloadFontsLink = document.createElement('link');
    preloadFontsLink.rel = 'preload';
    preloadFontsLink.as = 'style';
    preloadFontsLink.href = 'https://fonts.googleapis.com/css2?family=Playwrite+DE+Grund:wght@100..400&family=Rubik:ital,wght@0,300..900;1,300..900&display=swap';
    preloadFontsLink.onload = () => {
        // Once preloaded, we can actually load the stylesheet
        const stylesheetLink = document.createElement('link');
        stylesheetLink.rel = 'stylesheet';
        stylesheetLink.href = preloadFontsLink.href;
        document.head.appendChild(stylesheetLink);
    };
    
    document.head.appendChild(preloadFontsLink);
}


export { PreloadImages, PreloadFonts, AddPreloadImageHMTL }