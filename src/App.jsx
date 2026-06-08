import { useEffect } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AppRoutes from "./routes";
import { useAuthStore } from "./store/authStore";

function App() {
  useEffect(() => {
    useAuthStore.getState().hydrateAuth();
  }, []);

  return (
    <>
      <AppRoutes />
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}

export default App;
