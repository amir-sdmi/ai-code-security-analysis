// Javascript for the meeting-details page
// Data fetching and population of meeting details and GPT responses asynchronously
// Original for this project with ChatGPT assistance

// Asynch data fetching functions
async function fetchMeetingInfo(caseId) {

    const mId = GLOBALS.meetingId;
    const cId = GLOBALS.caseId;
    let queryParams1 = { meeting_id: mId}; 
    let queryParams2 = {case_id: cId};

    const url1 = '/get-meetings-details?' + new URLSearchParams(queryParams1);
    const url2 = '/get-case-details?' + new URLSearchParams(queryParams2);

    try {
        const response1 = await fetch(url1);
        const response2 = await fetch(url2);

        if (!response1.ok || !response2.ok) {
            console.log("error receiving data");
            return {};
        }

        const meetData = await response1.json();
        const caseData = await response2.json();

        if (!meetData || !caseData) {
            return {};
        }

        let formattedData = {
            meetingTime: meetData.meeting.created_at,
            clientFirstName: caseData.client_first_name,
            clientLastName: caseData.client_last_name,
            phoneNumber: caseData.phone_number,
            email: caseData.email_address,
            lawyerNotes: meetData.meeting.lawyer_notes.String
        };

        return formattedData;
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
        return [];
    }
}

async function fetchGptResponses(caseId) {
    

    const mId = GLOBALS.meetingId;
    let queryParams1 = { meeting_id: mId}; 

    const url1 = '/get-meetings-details?' + new URLSearchParams(queryParams1);

    try {
        const response1 = await fetch(url1);

        if (!response1.ok) {
            console.log("error receiving data");
            return [];
        }

        const meetData = await response1.json();

        if (!meetData) {
            return [];
        }

        let formattedData = meetData.gpt_resp.map(obj => ({
            id: obj.id,
            question: obj.questions,
            summary: obj.summary,
            points: obj.points
        }));

        return formattedData;
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
        return [];
    }
}

function populateMeetingInfo(meetingInfo) {
    const tableBody = document.querySelector('#meetingDetailsBody');
    const meetingDate = new Date(meetingInfo.meetingTime);
    const formattedDate = meetingDate.toLocaleDateString('en-US', {
        month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    tableBody.innerHTML = `
        <tr>
            <td>${formattedDate}</td>
            <td>${meetingInfo.clientFirstName+" "+meetingInfo.clientLastName}</td>
            <td>${meetingInfo.lawyerNotes}</td>
        </tr>
    `;
}

function generateGptResponseRow(response, index) {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${index}</td>
        <td>${response.question}</td>
        <td>${response.summary}</td>
        <td>${response.points}</td>
    `;
    return row;
}

async function populateGptResponses(caseId) {
    const responses = await fetchGptResponses(caseId);
    const tableBody = document.querySelector('#gptResponsesBody');
    responses.forEach((response, index) => {
        tableBody.appendChild(generateGptResponseRow(response, index + 1));
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const caseId = urlParams.get('caseId');
    
    const meetingInfo = await fetchMeetingInfo(caseId);
    populateMeetingInfo(meetingInfo);
    
    await populateGptResponses(caseId);
});
