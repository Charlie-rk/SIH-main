import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Dashboard from "./pages/DashBoard";
import OfficersPage from "./pages/OfficersPage";
import RecognitionsPage from "./pages/RecognitionsPage";
import AdminPage from "./pages/AdminPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import GeoAnalyticsPage from "./pages/GeoAnalyticsPage";
import GemApp from "./pages/GemApp";

// Temporary Analytics placeholder (avoid undefined route error)

/**
 * App with Quick Navigation Bar for testing routes.
 */
export default function App() {
  return (
    <BrowserRouter>
      {/* Optional Header */}
      {/* <Header /> */}

      {/* ✅ Quick Navigation Bar for Testing */}
      <nav className="flex flex-wrap gap-3 justify-center bg-slate-100 py-4 shadow-sm">
        {[
          { path: "/sign-in", label: "Sign In" },
          { path: "/sign-up", label: "Sign Up" },
          { path: "/dash", label: "Dashboard" },
          { path: "/officer", label: "Officers" },
          { path: "/recognize", label: "Recognitions" },
          { path: "/admin", label: "Admin" },
          { path: "/analytics", label: "Analytics" },
          { path: "/map", label: "GeoAnalytic" },
          { path: "/gemapp", label: "GemApp" },
        ].map((btn) => (
          <Link
            key={btn.path}
            to={btn.path}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            {btn.label}
          </Link>
        ))}
      </nav>

      {/* ✅ Page Routes */}
      <Routes>
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/dash" element={<Dashboard />} />
        <Route path="/officer" element={<OfficersPage />} />
        <Route path="/recognize" element={<RecognitionsPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/map" element={<GeoAnalyticsPage />} />
        <Route path="/gemapp" element={<GemApp />} />

      </Routes>

      {/* Optional Footer */}
      <Footer />
    </BrowserRouter>
  );
}
