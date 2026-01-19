const STRIPE_SK =
  process.env.NODE_ENV === "development"
    ? process.env.STRIPE_SK_TEST
    : process.env.STRIPE_SK_LIVE;
const stripe = require("stripe")(STRIPE_SK);
const nodemailer = require("nodemailer");
const EMAIL_ADDRESS = process.env.REACT_APP_EMAIL_ADDRESS;
const EMAIL_PASS = process.env.EMAIL_PASS;
const WEBSITE_URL =
  process.env.NODE_ENV === "development"
    ? process.env.TEST_DOMAIN
    : process.env.LIVE_DOMAIN;
const MIX_PRICE = process.env.REACT_APP_MIX_PRICE;
const MASTER_PRICE = process.env.REACT_APP_MASTER_PRICE;
const MIX_MASTER_PRICE = process.env.REACT_APP_MIX_MASTER_PRICE;

module.exports = async (req, res) => {
  const { session_id } = req.query;

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    const formData = JSON.parse(session.metadata.formData);
    const service = session.metadata.service;
    const quote = session.amount_total / 100;

    const userSubject = "AG Mastering Payment Confirmation";
    const userHTML = getUserEmailHtml(formData, service, quote);
    await sendEmail(formData.email, userSubject, userHTML); // Email to client

    const agMasteringSubject = "AG Mastering New Purchase";
    const agMasteringHTML = getAGMasteringEmailHtml(formData, service, quote);
    await sendEmail(EMAIL_ADDRESS, agMasteringSubject, agMasteringHTML); // Email to AG Mastering

    res.status(200).json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const sendEmail = async (email, subject, htmlContent) => {
  // Create a transporter object using the default SMTP transport
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    auth: {
      user: EMAIL_ADDRESS, // your email address
      pass: EMAIL_PASS, // your email password
    },
  });

  // Define email options
  const mailOptions = {
    from: EMAIL_ADDRESS,
    to: email,
    subject: subject,
    html: htmlContent,
  };

  // Send the email
  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new Error("Failed to send email", error);
  }
};

