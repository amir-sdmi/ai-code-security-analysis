
import { Message } from "@/types/chat";

export const getWelcomeMessages = () => {
  // Get the user's first name - in a real app this would come from auth
  const firstName = "Tonee";

  const chat: Message = {
    id: "welcome-1",
    role: "assistant",
    content: `👋 Hi ${firstName}! I'm Flami, your AI financial assistant from Tribbe Nation powered by ChatGPT.

I can help you automate your borrowing and lending (with interest 🤭) , manage your money within groups (no more whatsapp 🤨), join circles for shared money (for events and activities), send payments globally, and build up your wealth.

What would you like to do today? Try asking me to:

Send money to someone (pass the spoon 🥄)
Create a new circle (not those whatsapp ones 😏)
Check your balance (you got moneeeyy! 😛)
Grow your Tribbe (this is really important 🤩)

Click on the menu (≡) to see more of Tribbe. 
Welcome home 🤗`,
    timestamp: new Date()
  };

  const activity: Message = {
    id: "welcome-activity-1",
    role: "assistant",
    content: `Here you'll see your recent financial activity. Ask me about any transaction or let me know if you'd like to analyze your spending patterns. 📊`,
    timestamp: new Date()
  };

  return { chat, activity };
};
