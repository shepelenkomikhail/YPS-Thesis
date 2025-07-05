import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {CircularProgress} from "@mui/material";

export default function CallbackPage() {
    const navigate = useNavigate();
    const [, setLoading] = useState(true);
    const mode: string|null = localStorage.getItem("mode");

    useEffect(() => {
        const checkAuth = async () => {
            try {
                await new Promise(resolve => setTimeout(resolve, 1000));

                console.log("Checking authentication...");
                const response = await fetch("http://localhost:8000/auth/me", {credentials: "include"});

                console.log("Response status:", response.status);
                if (response.ok) {
                    console.log("User is authenticated");
                    console.log(response);
                    navigate("/home");
                } else {
                    console.log("User is not authenticated");
                    navigate("/login");
                }
            } catch (error) {
                console.error("Authentication check failed:", error);
                navigate("/login");
            } finally {
                setLoading(false);
            }
        };

        checkAuth().then();
    }, [navigate]);

     return (
        <div className={`flex h-[100vh] items-center justify-center ${mode === "dark" ? "bg-[#676279]" : "bg-pearlbush"}`}>
            <CircularProgress sx={{ color: mode === "dark" ? "#ffffff" : "#000000" }}/>
        </div>
    );
}
