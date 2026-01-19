import {assertIsVElement, h, updateElement, VElement, VNode} from '../../lib/dvdi';
import {BlogPost} from '../BlogPost';
import {JavaScriptParser} from '../../lib/syntax';
import {highlight} from '../../lib/highlight'
import {cloneObject} from '../../lib/cloneObject';
import {navigateEvent} from '../../app';

const code: VNode[][] = [[], []];
let codeVElement: (VElement | null)[] = [null, null];
const codeFunction: (() => VElement)[] = [
    blogCode0_2024_07_15_0800,
    blogCode1_2024_07_15_0800
];

/**
 * Callback to write the contents of the file load for the first code fragment.
 * @param content
 */
function writeCode(segment: number, content: VElement[]) {
    code[segment].push(...content);
    if (codeVElement[segment] === null) {
        return;
    }

    assertIsVElement(codeVElement[segment]);
    if (codeVElement[segment].parentVNode === null) {
        return;
    }

    const parentElem = (codeVElement[segment].parentVNode as VElement).domElement;
    if (parentElem === null) {
        return;
    }

    if (codeVElement[segment].domElement === null) {
        return;
    }

    const index = Array.from(parentElem.childNodes).indexOf(codeVElement[segment].domElement);
    const newVElement = codeFunction[segment]();
    newVElement.parentVNode = codeVElement[segment].parentVNode;
    updateElement(parentElem,
        parentElem.childNodes[index],
        codeVElement[segment].parentVNode as VElement,
        codeVElement[segment],
        newVElement
    );
    codeVElement[segment] = newVElement;
}

