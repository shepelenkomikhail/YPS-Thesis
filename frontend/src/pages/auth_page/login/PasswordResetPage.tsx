import {FormEvent, useEffect, useState} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import LoginRegisterDiv from "../components/LoginRegisterDiv.tsx";
import Input from "../../../components/Input.tsx";
import GoogleButton from "../components/GoogleButton.tsx";
import GitHubButton from "../components/GitHubButton.tsx";
import PasswordInput from "../components/PasswordInput.tsx";
import {patternEmail} from "../../../data/InputPatterns.ts";
import OptionalLoginLane from "../components/OptionalLoginLane.tsx";
import {Alert, CircularProgress, Snackbar} from "@mui/material";

export default function LoginPage({} : { darkMode: boolean }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [codeSuccess, setCodeSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const loginNavigation = () => { navigate("/login"); };

    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [password, setPassword] = useState("");
    const [passwordRepeat, setPasswordRepeat] = useState("");

    const [failedLogin, setFailedLogin] = useState(false);
    const [passwordNotMatch, setPasswordNotMatch] = useState(false);
    const [serverError, setServerError] = useState(false);

    const [credentials, setCredentials] = useState(true);

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setPasswordNotMatch(false);

        if (password !== passwordRepeat) {
            setPasswordNotMatch(true);
            return;
        }

        setCredentials(false)

        try {
            setLoading(true);

            const response = await fetch("http://localhost:8000/users/verifypassword", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email: email, password: password }),
                credentials: "include",
            });

            if (response.ok) {
                setCredentials(false);
            } else {
                if (response.status === 400) {
                    setFailedLogin(true);
                    setErrorMessage("Invalid code or email.");
                    console.error("Login failed");
                } else if (response.status === 500) {
                    setServerError(true);
                    setErrorMessage("Invalid code or email.");
                    console.error("Server error");
                }
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCodeCheck = async (event: FormEvent) => {
        event.preventDefault();
        setLoading(true);
        try {
            const response = await fetch("http://localhost:8000/users/verifypasswordreset", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email: email, code: code }),
                credentials: "include",
            });

            if (response.ok) {
                setCodeSuccess(true);
                setTimeout(() => navigate("/login"), 2000);
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
        <>
            <LoginRegisterDiv >
                {(darkMode) => (
                    <div className={"flex flex-col w-full h-full text-center justify-center items-center gap-3 mt-5"}>
                        <div className={"flex flex-col m-6 gap-2"}>
                            <h1>Reset your password</h1>
                            <h3 className={"text-xl mt-1 dark:text-secondarydarktext"}>Come back
                                <button className={"underline text-blue-900 dark:text-secondviolettext hover:scale-[1.01] cursor-pointer"}
                                        onClick={loginNavigation}>
                                    <h3 className={"ml-2"}>Login page</h3>
                                </button>
                            </h3>
                        </div>

                        {credentials ? (
                            <form className={"flex flex-col w-full text-center items-center gap-6 mb-4"}
                                  onSubmit={handleSubmit}>
                                <Input
                                    type={"email"}  placeholder={"Email"} pattern={patternEmail}  value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <PasswordInput
                                    placeholderProp={"Password"}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <PasswordInput
                                    placeholderProp={"Repeat password"}
                                    onChange={(e) => setPasswordRepeat(e.target.value)}
                                />

                                <button className={"logsignButton mt-3"} type={"submit"}>Reset</button>
                                {failedLogin && (<p className={"text-red-500"}>Wrong Email</p>)}
                                {serverError && (<p className={"text-red-500"}>Server Error</p>)}
                                {passwordNotMatch && (<p className={"text-red-500"}>Passwords do not match</p>)}
                            </form>
                        ) : (
                            <form className={"flex flex-col w-full text-center items-center gap-6 mb-4"}
                                  onSubmit={handleCodeCheck}>
                                <Input
                                    type={"code"}  placeholder={"Code from email"} value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                />

                                <button className={"logsignButton mt-3"} type={"submit"}>Check code</button>
                                {failedLogin && (<p className={"text-red-500"}>Wrong Code</p>)}
                                {serverError && (<p className={"text-red-500"}>Server Error</p>)}
                            </form>
                        )}

                        <OptionalLoginLane />

                        <div className={"flex w-full justify-center items-center mt-1 gap-6"}>
                            <GoogleButton/>
                            <GitHubButton darkMode={darkMode}/>
                        </div>
                    </div>
                )}
            </LoginRegisterDiv>

            <Snackbar open={codeSuccess} autoHideDuration={2000}  anchorOrigin={{ vertical: 'top', horizontal: 'left' }}>
                <Alert severity="success" sx={{ width: '100%' }}>
                    Code verified! Redirecting to login...
                </Alert>
            </Snackbar>

            <Snackbar
                open={!!errorMessage}
                autoHideDuration={2000}
                onClose={() => setErrorMessage("")}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={() => setErrorMessage("")} severity="error" sx={{ width: '100%' }}>
                    {errorMessage}
                </Alert>
            </Snackbar>
        </>
    );
}
