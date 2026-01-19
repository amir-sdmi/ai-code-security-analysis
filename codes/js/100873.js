document.getElementById('submitBtn').addEventListener('click', function() {
    const fileInput = document.getElementById('resumeFile');
    const jobDescription = document.getElementById('jobDescription').value;

    if (fileInput.files.length === 0 || jobDescription.trim() === "") {
        alert('Please upload a resume and provide a job description.');
        return;
    }

    const resumeFile = fileInput.files[0];
    const reader = new FileReader();

    // Read the resume file content
    reader.onload = async function(event) {
        const resumeContent = event.target.result;

        // Use ChatGPT API to score the resume
        const score = await getScoreFromAI(resumeContent, jobDescription);

        // Display the score
        document.getElementById('result').innerHTML = `<h2>Score: ${score}/100</h2>`;
        if (score >= 70) {
            document.getElementById('result').innerHTML += "<p>You should apply for this job!</p>";
        } else {
            document.getElementById('result').innerHTML += "<p>Consider revising your resume before applying.</p>";
        }
    };

    reader.readAsText(resumeFile);
});

// Function to call ChatGPT API and score resume
async function getScoreFromAI(resume, jobDescription) {
    const apiKey = 'API-Key'; // Replace with your API key
    const prompt = `
        You are an AI that helps users score their resume for job descriptions like an ATS software.
        - Given the following resume:
        "${resume}"
        - And the following job description:
        "${jobDescription}"

        Score the resume out of 100 based on how relevant the resume is for this job.
        Provide the scores, check the grammitical errors.
    `;

    try {
        const response = await axios.post('https://api.openai.com/v1/completions', {
            model: "gpt-3.5-turbo",
            prompt: prompt,
            max_tokens: 50,
            temperature: 0.5
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        const aiResult = response.data.choices[0].text.trim();
        const score = parseInt(aiResult, 10);
        return isNaN(score) ? 0 : score; 
    } catch (error) {
        console.error('Error calling ChatGPT API:', error);
        alert('Error occurred while processing the resume with AI.');
        return 0;
    }
}
