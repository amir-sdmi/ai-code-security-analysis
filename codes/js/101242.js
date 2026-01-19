// This code was assisted by ChatGPT, OpenAI.

const { v4: uuidv4 } = require("uuid");
const { SPONGEBOB_MODEL, BASE_CDN_URL } = require("../../../constants/endpoints");

class FakeYouTTS {
    #authCookie = null;

    init = async () => {
        if (this.#authCookie && await this.isLoggedIn()) return;

        const res = await fetch("https://api.fakeyou.com/login", {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username_or_email: process.env.FY_USERNAME,
                password: process.env.FY_PASSWORD
            })
        });

        if (!res.ok) throw new Error("FakeYou login failed");

        const cookie = res.headers.get("set-cookie");

        if (!cookie) throw new Error("No session cookie received");

        this.#authCookie = cookie.split(";")[0];
        console.log("Logged in to FakeYou");
    }

    isLoggedIn = async () => {
        if (!this.#authCookie) return false;

        const res = await fetch("https://api.fakeyou.com/session", {
            method: "GET",
            headers: { "Cookie": this.#authCookie }
        });

        const data = await res.json();
        return res.ok && data.logged_in === true;
    }

    generateAudioFromText = async (text) => {
        if (!text) throw new Error("Missing text");
        if (!await this.isLoggedIn()) await this.init();

        const headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Cookie": this.#authCookie
        };

        const jobToken = await this.submitTTSRequest(text, headers);
        return await this.pollForResult(jobToken, headers);
    }

    // submit job request and returns job token
    submitTTSRequest = async (text, headers) => {
        const res = await fetch("https://api.fakeyou.com/tts/inference", {
            method: "POST",
            headers,
            body: JSON.stringify({
                uuid_idempotency_token: uuidv4(),
                tts_model_token: SPONGEBOB_MODEL,
                inference_text: text
            })
        });

        const data = await res.json();
        if (!data.success) throw new Error(data.error_reason || "TTS request failed");

        return data.inference_job_token;
    }

    // use job token to get status of tts result
    pollForResult = async (jobToken, headers) => {
        // 30 loops to check result
        for (let i = 0; i < 30; i++) {
            const result = await fetch(`https://api.fakeyou.com/tts/job/${jobToken}`, { headers });
            const statusData = await result.json();

            // extracts job status and check if tts job successful
            if (statusData.success) {
                const { status, maybe_public_bucket_wav_audio_path: audioPath } = statusData.state;

                // returns audio link when successful
                if (status === "complete_success") {
                    return `${BASE_CDN_URL}${audioPath}`;
                }

                if (["complete_failure", "dead"].includes(status)) {
                    throw new Error(`TTS job failed: ${status}`);
                }
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        throw new Error("TTS job timed out");
    }
}

module.exports = new FakeYouTTS();
