const { chromium } = require('playwright');

// The browser needs to run with the following command:
// cmd.exe "%PROGRAMFILES%\Google\Chrome\Application\chrome.exe" --no-default-browser-check --remote-debugging-port=9222
// The chat needs to be initialized manually in the browser, logged in and all that

(async () => {
    const prompt = await getValidPromptFromInput();
    // var prompt = "test";
    const { page, browser } = await connectToChatGpt();

    // the div[data-message-author-role="assistant"] elements are the chat responses
    // we count them to know when a new response is added after we send the prompt
    const initialResponseDivCount = await getInitialResponseDivCount(page);
    await typePromptIntoChatGptAndPressEnter(prompt, page);
    const newResponseDiv = await waitForNewResponseDiv(initialResponseDivCount, page);
    await printResponseTextToConsoleAlongWithChatGpt(newResponseDiv, page);
    await browser.close();
})();

async function getValidPromptFromInput() {
    const args = process.argv.slice(2); // skip "node" and filename

    const showHelp = args.includes('--help') || args.includes('-h');
    const hasPromptArg = args.length > 0;
    const isPiped = !process.stdin.isTTY;

    if (showHelp || (!hasPromptArg && !isPiped)) {
        console.log(`
            Usage:
              chat "Your prompt here"
              echo "Prompt via stdin" | chat
            
            Options:
              -h, --help    Show this help message
            `);
        process.exit(0);
    }

    if (hasPromptArg) {
        return args.join(' ');
    }

    process.stdin.setEncoding('utf8');
    let input = '';
    for await (const chunk of process.stdin) {
        input += chunk;
    }

    if (!input.trim()) {
        throw new Error('No input provided via stdin.');
    }

    return input.trim();
}

async function connectToChatGpt() {
    const browser = await chromium.connectOverCDP('http://localhost:9222');

    const context = browser.contexts()[0];
    if (!context) throw new Error('No existing browser context found.');

    const pages = context.pages();
    if (pages.length === 0) throw new Error('No pages found in existing context.');

    const page = pages.find(p => p.url().includes('https://chatgpt.com'));
    if (!page) throw new Error('No ChatGPT page found.');
    return { page, browser };
}

async function getInitialResponseDivCount(page) {
    await page.waitForTimeout(1000);
    const initialResponseDivs = await page.locator('div[data-message-author-role="assistant"]');
    let initialResponseDivCount = 0;

    try {
        initialResponseDivCount = await initialResponseDivs.count();
    } catch (e) {
        throw new Error("Failed counting the chat gpt response divs, have the browser got enough of a time out? Use page.waitForTimeout. Inner error message:" + e.message);
    }

    if (typeof initialResponseDivCount !== 'number' || isNaN(initialResponseDivCount) || initialResponseDivCount < 0) {
        throw new Error('initialChatElementCount should be zero or a positive number but got: ' + initialResponseDivCount);
    }
    return initialResponseDivCount;
}

async function typePromptIntoChatGptAndPressEnter(prompt, page) {
    const promptDiv = await page.locator('#prompt-textarea');
    await promptDiv.click();
    await page.keyboard.type(prompt, { delay: 90 });
    await page.keyboard.press('Enter');
}

async function waitForNewResponseDiv(initialResponseDivCount, page) {
    let currentResponseDivs = null;
    let currentResponseDivCount = 0;
    let retrys = 0;
    for (; ;) {
        await page.waitForTimeout(500);
        currentResponseDivs = page.locator('div[data-message-author-role="assistant"]');
        currentResponseDivCount = await currentResponseDivs.count();

        if (currentResponseDivCount > initialResponseDivCount)
            break;

        retrys++;
        if (retrys > 3)
            throw new Error('No new "div[data-message-author-role="assistant"]" found. initialChatElementCount: ' + initialResponseDivCount + ' currentChatElementCount: ' + currentResponseDivCount);
    }

    if (currentResponseDivs === null)
        throw new Error('Failed locating currentChatElements - div[data-message-author-role="assistant"], currentChatElements was null.');

    const newResponseDiv = currentResponseDivs.nth(currentResponseDivCount - 1);

    if (!newResponseDiv)
        throw new Error('No assistant element found.');
    return newResponseDiv;
}

async function printResponseTextToConsoleAlongWithChatGpt(newResponseDiv, page) {
    let chatResponse = '';
    let chrPtr = 0;
    retrys = 0;

    for (; ;) {
        // If we caught up typing with chatGPT, the cases are:
        // - We have not started typing the response yet
        // - ChatGPT has taken a pause and we should wait for the next response
        // - The response is fully printed
        let caughtUpWithResponse = chatResponse.length === chrPtr;

        if (caughtUpWithResponse && retrys > 10) {
            break;
        }

        if (caughtUpWithResponse) {
            retrys++;
            await page.waitForTimeout(1000);
        }

        if (!caughtUpWithResponse) {
            retrys = 0;
        }

        chatResponse = await newResponseDiv.innerText();
        let newLength = chatResponse.length;

        for (let i = chrPtr; i < newLength; i++) {
            process.stdout.write(chatResponse[i]);
            await page.waitForTimeout(5);
        }

        chrPtr = newLength;
    }
}
