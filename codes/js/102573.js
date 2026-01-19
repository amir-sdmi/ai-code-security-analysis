// // // Toggle Sidebar
// // function toggleSidebar() {
// //   let sidebar = document.getElementById("sidebar");
// //   if (sidebar.style.left === "0px") {
// //     sidebar.style.left = "-250px"; // Hide sidebar
// //   } else {
// //     sidebar.style.left = "0px"; // Show sidebar
// //   }
// // }
// //   document.getElementById("progressBar1").style.width = progressValue + "%";
// // }

// // // Set Default Progress (Example: 70%)
// // window.onload = function () {
// //   document.getElementById("progressBar1").style.width = "70%";
// // };

// // // // AI FETCHING (Using DeepSeek API)
// // // async function sendMessage() {
// // //   let userInput = document.getElementById("user-input").value;
// // //   if (!userInput) return;

// // //   let chatBox = document.getElementById("chat-box");
// // //   chatBox.innerHTML += `<div>User: ${userInput}</div>`;

// // //   document.getElementById("user-input").value = "";

// // //   try {
// // //     let response = await fetchAIResponse(userInput);
// // //     chatBox.innerHTML += `<div>AI: ${response}</div>`;
// // //   } catch (error) {
// // //     chatBox.innerHTML += `<div style="color:red;">Error: ${error.message}</div>`;
// // //   }
// // // }

// // // async function fetchAIResponse(message) {
// // //   let apiKey =
// // //     "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"; // Replace with your actual DeepSeek API key

// // //   try {
// // //     let response = await fetch("https://api.deepseek.com/v1/chat/completions", {
// // //       method: "POST",
// // //       headers: {
// // //         "Content-Type": "application/json",
// // //         Authorization: `Bearer ${apiKey}`,
// // //       },
// // //       body: JSON.stringify({
// // //         model: "deepseek-chat", // or the correct model name from DeepSeek
// // //         messages: [{ role: "user", content: message }],
// // //       }),
// // //     });

// // //     if (!response.ok) {
// // //       let errorData = await response.json();
// // //       throw new Error(errorData.error?.message || "Failed to fetch response");
// // //     }

// // //     let data = await response.json();
// // //     return data.choices[0].message.content;
// // //   } catch (error) {
// // //     console.error("API Error:", error);
// // //     throw error;
// // //   }
// // // }

// // const chatBox = document.getElementById("chat-box");
// // const userInput = document.getElementById("user-input");

// // async function sendMessage() {
// //   const message = userInput.value.trim();
// //   if (!message) return;

// //   appendMessage(message, "user");
// //   userInput.value = "";

// //   try {
// //     const response = await fetch(
// //       "https://cors-anywhere.herokuapp.com/https://api.openai.com/v1/chat/completions",
// //       {
// //         method: "POST",
// //         headers: {
// //           "Content-Type": "application/json",
// //           Authorization:
// //             "PASTE YOUR API KEY HERE",
// //         },
// //         body: JSON.stringify({
// //           model: "gpt-3.5-turbo",
// //           messages: [{ role: "user", content: message }],
// //         }),
// //       }
// //     );

// //     if (!response.ok) {
// //       const errorData = await response.json();
// //       throw new Error(errorData.error.message || "API request failed");
// //     }

// //     const data = await response.json();
// //     const reply = data.choices[0].message.content.trim();
// //     appendMessage(reply, "ai");
// //   } catch (error) {
// //     appendMessage("⚠️ Error: " + error.message, "ai");
// //   }
// // }

// // function appendMessage(text, sender) {
// //   const messageElement = document.createElement("div");
// //   messageElement.classList.add("message", sender);
// //   messageElement.textContent = text;
// //   chatBox.appendChild(messageElement);
// //   chatBox.scrollTop = chatBox.scrollHeight;
// // }

// // // Reminders Section
// // document.addEventListener("DOMContentLoaded", loadReminders);

// // function addReminder() {
// //   let input = document.getElementById("reminderInput");
// //   let reminderText = input.value.trim();

// //   if (reminderText === "") return;

// //   let reminder = { text: reminderText, completed: false };
// //   let reminders = getStoredReminders();
// //   reminders.push(reminder);

// //   saveReminders(reminders);
// //   input.value = "";
// //   renderReminders();
// // }

// // function renderReminders() {
// //   let todayGoals = document.getElementById("todayGoals");
// //   let completedGoals = document.getElementById("completedGoals");

// //   todayGoals.innerHTML = "";
// //   completedGoals.innerHTML = "";