const getUserEmailHtml = (formData, service, quote) => {
  const paymentService = getService(service);
  const servicePrice = getPrice(service);
  const altMixesPrice =
    service !== "mixing" && formData.alternateMixes ? 10 : 0;

  // Generated with ChatGPT
  return `
    <table role="presentation" align="center" cellpadding="0" cellspacing="0" width="600" style="margin: auto; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 16px;">
      <tr>
          <td style="padding: 20px 0; text-align: center;">
              <h1 style="margin: 0; color: #007bff;">Payment Confirmation</h1>
          </td>
      </tr>
      <tr>
          <td style="padding: 20px 0;">
              <p>Hi ${formData.firstName},</p>
              <p>Your payment has been successfully processed. Below are the details of your purchase:</p>
              <table width="100%" cellpadding="5" cellspacing="0" style="border: 1px solid #ddd; border-collapse: collapse;">
                  <tr style="background-color: #f7f7f7;">
                      <th style="text-align: left; padding: 10px; border: 1px solid #ddd;">Description</th>
                      <th style="text-align: right; padding: 10px; border: 1px solid #ddd; width: 20%;">&nbsp;</th>
                  </tr>
                  <tr>
                      <td style="padding: 10px; border: 1px solid #ddd;">${paymentService}</td>
                      <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">$${servicePrice} / song</td>
                  </tr>
                  <tr>
                      <td style="padding: 10px; border: 1px solid #ddd;">Number of songs</td>
                      <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${formData.numberSongs}</td>
                  </tr>
                  <tr>
                      <td style="padding: 10px; border: 1px solid #ddd;">Alternate mixes</td>
                      <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">$${altMixesPrice}</td>
                  </tr>
                  <tr>
                      <td style="padding: 10px; border: 1px solid #ddd;"></td>
                      <td style="padding: 10px; padding-top: 20px; text-align: right; border: 1px solid #ddd;"><strong>Total: $${quote}</strong></td>
                  </tr>
              </table>
              <p>Below are the details of your form submission:</p>
              <table role="presentation" align="center" cellpadding="0" cellspacing="0" width="600" style="margin: auto;  border-collapse: collapse; font-family: Arial, sans-serif; font-size: 16px;">
                  <tr>
                      <td style="padding-top: 10px;">
                          <table width="100%" cellpadding="5" cellspacing="0" style="border: 1px solid #ddd;">
                              <tr style="background-color: #f7f7f7;">
                                  <th style="text-align: left; padding: 10px;">Form Submission Details</th>
                              </tr>
                              <tr>
                                  <td style="padding: 10px; border-top: 1px solid #ddd;"><strong>First name:</strong> ${formData.firstName}</td>
                              </tr>
                              <tr>
                                  <td style="padding: 10px; border-top: 1px solid #ddd;"><strong>Last name:</strong> ${formData.lastName}</td>
                              </tr>
                              <tr>
                                  <td style="padding: 10px; border-top: 1px solid #ddd;"><strong>Email:</strong> ${formData.email}</td>
                              </tr>
                              <tr>
                                  <td style="padding: 10px; border-top: 1px solid #ddd;"><strong>Artist name:</strong> ${formData.artistName}</td>
                              </tr>
                              <tr>
                                  <td style="padding: 10px; border-top: 1px solid #ddd;"><strong>Where can I find out more about you?</strong> ${formData.moreAboutYou}</td>
                              </tr>
                              <tr>
                                  <td style="padding: 10px; border-top: 1px solid #ddd;"><strong>Project title:</strong> ${formData.projectTitle}</td>
                              </tr>
                              <tr>
                                  <td style="padding: 10px; border-top: 1px solid #ddd;"><strong>Project type:</strong> ${formData.projectType}</td>
                              </tr>
                              <tr>
                                  <td style="padding: 10px; border-top: 1px solid #ddd;"><strong>How many songs do you want mixed/mastered:</strong> ${formData.numberSongs}</td>
                              </tr>
                              <tr>
                                  <td style="padding: 10px; border-top: 1px solid #ddd;"><strong>Yes I want alternate mixes:</strong> ${formData.alternateMixes}</td>
                              </tr>
                              <tr>
                                  <td style="padding: 10px; border-top: 1px solid #ddd;"><strong>List songs in title order:</strong> ${formData.songTitles}</td>
                              </tr>
                              <tr>
                                  <td style="padding: 10px; border-top: 1px solid #ddd;"><strong>Link to a reference track:</strong> ${formData.referenceTrack}</td>
                              </tr>
                              <tr>
                                  <td style="padding: 10px; border-top: 1px solid #ddd;"><strong>What do you like about this reference track?</strong> ${formData.referenceReason}</td>
                              </tr>
                              <tr>
                                  <td style="padding: 10px; border-top: 1px solid #ddd;"><strong>Additional notes:</strong> ${formData.additionalNotes}</td>
                              </tr>
                              <tr>
                                  <td style="padding: 10px; border-top: 1px solid #ddd;"><strong>How did you find me?</strong> ${formData.foundMe}</td>
                              </tr>
                              <tr>
                                  <td style="padding: 10px; border-top: 1px solid #ddd;"><strong>How you found me (Other):</strong> ${formData.foundMeOther}</td>
                              </tr>
                          </table>
                      </td>
                  </tr>
              </table>
              <p>Thank you for your purchase. I look forward to working on your music! If you have any questions or need further assistance, please don't hesitate to contact me at ${EMAIL_ADDRESS}.</p>
              <p style="padding-top:20px">Best regards,<br>AG Mastering</p>
          </td>
      </tr>
      <tr>
          <td style="padding: 20px 0; text-align: center;">
              <a href="${WEBSITE_URL}">Back to Website</a>
          </td>
      </tr>
  </table>
    `;
};

