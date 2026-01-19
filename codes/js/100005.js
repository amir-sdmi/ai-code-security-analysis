/**
 * Enum representing possible user statuses for ChatGPT authentication.
 */
const Fl64_Gpt_User_Shared_Enum_User_Status = {
    ACTIVE: 'ACTIVE',          // User is actively using ChatGPT.
    BLOCKED: 'BLOCKED',        // User is blocked and cannot interact with ChatGPT.
    UNVERIFIED: 'UNVERIFIED',  // User registered but hasn't verified their email.
};
Object.freeze(Fl64_Gpt_User_Shared_Enum_User_Status);
export default Fl64_Gpt_User_Shared_Enum_User_Status;