// //   let reminders = getStoredReminders();

// //   reminders.forEach((reminder, index) => {
// //     let li = document.createElement("li");
// //     li.innerHTML = `<input type="checkbox" ${
// //       reminder.completed ? "checked" : ""
// //     } onclick="toggleReminder(${index})"> ${reminder.text}`;

// //     if (reminder.completed) {
// //       completedGoals.appendChild(li);
// //     } else {
// //       todayGoals.appendChild(li);
// //     }
// //   });
// // }

// // function toggleReminder(index) {
// //   let reminders = getStoredReminders();
// //   reminders[index].completed = !reminders[index].completed;

// //   saveReminders(reminders);
// //   renderReminders();
// // }

// // function getStoredReminders() {
// //   return JSON.parse(localStorage.getItem("reminders")) || [];
// // }

// // function saveReminders(reminders) {
// //   localStorage.setItem("reminders", JSON.stringify(reminders));
// // }

// // function loadReminders() {
// //   renderReminders();
// // }

// // Toggle Sidebar
// function toggleSidebar() {
//   let sidebar = document.getElementById("sidebar");
//   sidebar.style.left = sidebar.style.left === "0px" ? "-250px" : "0px";
// }

// // Update Progress Bar Dynamically
// function updateProgress() {
//   let progressValue = document.getElementById("progressInput").value;
//   progressValue = Math.max(0, Math.min(100, progressValue));
//   document.getElementById("progressBar1").style.width = progressValue + "%";
// }

// // Set Default Progress (Example: 70%)
// window.onload = function () {
//   const bar = document.getElementById("progressBar1");
//   if (bar) bar.style.width = "70%";

//   if (document.getElementById("todayGoals")) loadReminders();
//   if (document.getElementById("workout_time_spent")) fetchStats();
//   if (document.querySelector(".streak-icon")) fetchStreakData();
// }

// // ---------------------- AI CHATBOT ----------------------
// const chatBox = document.getElementById("chat-box");
// const userInput = document.getElementById("user-input");

// async function sendMessage() {
//   const message = userInput.value.trim();
//   if (!message) return;

//   appendMessage(message, "user");
//   userInput.value = "";

//   try {
//     const res = await fetch("http://127.0.0.1:5000/chatbot", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ message }),
//     });

//     const data = await res.json();
//     appendMessage(data.reply, "ai");
//   } catch (error) {
//     appendMessage("⚠️ Error: " + error.message, "ai");
//   }
// }

// function appendMessage(text, sender) {
//   const messageElement = document.createElement("div");
//   messageElement.classList.add("message", sender);
//   messageElement.textContent = text;
//   chatBox.appendChild(messageElement);
//   chatBox.scrollTop = chatBox.scrollHeight;
// }

// // ---------------------- REMINDERS ----------------------
// async function getStoredReminders() {
//   const res = await fetch("http://127.0.0.1:5000/reminders");
//   return await res.json();
// }

// async function addReminder() {
//   let input = document.getElementById("reminderInput");
//   let reminderText = input.value.trim();
//   if (!reminderText) return;

//   await fetch("http://127.0.0.1:5000/reminders", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ text: reminderText }),
//   });

//   input.value = "";
//   renderReminders();
// }

// async function toggleReminder(index) {
//   await fetch(`http://127.0.0.1:5000/reminders/${index}`, { method: "PUT" });
//   renderReminders();
// }

// async function renderReminders() {
//   let todayGoals = document.getElementById("todayGoals");
//   let completedGoals = document.getElementById("completedGoals");
//   todayGoals.innerHTML = "";
//   completedGoals.innerHTML = "";

//   const reminders = await getStoredReminders();
//   reminders.forEach((reminder) => {
//     let li = document.createElement("li");
//     li.innerHTML = `<input type="checkbox" ${
//       reminder.completed ? "checked" : ""
//     } onclick="toggleReminder(${reminder.id})"> ${reminder.text}`;
//     (reminder.completed ? completedGoals : todayGoals).appendChild(li);
//   });
// }

// async function loadReminders() {
//   renderReminders();
// }

// // ---------------------- STREAKS ----------------------
// async function fetchStreakData() {
//   const res = await fetch("http://127.0.0.1:5000/streaks");
//   const data = await res.json();

//   document.querySelector(".streak-icon span").textContent = data.days;
//   const dayElements = document.querySelectorAll(".day");
//   dayElements.forEach((el, idx) => {
//     el.textContent = data.history[idx] || "";
//     el.classList.add("completed");
//   });
// }

