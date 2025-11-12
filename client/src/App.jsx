import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";

/**
 * Basic starting structure for the app:
 * - Simple routing (Home, About, SignIn, SignUp)
 * - Header/Footer left commented as optional placeholders
 * - Easy to extend with protected routes / Redux later
 */
export default function App() {
  return (
    <BrowserRouter>
      {/* Optional: add <Header /> here */}
      <Header />
      <Routes>

        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/sign-up" element={<SignUp />} />
        {/* Add more routes here as needed */}
      </Routes>
      {/* Optional: add <Footer /> here */}
      
    </BrowserRouter>
  );
}
