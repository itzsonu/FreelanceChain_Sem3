import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { currentUser } from "./api";

export default function ProtectedRoute({ children, allowedRole }) {
  const [expired, setExpired] = useState(false);
  useEffect(() => {
    const onExpired = () => setExpired(true);
    window.addEventListener("freelancechain:session-expired", onExpired);
    return () => window.removeEventListener("freelancechain:session-expired", onExpired);
  }, []);
  const token = localStorage.getItem("token");
  const user = currentUser();

  if (!token || !user) {
    return <Navigate to={expired ? "/login?session=expired" : "/login"} replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}
