// ==UserScript==
// @name         Timesheetinator
// @version      2025-07-03
// @description  Lets you autofill most of the boring timesheets for your projects.
// @author       someone
// @include      https://opstrs03.bsc.es/Time*/*
// @grant        none
// ==/UserScript==


// I coded this mostly with ChatGPT, if it doesnt work for your case: Feel free to modify it or contribute back your changes :)

(function() {
    'use strict';
function fixMyUIBugs(){
    let locationParams = new URLSearchParams(window.location.search);
    // we know that location parameters is valid, so just use them
    let year = locationParams.get('year');
    let month = locationParams.get('month');
    $("#monthSelect").val(month).change();
    $("#yearSelect").val(year).change();
}

function extractMonthlyRequiredHours() {
  const tds = document.querySelectorAll('td.sticky-penultimate-column');
  const results = [];

  tds.forEach(td => {
    // Get the two div elements inside the td
    const divs = td.querySelectorAll('div');
    if (divs.length >= 2) {
      // Extract text, trim spaces
      const firstNumText = divs[0].textContent.trim();
      const secondNumText = divs[1].textContent.trim();

      // Convert second number from "somethign," to "somethign.9"
      const secondNumNormalized = secondNumText.replace(',', '.');

      // Parse to floats
      const firstNum = parseFloat(firstNumText);
      const secondNum = parseFloat(secondNumNormalized);

      results.push({ firstNum, secondNum });
    }
  });

  return results;
}

function analyzeTableRows() {
  const rows = document.querySelectorAll('tr');
  const results = [];
  let id = 1;

  rows.forEach(tr => {
    const inputs = tr.querySelectorAll('input[data-projectid][data-wpid][data-day]');
    if (inputs.length > 0) {
      const firstInput = inputs[0];
      const projectId = firstInput.getAttribute('data-projectid');
      const wpid = firstInput.getAttribute('data-wpid');

      results.push({
        rowId: id++,
        trElement: tr, // <-- store reference to the <tr>
        projectId,
        wpid,
        inputCount: inputs.length
      });
    }
  });

  return results;
}

function resetTableInputs() {
  const inputs = document.querySelectorAll('input[data-projectid][data-wpid][data-day]');
  inputs.forEach(input => {
    input.value = '0';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

function fillInputs(tableData) {
  const usedDays = new Set();

  for (const row of tableData) {
    const inputs = row.trElement.querySelectorAll('input[data-projectid][data-wpid][data-day]');
    if (inputs.length === 0) continue;

    const required = Math.ceil(row.requiredHours);
    let sumFilled = 0;

    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const day = input.getAttribute('data-day');

      if (usedDays.has(day)) continue;

      const toAdd = Math.min(7.5, required - sumFilled);
      if (toAdd > 0) {
        input.value = toAdd.toFixed(1);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));

        sumFilled += toAdd;
        usedDays.add(day);
      }

      if (sumFilled >= required) break;
    }
  }
}


function autoFill(){
    // Lets first build up an understanding of how many projects / Work packages we have
    let requiredHours = extractMonthlyRequiredHours();
    // First entry corresponds to the already done ones, second to the needed.

    // lets also extract our project ids
    let table_results = analyzeTableRows();

    const combined = table_results.map((row, i) => {
        const numbers = requiredHours[i] || { firstNum: null, secondNum: null };
        return {
            ...row,
            alreadyDoneHours: numbers.firstNum,
            requiredHours: numbers.secondNum
        };
  });

    resetTableInputs();
    fillInputs(combined);


}



function addAutoFillButton(){
   $('<button>', {
  id: 'autofillButtonCool',
  text: 'Autofill?',
  class: 'btn btn-primary', // Bootstrap button style, you can change it to btn-secondary, btn-success, etc.
  click: autoFill
}).insertAfter('#saveAllButton');
}

function addEraseButton(){
    $('<button>', {
  id: 'EraseTable',
  text: 'Erase?',
  class: 'btn btn-primary', // Bootstrap button style, you can change it to btn-secondary, btn-success, etc.
  click: resetTableInputs
}).insertAfter('#saveAllButton');
}

function addOnSelectFunctionality(){
    $('#monthSelect').on('change', function () {
    var selectedMonth = $(this).val();

    // Parse current query parameters
    var params = new URLSearchParams(window.location.search);

    // Update the month parameter
    params.set('month', selectedMonth);

    // Build the new URL
    var baseUrl = window.location.origin + window.location.pathname;
    var newUrl = baseUrl + '?' + params.toString();

    // Redirect to the updated URL
    window.location.href = newUrl;
  });
    $('#yearSelect').on('change', function () {
    var selectedYear = $(this).val();

    // Parse current query parameters
    var params = new URLSearchParams(window.location.search);

    // Update the month parameter
    params.set('year', selectedYear);

    // Build the new URL
    var baseUrl = window.location.origin + window.location.pathname;
    var newUrl = baseUrl + '?' + params.toString();

    // Redirect to the updated URL
    window.location.href = newUrl;
  });
}

// Here we check if we have the year and stuff in the header
let locationParams = new URLSearchParams(window.location.search);
if(!locationParams.has('personId')){
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth()+1 ; // getMonth() returns 0–11
    if(confirm("TIMESHEETINATOR: Reloading the page to go to the current date")){
    $("#monthSelect").val(month).change();
    $("#yearSelect").val(year).change();
    $("#goButton").click();
    }
}

// Okay this is the normal mode
// first lets fix some ugly UI bugs:

fixMyUIBugs();
addOnSelectFunctionality();
addAutoFillButton();
addEraseButton();



})();
