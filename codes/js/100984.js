


export const getBufferFromUrl = async (url) => {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return buffer
}

// THIS IS GREAT FOR WORD DOCS
// docx to html converter: https://github.com/mwilliamson/mammoth.js/
import mammoth from 'mammoth';

// feed it a buffer of a WORD file and it will return HTML
// use getBufferFromUrl() to get the buffer from a URL
/* usage:
  htmlFromWordBuffer({
    url: 'https://dl.airtable.com/.attachments/ece32b51895f5e57952d0d5d1cb58f04/f2f5630a/2022_VOM_abstract_ver5.docx'

    // or send the buffer (not arrayBuf) in, e.g. from forms
    buffer,
  })


*/

export async function getHtmlFromWord({ buffer, url }) {
  if (url) {
    buffer = await getBufferFromUrl(url)
  }
  let output = await mammoth.convertToHtml({ buffer: buffer });
  // console.log('[htmlFromWordBuffer] w/mammoth:', Object.keys(output))
  return output?.value || null;
}



// WORKS GREAT FOR PDFs
// https://github.com/opendocsg/pdf2md
// Note that PDFs generally don't store italics very well
// so we either have to OCR it or use ChatGPT. Once OpenAI's img2text is out use that.
import pdf2md from '@opendocsg/pdf2md'

export async function getMdFromPdf({ buffer, url }) {
  if (url) {
    buffer = await getBufferFromUrl(url)
  }
  let output = await pdf2md(buffer);
  // console.log('[getMdFromPdf] w/pdf2md:', output)
  return output || null;
}


// export function convertpdf2md(url, cb) {
//   let callbackCalled = false;
//   let dataBuffer = null;

//   fetch(url)
//     .then(function (response) {
//       // Create an array buffer to store the file data
//       return response.arrayBuffer();
//     })
//     .then(function (arrayBuffer) {
//       dataBuffer = Buffer.from(arrayBuffer);

//       if (!callbackCalled) {
//         pdf2md(dataBuffer).then(function (data) {
//           // use data
//           console.log('convertpdf2md:', data)
//           cb(null, data);
//         });
//       }
//     })
//     .catch(function (error) {
//       callbackCalled = true;
//       cb(error);
//     });
// }