// // ---------------------- STATS ----------------------
// async function fetchStats() {
//   const res = await fetch("http://127.0.0.1:5000/stats");
//   const stats = await res.json();
//   document.getElementById("workout_time_spent").textContent = stats.minutes;
//   document.getElementById("cal_num").textContent = stats.calories;
// }
// // ---------------------- PROFILE FORM ----------------------
// const profileForm = document.getElementById("profileForm");
// const profileDataList = document.getElementById("profileData");

// function updateProfileDisplay(data) {
//   profileDataList.innerHTML = "";
//   for (const [key, value] of Object.entries(data)) {
//     const item = document.createElement("li");
//     item.innerHTML = `<strong>${key}:</strong> ${value}`;
//     profileDataList.appendChild(item);
//   }
// }

// // ---------------------- PROFILE FORM ----------------------
// document.addEventListener("DOMContentLoaded", () => {
//   const profileForm = document.getElementById("profileForm");
//   const profileDataList = document.getElementById("profileData");
//   const profileStatus = document.getElementById("profileStatus");

//   function updateProfileDisplay(data) {
//     if (!profileDataList) return;
//     profileDataList.innerHTML = "";
//     for (const [key, value] of Object.entries(data)) {
//       const item = document.createElement("li");
//       item.innerHTML = `<strong>${key}:</strong> ${value}`;
//       profileDataList.appendChild(item);
//     }
//   }

//   if (profileForm && profileDataList) {
//     profileForm.addEventListener("submit", async (e) => {
//       e.preventDefault();
//       const formData = new FormData(profileForm);
//       const data = Object.fromEntries(formData.entries());

//       await fetch("http://127.0.0.1:5000/profile", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(data),
//       });

//       if (profileStatus) profileStatus.textContent = "✅ Profile saved!";
//       updateProfileDisplay(data);
//     });

//     fetch("http://127.0.0.1:5000/profile")
//       .then((res) => res.json())
//       .then((data) => {
//         for (const key in data) {
//           if (profileForm.elements[key]) {
//             profileForm.elements[key].value = data[key];
//           }
//         }
//         updateProfileDisplay(data);
//       });
//   }
// });
// const workoutBtn = document.getElementById("getWorkoutBtn");
// const workoutDiv = document.getElementById("workoutPlan");

// if (workoutBtn && workoutDiv && profileForm) {
//   workoutBtn.addEventListener("click", async () => {
//     workoutBtn.textContent = "Generating plan...";
//     const formData = new FormData(profileForm);
//     const profileData = Object.fromEntries(formData.entries());

//     try {
//       const res = await fetch("http://127.0.0.1:5000/recommend-workout", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(profileData),
//       });

//       const data = await res.json();
//       if (data.plan) {
//         workoutDiv.innerHTML = `<pre style="white-space: pre-wrap; color: #00ffff;">${data.plan}</pre>`;
//       } else {
//         workoutDiv.innerHTML = `<p style="color: red;">❌ Failed to get plan</p>`;
//       }
//     } catch (err) {
//       workoutDiv.innerHTML = `<p style="color: red;">⚠️ ${err.message}</p>`;
//     } finally {
//       workoutBtn.textContent = "Get Recommended Workout Plan";
//     }
//   });
// }

// Toggle Sidebar
// Toggle Sidebar
// function toggleSidebar() {
//   let sidebar = document.getElementById("sidebar");
//   sidebar.style.left = sidebar.style.left === "0px" ? "-250px" : "0px";
// }

// // Update Progress Bar Dynamically
// function updateProgress() {
//   let progressValue = document.getElementById("progressInput").value;
//   progressValue = Math.max(0, Math.min(100, progressValue));
//   document.getElementById("progressBar1").style.width = progressValue + "%";
// }

// // Set Default Progress (Example: 70%)
// window.onload = function () {
//   if (document.getElementById("todayGoals")) renderReminders();
//   if (document.getElementById("progressBar1")) updateStreakProgress();
//   if (document.getElementById("workout_time_spent")) fetchStats();
//   if (document.querySelector(".streak-icon")) fetchStreakData();
// };

// function showRewardPopup() {
//   const popup = document.createElement("div");
//   popup.classList.add("reward-popup");
//   popup.innerHTML = `
//     <div class="popup-content">
//       <h2>🎉 Wow!</h2>
//       <p>You have completed today's goals and unlocked your reward!</p>
//       <button onclick="this.parentElement.parentElement.remove()">Close</button>
//     </div>
//   `;
//   document.body.appendChild(popup);
// }