const getAGMasteringEmailHtml = (formData, service, quote) => {
  const paymentService = getService(service);
  const servicePrice = getPrice(service);
  const altMixesPrice =
    service !== "mixing" && formData.alternateMixes ? 10 : 0;

  // Generated with ChatGPT
  return `
    <table role="presentation" align="center" cellpadding="0" cellspacing="0" width="600" style="margin: auto; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 16px;">
      <tr>
          <td style="padding: 20px 0; text-align: center;">
              <h1 style="margin: 0; color: #007bff;">Payment Confirmation</h1>
          </td>
      </tr>
      <tr>
          <td style="padding: 20px 0;">
              <p>${formData.firstName} ${formData.lastName} has made a purchase. Below are the details of the purchase:</p>
              <table width="100%" cellpadding="5" cellspacing="0" style="border: 1px solid #ddd; border-collapse: collapse;">
                  <tr style="background-color: #f7f7f7;">
                      <th style="text-align: left; padding: 10px; border: 1px solid #ddd;">Description</th>
                      <th style="text-align: right; padding: 10px; border: 1px solid #ddd; width: 20%;">&nbsp;</th>
                  </tr>
                  <tr>
                      <td style="padding: 10px; border: 1px solid #ddd;">${paymentService}</td>
                      <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">$${servicePrice} / song</td>
                  </tr>
                  <tr>
                      <td style="padding: 10px; border: 1px solid #ddd;">Number of songs</td>
                      <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${formData.numberSongs}</td>
                  </tr>
                  <tr>
                      <td style="padding: 10px; border: 1px solid #ddd;">Alternate mixes</td>
                      <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">$${altMixesPrice}</td>
                  </tr>
                  <tr>
                      <td style="padding: 10px; border: 1px solid #ddd;"></td>
                      <td style="padding: 10px; padding-top: 20px; text-align: right; border: 1px solid #ddd;"><strong>Total: $${quote}</strong></td>
                  </tr>
              </table>
              <p>Below are the details of the form submission:</p>
              <table role="presentation" align="center" cellpadding="0" cellspacing="0" width="600" style="margin: auto;  border-collapse: collapse; font-family: Arial, sans-serif; font-size: 16px;">
                  <tr>
                      <td style="padding-top: 10px;">
                          <table width="100%" cellpadding="5" cellspacing="0" style="border: 1px solid #ddd;">
                              <tr style="background-color: #f7f7f7;">
                                  <th style="text-align: left; padding: 10px;">Form Submission Details</th>
                              </tr>
                              <tr>
                                  <td style="padding: 10px; border-top: 1px solid #ddd;"><strong>First name:</strong> ${formData.firstName}</td>
                              </tr>
                              <tr>
                                  <td style="padding: 10px; border-top: 1px solid #ddd;"><strong>Last name:</strong> ${formData.lastName}</td>
                              </tr>
                              <tr>
                                  <td style="padding: 10px; border-top: 1px solid #ddd;"><strong>Email:</strong> ${formData.email}</td>
                              </tr>
                              <tr>
                                  <td style="padding: 10px; border-top: 1px solid #ddd;"><strong>Artist name:</strong> ${formData.artistName}</td>
                              </tr>
                              <tr>
                                  <td style="padding: 10px; border-top: 1px solid #ddd;"><strong>Where can I find out more about you?</strong> ${formData.moreAboutYou}</td>
                              </tr>
                              <tr>
                                  <td style="padding: 10px; border-top: 1px solid #ddd;"><strong>Project title:</strong> ${formData.projectTitle}</td>
                              </tr>
                              <tr>
                                  <td style="padding: 10px; border-top: 1px solid #ddd;"><strong>Project type:</strong> ${formData.projectType}</td>
                              </tr>
                              <tr>
                                  <td style="padding: 10px; border-top: 1px solid #ddd;"><strong>How many songs do you want mixed/mastered:</strong> ${formData.numberSongs}</td>
                              </tr>
                              <tr>
                                  <td style="padding: 10px; border-top: 1px solid #ddd;"><strong>Yes I want alternate mixes:</strong> ${formData.alternateMixes}</td>
                              </tr>
                              <tr>
                                  <td style="padding: 10px; border-top: 1px solid #ddd;"><strong>List songs in title order:</strong> ${formData.songTitles}</td>
                              </tr>
                              <tr>
                                  <td style="padding: 10px; border-top: 1px solid #ddd;"><strong>Link to a reference track:</strong> ${formData.referenceTrack}</td>
                              </tr>
                              <tr>
                                  <td style="padding: 10px; border-top: 1px solid #ddd;"><strong>What do you like about this reference track?</strong> ${formData.referenceReason}</td>
                              </tr>
                              <tr>
                                  <td style="padding: 10px; border-top: 1px solid #ddd;"><strong>Additional notes:</strong> ${formData.additionalNotes}</td>
                              </tr>
                              <tr>
                                  <td style="padding: 10px; border-top: 1px solid #ddd;"><strong>How did you find me?</strong> ${formData.foundMe}</td>
                              </tr>
                              <tr>
                                  <td style="padding: 10px; border-top: 1px solid #ddd;"><strong>How you found me (Other):</strong> ${formData.foundMeOther}</td>
                              </tr>
                          </table>
                      </td>
                  </tr>
              </table>
          </td>
      </tr>
  </table>
    `;
};

const getPrice = (service) => {
  switch (service) {
    case "mixing":
      return MIX_PRICE;
    case "mastering":
      return MASTER_PRICE;
    case "mix&master":
      return MIX_MASTER_PRICE;
    default:
      return 0;
  }
};

const getService = (service) => {
  switch (service) {
    case "mixing":
      return "Mixing";
    case "mastering":
      return "Mastering";
    case "mix&master":
      return "Mix & Master";
    default:
      return "mixing";
  }
};
