// Written by SA using ChatGPT-4o and Claude 3.7 Sonnet

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: "Method Not Allowed" }),
        };
    }

    try {
        let formData
        
        if (event.headers['content-type'] === 'application/json') {
            formData = JSON.parse(event.body)
        } else {
            formData = {}
            const params = new URLSearchParams(event.body)
            for (const [key, value] of params) {
                formData[key] = value
            }
        }
        
        const { name, email, skills } = formData

        const jiraUrl = process.env.JIRA_URL; 
        const jiraAuth = process.env.JIRA_AUTH; 
        const projectKey = process.env.JIRA_PROJECT_KEY;
        const issueType = process.env.JIRA_ISSUE_TYPE;

        const payload = {
            fields: {
                project: { key: projectKey },
                summary: `${name}`,
                description: {
                    type: "doc",
                    version: 1,
                    content: [
                        {
                            type: "heading",
                            attrs: {
                                level: 2
                            },
                            content: [
                                {
                                    type: "text",
                                    text: "Skills/Interests"
                                }
                            ]
                        },
                        {
                            type: "paragraph",
                            content: [
                                {
                                    type: "text",
                                    text: `${skills}`
                                }
                            ]
                        }
                    ]
                },
                customfield_10053: email, 
                issuetype: { name: issueType },
            },
        };

        const response = await fetch(jiraUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": jiraAuth,
            },
            body: JSON.stringify(payload),
        });



        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.errorMessages ? data.errorMessages.join(", ") : "Jira issue creation failed");
        }

        return {
            statusCode: 201,
            body: JSON.stringify({ message: "Jira issue created successfully", issueKey: data.key }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Error creating Jira issue", error: error.message }),
        };
    }
};
