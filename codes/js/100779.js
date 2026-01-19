/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run "npm run dev" in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run "npm run deploy" to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

// Created using ChatGPT (lol)



async function handleRequest(request, env) {
  // Set up the headers for downloading the CSV file
  const headers = new Headers();
  headers.set("Content-Type", "text/csv");
  headers.set("Content-Disposition", "attachment; filename=kv_pairs.csv");

  // Prepare the CSV content
  const csvHeader = 'Key,Value\n';
  let csvContent = csvHeader;

  // Fetch all keys from the KV store
  const listOptions = {
    limit: 1000, // The maximum number of items to return in one request
  };
  
  let cursor = undefined;
  
  do {
    // Fetch a batch of keys and values from KV store
    const { keys, cursor: nextCursor } = await env.LINKS.list(listOptions);
    
    // Append the key-value pairs to the CSV content
    for (const { name: key } of keys) {
      const value = await env.LINKS.get(key);
      // Make sure the value is a string for CSV compatibility
      csvContent += `"${key}","${value.replace(/"/g, '""')}"\n`;
    }

    // Update the cursor to continue pagination
    cursor = nextCursor;
    listOptions.cursor = cursor;

  } while (cursor); // Keep fetching until all keys are retrieved

  // Return the CSV file as the response
  return new Response(csvContent, {
    headers: headers
  });
}


export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env);
  },
};