// async function updateStreakProgress() {
//   try {
//     const res = await fetch("http://127.0.0.1:5000/reminders/stats");
//     const data = await res.json();

//     const { completed, total } = data;
//     const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

//     const progressBar = document.getElementById("progressBar1");
//     if (progressBar) {
//       progressBar.style.width = percent + "%";
//     }

//     // 🎯 Show popup if 100%
//     if (percent === 100 && !document.querySelector(".reward-popup")) {
//       showRewardPopup();
//     }
//   } catch (err) {
//     console.error("Error fetching reminder stats:", err);
//   }
// }
// window.onload = function () {
//   if (document.getElementById("todayGoals")) renderReminders();
//   if (document.getElementById("progressBar1")) updateStreakProgress();
//   if (document.getElementById("workout_time_spent")) fetchStats();
//   if (document.querySelector(".streak-icon")) fetchStreakData();
//   showDayStreakPopupIfNeeded(); // ✅ New
// };

// function showDayStreakPopupIfNeeded() {
//   const today = new Date().toLocaleDateString();
//   const shownDate = localStorage.getItem("dayStreakPopupShownDate");
//   const streakDay = localStorage.getItem("streakDay") || 7; // fallback

//   if (shownDate !== today) {
//     // Show only once per day
//     localStorage.setItem("dayStreakPopupShownDate", today);
//     document.getElementById("dayCountSpan").textContent = streakDay;
//     const popup = document.getElementById("streakPopupDay");
//     popup.style.display = "flex";

//     setTimeout(() => {
//       popup.style.display = "none";
//     }, 3000); // auto-hide after 3 seconds
//   }
// }


// // ---------------------- AI CHATBOT ----------------------
// const chatBox = document.getElementById("chat-box");
// const userInput = document.getElementById("user-input");

// async function sendMessage() {
//   const message = userInput.value.trim();
//   if (!message) return;

//   appendMessage(message, "user");
//   userInput.value = "";

//   try {
//     const res = await fetch("http://127.0.0.1:5000/chatbot", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ message }),
//     });

//     const data = await res.json();
//     appendMessage(data.reply, "ai");
//   } catch (error) {
//     appendMessage("⚠️ Error: " + error.message, "ai");
//   }
// }

// function appendMessage(text, sender) {
//   const messageElement = document.createElement("div");
//   messageElement.classList.add("message", sender);
//   messageElement.textContent = text;
//   chatBox.appendChild(messageElement);
//   chatBox.scrollTop = chatBox.scrollHeight;
// }

// // ---------------------- REMINDERS ----------------------
// async function getStoredReminders() {
//   const res = await fetch("http://127.0.0.1:5000/reminders");
//   return await res.json();
// }

// async function addReminder() {
//   let input = document.getElementById("reminderInput");
//   let reminderText = input.value.trim();
//   if (!reminderText) return;

//   await fetch("http://127.0.0.1:5000/reminders", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ text: reminderText }),
//   });

//   input.value = "";
//   renderReminders();
// }

// async function toggleReminder(index) {
//   await fetch(`http://127.0.0.1:5000/reminders/${index}`, { method: "PUT" });
//   renderReminders();
// }

// async function renderReminders() {
//   let todayGoals = document.getElementById("todayGoals");
//   let completedGoals = document.getElementById("completedGoals");
//   todayGoals.innerHTML = "";
//   completedGoals.innerHTML = "";

//   const reminders = await getStoredReminders();
//   reminders.forEach((reminder) => {
//     let li = document.createElement("li");
//     li.innerHTML = `<input type="checkbox" ${
//       reminder.completed ? "checked" : ""
//     } onclick="toggleReminder(${reminder.id})"> ${reminder.text}`;
//     (reminder.completed ? completedGoals : todayGoals).appendChild(li);
//   });
// }

// async function loadReminders() {
//   renderReminders();
// }

// // ---------------------- STREAKS ----------------------
// async function fetchStreakData() {
//   const res = await fetch("http://127.0.0.1:5000/streaks");
//   const data = await res.json();

//   document.querySelector(".streak-icon span").textContent = data.days;
//   const dayElements = document.querySelectorAll(".day");
//   dayElements.forEach((el, idx) => {
//     el.textContent = data.history[idx] || "";
//     el.classList.add("completed");
//   });
// }

// // ---------------------- STATS ----------------------
// async function fetchStats() {
//   const res = await fetch("http://127.0.0.1:5000/stats");
//   const stats = await res.json();
//   document.getElementById("workout_time_spent").textContent = stats.minutes;
//   document.getElementById("cal_num").textContent = stats.calories;
// }

