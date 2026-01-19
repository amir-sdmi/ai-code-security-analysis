import React from "react";
import eulogyLogo from "../assets/img/EQ-halfling-tombstone.png";
import { Link } from "react-router-dom";

// This is the project description.
const presentationLink = "https://docs.google.com/presentation/d/1S0enStuspSFOCA47sYQGOw54QvP8QmfZr2Ybn5IPQbA/edit?slide=id.g33e6dbe26d6_0_10#slide=id.g33e6dbe26d6_0_10"


const backgroundStyle = {
    position: "absolute",
    backgroundImage: `url(${eulogyLogo})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    height: "100vh",
    width: "100vw",
    
};

const dimmedBlackBackgroundStyle = {
    position: "relative",
    top: 0,
    left: "25vw",
    height: "100vh",
    width: "50vw",
    background: "linear-gradient(to right, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.8))",
    zIndex: 1
};

const textStyle = {
    position: "absolute",
    top: "8vh",
    left: "50%",
    transform: "translate(-50%,0%)",
    color: "rgb(0,0,0)",
    zIndex: 2,
    maxWidth: "80vw",
    padding: "1rem",
    textAlign: "center",

}

function About() {
    return (
        <div style={backgroundStyle}>
        
            <div style = {dimmedBlackBackgroundStyle}> 
            </div>
            <div style={textStyle}>
                    <h1 style={{ fontSize: '2rem' }}>Why?</h1>
                        <p>
                           Why did we make this project? Many EverQuest players enjoy custom quests that they either download or
                           make, but what if any player could make a quest based on either a famous person or a loved one in a few clicks?
                           EulogyQuest seeks to make it easier for EverQuest players to create their own custom quests, and base their 
                           quests on either a famous person, or a player they know from the game.
                        </p>
                    <h1 style={{ fontSize: '2rem' }}>How?</h1>    
                        <p>
                            The website has 2 sections: 
                            <Link to="/famous-person"> Famous Person Quest</Link> and 
                            <Link to="/honored-one"> Honored One Quest</Link>.
                        </p>
                        <p>
                            In the Famous Person Quest section, you can enter the name of a famous person, and press enter to let the process begin.
                            Using ChatGPT, a custom-made quest will be generated and added to the Eulogy Quest server on EQEmulator using the RoF2 client, and would 
                            be ready to play.
                        </p>
                        <p>
                            In the Honored One Quest, you would enter the name of an honored player that you played with, along with 
                            a text file containing their chat history. The rest is similar to the Famous Person Quest, only now you can have 
                            your honored one in your new quest
                        </p>
                    <h1 style={{ fontSize: '2rem' }}>More Info</h1>  
                        <p>
                            To find out more about this project, click <a href= {presentationLink} target="_blank" style={{ color: "rgb(0, 36, 120)", textDecoration: "underline" }}>here</a>.
                        </p>
                        

                    <div style = {{marginTop: "20vh" }}>
                    </div>
                    <h1 style={{ fontSize: '2rem' }}>Developers</h1>
                        <p>
                            Ken Harvey, Adam Hamou, Michael Soffer, Parham Pahlavan, Kevin Ramos, Hardy Fenam,
                        </p>
                        <p>
                            Tanner Donovan, Jayson Kirchand-Patel, Richard Vargason, John Zaleschuk
                        </p>
                </div> 
            
            
        </div>
    );
}

export default About;