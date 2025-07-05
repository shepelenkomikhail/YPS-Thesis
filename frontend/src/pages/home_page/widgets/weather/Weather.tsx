import RemoveWidgetButton from "../components/RemoveWidgetButton.tsx";
import {useEffect, useState} from "react";
import {format} from "date-fns";
import WeatherDataType from "../../../../data/types/WeatherDataType.ts";
import {CustomSnackbar, useSnackbar} from "../../../../components/CustomSnackbar.tsx";
import WidgetLoading from "../components/WidgetLoading.tsx";
import WidgetError from "../components/WidgetError.tsx";
import WeatherCard from "./WeatherCard.tsx";


export default function Weather({ onRemove, latitude, longitude, loadingDesk, city, setCity }:
                                { onRemove: () => void, latitude: number, longitude: number, loadingDesk: boolean, city: string|null, setCity: (city: string) => void }) {
    const mode: string|null = localStorage.getItem("mode");
    const { showSnackbar, snackbarOpen, snackbarMessage, snackbarSeverity, handleClose: handleSnackbarClose } = useSnackbar();

    const [data, setData] = useState<WeatherDataType | null>(null);
    const [loading, setLoading] = useState(loadingDesk);
    const [error, setError] = useState<GeolocationPositionError | null | unknown>("");
    const [date] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
    const endDate: string = format(new Date(), 'yyyy-MM-dd').split('-').map((el, i) => i === 2 ? (parseInt(el) + 1).toString() : el).join('-');
    const [loadWeather, setLoadWeather] = useState(true);

    // Reset loadWeather when coordinates change
    useEffect(() => {
        setLoadWeather(true);
    }, [latitude, longitude]);

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;
        if (latitude === 0 && longitude === 0) return;

        const fetchData = async () => {
            try {
                //console.log(`Latitude: ${latitude} °, Longitude: ${longitude} ° WEATHER`);
                const weatherResponse = await
                    fetch(`http://localhost:8000/weather?lat=${latitude}&lon=${longitude}&startDate=${date}&endDate=${endDate}`, {
                        credentials: "include"
                    });
                if (!weatherResponse.ok) {
                    console.error("Error fetching weather");
                    showSnackbar("Failed to load weather data", "error");
                }
                const data: WeatherDataType = await weatherResponse.json();
                setData(data);
                setLoading(false);
            } catch (fetchError) {
                setError(fetchError);
                setLoading(false);
                showSnackbar("Failed to load weather data", "error");
            }
        }

        timeoutId = setTimeout(() => {
            if (loadWeather) {
                fetchData().then();
                setLoadWeather(false);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [longitude, latitude, loadWeather]);

    //console.log(city);

    return (
        <>
            {loading && <WidgetLoading mode={mode === "dark" ? "dark" : "light"} />}
            {error ? (<WidgetError error={error.toString()} mode={mode === "dark" ? "dark" : "light"} onRemove={onRemove} />) :(
                <div className={`relative ${mode == "dark" ? "bg-cyan-800" : "bg-cyan-100"} w-full h-full rounded-lg ${mode == "dark" ? "text-gray-200" : "text-black" }`}>
                    <WeatherCard data={data} city={city} mode={mode === "dark" ? "dark" : "light"} setCity={setCity} />
                    <RemoveWidgetButton onRemove={onRemove} darkMode={mode === "dark"} />
                </div>
            )}


            <CustomSnackbar
                open={snackbarOpen}
                message={snackbarMessage}
                severity={snackbarSeverity}
                onClose={handleSnackbarClose}
            />
        </>
    );
}