// By: Tomas Smitas
// Date: 2024
// Development: Assisted by chatGPT

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css';
import githubLogo from './images/github.png';
import linkedInLogo from './images/linkedIn.png';
import siteSafeLogo from './images/SiteSafeLogo.png';
import NoHelmet from './images/1NoHelmet.jpg';
import Main from "./Main";
import Login from "./Login";
import Register from "./Register";
import AddUser from "./AddUser";
import ChangeSettings from './ChangeSettings.js';
import ManageUsers from "./ManageUsers.js";
import Detections from "./Detections.js"
import PrivateRoute from "./PrivateRoute";
import AdminRoute from './AdminRoute.js';

function App() {

  return (
		<BrowserRouter>
			<Routes>
				{/* Public Routes */}
				<Route path="/" element={<Login />} />
				<Route path="register" element={<Register />} />

				{/* Protected Routes */}
				<Route
					path="main"
					element={
						<PrivateRoute>
							<Main />
						</PrivateRoute>
					}
				/>
				<Route
					path="changeSettings"
					element={
						<PrivateRoute>
							<ChangeSettings />
						</PrivateRoute>
					}
				/>
				<Route
					path="detections"
					element={
						<PrivateRoute>
							<Detections />
						</PrivateRoute>
					}
				/>
				<Route
					path="addUser"
					element={
						<AdminRoute>
							<AddUser />
						</AdminRoute>
					}
				/>
				<Route
					path="manageUsers"
					element={
						<AdminRoute>
							<ManageUsers />
						</AdminRoute>
					}
				/>
			</Routes>
		</BrowserRouter>
  );
}

export default App;