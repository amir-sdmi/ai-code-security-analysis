import React from 'react';
import { useState } from 'react';
import axios from 'axios';
import backgroundImage from '../assets/img/Famous_Person_background.jpg';
import "./Generatequest.css";  //reusing :D


function FamousPerson() {
    const [Input, SetInput] = useState(null);
    const [Ret, setRet] = useState(true);
    const [message, setMessage] = useState("");
    const [/*response*/, setResponse] = useState(null);

    /* ai-gen start (ChatGPT-4, 2) */
    const handleSubmit = async () => {


        try {
            const response = await axios.post("http://localhost:5000/famous-person", {
                message: Input,
            });
            setMessage("Sucessfully receieved");
            setRet(true);
            console.log("Server response:", response.data);
            setResponse(response.data);

        } catch (error) {
            console.error("Error sending prompt:", error);
            setMessage("Unsuccessful, please try again");
            setRet(false);
        }
    }

    return (
        <div className="split-container">
            <div className="split-section"
                style={{ backgroundImage: `url(${backgroundImage})` }}>
                <div className="section-title-container">
                    <h2 className="section-title" style={{ fontFamily: "Georgia, serif" }}>Famous Person</h2>
                </div>
                <p className="section-description" style={{ fontFamily: "Helvetica, Arial, sans-serif" }}>
                    Enter a famous person to generate a quest. This will be generated using ChatGPT
                </p>
                <input
                    type="text"
                    placeholder="Enter a famous person"
                    value={Input}
                    onChange={(e) => SetInput(e.target.value)}
                    style={{
                        padding: "10px",
                        borderRadius: "5px",
                        border: "2px solid black",
                        fontSize: "1.2rem",
                        marginBottom: "1rem",
                        width: "30%"
                    }}
                />
                <div style={{ marginBottom: "10px" }}></div>
                {Ret === false ? (
                    <p style={{ color: 'red' }}>{message}</p>
                ) : (
                    message && <p style={{ color: 'limegreen' }}>{message}</p>
                )}
                <button className="quest-button" onClick={handleSubmit}>Submit</button>
            </div>
        </div>
    );
}

export default FamousPerson;