// // ---------------------- PROFILE + GPT + RESET ----------------------
// document.addEventListener("DOMContentLoaded", () => {
//   const profileForm = document.getElementById("profileForm");
//   const profileDataList = document.getElementById("profileData");
//   const profileStatus = document.getElementById("profileStatus");
//   const workoutBtn = document.getElementById("getWorkoutBtn");
//   const workoutDiv = document.getElementById("workoutPlan");
//   const resetProfileBtn = document.getElementById("resetProfileBtn");

//   function updateProfileDisplay(data) {
//     if (!profileDataList) return;
//     profileDataList.innerHTML = "";
//     for (const [key, value] of Object.entries(data)) {
//       const item = document.createElement("li");
//       item.innerHTML = `<strong>${key}:</strong> ${value}`;
//       profileDataList.appendChild(item);
//     }
//   }

//   if (profileForm && profileDataList) {
//     profileForm.addEventListener("submit", async (e) => {
//       e.preventDefault();
//       const formData = new FormData(profileForm);
//       const data = Object.fromEntries(formData.entries());

//       try {
//         const res = await fetch("http://127.0.0.1:5000/profile", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify(data),
//         });

//         if (profileStatus) profileStatus.textContent = "✅ Profile saved!";
//         updateProfileDisplay(data);
//       } catch (error) {
//         profileStatus.textContent = "❌ Failed to save profile.";
//         console.error(error);
//       }
//     });

//     fetch("http://127.0.0.1:5000/profile")
//       .then((res) => res.json())
//       .then((data) => {
//         for (const key in data) {
//           if (profileForm.elements[key]) {
//             profileForm.elements[key].value = data[key];
//           }
//         }
//         updateProfileDisplay(data);
//       });
//   }

//   // GPT Workout Recommendation
//   if (workoutBtn && workoutDiv) {
//     workoutBtn.addEventListener("click", async () => {
//       workoutBtn.textContent = "Generating plan...";
//       workoutDiv.innerHTML = "";

//       try {
//         const res = await fetch("http://127.0.0.1:5000/recommend-workout", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" }
//         });

//         const data = await res.json();
//         if (data.plan) {
//           workoutDiv.innerHTML = `<pre style="white-space: pre-wrap; color: #00ffff;">${data.plan}</pre>`;
//         } else {
//           workoutDiv.innerHTML = `<p style="color: red;">❌ ${data.error || 'Failed to generate plan'}</p>`;
//         }
//       } catch (err) {
//         workoutDiv.innerHTML = `<p style="color: red;">⚠️ ${err.message}</p>`;
//       } finally {
//         workoutBtn.textContent = "Get Recommended Workout Plan";
//       }
//     });
//   }

//   // Reset Profile Button
//   if (resetProfileBtn) {
//     resetProfileBtn.addEventListener("click", async () => {
//       try {
//         await fetch("http://127.0.0.1:5000/profile", {
//           method: "DELETE"
//         });

//         if (profileForm) profileForm.reset();
//         if (profileStatus) profileStatus.textContent = "⚠️ Profile reset!";
//         if (profileDataList) profileDataList.innerHTML = "";
//         if (workoutDiv) workoutDiv.innerHTML = "";
//       } catch (err) {
//         alert("Error resetting profile");
//         console.error(err);
//       }
//     });
//   }
// });
// function toggleSidebar() {
//   let sidebar = document.getElementById("sidebar");
//   sidebar.style.left = sidebar.style.left === "0px" ? "-250px" : "0px";
// }

// // Update Progress Bar Dynamically
// function updateProgress() {
//   let progressValue = document.getElementById("progressInput").value;
//   progressValue = Math.max(0, Math.min(100, progressValue));
//   document.getElementById("progressBar1").style.width = progressValue + "%";
// }

// // Set Default Progress (Example: 70%)
// window.onload = function () {
//   if (document.getElementById("todayGoals")) renderReminders();
//   if (document.getElementById("progressBar1")) updateStreakProgress();
//   if (document.getElementById("workout_time_spent")) fetchStats();
//   if (document.querySelector(".streak-icon")) fetchStreakData();
//   showDayStreakPopupIfNeeded(); // ✅ New
// };

