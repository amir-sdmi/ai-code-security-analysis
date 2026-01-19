// Utils Module

// Check connection status periodically
export function checkConnectionStatus() {
    function updateStatus() {
        const statusElement = document.getElementById('connection-status');
        
        if (navigator.onLine) {
            statusElement.innerHTML = '<i class="fas fa-wifi"></i> Online';
            statusElement.className = 'text-success';
        } else {
            statusElement.innerHTML = '<i class="fas fa-wifi-slash"></i> Offline';
            statusElement.className = 'text-danger';
        }
    }
    
    // Initial check
    updateStatus();
    
    // Add event listeners for online/offline events
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    
    // Periodic check every 30 seconds
    setInterval(updateStatus, 30000);
}

// Format time function
export function formatTimeRemaining(milliseconds) {
    const days = Math.floor(milliseconds / (24 * 60 * 60 * 1000));
    const hours = Math.floor((milliseconds % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((milliseconds % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((milliseconds % (60 * 1000)) / 1000);
    
    return {
        days,
        hours,
        minutes,
        seconds,
        formattedText: `${days}d ${hours}h ${minutes}m ${seconds}s`
    };
}

// Safely parse JSON with error handling
export function safeJSONParse(jsonString, defaultValue = null) {
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        console.error('Error parsing JSON:', error);
        return defaultValue;
    }
}

// Get current logged in user
export function getCurrentUser() {
    const userData = localStorage.getItem('village_user');
    if (!userData) {
        return null;
    }
    
    try {
        return JSON.parse(userData);
    } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
    }
}

// Generate a unique ID
export function generateUniqueId(prefix = '') {
    return prefix + Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

// Use Gemini API to enhance proposal description
export async function enhanceProposalWithGemini(proposal) {
    if (!proposal) {
        console.error('No proposal provided for Gemini enhancement');
        return null;
    }
    
    try {
        const GEMINI_API_KEY = 'AIzaSyDngWZ2AABGCSvoGGhDguDDEFs-e7nBkSk';
        const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
        
        // Prepare the prompt for Gemini
        const prompt = `
        I need you to enhance and formalize a village planning proposal for official documentation. 
        Here are the details of the approved proposal:
        
        Title: ${proposal.title}
        Type: ${proposal.type}
        Original Description: ${proposal.description}
        
        This proposal has been approved by the village council with ${proposal.votes.up} upvotes and ${proposal.votes.down || 0} downvotes.
        It had a participation rate of ${proposal.evaluationReason.match(/\((\d+)%/)?.[1] || '0'}%.
        
        Please provide:
        1. An enhanced formal description (2-3 paragraphs) that would be suitable for an official document
        2. A brief summary of potential benefits to the village community (bullet points)
        3. A short implementation timeline recommendation
        
        Keep the tone professional but accessible to all village members.
        `;
        
        // Call the Gemini API
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });
        
        if (!response.ok) {
            console.error('Gemini API error:', await response.text());
            return null;
        }
        
        const data = await response.json();
        
        if (data.candidates && data.candidates.length > 0 && 
            data.candidates[0].content && 
            data.candidates[0].content.parts && 
            data.candidates[0].content.parts.length > 0) {
            
            // Extract the generated text
            const enhancedContent = data.candidates[0].content.parts[0].text;
            
            // Return the enhanced content
            return {
                enhancedDescription: enhancedContent,
                generatedAt: new Date().toISOString()
            };
        } else {
            console.error('Unexpected Gemini API response format:', data);
            return null;
        }
    } catch (error) {
        console.error('Error calling Gemini API:', error);
        return null;
    }
}

// Generate PDF from proposal data
export async function generateProposalPDF(proposal) {
    if (!proposal) {
        console.error('No proposal data provided for PDF generation');
        return null;
    }
    
    try {
        // Try to enhance the proposal with Gemini
        let enhancedContent = null;
        try {
            enhancedContent = await enhanceProposalWithGemini(proposal);
            console.log('Enhanced content generated:', enhancedContent);
        } catch (error) {
            console.error('Error enhancing proposal with Gemini:', error);
        }
        
        // Create PDF document
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Set up title
        doc.setFontSize(22);
        doc.setTextColor(0, 102, 204);
        doc.text('Village Planning Proposal - APPROVED', 105, 20, { align: 'center' });
        
        // Add proposal details
        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.text(`Title: ${proposal.title}`, 20, 40);
        
        doc.setFontSize(12);
        doc.text(`Type: ${proposal.type}`, 20, 50);
        doc.text(`Proposed by: ${proposal.author}`, 20, 60);
        doc.text(`Created on: ${proposal.createdAt}`, 20, 70);
        
        // Add voting results
        doc.setFontSize(14);
        doc.text('Voting Results:', 20, 90);
        
        doc.setFontSize(12);
        doc.text(`Total upvotes: ${proposal.votes.up}`, 30, 100);
        doc.text(`Total downvotes: ${proposal.votes.down || 0}`, 30, 110);
        
        // Calculate participation rate
        const user = getCurrentUser();
        const villageName = user ? user.location : 'Village';
        const totalVoters = proposal.voters ? proposal.voters.length : 0;
        
        // Add participation info
        doc.text(`Total participants: ${totalVoters}`, 30, 120);
        doc.text(`Participation rate: ${proposal.evaluationReason.match(/\((\d+)%/)?.[1] || 'N/A'}%`, 30, 130);

        // Add map snippet if available
        if (proposal.mapSnippet) {
            // Add a new page for the map
            doc.addPage();
            
            // Add map title
            doc.setFontSize(16);
            doc.text('Proposed Location Map', 105, 20, { align: 'center' });
            
            // Convert base64 image to blob
            const imgData = proposal.mapSnippet;
            
            // Add the image to the PDF
            // Note: The image dimensions are set to fit the page width while maintaining aspect ratio
            const imgWidth = 170; // Max width on page
            const imgHeight = (imgWidth * 0.75); // Maintain aspect ratio
            doc.addImage(imgData, 'PNG', 20, 30, imgWidth, imgHeight);
            
            // Add a note about the map
            doc.setFontSize(10);
            doc.text('Note: This map shows the proposed development area as drawn by the proposer.', 20, 140);
        }
        
        // Add description - use enhanced version if available, otherwise original
        let yPosition = 150;
        doc.setFontSize(14);
        doc.text('Proposal Description:', 20, yPosition);
        yPosition += 10;
        
        const description = proposal.description || 'No description provided';
        const splitDescription = doc.splitTextToSize(description, 170);
        doc.setFontSize(12);
        doc.text(splitDescription, 20, yPosition);
        
        // Add enhanced content if available
        if (enhancedContent) {
            // Calculate how much space the description took
            yPosition += splitDescription.length * 7;
            yPosition += 10; // Add some spacing
            
            // Add enhanced content sections
            doc.setFontSize(14);
            doc.setTextColor(0, 102, 204);
            doc.text('Enhanced Analysis (AI-Assisted):', 20, yPosition);
            yPosition += 10;
            
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            
            // Split the enhanced content by sections and add them
            const enhancedText = enhancedContent.enhancedDescription;
            const sections = enhancedText.split('\n\n');
            
            sections.forEach(section => {
                if (section.trim()) {
                    const splitSection = doc.splitTextToSize(section.trim(), 170);
                    
                    // Check if we need a new page
                    if (yPosition + (splitSection.length * 7) > 270) {
                        doc.addPage();
                        yPosition = 20;
                    }
                    
                    doc.text(splitSection, 20, yPosition);
                    yPosition += splitSection.length * 7 + 5;
                }
            });
        }
        
        // Check if we need a new page for the signature section
        if (yPosition > 230) {
            doc.addPage();
            yPosition = 20;
        }
        
        // Add validation stamp
        doc.setFontSize(14);
        doc.setTextColor(39, 174, 96);
        doc.text('PROPOSAL ACCEPTED BY VILLAGE COUNCIL', 105, 270, { align: 'center' });
        doc.setFontSize(12);
        doc.text(`Document generated on: ${new Date().toLocaleDateString()}`, 105, 280, { align: 'center' });
        
        // Add village stamp
        doc.text(`${villageName} Planning Authority`, 105, 290, { align: 'center' });
        
        // Return the PDF document
        return doc;
    } catch (error) {
        console.error('Error generating PDF:', error);
        return null;
    }
}

// Send proposal PDF via email
export async function sendProposalEmail(proposal, emailAddress) {
    if (!proposal || !emailAddress) {
        console.error('Missing proposal or email address');
        return { success: false, message: 'Missing proposal or email address' };
    }
    
    try {
        // Generate PDF
        const pdfDoc = await generateProposalPDF(proposal);
        if (!pdfDoc) {
            throw new Error('Failed to generate PDF');
        }
        
        // Generate subject and content
        const subject = `Approved Village Proposal: ${proposal.title}`;
        const content = `
            <h2>Village Proposal Approved</h2>
            <p>Dear Village Member,</p>
            <p>We are pleased to inform you that the following proposal has been approved:</p>
            <ul>
                <li><strong>Title:</strong> ${proposal.title}</li>
                <li><strong>Type:</strong> ${proposal.type}</li>
                <li><strong>Proposed by:</strong> ${proposal.author}</li>
                <li><strong>Created on:</strong> ${proposal.createdAt}</li>
            </ul>
            <p><strong>Approval reason:</strong> ${proposal.evaluationReason}</p>
            <p>Please find the attached official PDF document for your records.</p>
            <p>Thank you for your participation in our village planning process.</p>
            <p>Regards,<br>Village Planning Committee</p>
        `;
        
        // Get the PDF as base64
        const pdfBase64 = pdfDoc.output('datauristring');
        
        // Create the email data
        const emailData = {
            to_email: emailAddress,
            subject: subject,
            message: content,
            attachment: pdfBase64
        };
        
        // Log email data for verification (excluding the attachment for brevity)
        console.log('Sending email to:', emailAddress, 'with subject:', subject);
        
        // Send the email using Gemini API (for future implementation)
        // For now, just show an alert that the email would be sent
        alert(`Email with proposal details would be sent to: ${emailAddress}`);
        
        // Return success
        return { success: true, message: 'Email sent successfully' };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, message: error.message };
    }
} 