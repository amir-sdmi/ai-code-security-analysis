const PushMail = require('./pushEmail'); 
const { generateReply } = require('./generateReply'); 
const { ethers } = require("ethers");
const { getTxHashMapping, storeTxHashMapping } = require('./database'); 
require('dotenv').config();


async function sendResponse() {
  const pushMailInstance = await PushMail.initialize(); 
  
  const recipientAddress = process.env.CAIP_ADDRESS; 

  try {
    // Fetch the current txHash mappings from MongoDB
    const txHashMapping = await getTxHashMapping();
    console.log("txHashmapping",txHashMapping)
    const emails = await pushMailInstance.getByRecipient(recipientAddress);
    console.log('Fetched Emails:', emails);

    // Loop through the emails to generate and send responses
    for (const email of emails) {
      // Skip if email was already replied (check in txHashMapping)
      if (txHashMapping[email.txHash]) {
        console.log(`Already replied to email with txHash: ${email.txHash}`);
        continue;
      }

      const subject = email.subject;
      const emailBody = email.body.content;
      
      // Generate email content using ChatGPT
      const generatedEmail = await generateReply(subject, recipientAddress, emailBody);

      // Dummy signer, replace with actual signer logic
      const address = recipientAddress;
      const wallet = new ethers.Wallet(process.env.PRIVATE_KEY); 

      const signer = {
        account: address,
        signMessage: async (data) => {
          const signature = await wallet.signMessage(data);
          return ethers.getBytes(signature);
        },
      };

      // Send the generated email using PushMail's send method
      const txHash = await pushMailInstance.send(
        generatedEmail.subject,  
        generatedEmail.body,     
        generatedEmail.attachments, 
        generatedEmail.headers,   
        [email.from],     
        signer                  
      );

      console.log('Email sent successfully! Transaction Hash:', txHash);

      // Store the txHash and replyTxHash mapping in MongoDB to avoid replying again
      await storeTxHashMapping(email.txHash, txHash);
    }
  } catch (error) {
    console.error('Error fetching emails:', error);
  }
}

module.exports = sendResponse;
