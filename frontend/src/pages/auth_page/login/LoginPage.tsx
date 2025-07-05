import {FormEvent, useEffect, useState} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import LoginRegisterDiv from "../components/LoginRegisterDiv.tsx";
import Input from "../../../components/Input.tsx";
import GoogleButton from "../components/GoogleButton.tsx";
import GitHubButton from "../components/GitHubButton.tsx";
import PasswordInput from "../components/PasswordInput.tsx";
import { patternUsername } from "../../../data/InputPatterns.ts";
import OptionalLoginLane from "../components/OptionalLoginLane.tsx";
import {CircularProgress} from "@mui/material";

export default function LoginPage({} : { darkMode: boolean }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);

    const signupNavigation = () => { navigate("/signup"); };

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const [failedLogin, setFailedLogin] = useState(false);
    const [serverError, setServerError] = useState(false);

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        try {
            setLoading(true);
            const response = await fetch("http://localhost:8000/users/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username: username, password: password }),
                credentials: "include",
            });

            if (response.ok) {
                navigate("/home");
            } else {
                if (response.status === 400) {
                    setFailedLogin(true);
                    console.error("Login failed");
                } else if (response.status === 500) {
                    setServerError(true);
                    console.error("Server error");
                }
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
        //console.table([{"Username": username, "Password": password}]);
    };

    const resetPassword = () => {
        navigate("/passwordreset");
    }

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const error = queryParams.get('error');

        if (error) {
            alert(error);
            navigate('/login', { replace: true });
        }
    }, [location.search, navigate]);

    if (loading) return (
        <LoginRegisterDiv >
            {(darkMode) => (
                <CircularProgress sx={{ color: darkMode? "#ffffff" : "#000000" }}/>
            )}
        </LoginRegisterDiv>
    );
    else return (
        <LoginRegisterDiv >
            {(darkMode) => (
                <div className={"flex flex-col w-full h-full text-center justify-center items-center gap-3 mt-5"}>
                    <div className={"flex flex-col m-6 gap-2"}>
                        <h1>Welcome Back!</h1>
                        <h3 className={"text-xl mt-1 dark:text-secondarydarktext"}>Don't have an account?
                            <button className={"underline text-blue-900 dark:text-secondviolettext hover:scale-[1.01] cursor-pointer"}
                                    onClick={signupNavigation}>
                                <h3 className={"ml-2"}>Sign up</h3>
                            </button>
                        </h3>
                    </div>

                    <form className={"flex flex-col w-full text-center items-center gap-6 mb-4"}
                          onSubmit={handleSubmit}>
                        <Input
                            type={"text"}  placeholder={"Username"} pattern={patternUsername}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                        <PasswordInput
                            placeholderProp={"Password"}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <h3 className={"text-sm -mt-1 dark:text-secondarydarktext"}>Forgot password?
                            <button className={"underline text-blue-900 dark:text-secondviolettext hover:scale-[1.02] cursor-pointer"}
                                    onClick={resetPassword}>
                                <h3 className={"ml-2"}>Reset</h3>
                            </button>
                        </h3>

                        <button className={"logsignButton mt-1"} type={"submit"}>Login</button>
                        {failedLogin && (<p className={"text-red-500"}>Wrong username or password</p>)}
                        {serverError && (<p className={"text-red-500"}>Server Error</p>)}
                    </form>


                    <OptionalLoginLane />

                    <div className={"flex w-full justify-center items-center mt-1 gap-6"}>
                        <GoogleButton/>
                        <GitHubButton darkMode={darkMode}/>
                    </div>
                </div>
            )}
        </LoginRegisterDiv>
    );
}
