import "../node_modules/bootstrap/dist/css/bootstrap.min.css";
import "./App.scss";
import EventList from "./components/EventList";
import CitySearch from "./components/CitySearch";
import NumberOfEvents from "./components/NumberOfEvents";
import { extractLocations, getEvents, getAccessToken } from "./api";
import { useCallback, useEffect, useState } from "react";
import { ErrorAlert, InfoAlert, LocationAlert, OfflineAlert } from './components/Alert';
import './page-loader.css'
import EventPlaceholder from "./components/EventPlaceholder";
import { Placeholder } from 'react-bootstrap';
import CityEventsChart from "./components/CityEventsChart";
import EventGenresChart from "./components/EventGenresChart";
import AnimateHeight from "react-animate-height";


function App() {
  const [loading, setLoading] = useState("")
  const [chatGPTloading, setChatGPTloading] = useState("")
  const [brandName, setBrandName] = useState("Meet App")

  const [events, setEvents] = useState("");
  const [token, setToken] = useState("");
  const [allEvents, setAllEvents] = useState("")
  const [locations, setLocations] = useState("");
  const [currentCity, setCurrentCity] = useState("See all cities");
  const [filteredEvents, setFilteredEvents] = useState([])
  const [numberOfEvents, setNumberOfEvents] = useState(32)

  const [infoText, setInfoText] = useState("");
  const [errorText, setErrorText] = useState("");
  const [offlineText, setOfflineText] = useState("");
  const [locationAlert, setShowLocationAlert] = useState("");
  const [showCharts, setShowCharts] = useState(false)

  const [userCountry, setUserCountry] = useState("");
  const [userCountryFormatted, setUserCountryFormatted] = useState("");
  const [searchForUserCountry, setSearchForUserCountry] = useState("");

  const [showLoginScreen, setShowLoginScreen] = useState("")

  const googleAuthScreen = async () => {

    // console.log("yeppers");
    // setLoading(false)

    const response = await fetch(
      "https://eio4ssbtcl.execute-api.eu-west-2.amazonaws.com/dev/api/get-auth-url"
    );
    const result = await response.json();
    const { authUrl } = result;

    // set browser url to authUrl aka redirect to authUrl
    // console.log("setting logging screen to false...");
    setShowLoginScreen(false)
    setLoading(true)

    window.location.href = authUrl;

    // if (authCode) {


    // }

  }

  const setEventValues = useCallback(() => {
    const filteredEvents = currentCity === "See all cities"
      ? allEvents
      : allEvents.filter((calenderEvent) => {
        return calenderEvent.location === currentCity;
      })
    setFilteredEvents(filteredEvents);
    setEvents(filteredEvents.slice(0, numberOfEvents));
  }, [allEvents, currentCity, numberOfEvents])


  const fetchEvents = useCallback(async () => {

    console.log("inside fetchEvents...");
    console.log("value of showloginscreen:", showLoginScreen);
    console.log("value of token:", token);
    console.log("value of events:", events);

    // check to see if the user has an access token
    if (!window.location.href.startsWith("http://localhost") && !token) {
      // console.log("getting token...");
      await getAccessToken(setToken, setShowLoginScreen);
    }

    if (!window.location.href.startsWith("http://localhost") && showLoginScreen && !token) {

      return

    }

    if (window.location.href.startsWith("http://localhost")) {

      setToken("offline")

    }

    if (!showLoginScreen && token && !events) {
      console.log("getting events...");

      const allEvents = await getEvents(token);
      const allLocations = extractLocations(allEvents);
      setEvents(allEvents.slice(0, numberOfEvents))
      setAllEvents(allEvents)
      setLocations(allLocations)

      console.log(events);

      setEventValues();

    }


    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showLoginScreen, token, `${events}`, getAccessToken, loading, getEvents, numberOfEvents, setEventValues]);

  const getUserCountry = useCallback(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(function (location) {
        // console.log("location:", location);
        let latitude = location.coords.latitude.toString()
        let longitude = location.coords.longitude.toString()
        fetch(`https://secure.geonames.org/countryCodeJSON?lat=${latitude}&lng=${longitude}&username=simeont`)
          .then(response => response.json())
          .then(data => {
            let country = data.countryName
            if (country === "United Kingdom") {
              country = "UK"
            }
            // console.log(data)
            localStorage.setItem("userCountry", country)

            let filteredLocations = locations.filter(item => item.includes(country))
            // console.log("filtered locations", filteredLocations);
            // console.log("includes country:", !!filteredLocations);

            setUserCountry(country)
            setUserCountryFormatted(filteredLocations[0])
            setShowLocationAlert(true)
          })
      });
    }
  }, [locations])

  const chatGPT = async () => {

    setChatGPTloading(true)

    const response = await fetch("https://eio4ssbtcl.execute-api.eu-west-2.amazonaws.com/dev/api/gpt");
    const result = await response.json();

    // console.log(response);
    // console.log(result.chatCompletion);

    const name = result.chatCompletion.choices[0].message.content

    setBrandName(name)

    setChatGPTloading(false)

  }


  useEffect(() => {

    console.log("loading:", loading);
    // console.log("online:", navigator.onLine);
    if (navigator.onLine) {
      setOfflineText("")

      if (!userCountry) {
        getUserCountry()
      }
    } else {
      setOfflineText("You're currently offline and viewing a cached version of the website")
    }

    if (!events) {
      setLoading(true)
      fetchEvents();
    }
    if (events) {
      setEventValues();
      setLoading(false)
      console.log(events);
    }

    // console.log("number of events value:", numberOfEvents, "\nevents object length:", events.length);
    // console.log("infotext value:",infoText);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchEvents, numberOfEvents, currentCity, infoText, offlineText, setEventValues, userCountry, loading, brandName, `${events}`, getUserCountry]);


  return (
    <div className="App">

      {showLoginScreen && !token ?

        (

          <div style={{ height: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", fontSize: "2rem" }}>
            Welcome to Meet App!
            <button onClick={googleAuthScreen} style={{ fontSize: "1rem" }} className="d-flex align-items-center alerts-button p-3 mt-2">
              Login with Google
              <img
                className="ms-2" style={{ width: "20px", height: "20px" }}
                src={"https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"}
                alt="Login with your google account." />
            </button>
          </div>

        ) : (
          <>

            {chatGPTloading ? (
              <Placeholder className="d-flex justify-content-center align-items-end mt-3 mb-1 pb-3" style={{ position: "relative", height: "96px" }} as={"p"} animation='wave'>
                <Placeholder style={{ opacity: "0.4", width: "275px", height: "50px" }} />
              </Placeholder>
            ) : (
              <p style={{ fontSize: "4rem", fontFamily: "'Kanit', sans-serif" }} className="mt-3">{brandName}</p>
            )}

            <button style={{ backgroundColor: "#d2efe0" }} className="alerts-button p-3 pt-2 pb-2 text-center" disabled={chatGPTloading ? true : false} onClick={chatGPT}>
              Reroll name using ChatGPT
              <img
                className="ms-2" style={{ width: "20px", height: "20px" }}
                src={"https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg"}
                alt="Generate a new brand name using ChatGPT" />
            </button>


            <div className="alerts-container">
              {locationAlert && events ? (
                <LocationAlert setShowLocationAlert={setShowLocationAlert} userCountry={userCountry} setSearchForUserCountry={setSearchForUserCountry} />
              ) : null}
              {offlineText ? <OfflineAlert className="mb-2" text={offlineText} /> : null}
              {errorText ? <ErrorAlert text={errorText} /> : infoText ? <InfoAlert text={infoText} /> : null}
            </div>

            <div
              className="mx-auto mt-3 mb-4"
              id="top-bar"
            >
              <div id="city-search__wrapper" className="me-md-3 mb-2 mb-md-0">
                <span>Search for a city</span>
                <CitySearch
                  events={events}
                  allLocations={locations}
                  setCurrentCity={setCurrentCity}
                  setInfoText={setInfoText}
                  setErrorText={setErrorText}
                  userCountry={userCountry}
                  userCountryFormatted={userCountryFormatted}
                  searchForUserCountry={searchForUserCountry}
                  setSearchForUserCountry={setSearchForUserCountry}
                />
              </div>

              <div id="number-of-events__wrapper">
                <span>Number of events</span>
                <NumberOfEvents
                  setEvents={setEvents}
                  filteredEvents={filteredEvents}
                  setNumberOfEvents={setNumberOfEvents}
                  events={events} />
              </div>
            </div>

            {
              loading ? (
                <EventPlaceholder amount={3} />
              ) : !loading && events.length ? (
                <>
                  <button
                    onClick={() => showCharts ? setShowCharts(false) : setShowCharts(true)}
                    className="alerts-button p-2 mt-3 mb-3">{showCharts ? "Hide Charts" : "Show charts"}
                  </button>

                  <AnimateHeight
                    duration={500}
                    height={showCharts ? "auto" : 0}
                  >
                    <div className="d-md-flex p-xs-0 p-md-3 mb-2 mx-lg-5 charts-container">
                      <EventGenresChart events={events} />
                      <CityEventsChart locations={locations} events={events} />
                    </div>
                  </AnimateHeight>

                  <EventList events={events} />
                </>
              ) : null
            }
          </>
        )

      }


    </div >
  );
}

export default App;
