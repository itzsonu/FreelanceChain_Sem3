import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import HomePage from "./pages/HomePage";
import LoginRegister from "./pages/LoginRegister";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ClientDashboard from "./pages/ClientDashboard";
import FreelancerDashboard from "./pages/FreelancerDashboard";
import MilestoneChain from "./pages/MilestoneChain";
import WorkroomInbox from "./pages/WorkroomInbox";
import FreelancerProfile from "./pages/FreelancerProfile";
import TalentDirectory from "./pages/TalentDirectory";
import PublicJob from "./pages/PublicJob";
import TalentProfile from "./pages/TalentProfile";
import ProtectedRoute from "./ProtectedRoute";

import "./App.css";
import "./Phase3.css";
import "./Phase4.css";
import "./Phase5.css";
import "./Phase7.css";
import "./Phase8.css";
import "./Phase9.css";
import "./Phase10.css";
import "./Phase12.css";
import "./Phase14.css";
import "./Phase16.css";
import "./Marketplace.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/jobs/:projectId" element={<PublicJob />} />

        <Route path="/login" element={<LoginRegister />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route
          path="/client-dashboard"
          element={
            <ProtectedRoute allowedRole="client">
              <ClientDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/freelancer-dashboard"
          element={
            <ProtectedRoute allowedRole="freelancer">
              <FreelancerDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/profile" element={<ProtectedRoute allowedRole="freelancer"><FreelancerProfile /></ProtectedRoute>} />
        <Route path="/talent" element={<ProtectedRoute allowedRole="client"><TalentDirectory /></ProtectedRoute>} />
        <Route path="/talent/:freelancerId" element={<ProtectedRoute allowedRole="client"><TalentProfile /></ProtectedRoute>} />
        <Route path="/workrooms" element={<ProtectedRoute><WorkroomInbox /></ProtectedRoute>} />

        <Route
          path="/milestones/:projectId"
          element={
            <ProtectedRoute>
              <MilestoneChain />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </Router>
  );
}

export default App;
