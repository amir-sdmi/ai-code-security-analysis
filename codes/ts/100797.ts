import browser from 'webextension-polyfill';

import { VIDEO_SUMMARIZER_URL } from './js/consts';

console.log('Hello from the background!');

browser.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed:', details);
});

browser.browserAction.onClicked.addListener(() => {
  console.log('Browser action clicked!');
});

// Check if we're running in development mode
if (browser.runtime.id.endsWith('@temporary-addon')) {
  console.log('Running in development mode');
  // Open the options page
  // browser.runtime.openOptionsPage().then(() => console.log('openOptionsPage'));
  // browser.tabs.create({url: browser.runtime.getURL('src/popup.html')});
  // browser.tabs.create({ url: 'https://www.youtube.com/watch?v=YRBIoCIIxTE' });
  // browser.tabs.create({
  //   url: browser.runtime.getURL(
  // eslint-disable-next-line max-len
  //     "https://chat.openai.com/share/ea0b7446-42eb-4a4e-88e2-de75f5a1eefc?video=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DL_Tcxe7_2kg"
  //   ),
  // });
}

// Create a new context menu item.
browser.contextMenus.create(
  {
    id: 'my-extension-link-action',
    title: 'Summarize using ChatGPT',
    contexts: ['link', "image", "page"], // ContextType
  },
  () => {
    if (browser.runtime.lastError) {
      console.error(browser.runtime.lastError);
    } else {
      console.log('Context menu item created successfully.');
    }
  },
);

// Add an onClicked listener for the context menu item.
browser.contextMenus.onClicked.addListener((info) => {
  console.log('contextMenus.onClicked event fired.');
  const { linkUrl, menuItemId } = info;
  if (menuItemId === 'my-extension-link-action') {
    console.log('You clicked a link!');
    console.log('Link URL:', linkUrl);

    // Open a new tab with the link URL. Encode the video query parameter.
    if (linkUrl !== undefined) {
      browser.tabs.create({
        url: `${VIDEO_SUMMARIZER_URL}?video=${encodeURIComponent(linkUrl)}`,
      });
    }
  }
});
