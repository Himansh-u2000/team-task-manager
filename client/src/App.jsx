import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { checkAuth } from "./store/authSlice";
import { Toaster } from "react-hot-toast";

import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout/Layout";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import MyTasks from "./pages/MyTasks";
import Team from "./pages/Team";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";

export default function App() {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8f6f3]">
        <div className="w-8 h-8 border-2 border-[#2d2d2d] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Protected */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:id" element={<ProjectDetail />} />
        <Route path="tasks" element={<MyTasks />} />
        <Route path="team" element={<Team />} />
        <Route path="profile" element={<Profile />} />

        <Route
          path="admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Admin />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#f8f6f3] gap-3">
          <h1 className="text-[48px] font-bold text-[#2d2d2d]">404</h1>
          <p className="text-[14px] text-[#888]">Page not found</p>
          <a href="/" className="text-[13px] text-[#2d2d2d] underline hover:no-underline">Go back home</a>
        </div>
      } />
      </Routes>
    </>
  );
}