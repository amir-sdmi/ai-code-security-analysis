import anthemsPreview from '/public/anthemsPreview.png'
import chroniclesPreview from '/public/chroniclesPreview.png'
import hyperloomPreview from '/public/hyperloomPreview.png'


const ProjectArray = {
  'anthems' : 
  {title : 'Avian Anthems', size: '4', mod : '3rd', 
    tech: ['react', 'javascript', 'typescript', 'html5', 'css3', 'mocha', 'git'],
    previewImg: anthemsPreview,
    abstract: 'The world of birdsongs is a vast one, and this project aims to offer a glimpse into a robust trove of calls and songs that have been collected by our fellow audience members. This project is written with TypeScript and uses the Xeno-Canto.org provided RESTful API. Users may browse by bird call type and location of recording. Additional notes are included upon the details page of each recording, including any details included by the citizen scientist responsible for submitting the sample. Original MVP was completed within two weeks, using an agile methodology, and Cypress was used for E2E testing.',
    link: 'https://avian-anthems.vercel.app/',
    github: 'https://github.com/sdmisra/birdWords'
  },
  'chronicles' : 
  {title : 'Mars Chronicles', size: '4', mod : '3rd', 
    tech : ['react', 'redux', 'javascript', 'html5', 'css3', 'mocha', 'git'],
    previewImg: chroniclesPreview,
    abstract: 'One of mankinds most incredible accomplishments to date is certainly our ventures into the exploration of space. This application enables users to browse Mars Rover images, as offered directly from NASA and updated on a nearly daily basis. Users may select from any previous or current Mars Rover mission, as well as dates of note such as the landing date (aka sol 0). Selection by camera location is an option, allowing our planetary observers input into what perspectives they wish to review. This project was created with React and Redux, as well as Cypress to enable E2E and component testing.',
    link: 'https://mars-chronicles.vercel.app/',
    github: 'https://github.com/Zertroz/Mars-Chronicles'
  },
  'hyperloom' : 
  {title: 'Hyper Loom', size: '7', mod : '4th', 
    tech: ['react', 'redux', 'javascript','html5', 'css3', 'mocha', 'git', 'python', 'django'],
    abstract: 'This project is a unique offering indeed, as it enables users to explore vibrant imagined worlds that have been generated with ChatGPT, MidJourney, and our teams intention to offer fuel to the creative fires of those who interact with it. Users can browse worlds that have been randomly selected and offered, or they may filter through multiple carousels of varied descriptions and categories. Each world is a self-consisent concept, with its own locations of note, historical events, key characters, and inhabitants to explore. Worlds vary in technological scale, magical influence, and even in metaphysical shape. The tech stack used to bring this to life is: React, Redux, Framer Motion, Python, Django, and their respective testing suites for full component and E2E testing.',
    previewImg: hyperloomPreview,
    link: 'https://hyperloom.shane-misra.com/',
    github: 'https://github.com/The-Never-Ending-Story/front-end'
  }
}

export default ProjectArray;