// function showRewardPopup() {
//   const popup = document.createElement("div");
//   popup.classList.add("reward-popup");
//   popup.innerHTML = `
//     <div class="popup-content">
//       <h2>🎉 Wow!</h2>
//       <p>You have completed today's goals and unlocked your reward!</p>
//       <button onclick="this.parentElement.parentElement.remove()">Close</button>
//     </div>
//   `;
//   document.body.appendChild(popup);
// }

// async function updateStreakProgress() {
//   try {
//     const res = await fetch("http://127.0.0.1:5000/reminders/stats");
//     const data = await res.json();

//     const { completed, total } = data;
//     const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

//     const progressBar = document.getElementById("progressBar1");
//     if (progressBar) {
//       progressBar.style.width = percent + "%";
//     }

//     // 🎯 Show popup if 100%
//     if (percent === 100 && !document.querySelector(".reward-popup")) {
//       showRewardPopup();
//     }
//   } catch (err) {
//     console.error("Error fetching reminder stats:", err);
//   }
// }

// function showDayStreakPopupIfNeeded() {
//   const today = new Date().toLocaleDateString();
//   const shownDate = localStorage.getItem("dayStreakPopupShownDate");
//   const streakDay = localStorage.getItem("streakDay") || 7; // fallback

//   if (shownDate !== today) {
//     localStorage.setItem("dayStreakPopupShownDate", today);
//     document.getElementById("dayCountSpan").textContent = streakDay;
//     const popup = document.getElementById("streakPopupDay");
//     popup.style.display = "flex";

//     setTimeout(() => {
//       popup.style.display = "none";
//     }, 3000); // auto-hide after 3 seconds
//   }
// }

// // ---------------------- AI CHATBOT ----------------------
// const chatBox = document.getElementById("chat-box");
// const userInput = document.getElementById("user-input");

// async function sendMessage() {
//   const message = userInput.value.trim();
//   if (!message) return;

//   appendMessage(message, "user");
//   userInput.value = "";

//   try {
//     const res = await fetch("http://127.0.0.1:5000/chatbot", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ message }),
//     });

//     const data = await res.json();
//     appendMessage(data.reply, "ai");
//   } catch (error) {
//     appendMessage("⚠️ Error: " + error.message, "ai");
//   }
// }

// function appendMessage(text, sender) {
//   const messageElement = document.createElement("div");
//   messageElement.classList.add("message", sender);
//   messageElement.textContent = text;
//   chatBox.appendChild(messageElement);
//   chatBox.scrollTop = chatBox.scrollHeight;
// }

// // ---------------------- REMINDERS ----------------------
// async function getStoredReminders() {
//   const res = await fetch("http://127.0.0.1:5000/reminders");
//   return await res.json();
// }

// async function addReminder() {
//   let input = document.getElementById("reminderInput");
//   let reminderText = input.value.trim();
//   if (!reminderText) return;

//   await fetch("http://127.0.0.1:5000/reminders", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ text: reminderText }),
//   });

//   input.value = "";
//   renderReminders();
// }

// async function toggleReminder(index) {
//   await fetch(`http://127.0.0.1:5000/reminders/${index}`, { method: "PUT" });
//   renderReminders();
// }

// async function renderReminders() {
//   let todayGoals = document.getElementById("todayGoals");
//   let completedGoals = document.getElementById("completedGoals");
//   todayGoals.innerHTML = "";
//   completedGoals.innerHTML = "";

//   const reminders = await getStoredReminders();
//   reminders.forEach((reminder) => {
//     let li = document.createElement("li");
//     li.innerHTML = `<input type="checkbox" ${
//       reminder.completed ? "checked" : ""
//     } onclick="toggleReminder(${reminder.id})"> ${reminder.text}`;
//     (reminder.completed ? completedGoals : todayGoals).appendChild(li);
//   });
// }

// async function loadReminders() {
//   renderReminders();
// }

// // ---------------------- STREAKS ----------------------
// async function fetchStreakData() {
//   const res = await fetch("http://127.0.0.1:5000/streaks");
//   const data = await res.json();

//   document.querySelector(".streak-icon span").textContent = data.days;
//   const dayElements = document.querySelectorAll(".day");
//   dayElements.forEach((el, idx) => {
//     el.textContent = data.history[idx] || "";
//     el.classList.add("completed");
//   });
// }

// // ---------------------- STATS ----------------------
// async function fetchStats() {
//   const res = await fetch("http://127.0.0.1:5000/stats");
//   const stats = await res.json();
//   document.getElementById("workout_time_spent").textContent = stats.minutes;
//   document.getElementById("cal_num").textContent = stats.calories;
// }
// Sidebar Toggle
// function toggleSidebar() {
//   const sidebar = document.getElementById("sidebar");
//   sidebar.style.left = sidebar.style.left === "0px" ? "-250px" : "0px";
// }

