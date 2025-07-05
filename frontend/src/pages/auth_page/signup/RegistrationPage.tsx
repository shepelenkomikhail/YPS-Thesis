import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import LoginRegisterDiv from "../components/LoginRegisterDiv.tsx";
import Input from "../../../components/Input.tsx";
import GoogleButton from "../components/GoogleButton.tsx";
import GitHubButton from "../components/GitHubButton.tsx";
import PasswordInput from "../components/PasswordInput.tsx";
import { patternLetters, patternEmail, patternUsername } from "../../../data/InputPatterns.ts";
import OptionalLoginLane from "../components/OptionalLoginLane.tsx";
import {CircularProgress} from "@mui/material";

export default function RegistrationPage({} : {darkMode: boolean}) {
    const navigate = useNavigate();
    const loginNavigation = () => { navigate("/login"); };
    const [loading, setLoading] = useState(false);

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [repeatPassword, setRepeatPassword] = useState("");

    const [failedSignup, setFailedSignup] = useState(false);
    const [serverError, setServerError] = useState(false);
    const [passwordNotMatch, setPasswordNotMatch] = useState(false);

    const checkPasswords = (password: string, password2: string) => {
        const check = password === password2;
        check ? setPasswordNotMatch(false) : setPasswordNotMatch(true);
        return check;
    }
    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();

        if (!checkPasswords(password, repeatPassword)) {
            console.error("Passwords do not match");
            return;
        }

        try {
            setLoading(true);
            const response = await fetch("http://localhost:8000/users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ firstName, lastName, username, email, password }),
                credentials: "include",
            });

            if (response.ok) {
                localStorage.setItem("email", email);
                navigate("/verification");
            } else {
                if (response.status === 400) {
                    const errorData = await response.json();
                    console.error(errorData.message);
                    setFailedSignup(true);
                    setServerError(false);
                } else if (response.status === 500) {
                    const errorData = await response.json();
                    console.error(errorData.message);
                    setServerError(true);
                    setFailedSignup(false);
                }
            }
        } catch (error) {
            console.error("Error:", error);
        }
        finally {
            setLoading(false);
        }

        // console.table([{
        //     "First name": firstName,
        //     "Last name": lastName,
        //     "Username": username,
        //     "Email": email,
        //     "Password": password
        // }]);
    };

    if (loading) return (
        <LoginRegisterDiv >
            {(darkMode) => (
                <CircularProgress sx={{ color: darkMode? "#ffffff" : "#000000" }}/>
            )}
        </LoginRegisterDiv>
    );
    else return (
        <LoginRegisterDiv>
            {(darkMode) => (
                <div className={"flex flex-col w-full h-fit text-center justify-center items-center gap-1 mt-5"}>
                    <div className={"m-4 mt-6 mb-6"}>
                        <h1>Create an account</h1>
                        <h3 className={"text-xl mt-2 dark:text-secondarydarktext font-extralight"}>Already have an account?
                            <button className={"underline text-blue-900 dark:text-secondviolettext hover:scale-[1.01]"}
                                    onClick={loginNavigation}>
                                <h3 className={"ml-2 cursor-pointer"}>Login</h3>
                            </button>
                        </h3>
                    </div>

                    <form className={"flex flex-col w-full text-center items-center gap-6 mb-6"} onSubmit={handleSubmit}>
                        <div className={"flex flex-row justify-between w-9/12 2xl:w-1/2 gap-4"}>
                            <Input type={"name"} onChange={(e) => setFirstName(e.target.value)}
                                   placeholder={"First name"} pattern={patternLetters}/>
                            <Input type={"name"} onChange={(e) => setLastName(e.target.value)} placeholder={"Last name"}
                                   pattern={patternLetters}/>
                        </div>

                        <Input type={"text"} onChange={(e) => setUsername(e.target.value)} placeholder={"Username"}
                               pattern={patternUsername}/>

                        <Input type={"email"} onChange={(e) => setEmail(e.target.value)} placeholder={"Email"}
                               pattern={patternEmail}/>

                        <div className={"flex flex-col lg:flex-row items-center justify-center md:justify-between w-full lg:w-9/12 2xl:w-1/2 gap-6 my-3"}>
                            <PasswordInput placeholderProp={"Password"} onChange={(e) => setPassword(e.target.value)}/>
                            <PasswordInput placeholderProp={"Repeat password"}
                                           onChange={(e) => {
                                               setRepeatPassword(e.target.value);
                                               checkPasswords(password, e.target.value);
                                           }}/>
                        </div>
                        {passwordNotMatch && <p className={"text-red-500 mt-2"}>Passwords do not match!</p>}

                        <button className={"logsignButton"} type={"submit"}>Sign up</button>
                        <span>
                            {failedSignup && <p className={"text-red-500"}>User already exists!</p>}
                            {serverError && <p className={"text-red-500"}>Server error!</p>}
                        </span>
                    </form>

                    <OptionalLoginLane/>

                    <div className={"flex w-full justify-center items-center mt-1 gap-6"}>
                        <GoogleButton/>
                        <GitHubButton darkMode={darkMode}/>
                    </div>
                </div>
            )}
        </LoginRegisterDiv>
    );
}