/*
Navigate to Carmax.com and search for some cars with whatever filters you want. 
Example: https://www.carmax.com/cars/chevrolet/suburban-1500/high-country/premier/rst/z71/four-wheel-drive?showreservedcars=false&mileage=0-70000&year=2021-2024
Copy/paste/run the following code in the developer console to parse out a CSV list of each vihicle card, including car model, trim, miles, and price.
Load into excel to analyze price points.
Setup: my code parses on Chevy Suburban. You'll need to edit the match variable with your car match. 
Note: Generated with ChatGPT.
*/
container = document.querySelector('div.car-container.listing-container');
if (container) {
  let directDivs = Array.from(container.children).filter(function(el) {
    return el.tagName.toLowerCase() === 'div';
  });

  directDivs.forEach(function(div) {
    let text = div.textContent.trim();

    // Match: Year + Make + Model + Trim + Cost + Miles
    let match = text.match(/(\d{4})\s+Chevrolet\s+Suburban\s+1500\s+([A-Za-z0-9 ]+)\s*\$([\d,]+).*?(\d{1,3}(?:K)?\s*mi)/i);
    if (match) {
      let year = match[1];
      let trim = match[2];
      let cost = `$${match[3]}`;
      let miles = match[4].replace(/\s+/g, ''); // Remove spaces in mileage
      console.log(`${year}, ${trim}, ${cost}, ${miles}`);
    }
  });
} else {
  console.log('Container not found.');
}
