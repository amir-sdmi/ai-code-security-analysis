// Mapbox and NYC Open Data tokens
const YOUR_MAPBOX_ACCESS_TOKEN =
  "pk.eyJ1Ijoia2ltYzg4OSIsImEiOiJjbDk0YjM2a2IyMXJsM3Bud2Qwdmw2cGd2In0.4g07W_lEpCcMTc7QdtJ_qQ";
const NYC_OPENDATA_APP_TOKEN_TNS = "O5H655eiD1x4VoPhW3ZUbKfGH";
const NYC_OPENDATA_APP_TOKEN_PARKS = "xL2MGds4sPjYXCmShZhW8yZj0";

/* code assistance from Midterm and using chatGPT 
Data Sources: NYC Open Data and Mapbox
Tennis Courts - Apr 2023 (Athletic Facilities API): https://dev.socrata.com/foundry/data.cityofnewyork.us/qnem-b8re
Recreational Parks - Aug 2022 (Facilities API): https://dev.socrata.com/foundry/data.cityofnewyork.us/ji82-xba5
Directory of Tennis Courts - Sep 2018 (JSON): https://data.cityofnewyork.us/Recreation/Directory-of-Tennis-Courts/dies-sqgi
Zipcodes (Mapbox Geocoding API): https://docs.mapbox.com/api/search/geocoding/
*/

/* ----- NEED HELP USING JSON AS DATA -----
("use strict");

// dependencies
const fs = require("fs");

// for json file
fs.readFile("../src/json/DPR_Tennis_001.json", "utf-8", (err, data) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(data);
});
function writeSuccess(err) {
  if (err) console.error(err);
  else console.log("write success");
}
fs.writeFile("../src/json/DPR_Tennis_001.json", "hello", writeSuccess);
*/

// html elements
const getCourtsButton = document.getElementById("getCourts");
const locationInput = document.getElementById("locationInput");
const courtList = document.getElementById("courtList");
const parkList = document.getElementById("parkList");
const zip = document.getElementById("zipcode");

// NYC bounds coordinates
const nycBounds = "-74.1687,40.5722,-73.8062,40.9467";

// function to get tennis courts based on input location's zipcode
function getLocationZipcodeforTNS(locationName) {
  const urlMap = `https://api.mapbox.com/geocoding/v5/mapbox.places/${locationName}.json?access_token=${YOUR_MAPBOX_ACCESS_TOKEN}&limit=1&bbox=${nycBounds}`;

  return (
    fetch(urlMap)
      .then((response) => response.json())
      .then((data) => {
        if (data.features.length > 0) {
          const zipcode = data.features[0].context.find((c) =>
            c.id.includes("postcode")
          ).text;
          console.log(`For tennis API at ${locationName}, zipcode: ${zipcode}`);
          // if a zipcode is found...

          /* // ----- FOR JSON DIRECTORY ------
          const coordinates = data.features[0].center;
          console.log(`${locationName} : ${coordinates}`);
          // if coordinates are found... */

          // insert HTML element
          zip.innerHTML = ""; // clear previous list
          const listTitle = document.createElement("h1");
          listTitle.textContent = `Your zipcode`;
          const li = document.createElement("li");
          li.textContent = `${zipcode}`;
          // li.textContent = `${coordinates}`;
          zip.appendChild(listTitle);
          zip.appendChild(li);

          /* // ----- FOR JSON DIRECTORY ------ 
          const jsonDirectory = url(`../src/json/DPR_Tennis_001.json`);
          return fetch(jsonDirectory); */

          const urlTNS = `https://data.cityofnewyork.us/resource/qnem-b8re.json?$limit=5000&$where=zipcode='${zipcode}'&$$app_token=${NYC_OPENDATA_APP_TOKEN_TNS}`;
          // return fetched urlTNS back to the main function
          return fetch(urlTNS);
        } else {
          throw new Error(`No tennis courts found near ${locationName}`);
        }
      })

      /* // ----- FOR JSON DIRECTORY ------
        } else if (data.features.length > 0) {
          const zipcode = data.features[0].context.find((c) =>
            c.id.includes("postcode")
          ).text;
          console.log(`For tennis API at ${locationName}, zipcode: ${zipcode}`);
          const urlTNS = `https://data.cityofnewyork.us/resource/qnem-b8re.json?$limit=5000&$where=zipcode='${zipcode}'&$$app_token=${NYC_OPENDATA_APP_TOKEN_TNS}`;
          // return fetched urlTNS back to the main function
          return fetch(urlTNS);
          const coordinates = data.features[0].center;
          console.log(`${locationName} : ${coordinates}`);
          const jsonDirectory = url("../src/json/DPR_Tennis_001.json");
          return fetch(jsonDirectory);
        } else {
          throw new Error(`No tennis courts found near ${locationName}`);
        }
      })*/

      // because previous .then fetched zipcode, can now get tennis court data
      .then((response) => response.json())
      .then((data) => {
        // filter API for Athletic Facilities where the primary sport is tennis
        const tennisCourts = data.filter(
          (court) => court.primary_sport === "TNS"
        );
        console.log(tennisCourts);

        /* // ----- FOR JSON DIRECTORY ------
        const jsonDirectory = data;
        console.log(`From tennis Directory: `);
        console.log(jsonDirectory); */

        // insert HTML element
        courtList.innerHTML = ""; // clear previous list

        if (tennisCourts.length > 0) {
          // lists count of tennis courts found
          const li = document.createElement("li");
          li.textContent = `${tennisCourts.length} courts found`;
          courtList.appendChild(li);
          // data pulled from API
          tennisCourts.forEach((court) => {
            const primarySport = court.primary_sport;
            const accessible = court.accessible;
            const borough = court.borough;
            const communityBoard = court.communityboard;
            const councilDistrict = court.councildistrict;
            const department = court.department;
            // const propName = court.gispropnum;
            const status = court.featurestatus;
            // const fieldId = court.field_number;
            const maintenance = court.maintenanceagreement;
            const police = court.precinct;
            const area = court.starea;
            const perimeterLength = court.stlength;
            const systemId = court.system;
            const type = court.surface_type;
            const permit = court.tennis;
            const zipcode = court.zipcode;
            // create html format
            const listItemHtml = `
          <h2>${systemId} (${zipcode})</h2>
          <ul>
            <li>Permit Requirement: ${permit}</li>
            <li>Accessible: ${accessible}</li>
            <li>Surface Type: ${type}</li>
            <li>Community Board: ${communityBoard}</li>
            <li>Council District: ${councilDistrict}</li>
          </ul>`;
            courtList.insertAdjacentHTML("beforeend", listItemHtml);
          });
        } else {
          // If no results match input location's zipcode, display no results message
          const li = document.createElement("li");
          li.textContent = `Sorry, no tennis courts found in this zipcode`;
          courtList.appendChild(li);
        }
      })
      .catch((error) => console.error(error))
  );
}

