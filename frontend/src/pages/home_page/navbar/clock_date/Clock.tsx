import {useEffect, useState} from "react";

export default function Clock({darkmode}: {darkmode: boolean}) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isSmallScreen, setIsSmallScreen] = useState(false);

    useEffect(() => {
        const timerID = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        const checkScreenSize = () => {
            setIsSmallScreen(window.innerWidth < 1024);
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);

        return () => {
            clearInterval(timerID);
            window.removeEventListener('resize', checkScreenSize);
        };
    }, []);

    const timeString = currentTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });

    const fullTimeString = currentTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });

    const dateString = currentTime.toLocaleDateString('en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });

    return (
        <div className={`absolute left-1/2 -translate-x-1/2 flex items-center justify-center flex-col
                            ${darkmode ? "bg-[#5e4c7f]" : "bg-[#7e59a2]"} p-2 rounded-md h-8 lg:h-5/6 lg:min-w-52`}>
            <div className="text-2xl font-bold text-white drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]">
                {isSmallScreen ? timeString : fullTimeString}
            </div>
            {!isSmallScreen && (
                <div className="text-sm text-white">
                    {dateString}
                </div>
            )}
        </div>
    );
}