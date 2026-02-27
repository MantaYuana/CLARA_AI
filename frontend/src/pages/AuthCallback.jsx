import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    try {
      const token = searchParams.get("token");

      console.log("URL:", window.location.href);
      console.log("TOKEN:", token);

      if (!token) {
        console.log("No token found");
        navigate("/auth", { replace: true });
        return;
      }

      console.log("Saving token...");
      localStorage.setItem("token", token);

      console.log("Saved token:", localStorage.getItem("token"));

      // delay sedikit supaya tidak bentrok
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 100);
    } catch (error) {
      console.error("AUTH CALLBACK ERROR:", error);
    }
  }, [searchParams, navigate]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-lg">Logging you in...</p>
    </div>
  );
}
