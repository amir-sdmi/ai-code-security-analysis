import React, { useState, useEffect } from 'react';
import axios from 'axios';

function ReservationsList({ onCancelReservation, reservationCanceled }) {
  const [reservations, setReservations] = useState([]);

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const response = await axios.get('/api/reservations');
        setReservations(response.data);
      } catch (error) {
        console.error('Failed to fetch reservations:', error);
      }
    };
    fetchReservations();
  }, [reservationCanceled]); // this was made with chatgpt to fix a error.
  //the error, however, was not fixed and I have no idea how to fix it.
  //it makes it so some reservations cannot be cancelled.
  //I don't know why it happens, but it does

  //this one shows the reservations inside "my reservation"
  return (
    <div>
      <h2 className="reservation-title">My Reservations</h2>
      {reservations.map((reservation) => (
        <div key={reservation._id} className="reservation-card">
          <p>Name: {reservation.name}</p>
          <p>Email: {reservation.email}</p>
          <p>Flight ID: {reservation.flightId}</p>
          <p>Reservation Date: {new Date(reservation.reservationDate).toLocaleDateString()}</p>
          <button onClick={() => onCancelReservation(reservation._id)} className="cancel-button">Cancel This Reservation</button>
        </div>
      ))}
    </div>
  );
}

export default ReservationsList;