// // On page load
// window.onload = function () {
//   if (document.getElementById("todayGoals")) renderReminders();
//   if (document.getElementById("progressBar1")) updateStreakProgress();
//   if (document.getElementById("workout_time_spent")) fetchStats();
//   if (document.querySelector(".streak-icon")) fetchStreakData();
// };

// // ---------------------- REMINDERS ----------------------
// async function getStoredReminders() {
//   const res = await fetch("http://127.0.0.1:5000/reminders");
//   return await res.json();
// }

// async function addReminder() {
//   const input = document.getElementById("reminderInput");
//   const reminderText = input.value.trim();
//   if (!reminderText) return;

//   await fetch("http://127.0.0.1:5000/reminders", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ text: reminderText }),
//   });

//   input.value = "";
//   renderReminders();
// }

// async function toggleReminder(index) {
//   await fetch(`http://127.0.0.1:5000/reminders/${index}`, { method: "PUT" });
//   renderReminders();
//   updateStreakProgress(); // Update streak when a reminder is completed
// }

// async function renderReminders() {
//   const todayGoals = document.getElementById("todayGoals");
//   const completedGoals = document.getElementById("completedGoals");
//   todayGoals.innerHTML = "";
//   completedGoals.innerHTML = "";

//   const reminders = await getStoredReminders();

//   reminders.forEach((reminder) => {
//     const li = document.createElement("li");
//     li.innerHTML = `<input type="checkbox" ${
//       reminder.completed ? "checked" : ""
//     } onclick="toggleReminder(${reminder.id})"> ${reminder.text}`;
//     (reminder.completed ? completedGoals : todayGoals).appendChild(li);
//   });
// }

// // ---------------------- STREAKS ----------------------
// async function updateStreakProgress() {
//   try {
//     const res = await fetch("http://127.0.0.1:5000/reminders/stats");
//     const { completed, total } = await res.json();
//     const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

//     const bar = document.getElementById("progressBar1");
//     if (bar) bar.style.width = percent + "%";

//     if (percent === 100) {
//       document.getElementById("medal")?.style.display = "block";
//     } else {
//       document.getElementById("medal")?.style.display = "none";
//     }
//   } catch (err) {
//     console.error("❌ Error updating streak progress:", err);
//   }
// }

// async function fetchStreakData() {
//   const res = await fetch("http://127.0.0.1:5000/streaks");
//   const data = await res.json();
//   document.querySelector(".streak-icon span").textContent = data.days;

//   const dayEls = document.querySelectorAll(".day");
//   dayEls.forEach((el, idx) => {
//     el.textContent = data.history[idx] || "";
//     el.classList.add("completed");
//   });
// }

// // ---------------------- STATS ----------------------
// async function fetchStats() {
//   const res = await fetch("http://127.0.0.1:5000/stats");
//   const stats = await res.json();
//   document.getElementById("workout_time_spent").textContent = stats.minutes;
//   document.getElementById("cal_num").textContent = stats.calories;
// }

// // ---------------------- AI CHATBOT ----------------------
// const chatBox = document.getElementById("chat-box");
// const userInput = document.getElementById("user-input");

// async function sendMessage() {
//   const message = userInput.value.trim();
//   if (!message) return;

//   appendMessage(message, "user");
//   userInput.value = "";

//   try {
//     const res = await fetch("http://127.0.0.1:5000/chatbot", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ message }),
//     });

//     const data = await res.json();
//     appendMessage(data.reply, "ai");
//   } catch (error) {
//     appendMessage("⚠️ Error: " + error.message, "ai");
//   }
// }

// function appendMessage(text, sender) {
//   const messageElement = document.createElement("div");
//   messageElement.classList.add("message", sender);
//   messageElement.textContent = text;
//   chatBox.appendChild(messageElement);
//   chatBox.scrollTop = chatBox.scrollHeight;
// }
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  sidebar.style.left = sidebar.style.left === "0px" ? "-250px" : "0px";
}

// On page load
window.onload = function () {
  if (document.getElementById("todayGoals")) renderReminders();
  if (document.getElementById("progressBar1")) updateStreakProgress();
  if (document.getElementById("workout_time_spent")) fetchStats();
  if (document.querySelector(".streak-icon")) fetchStreakData();
};

// ---------------------- REMINDERS ----------------------
async function getStoredReminders() {
  const res = await fetch("http://127.0.0.1:5000/reminders");
  return await res.json();
}

