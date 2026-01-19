"use client";

import { useState, useEffect } from "react";
import extractOldestRecords from "../dataManipulation";

export default function OpenF1() {
  const [intervalData, setIntervalData] = useState([]);
  //const apiUrl = "https://api.openf1.org/v1/intervals?session_key=latest";
  const apiUrl = "https://api.openf1.org/v1/position?session_key=9599";
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        const last20Data = data.slice(-20); // Get the last 20 indexes
        setIntervalData(last20Data);
      } catch (error) {
        console.error("Error fetching live data: ", error);
      }
    };

    fetchData();

    // Created by ChatGPT
    //Context prompt is active
    // Prompt: Set the following useEffect to execute every determined interval
    const intervalId = setInterval(fetchData, 15000); // Fetch every 15 seconds

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div>
      <h2>Live Data</h2>
      {intervalData.length === 0 && <p>Loading...</p>}
      {intervalData}
    </div>
  );
}

export async function getDrivers() {
  const apiUrl = "https://api.openf1.org/v1/drivers?session_key=latest";
  const response = await fetch(apiUrl);
  const data = await response.json();
  console.log(data);
  return data;
}

export async function getIntervals() {
  const apiUrl = "https://api.openf1.org/v1/intervals?session_key=latest";
  const response = await fetch(apiUrl);
  const data = await response.json();
  const intervals = extractOldestRecords(data);
  console.log(intervals);
  return intervals;
}

export async function getLapNumber(driver) {
  const apiUrl = `https://api.openf1.org/v1/laps?session_key=latest&driver_number=${driver}`;
  const response = await fetch(apiUrl);
  const data = await response.json();
  data.reverse();
  console.log(`lap number`);
  console.log(data[0].lap_number);
  return data[0].lap_number;
}

export async function getLatestSessionName() {
  const apiUrl = "https://api.openf1.org/v1/sessions?session_key=latest";

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    return data[0].session_name;
  } catch (error) {
    console.error("Error fetching session name: ", error);
    return null;
  }
}
