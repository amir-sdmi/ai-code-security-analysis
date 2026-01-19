// YouTube Transcript Summarizer Extension
(() => {
  console.log("YouTube Transcript Summarizer Extension loaded");

  // Biến để theo dõi số lần thử
  let playerLoadAttempts = 0;
  const MAX_ATTEMPTS = 20; // Tối đa 20 lần thử (20 giây)

  // Wait for the YouTube player to be fully loaded
  function waitForYouTubePlayer() {
    playerLoadAttempts++;
    console.log(
      `Attempt ${playerLoadAttempts} to find YouTube player controls`
    );

    const rightControls = document.querySelector(".ytp-right-controls");
    if (rightControls) {
      console.log("Found YouTube player controls, injecting button");
      injectSummaryButton();
    } else if (playerLoadAttempts < MAX_ATTEMPTS) {
      // Thử lại sau 1 giây
      setTimeout(waitForYouTubePlayer, 1000);
    } else {
      console.log(
        "Failed to find YouTube player controls after maximum attempts"
      );
      // Thử lại với phương pháp khác - theo dõi thay đổi DOM
      setupMutationObserver();
    }
  }

  // Create and inject the summary button into the YouTube player controls
  function injectSummaryButton() {
    // Check if button already exists
    if (document.querySelector(".transcript-summary-btn")) {
      return;
    }

    // Xóa transcript cũ khi inject button mới (có thể là video mới)
    chrome.runtime.sendMessage(
      {action: "clearStoredTranscript"},
      (response) => {
        console.log(
          "Cleared stored transcript when injecting new button:",
          response
        );
      }
    );

    // Create the button
    const summaryButton = document.createElement("button");
    summaryButton.className = "ytp-button transcript-summary-btn";
    summaryButton.title = "Summarize Transcript with ChatGPT";
    summaryButton.innerHTML = `
      <svg height="100%" viewBox="0 0 36 36" width="100%">
        <path d="M18 12L18 24" stroke="white" stroke-width="2" stroke-linecap="round"></path>
        <path d="M12 18L24 18" stroke="white" stroke-width="2" stroke-linecap="round"></path>
      </svg>
    `;

    // Add click event listener
    summaryButton.addEventListener("click", async (e) => {
      e.stopPropagation();

      // Show loading indicator
      summaryButton.classList.add("loading");
      summaryButton.title = "Đang trích xuất transcript...";

      try {
        // Trích xuất transcript mới
        const transcript = await extractTranscript();
        if (transcript && transcript.length > 0) {
          const paragraphText = formatTranscriptAsParagraph(transcript);
          // Gửi trực tiếp đến hàm sendToChatGPT mà không lưu trước
          // Việc lưu sẽ được thực hiện trong hàm sendToChatGPT
          sendToChatGPT(paragraphText);
        } else {
          showNotification(
            "Không thể trích xuất transcript. Video này có thể không có phụ đề hoặc phụ đề đã bị tắt."
          );
        }
      } catch (error) {
        console.error("Error extracting transcript:", error);
        showNotification("Lỗi khi trích xuất transcript. Vui lòng thử lại.");
      } finally {
        summaryButton.classList.remove("loading");
        summaryButton.title = "Tóm tắt Transcript với ChatGPT";
      }
    });

    // Insert the button into the YouTube player controls
    const rightControls = document.querySelector(".ytp-right-controls");
    if (rightControls) {
      rightControls.insertBefore(summaryButton, rightControls.firstChild);
      console.log("Summary button injected successfully");
    }
  }

  // Function to show notification
  function showNotification(message) {
    const notification = document.createElement("div");
    notification.className = "transcript-notification";
    notification.textContent = message;

    document.body.appendChild(notification);

    // Remove notification after 5 seconds
    setTimeout(() => {
      notification.classList.add("fade-out");
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 500);
    }, 5000);
  }

  // Method 1: Extract transcript from ytInitialPlayerResponse
  async function extractFromInitialPlayerResponse() {
    console.log(
      "Attempting to extract transcript from ytInitialPlayerResponse..."
    );

    try {
      // Get the ytInitialPlayerResponse from the window object
      let ytInitialPlayerResponse = null;

      // Try different methods to get the player response
      if (window.ytInitialPlayerResponse) {
        console.log("Found ytInitialPlayerResponse directly in window object");
        ytInitialPlayerResponse = window.ytInitialPlayerResponse;
      } else {
        // Try to find it in script tags
        const scripts = document.getElementsByTagName("script");
        for (const script of scripts) {
          const content = script.textContent;
          if (content && content.includes("ytInitialPlayerResponse")) {
            const match = content.match(
              /ytInitialPlayerResponse\s*=\s*({.+?});/
            );
            if (match && match[1]) {
              try {
                console.log("Found ytInitialPlayerResponse in script tag");
                ytInitialPlayerResponse = JSON.parse(match[1]);
                break;
              } catch (e) {
                console.log(
                  "Failed to parse ytInitialPlayerResponse from script:",
                  e
                );
              }
            }
          }
        }
      }

      if (!ytInitialPlayerResponse) {
        console.log("Could not find ytInitialPlayerResponse");
        return null;
      }

      // Navigate through the player response to find the transcript
      if (
        ytInitialPlayerResponse.captions &&
        ytInitialPlayerResponse.captions.playerCaptionsTracklistRenderer &&
        ytInitialPlayerResponse.captions.playerCaptionsTracklistRenderer
          .captionTracks
      ) {
        const captionTracks =
          ytInitialPlayerResponse.captions.playerCaptionsTracklistRenderer
            .captionTracks;
        console.log(`Found ${captionTracks.length} caption tracks`);

        // Try to find a caption track in the user's language or English
        let captionTrack = null;
        const userLang = navigator.language || "en";

        // First try to find a track in the user's language
        captionTrack = captionTracks.find(
          (track) => track.languageCode === userLang
        );

        // If not found, try English
        if (!captionTrack) {
          captionTrack = captionTracks.find(
            (track) => track.languageCode === "en"
          );
        }

        // If still not found, use the first available track
        if (!captionTrack && captionTracks.length > 0) {
          captionTrack = captionTracks[0];
        }

        if (captionTrack) {
          console.log(
            `Using caption track: ${captionTrack.name.simpleText} (${captionTrack.languageCode})`
          );
          const baseUrl = captionTrack.baseUrl;
          return await fetchTranscriptData(baseUrl);
        }
      }

      console.log("No caption tracks found in ytInitialPlayerResponse");
      return null;
    } catch (error) {
      console.log("Error in extractFromInitialPlayerResponse:", error);
      return null;
    }
  }

  // Extract transcript data from player response object
  function extractTranscriptFromPlayerResponse(playerResponse) {
    try {
      if (!playerResponse.captions) {
        console.log("No captions found in player response");
        return null;
      }

      const captionTracks =
        playerResponse.captions.playerCaptionsTracklistRenderer.captionTracks;

      if (!captionTracks || captionTracks.length === 0) {
        console.log("No caption tracks found");
        return null;
      }

      // Get the first caption track (usually the default language)
      const firstTrack = captionTracks[0];
      const baseUrl = firstTrack.baseUrl;
      const languageName = firstTrack.name.simpleText || "Default";

      console.log(`Found caption track: ${languageName}`);

      // We need to fetch the actual transcript data
      return fetchTranscriptData(baseUrl);
    } catch (error) {
      console.log("Error extracting transcript from player response:", error);
      return null;
    }
  }

  // Method 2: Extract transcript by monitoring network requests
  async function extractFromNetworkRequests() {
    console.log("Attempting to extract transcript from network requests...");

    try {
      // Try to find caption track URLs in the page source
      const pageSource = document.documentElement.outerHTML;

      // Try different regex patterns to find caption track URLs
      const patterns = [
        /"captionTracks":\[{.*?"baseUrl":"([^"]+)"/,
        /{"captionTracks":\[{"baseUrl":"([^"]+)"/,
        /"playerCaptionsTracklistRenderer":{.*?"baseUrl":"([^"]+)"/,
      ];

      for (const pattern of patterns) {
        const match = pageSource.match(pattern);
        if (match && match[1]) {
          const baseUrl = match[1].replace(/\\u0026/g, "&");
          console.log("Found caption track URL with pattern:", pattern);
          const transcript = await fetchTranscriptData(baseUrl);
          if (transcript && transcript.length > 0) {
            return transcript;
          }
        }
      }

      // Try to find transcript in ytInitialData
      const scripts = document.getElementsByTagName("script");
      for (const script of scripts) {
        const content = script.textContent;
        if (content && content.includes("ytInitialData")) {
          const match = content.match(/ytInitialData\s*=\s*({.+?});/);
          if (match && match[1]) {
            try {
              const data = JSON.parse(match[1]);
              // Navigate through the data structure to find transcript
              if (
                data &&
                data.playerOverlays &&
                data.playerOverlays.playerOverlayRenderer &&
                data.playerOverlays.playerOverlayRenderer
                  .decoratedPlayerBarRenderer &&
                data.playerOverlays.playerOverlayRenderer
                  .decoratedPlayerBarRenderer.decoratedPlayerBarRenderer &&
                data.playerOverlays.playerOverlayRenderer
                  .decoratedPlayerBarRenderer.decoratedPlayerBarRenderer
                  .playerBar &&
                data.playerOverlays.playerOverlayRenderer
                  .decoratedPlayerBarRenderer.decoratedPlayerBarRenderer
                  .playerBar.multiMarkersPlayerBarRenderer &&
                data.playerOverlays.playerOverlayRenderer
                  .decoratedPlayerBarRenderer.decoratedPlayerBarRenderer
                  .playerBar.multiMarkersPlayerBarRenderer.markersMap
              ) {
                const markersMap =
                  data.playerOverlays.playerOverlayRenderer
                    .decoratedPlayerBarRenderer.decoratedPlayerBarRenderer
                    .playerBar.multiMarkersPlayerBarRenderer.markersMap;
                for (const key in markersMap) {
                  if (key.includes("TRANSCRIPT")) {
                    const transcriptMarkers = markersMap[key].value.chapters;
                    if (transcriptMarkers && transcriptMarkers.length > 0) {
                      console.log("Found transcript markers in ytInitialData");
                      const transcript = transcriptMarkers
                        .map((marker, index) => ({
                          start:
                            marker.chapterRenderer.timeRangeStartMillis / 1000,
                          duration: 1,
                          text: marker.chapterRenderer.title.simpleText || "",
                        }))
                        .filter((item) => item.text);

                      if (transcript.length > 0) {
                        return transcript;
                      }
                    }
                  }
                }
              }
            } catch (e) {
              console.log("Failed to parse ytInitialData:", e);
            }
          }
        }
      }

      console.log("Could not find caption track URL in page source");
      return null;
    } catch (error) {
      console.log("Error in extractFromNetworkRequests:", error);
      return null;
    }
  }

  // Method 3: Extract transcript from visible captions
  async function extractFromVisibleCaptions() {
    console.log("Attempting to extract transcript from visible captions...");

    try {
      // Try different selectors for caption elements
      const selectors = [
        ".ytp-caption-segment", // Standard YouTube caption segments
        ".captions-text", // Alternative caption text
        ".caption-window .caption-visual-line", // Another possible structure
        '[data-testid="captions-text-segment"]', // Possible test ID
      ];

      let captionElements = [];

      // Try each selector
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        if (elements && elements.length > 0) {
          console.log(
            `Found ${elements.length} caption elements with selector: ${selector}`
          );
          captionElements = Array.from(elements);
          break;
        }
      }

      // If no caption elements found, try to enable captions programmatically
      if (captionElements.length === 0) {
        console.log("No caption elements found, trying to enable captions...");

        // Try to find and click the captions button
        const captionsButton = document.querySelector(".ytp-subtitles-button");
        if (captionsButton) {
          console.log("Found captions button, clicking it...");
          captionsButton.click();

          // Wait a moment for captions to appear
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // Try selectors again
          for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            if (elements && elements.length > 0) {
              console.log(
                `Found ${elements.length} caption elements after enabling captions`
              );
              captionElements = Array.from(elements);
              break;
            }
          }
        }
      }

      if (captionElements.length === 0) {
        console.log("No caption elements found after all attempts");
        return null;
      }

      // Collect caption text
      let captionTexts = [];

      // Method 1: Extract text directly from elements
      captionTexts = captionElements
        .map((el) => el.textContent.trim())
        .filter((text) => text);

      // Method 2: If we have few captions, try to collect more by waiting
      if (captionTexts.length < 10) {
        console.log("Few captions found, trying to collect more by waiting...");

        // Create a set to avoid duplicates
        const uniqueCaptions = new Set(captionTexts);

        // Try to collect captions for a short time
        const startTime = Date.now();
        const maxWaitTime = 10000; // 10 seconds max

        // Function to collect captions from the current view
        const collectCurrentCaptions = () => {
          for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            if (elements && elements.length > 0) {
              Array.from(elements).forEach((el) => {
                const text = el.textContent.trim();
                if (text) uniqueCaptions.add(text);
              });
            }
          }
          return uniqueCaptions.size;
        };

        // Initial collection
        let lastCount = collectCurrentCaptions();
        console.log(`Initially collected ${lastCount} unique captions`);

        // Try to collect more captions by waiting and checking periodically
        while (Date.now() - startTime < maxWaitTime) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          const newCount = collectCurrentCaptions();
          if (newCount > lastCount) {
            console.log(
              `Collected ${newCount} unique captions (added ${
                newCount - lastCount
              } new)`
            );
            lastCount = newCount;
          }

          // If we have a good number of captions, stop waiting
          if (newCount >= 20) break;
        }

        // Convert set back to array
        captionTexts = Array.from(uniqueCaptions);
      }

      console.log(
        `Final caption collection: ${captionTexts.length} unique captions`
      );

      // Create transcript-like structure
      const transcript = captionTexts.map((text, index) => ({
        start: index,
        duration: 1,
        text: text,
      }));

      return transcript;
    } catch (error) {
      console.log("Error extracting from visible captions:", error);
      return null;
    }
  }

  // Fetch transcript data from a caption track URL
  async function fetchTranscriptData(url) {
    try {
      console.log("Fetching transcript data from URL...");

      // Add parameters to get transcript in JSON format
      const jsonUrl = url + "&fmt=json3";

      const response = await fetch(jsonUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data || !data.events) {
        console.log("Invalid transcript data format");
        return null;
      }

      // Process the transcript data
      const transcript = data.events
        .filter((event) => event.segs && event.segs.length > 0)
        .map((event) => {
          const text = event.segs
            .map((seg) => seg.utf8)
            .join("")
            .trim();
          return {
            start: event.tStartMs / 1000,
            duration: (event.dDurationMs || 0) / 1000,
            text: text,
          };
        })
        .filter((item) => item.text); // Remove empty captions

      console.log(
        `Successfully extracted ${transcript.length} caption segments`
      );
      return transcript;
    } catch (error) {
      console.log("Error fetching transcript data:", error);
      return null;
    }
  }

  // Function to extract transcript from YouTube's player response data
  async function extractTranscript() {
    try {
      console.log("Searching for transcript data...");

      // Show notification to user that extraction is in progress
      showNotification("Đang trích xuất transcript, vui lòng đợi...");

      // Method 1: Try to get transcript from ytInitialPlayerResponse
      let transcript = await extractFromInitialPlayerResponse();

      // Method 2: If Method 1 fails, try to get transcript from network requests
      if (!transcript || transcript.length === 0) {
        console.log("Method 1 failed, trying Method 2...");
        transcript = await extractFromNetworkRequests();
      }

      // Method 3: If Method 2 fails, try to get transcript from visible captions
      if (!transcript || transcript.length === 0) {
        console.log("Method 2 failed, trying Method 3...");
        transcript = await extractFromVisibleCaptions();
      }

      // Debug: Log transcript length
      console.log("Transcript length:", transcript ? transcript.length : 0);

      // Check if transcript exists but is empty
      if (!transcript || transcript.length === 0) {
        // Try one more time with a different approach - look for transcript in the page
        try {
          console.log("All methods failed, trying emergency approach...");

          // Try to enable captions if they're not already enabled
          const captionsButton = document.querySelector(
            ".ytp-subtitles-button"
          );
          if (
            captionsButton &&
            !captionsButton.classList.contains("ytp-button-active")
          ) {
            console.log("Trying to enable captions...");
            captionsButton.click();
            // Wait a moment for captions to appear
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }

          const transcriptElements = document.querySelectorAll(
            ".ytp-caption-segment"
          );
          if (transcriptElements && transcriptElements.length > 0) {
            // Extract text from caption segments
            transcript = Array.from(transcriptElements)
              .map((el, index) => ({
                start: index,
                duration: 1,
                text: el.textContent.trim(),
              }))
              .filter((item) => item.text);

            console.log(
              "Found transcript from caption segments:",
              transcript.length
            );
          }
        } catch (captionError) {
          console.log("Error getting captions from DOM:", captionError);
        }
      }

      if (!transcript || transcript.length === 0) {
        console.error(
          "Could not extract transcript. This video might not have captions, or they might be disabled."
        );
        showNotification(
          "Không thể trích xuất transcript. Video này có thể không có phụ đề hoặc phụ đề đã bị tắt."
        );
        return null;
      }

      // Verify transcript has actual content
      const totalTextLength = transcript.reduce(
        (sum, item) => sum + item.text.length,
        0
      );
      if (totalTextLength < 50) {
        console.error(
          "Transcript extracted but content is too short:",
          totalTextLength
        );
        showNotification(
          "Transcript trích xuất được quá ngắn. Hãy đảm bảo video có phụ đề đầy đủ."
        );
        return null;
      }

      return transcript;
    } catch (error) {
      console.error("Error extracting transcript:", error);
      showNotification("Lỗi khi trích xuất transcript. Vui lòng thử lại.");
      return null;
    }
  }

  // Function to format the transcript as a continuous paragraph
  function formatTranscriptAsParagraph(transcript) {
    if (!transcript || transcript.length === 0) {
      return "";
    }

    // Join all text segments into a single paragraph
    return transcript.map((item) => item.text).join(" ");
  }

  // Function to send transcript to ChatGPT and automatically press Enter
  function sendToChatGPT(text) {
    try {
      console.log("Preparing to send transcript to ChatGPT...");

      // Xóa transcript cũ trước khi lưu transcript mới
      chrome.runtime.sendMessage(
        {action: "clearStoredTranscript"},
        (clearResponse) => {
          console.log(
            "Cleared previous transcript before storing new one:",
            clearResponse
          );

          // Get prompt template from storage or use default
          chrome.storage.sync.get("promptTemplate", function (data) {
            const promptTemplate =
              data.promptTemplate ||
              "Hãy tóm tắt đoạn văn sau đây thành các đề mục, không quá 20 đề mục:";

            // Create ChatGPT prompt
            const promptText = promptTemplate + "\n\n" + text;

            // Lưu prompt vào background script (chỉ lưu một lần ở đây)
            chrome.runtime.sendMessage(
              {action: "storeTranscript", text: promptText},
              (response) => {
                if (response && response.success) {
                  console.log(
                    "Stored transcript in background script:",
                    response
                  );

                  // Xóa transcript cũ từ video trước (nếu có)
                  // Lưu ý: Chúng ta không xóa transcript vừa lưu, vì nó sẽ được sử dụng ngay sau đó

                  // Open ChatGPT with autopaste parameter and a unique timestamp
                  const timestamp = Date.now();
                  window.open(
                    `https://chat.openai.com/?autopaste=true&t=${timestamp}`,
                    "_blank"
                  );

                  // Show success notification with instructions
                  showNotification(
                    "Transcript đã được lưu! ChatGPT sẽ tự động dán và gửi nội dung."
                  );

                  // Also copy to clipboard as backup
                  navigator.clipboard
                    .writeText(promptText)
                    .then(() => {
                      console.log("Prompt also copied to clipboard as backup!");
                    })
                    .catch((err) => {
                      console.error("Failed to copy prompt to clipboard:", err);
                    });
                } else {
                  console.error(
                    "Failed to store transcript in background script"
                  );
                  showNotification("Lỗi khi lưu transcript. Vui lòng thử lại.");
                }
              }
            );
          });
        }
      );
    } catch (error) {
      console.error("Error in sendToChatGPT:", error);
      showNotification(
        "Error sending transcript to ChatGPT. Please try again."
      );
    }
  }

  // Thiết lập MutationObserver để theo dõi thay đổi DOM và phát hiện player
  function setupMutationObserver() {
    console.log("Setting up MutationObserver to detect player controls");
    const observer = new MutationObserver((mutations) => {
      if (
        document.querySelector(".ytp-right-controls") &&
        !document.querySelector(".transcript-summary-btn")
      ) {
        console.log("Player controls detected via MutationObserver");
        injectSummaryButton();
      }
    });

    // Theo dõi thay đổi trong toàn bộ document
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  // Khởi tạo MutationObserver để theo dõi thay đổi DOM
  const mainVideoObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        // Kiểm tra nếu player controls đã xuất hiện nhưng nút tóm tắt chưa được thêm vào
        if (
          document.querySelector(".ytp-right-controls") &&
          !document.querySelector(".transcript-summary-btn")
        ) {
          console.log("Player detected after DOM change, injecting button");

          // Khi chuyển video mới, xóa transcript cũ
          chrome.runtime.sendMessage(
            {action: "clearStoredTranscript"},
            (response) => {
              console.log(
                "Cleared stored transcript when navigating to new video (MutationObserver):",
                response
              );
            }
          );

          injectSummaryButton();
        }
      }
    }
  });

  // Bắt đầu theo dõi thay đổi DOM
  mainVideoObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Thêm event listener cho các sự kiện YouTube SPA
  document.addEventListener("yt-page-data-updated", function () {
    console.log("YouTube page data updated, checking for player");
    setTimeout(waitForYouTubePlayer, 1000);
  });

  // Chạy khi trang được load
  function onPageLoad() {
    console.log("Page loaded, starting extension");
    waitForYouTubePlayer();

    // Thêm event listener cho sự kiện navigation (SPA)
    window.addEventListener("yt-navigate-finish", function () {
      console.log("YouTube navigation detected, checking for player");
      setTimeout(waitForYouTubePlayer, 1000);
    });
  }

  // Start the extension
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", onPageLoad);
  } else {
    onPageLoad();
  }

  // Theo dõi URL hiện tại để phát hiện khi chuyển video
  let currentVideoId = new URLSearchParams(window.location.search).get("v");

  // Xóa transcript cũ ngay khi extension được load
  chrome.runtime.sendMessage({action: "clearStoredTranscript"}, (response) => {
    console.log("Cleared stored transcript on initial load:", response);
  });

  // Kiểm tra URL định kỳ để phát hiện chuyển video
  setInterval(() => {
    const newVideoId = new URLSearchParams(window.location.search).get("v");
    if (newVideoId && newVideoId !== currentVideoId) {
      console.log(`Video changed from ${currentVideoId} to ${newVideoId}`);
      currentVideoId = newVideoId;

      // Xóa transcript cũ
      chrome.runtime.sendMessage(
        {action: "clearStoredTranscript"},
        (response) => {
          console.log(
            "Cleared stored transcript when navigating to new video:",
            response
          );
        }
      );

      // Đảm bảo nút được thêm vào sau khi player đã load
      setTimeout(() => {
        if (
          document.querySelector(".ytp-right-controls") &&
          !document.querySelector(".transcript-summary-btn")
        ) {
          injectSummaryButton();
        } else {
          // Nếu player chưa sẵn sàng, thử lại
          waitForYouTubePlayer();
        }
      }, 1500);
    }
  }, 1000);

  // Observer đã được định nghĩa và khởi tạo ở trên với tên mainVideoObserver
})();