async function addReminder() {
  const input = document.getElementById("reminderInput");
  const reminderText = input.value.trim();
  if (!reminderText) return;

  await fetch("http://127.0.0.1:5000/reminders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: reminderText }),
  });

  input.value = "";
  renderReminders();
}

// async function toggleReminder(index) {
//   await fetch(`http://127.0.0.1:5000/reminders/${index}`, { method: "PUT" });
//   renderReminders();
//   updateStreakProgress(); // Update streak when a reminder is completed
// }
async function toggleReminder(index) {
  await fetch(`http://127.0.0.1:5000/reminders/${index}`, { method: "PUT" });
  await renderReminders(); // Refresh list

  const res = await fetch("http://127.0.0.1:5000/reminders");
  const allReminders = await res.json();
  const allCompleted = allReminders.length > 0 && allReminders.every(r => r.completed);

  if (allCompleted) {
    try {
      await fetch("http://127.0.0.1:5000/log-workout", { method: "POST" });
      console.log("✅ Streak incremented because all goals completed!");
    } catch (err) {
      console.error("❌ Failed to log workout:", err);
    }
  }

  updateStreakProgress();
}

async function renderReminders() {
  const todayGoals = document.getElementById("todayGoals");
  const completedGoals = document.getElementById("completedGoals");
  todayGoals.innerHTML = "";
  completedGoals.innerHTML = "";

  const reminders = await getStoredReminders();

  reminders.forEach((reminder) => {
    const li = document.createElement("li");
    li.innerHTML = `<input type="checkbox" ${
      reminder.completed ? "checked" : ""
    } onclick="toggleReminder(${reminder.id})"> ${reminder.text}`;
    (reminder.completed ? completedGoals : todayGoals).appendChild(li);
  });
}

// ---------------------- STREAKS ----------------------
// Replace updateStreakProgress function with this:
async function updateStreakProgress() {
  try {
    const res = await fetch("http://127.0.0.1:5000/streaks");
    const { days, history } = await res.json();

    const percent = Math.min(100, Math.round((days / 7) * 100));
    const bar = document.getElementById("progressBar1");
    if (bar) bar.style.width = percent + "%";

    const medal = document.getElementById("medal");
    if (medal) medal.style.display = (days === 7 ? "block" : "none");

    // Update the circular day tracker if present
    const dayEls = document.querySelectorAll(".day");
    dayEls.forEach((el, idx) => {
      el.textContent = history[idx] || "";
      el.classList.toggle("completed", history[idx] === "✔");
    });

  } catch (err) {
    console.error("❌ Error updating streak progress:", err);
  }
}


async function fetchStreakData() {
  const res = await fetch("http://127.0.0.1:5000/streaks");
  const data = await res.json();
  const streakEl = document.querySelector(".streak-icon span");
  if (streakEl) streakEl.textContent = data.days;

  const dayEls = document.querySelectorAll(".day");
  dayEls.forEach((el, idx) => {
    el.textContent = data.history[idx] || "";
    el.classList.add("completed");
  });
}

// ---------------------- STATS ----------------------
async function fetchStats() {
  const res = await fetch("http://127.0.0.1:5000/stats");
  const stats = await res.json();
  document.getElementById("workout_time_spent").textContent = stats.minutes;
  document.getElementById("cal_num").textContent = stats.calories;
}

// ---------------------- LOG WORKOUT ----------------------

async function logWorkout() {
  try {
    const res = await fetch("http://127.0.0.1:5000/log-workout", { method: "POST" });
    const data = await res.json();

    document.getElementById("logStatus").textContent = data.message || "Workout logged!";
    updateStreakProgress();  // update progress bar after logging
  } catch (err) {
    document.getElementById("logStatus").textContent = "⚠️ Failed to log workout.";
    console.error("Log workout error:", err);
  }
}

// ---------------------- AI CHATBOT ----------------------
const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");

async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  appendMessage(message, "user");
  userInput.value = "";

  try {
    const res = await fetch("http://127.0.0.1:5000/chatbot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    const data = await res.json();
    appendMessage(data.reply, "ai");
  } catch (error) {
    appendMessage("⚠️ Error: " + error.message, "ai");
  }
}

function appendMessage(text, sender) {
  const messageElement = document.createElement("div");
  messageElement.classList.add("message", sender);
  messageElement.textContent = text;
  chatBox.appendChild(messageElement);
  chatBox.scrollTop = chatBox.scrollHeight;
}
