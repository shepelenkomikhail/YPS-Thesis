import { Button } from "@mui/material";
import Widgets from "./customization/widgets/Widgets.tsx";
import Backgrounds from "./customization/bg/Backgrounds.tsx";
import Profile from "./profile/Profile.tsx";
import Clock from "./clock_date/Clock.tsx";
import WbSunnyOutlinedIcon from '@mui/icons-material/WbSunnyOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import {useEffect, useRef, useState} from "react";
import MenuIcon from '@mui/icons-material/Menu';

export default function Header({ headerHeight, handleTheme, onAddWidget, activeWidgets, removeWidget }: { headerHeight: number, handleTheme: () => void, onAddWidget: (widget: string) => void, activeWidgets: string[], removeWidget: (widget: string) => void }) {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    const menuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        setIsDarkMode(localStorage.getItem('mode') === 'dark');
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth <= 700);
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);

        return () => {
            window.removeEventListener('resize', checkScreenSize);
        };
    }, []);

    const handleThemeToggle = () => {
        handleTheme();
        setIsDarkMode(prev => !prev);
    };


    return (
        <div className="relative w-full lg:pb-1">
            {/* Background layer with opacity */}
            <div className={`absolute inset-0 opacity-50 ${isDarkMode ? "bg-[#242424]" : "bg-amber-50"} z-0`}></div>

            {/* Header */}
            <header className={`relative flex w-full justify-between ${isMobile ? "px-2" : "px-4 md:px-12"} h-[${headerHeight}px] z-10`}>
                {/* Left section */}
                <div className="flex p-4 gap-4">
                    {/* Mobile menu button  */}
                    <button
                        className={`${isMobile ? "block" : "hidden"} text-current`}
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        <MenuIcon style={{ color: isDarkMode ? '#fff' : '#000' }} />
                    </button>

                    {/* Desktop buttons  */}
                    <div className={`${isMobile ? "hidden" : "flex"} gap-4`}>
                        <Widgets onAddWidget={onAddWidget} darkmode={isDarkMode} activeWidgets={activeWidgets}  removeWidget={removeWidget}/>
                        <Backgrounds darkmode={isDarkMode} />
                    </div>
                </div>

                {/* Clock */}
                <div className="flex p-4 lg:p-1">
                    <Clock darkmode={isDarkMode} />
                </div>

                {/* Right section */}
                <div className="flex p-4 gap-4">
                    {/* Desktop profile */}
                    <div className={`${isMobile ? "hidden" : "block"}`}>
                        <Profile darkmode={isDarkMode} />
                    </div>
                    <Button
                        variant="contained"
                        className="h-8 font-bold transition-all duration-300"
                        onClick={handleThemeToggle}
                        sx={{
                            minWidth: 64,
                            '& .MuiSvgIcon-root': {
                                transition: 'transform 0.3s ease-in-out',
                                fontSize: '1.5rem'
                            },
                            backgroundColor: isDarkMode ? "#5e4c7f" : "#7e59a2",
                            '&:hover': { backgroundColor: '#7e59a2' },
                        }}
                    >
                        {isDarkMode ? (
                            <WbSunnyOutlinedIcon className="animate-[spin_0.5s_ease-in-out]" />
                        ) : (
                            <DarkModeOutlinedIcon className="animate-[spin_0.5s_ease-in-out]" />
                        )}
                    </Button>
                </div>
            </header>

            {/* Mobile menu  */}
            {isMenuOpen && isMobile && (
                <div
                    ref={menuRef}
                    className={`absolute left-0 right-0 top-full z-20 opacity-95 p-4 transition-all duration-300 ease-in-out transform
                    ${isDarkMode ? 'bg-[#242424]' : 'bg-amber-50'}  ${isMenuOpen ? 'animate-slide-down' : 'animate-slide-up'}`}
                >
                    <div className="flex flex-col gap-4">
                        <Widgets onAddWidget={onAddWidget} darkmode={isDarkMode} activeWidgets={activeWidgets} removeWidget={removeWidget}/>
                        <Backgrounds darkmode={isDarkMode} />
                        <Profile darkmode={isDarkMode} />
                    </div>
                </div>
            )}
        </div>
    );
}