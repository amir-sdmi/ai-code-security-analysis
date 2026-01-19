// // src/data/decisionTrees.js
// // src/data/decisionTrees.js

// // src/data/decisionTrees.js
// export const decisionTreeEnglish = {

// export const decisionTreeEnglish = {
//     startNode: "root",
//     nodes: {
//       root: {
//         question: "What do you want to do with ChatGPT?",
//         options: [
//           { text: "Ask a direct question", nextNodeId: "ask" },
//           { text: "Analyze a single file (PDF)", nextNodeId: "analyze_file" },
//           { text: "Analyze a folder (zip)", nextNodeId: "analyze_folder" }
//         ]
//       },
//       ask: {
//         question: "Please type your question.",
//         options: [
//           {
//             text: "Continue",
//             finalPrompt: "Feel free to ask anything."
//           }
//         ]
//       },
//       analyze_file: {
//         question: "We will analyze one file (e.g. PDF).",
//         options: [
//           {
//             text: "Continue",
//             finalPrompt: "We will analyze a single file you upload."
//           }
//         ]
//       },
//       analyze_folder: {
//         question: "We will analyze a folder (zip) of code/text files.",
//         options: [
//           {
//             text: "Continue",
//             finalPrompt: "We will analyze a .zip folder containing .js, .json, or text files."
//           }
//         ]
//       }
//     }
//   };
  
  
// // export const decisionTreeEnglish = {
// //     startNode: "root",
// //     nodes: {
// //       root: {
// //         question: "What do you want to do with ChatGPT?",
// //         options: [
// //           { text: "Software Development", nextNodeId: "dev" },
// //           { text: "Writing Content", nextNodeId: "writing" },
// //         ],
// //       },
// //       dev: {
// //         question: "Which area of development do you need help with?",
// //         options: [
// //           { text: "Backend", nextNodeId: "dev_backend" },
// //           { text: "Frontend", nextNodeId: "dev_frontend" },
// //         ],
// //       },
// //       dev_backend: {
// //         question: "What do you need help with in backend?",
// //         options: [
// //           {
// //             text: "Database design",
// //             finalPrompt: "I want help designing a backend database.",
// //           },
// //           {
// //             text: "API endpoints",
// //             finalPrompt: "I want help creating backend API endpoints.",
// //           },
// //           {
// //             text: "Server configuration",
// //             finalPrompt: "I want help with server configuration.",
// //           },
// //         ],
// //       },
// //       dev_frontend: {
// //         question: "Which area of frontend?",
// //         options: [
// //           {
// //             text: "UI/UX design",
// //             finalPrompt: "I want help with UI/UX design.",
// //           },
// //           {
// //             text: "State management",
// //             finalPrompt: "I want help with frontend state management.",
// //           },
// //         ],
// //       },
// //       writing: {
// //         question: "What kind of writing do you need?",
// //         options: [
// //           {
// //             text: "Marketing copy",
// //             finalPrompt: "I want to write persuasive marketing copy.",
// //           },
// //           {
// //             text: "Blog article",
// //             finalPrompt: "I want to write a blog article.",
// //           },
// //           {
// //             text: "Email/Newsletter",
// //             finalPrompt: "I want to write an email/newsletter.",
// //           },
// //         ],
// //       },
// //     },
// //   };
  
//   export const decisionTreeHebrew = {
//     startNode: "root",
//     nodes: {
//       root: {
//         question: "מה תרצה לעשות באמצעות ChatGPT?",
//         options: [
//           { text: "פיתוח תוכנה", nextNodeId: "dev" },
//           { text: "כתיבת טקסט/תוכן", nextNodeId: "writing" },
//         ],
//       },
//       dev: {
//         question: "באיזה תחום פיתוח תרצה עזרה?",
//         options: [
//           { text: "בקאנד (Backend)", nextNodeId: "dev_backend" },
//           { text: "פרונטאנד (Frontend)", nextNodeId: "dev_frontend" },
//         ],
//       },
//       dev_backend: {
//         question: "באיזה נושא תרצה עזרה בבקאנד?",
//         options: [
//           {
//             text: "עיצוב בסיס נתונים",
//             finalPrompt: "אני מעוניין בעזרה בעיצוב בסיס נתונים לבקאנד.",
//           },
//           {
//             text: "נקודות קצה (API endpoints)",
//             finalPrompt: "אני מעוניין בעזרה ביצירת נקודות קצה לבקאנד.",
//           },
//           {
//             text: "קונפיגורציית שרת",
//             finalPrompt: "אני מעוניין בעזרה בקונפיגורציית שרת.",
//           },
//         ],
//       },
//       dev_frontend: {
//         question: "באיזה תחום בפרונטאנד תרצה עזרה?",
//         options: [
//           {
//             text: "עיצוב UI/UX",
//             finalPrompt: "אני מעוניין בעזרה בעיצוב UI/UX לפרונטאנד.",
//           },
//           {
//             text: "ניהול מצבים (State management)",
//             finalPrompt: "אני מעוניין בעזרה בניהול מצבים בפרונטאנד.",
//           },
//         ],
//       },
//       writing: {
//         question: "איזה סוג כתיבה נחוץ לך?",
//         options: [
//           {
//             text: "טקסט שיווקי",
//             finalPrompt: "אני מעוניין לכתוב טקסט שיווקי משכנע.",
//           },
//           {
//             text: "מאמר בלוג",
//             finalPrompt: "אני מעוניין לכתוב פוסט בלוג.",
//           },
//           {
//             text: "אימייל/ניוזלטר",
//             finalPrompt: "אני מעוניין לכתוב אימייל/ניוזלטר.",
//           },
//         ],
//       },
//     },
//   };
  