// function to get parks based on location zipcode
function getLocationZipcodeforParks(locationName) {
  const urlMap = `https://api.mapbox.com/geocoding/v5/mapbox.places/${locationName}.json?access_token=${YOUR_MAPBOX_ACCESS_TOKEN}&limit=1&bbox=${nycBounds}`;

  return (
    fetch(urlMap)
      .then((response) => response.json())
      .then((data) => {
        if (data.features.length > 0) {
          const zipcode = data.features[0].context.find((c) =>
            c.id.includes("postcode")
          ).text;
          console.log(`For parks API at ${locationName}, zipcode: ${zipcode}`);
          // if a zipcode is found...

          const urlParks = `https://data.cityofnewyork.us/resource/ji82-xba5.json?$limit=5000&$where=zipcode='${zipcode}'&$$app_token=${NYC_OPENDATA_APP_TOKEN_PARKS}`;
          // return fetched urlParks back to the main function
          return fetch(urlParks);
        } else {
          throw new Error(`No parks found near ${locationName}`);
        }
      })

      // because previous .then fetched zipcode, can now get park site data
      .then((response) => response.json())
      .then((data) => {
        // filter API for Facilities where the facility subgroup is a recreational and waterfront site (includes playgrounds)
        const nearbyParks = data.filter(
          (park) => park.facsubgrp === "RECREATION AND WATERFRONT SITES"
        );
        console.log(nearbyParks);

        // insert HTML element
        parkList.innerHTML = ""; // clear previous list
        if (nearbyParks.length > 0) {
          const listTitle = document.createElement("h1");
          listTitle.textContent = `Parks & Playgrounds`;
          parkList.append(listTitle);
          // lists count of parks found
          const li = document.createElement("li");
          li.textContent = `${nearbyParks.length} alternatives`;
          parkList.appendChild(li);
          // data pulled from API
          nearbyParks.forEach((park) => {
            const parkName = park.facname;
            const parkType = park.factype;
            const parkAddress = park.address;
            const parkZipcode = park.zipcode;
            const parkOp = park.optype;
            const parkCD = park.council;
            const parkCT = park.censtract;
            const li = document.createElement("li");
            li.textContent = `${parkName} - ${parkType} - ${parkOp} - ${parkAddress} - Community District: ${parkCD}, Census Tract: ${parkCT}`;
            parkList.appendChild(li);
          });
        } else {
          // If no results match input location's zipcode, display no results message
          const li = document.createElement("li");
          li.textContent = `Sorry, no places for recreation and play found in this zipcode`;
          parkList.appendChild(li);
        }
      })
      .catch((error) => console.error(error))
  );
}

// event listener for "Get Tennis Courts" button click
getCourtsButton.addEventListener("click", () => {
  const locationName = locationInput.value;
  getLocationZipcodeforTNS(locationName);
  getLocationZipcodeforParks(locationName);
});