async function loadFile(segment: number, filePath: string, storeFunction: (segment: number, content: VElement[]) => void) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.statusText}`);
        }

        const content = await response.text();
        storeFunction(segment, highlight(content, JavaScriptParser));
    } catch (error) {
        console.error('Error loading file:', error);
    }
}

function blogCode0_2024_07_15_0800(): VElement {
    let contents: VElement;
    if (code[0].length === 0) {
        contents = h('pre', {});
    } else {
        contents = h('pre', {}, h('code', {}, ...cloneObject(code[0])));
    }

    contents.mountCallback = () => {
        codeVElement[0] = contents;
        if (code[0].length === 0) {
            loadFile(0, '/blog/2024-07-15-0800/code0.js', writeCode);
        }
    }

    contents.unmountCallback = () => {
        codeVElement[0] = null;
    }

    return contents;
}

function blogCode1_2024_07_15_0800(): VElement {
    let contents: VElement;
    if (code[1].length === 0) {
        contents = h('pre', {});
    } else {
        contents = h('pre', {}, h('code', {}, ...cloneObject(code[1])));
    }

    contents.mountCallback = () => {
        codeVElement[1] = contents;
        if (code[1].length === 0) {
            loadFile(1, '/blog/2024-07-15-0800/code1.js', writeCode);
        }
    }

    contents.unmountCallback = () => {
        codeVElement[1] = null;
    }

    return contents;
}

function blogOpening_2024_07_15_0800(): VElement[] {
    return [
        h('p', {},
            'We\'re all trying to work out the implications of generative AI.  We\'ve all seen examples of it building ' +
            'websites and coding a version of the snake game.  These seem impressive until we realize there are millions ' +
            'of websites and thousands of versions of snake, so it\'s not too surprising tools like ChatGPT can regurgitate ' +
            'them.  After all, it\'s easy to replicate something that\'s well-understood?'
        ),
        h('p', {},
            'How about a more interesting challenge?  How well can these tools build something new?  I decided to give this ' +
            'a try.  I needed a tool to use with my blog site, ',
            h('a', {href: '/', onclick: (e: MouseEvent) => navigateEvent(e, '/')}, 'davehudson.io'),
            '.  How well would ChatGPT be able to help?'
        )
    ]
}

function blogArticle_2024_07_15_0800(): VElement[] {
    return [
        h('section', {},
            h('h2', {}, 'A quick aside'),
            h('p', {},
                'Humans have a long history of building tools.  About 2.6 million years ago, in the early Stone Age, our ' +
                'ancestors began creating simple stone implements to aid in hunting, gathering, and daily survival.  I ' +
                'daresay stone engineering was quite satisfying at the time, but these days our most prolific tool builders ' +
                'are software engineers.',
            ),
            h('p', {},
                'Most software takes the form of tooling.  It\'s intended to be created once and used many times.  We could ' +
                'almost say software engineering is the pursuit of finding ways to build ever better, more reliable, and less ' +
                'expensive tools.',
            )
        ),
        h('section', {},
            h('h2', {}, 'The problem statement'),
            h('p', {},
                'I’ve been rebuilding my blog site (formerly hashingit.com), and this time I decided to do it from first ' +
                'principles.  I like to do slightly mad low-level things sometimes!',
            ),
            h('p', {},
                'The blog site is a single page app (SPA) and is 99% TypeScript code (we\'ll save discussions on why for ' +
                'another time), but I realized that doesn\'t play nicely with web crawlers, or social media sharing.  As ' +
                'I\'d like people to find things I write, and potentially share them, I needed to come up with a way to ' +
                'serve up initial static versions of any page on the site before the TypeScript code could take over.',
            ),
        ),
        h('section', {},
            h('h2', {}, 'First steps'),
            h('p', {},
                'As I’ve increasingly done for the last 6 months I asked my sidekick, ChatGPT, how to solve this problem.  It ' +
                'suggested I needed to pre-render these pages.',
            ),
            h('p', {},
                'It also recommended I should follow the crowd and serve up the pre-rendered pages to crawlers and bots but ' +
                'serve the dynamic version to humans.  While apparently common practice, that seemed a bit clunky, so I ' +
                'decided I\'d serve the static version to everyone but then let the dynamic code take over after that first ' +
                'page load thus any first page is the only page you “load”).',
            ),
            h('p', {},
                'It next, helpfully, identified some projects or commercial services that might do what I needed, but my ' +
                'intuition was I could do something local, fast, and free (except for my time).  Being able to work offline ' +
                'was a bonus because I spend a lot of time on trains and planes and Internet access is awful on both.',
            ),
        ),
        h('section', {},
            h('h2', {}, '30 minutes and code'),
            h('p', {},
                'Here\'s my initial prompt in a new session:',
            ),
            h('div', {className: 'green-note'},
                h('p', {},
                    'How do I use google chrome to pre-render my single page app website?'
                )
            ),
            h('p', {},
                'And the first reply:',
            ),
            h('div', {className: 'green-note'},
                h('p', {},
                    'Pre-rendering a single-page application (SPA) using Google Chrome involves generating static HTML ' +
                    'content that can be served to search engines and users to improve SEO and performance.  Here are the ' +
                    'steps to pre-render your SPA:'
                ),
                h('p', {},
                    '1. Use a Pre-rendering Service'
                ),
                h('p', {},
                    'Pre-rendering services can handle the task for you.  These services visit your SPA, render it using ' +
                    'a headless browser, and save the resulting HTML.  Popular services include Prerender.io, Rendertron, ' +
                    'and others.'
                ),
                h('p', {},
                    '2. Use Headless Chrome with Puppeteer'
                ),
                h('p', {},
                    'Puppeteer is a Node.js library which provides a high-level API to control Chrome or Chromium over the ' +
                    'DevTools Protocol.  Here\'s a basic example of using Puppeteer to pre-render your SPA:'
                ),
                h('p', {},
                    h('em', {},
                        '...goes on to give some code fragments.'
                    )
                )
            ),
            h('p', {},
                'I like to build things - option 2 was the only way to go!',
            ),
            h('p', {},
                'The chat went on for about half an hour with me asking questions and suggesting things I\'d like to see, ' +
                'and with ChatGPT writing all the code.  We ended up with this version:',
            ),
            h('figure', {},
                blogCode0_2024_07_15_0800(),
                h('figcaption', {}, 'Initial software developed using ChatGPT 4o')
            ),
            h('p', {},
                'It has a few rather quirky features because I wanted to render my site using a local ',
                h('code', {}, 'express.js'),
                ' server and not the one that hosts my live blog, so it does some translation of the ',
                h('code', {}, 'sitemap.xml'),
                ' file to find the correct URL to render.',
            ),
        ),
        h('section', {},
            h('h2', {}, 'Let\'s make this more interesting!'),
            h('p', {},
                'We could almost declare victory at this point.  To render 29 pages took 47 seconds on my M1 MacBook Air.'
            ),
            h('p', {},
                'I\'m fairly impatient though, and hate waiting for builds.  So, I upped the ante a little and asked for ' +
                'a parallelized version.  A little back and forth and we ended up with this:'
            ),
            h('figure', {},
                blogCode1_2024_07_15_0800(),
                h('figcaption', {}, 'Final software developed using ChatGPT 4o')
            ),
            h('p', {},
                'This one could complete in about 12 seconds.  Now we were getting close to what I wanted!  A manual tweak ' +
                'to run 16 in parallel and rendering was just under 6 seconds.  I\'ll take that as a huge win!'
            ),
            h('p', {},
                'Total elapsed time - about 2 hours.'
            ),
        ),
        h('section', {},
            h('h2', {}, 'A sign of things to come'),
            h('p', {},
                'Just like a human engineer, ChatGPT made mistakes.  It needed dialogue and questioning to keep it on the ' +
                'right path, and it worked better if you could give it a way to assess if it\'s doing the right things ' +
                '(that\'s a subject for another time).'
            ),
            h('p', {},
                'As the code got longer, it was also a little irritating in wanting to give me all the code all the time, ' +
                'when I only wanted a small section changing.'
            ),
            h('p', {},
                'However, I got an effective solution to my problem in 2 hours rather than 2 days.  Left unassisted, I\'d have ' +
                'probably still be reading docs at the 2 hours point.'
            ),
            h('p', {},
                'This was seriously impressive.'
            ),
            h('p', {},
                'I\'ve been building software for a very long time.  That included many years building compilers and code ' +
                'generators, and it\'s very clear we\'re somewhere we\'ve not been before.'
            ),
            h('p', {},
                'I read Fred Brooks\', “The Mythical Man Month” almost 30 years ago.  “No Silver Bullet - Essence and ' +
                'Accident in Software Engineering” was the chapter that has resonated with me for all that time.  It ' +
                'posed that in the 10 years after it was written there wouldn\'t be a single technology that would give ' +
                'a 10x improvement.  That has remained true for almost 50 years.  I have a feeling that 10x barrier may ' +
                'finally be about to break.'
            )
        )
    ];
}

export const blogPost_2024_07_15_0800 = new BlogPost(
    'Can my tools build tools?  Pre-rendering web pages with help from ChatGPT',
    '2024-07-15T08:00',
    '/blog/2024-07-15-0800',
    'ChatGPT 4o is pretty amazing, but how good is it at building non-trivial software?' +
    'Here\'s how it did when I had it help build a website pre-rendering tool',
    null,
    null,
    blogOpening_2024_07_15_0800,
    blogArticle_2024_07_15_0800,
    null
);
