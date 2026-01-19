// Initialize Office JS
Office.onReady(function() {
    document.getElementById("copy-button").onclick = copyEmailContent;
});

// Function to copy email content to the text box
function copyEmailContent() {
    Office.context.mailbox.item.body.getAsync("text", async function (result) {
        if (result.status === Office.AsyncResultStatus.Succeeded) {
            const emailContent = result.value;
            document.getElementById("content-box").value = "Sending to ChatGPT..."; // Show a temporary message

            // Full URL to your Vercel API
            const apiUrl = 'https://auto-event-git-main-david-barsoums-projects.vercel.app/api/chatgpt'; // Replace with your actual Vercel URL

            // Call the backend API to process the email content with ChatGPT
            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ content: emailContent })
                });

                // Check if the response is valid JSON
                if (response.ok) {
                    const data = await response.json();  // Parse the JSON response

                    // Display the response from ChatGPT in the content box
                    if (data.success) {
                        document.getElementById("content-box").value = data.output;
                    } else {
                        document.getElementById("content-box").value = "Error: " + data.error;
                    }
                } else {
                    // Handle the case where the response is not OK (e.g., server error)
                    document.getElementById("content-box").value = "Error: " + response.statusText;
                }
            } catch (error) {
                // Handle any other errors (e.g., network issues)
                document.getElementById("content-box").value = "Error: " + error.message;
            }
        } else {
            document.getElementById("content-box").value = "Error: " + result.error.message;
        }
    });
}
