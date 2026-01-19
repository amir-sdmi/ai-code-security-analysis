// written with CHATGPT <3

/**
 *
 * @param {Date} date
 * @returns a string fate of YYYY-DD-MM
 */

export default function formatDate(date) {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error('Invalid date provided. Please provide a valid date object.');
  }

  let year = date.getFullYear();
  let month = date.getMonth() + 1;
  let day = date.getDate();

  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}
