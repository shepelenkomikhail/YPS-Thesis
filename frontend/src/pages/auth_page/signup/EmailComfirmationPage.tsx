import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import LoginRegisterDiv from "../components/LoginRegisterDiv.tsx";
import Input from "../../../components/Input.tsx";
import {CircularProgress} from "@mui/material";

export default function RegistrationPage({} : {darkMode: boolean}) {
    const navigate = useNavigate();
    const registerNavigation = () => { navigate("/signup"); };
    const [loading, setLoading] = useState(false);

    const [code, setCode] = useState("");
    const [failedSignup, setFailedSignup] = useState(false);

    const handleVerification = async (event: FormEvent) => {
        event.preventDefault();
        const email = localStorage.getItem("email");
        //console.log(email, code);

        try {
            setLoading(true);
            const response = await fetch("http://localhost:8000/users/verification", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, code }),
                credentials: "include",
            });

            if (response.ok) {
                localStorage.removeItem("email");
                navigate("/home");
            } else {
                if (response.status === 400) {
                    const errorData = await response.json();
                    console.error(errorData.message);
                    setFailedSignup(true);
                } else if (response.status === 500) {
                    const errorData = await response.json();
                    console.error(errorData.message);
                    setFailedSignup(false);
                }
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
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
                <div className={"flex flex-col w-full h-fit text-center items-center gap-1 mt-5"}>
                    <div className={"m-4 mt-6 mb-6"}>
                        <h1>Verify Email</h1>
                        <h3 className={"text-xl mt-2 dark:text-secondarydarktext font-extralight"}>Anything wrong?
                            <button className={"underline text-blue-900 dark:text-secondviolettext hover:scale-[1.01]"}
                                    onClick={registerNavigation}>
                                <h3 className={"ml-2 cursor-pointer"}>Back</h3>
                            </button>
                        </h3>
                    </div>

                    <form className={"flex flex-col w-full text-center items-center gap-6 mt-4"} onSubmit={handleVerification}>
                        <div className={"flex flex-row justify-center w-9/12 2xl:w-1/2 gap-4"}>
                            <Input type={"verification"} onChange={(e) => setCode(e.target.value)}
                                   placeholder={"Code from email"}/>
                        </div>
                        <button className={"logsignButton mt-3"} type={"submit"}>Confirm</button>
                        <span>
                            {failedSignup && <p className={`${darkMode ? "text-red-400" : "text-red-500"}`}>Code is wrong!</p>}
                        </span>
                    </form>
                </div>
            )}
        </LoginRegisterDiv>
    );
}