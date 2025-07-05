import {ReactNode, useEffect, useState} from "react";
import WbSunnyOutlinedIcon from '@mui/icons-material/WbSunnyOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';

interface LoginRegisterDivProps {
    children: (darkMode: boolean) => ReactNode;
}

export default function LoginRegisterDiv({ children }: LoginRegisterDivProps){
    const [darkMode, setDarkMode] = useState(localStorage.getItem("mode") === "dark");

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        //console.log("Dark mode: ", darkMode);
    }, [darkMode]);

    const toggleDarkMode = () => {
        if (!darkMode) {
            document.documentElement.classList.toggle('dark');
            localStorage.setItem("mode", "dark");
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem("mode", "light");
        }
        setDarkMode(!darkMode);
    };

    return (
        <div className={"flex justify-center items-center w-dvw h-dvh bg-pearlbush dark:bg-[#676279] dark:text-white"}>
            <button className={"absolute m-6 right-0 top-0 w-fit h-fit hover:scale-105 transition-transform duration-200 ease-in-out"}
                    onClick={toggleDarkMode}>
                {!darkMode ? (
                    <DarkModeOutlinedIcon
                        className="animate-[spin_0.5s_ease-in-out] cursor-pointer flip-horizontal"
                        sx={{ fontSize: 36 }}
                    />
                ) : (
                    <WbSunnyOutlinedIcon
                        className="animate-[spin_0.5s_ease-in-out] cursor-pointer"
                        sx={{ fontSize: 36 }}
                    />
                )}
            </button>
            <div className={"flex justify-center items-center bg-white rounded-2xl shadow-ash shadow-lg dark:shadow-sm pb-12 " +
                "w-5/6 min-h-[70vh] h-fit md:w-4/6 md:h-fit lg:w-3/6 lg:h-fit dark:bg-boxviolet"}>
                {children(darkMode)}
            </div>
        </div>
    );
}
