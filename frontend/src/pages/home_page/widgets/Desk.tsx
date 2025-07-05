import GridLayout from "react-grid-layout";
import { useState, useEffect } from "react";
import Notes from "./notes/Notes.tsx";
import Weather from "./weather/Weather.tsx";
import Calendar from "./calendar/Calendar.tsx";
import News from "./news/News.tsx";
import Chats from "./chats/Chats.tsx";
import opencage from "opencage-api-client";
import {CustomSnackbar, useSnackbar} from "../../../components/CustomSnackbar.tsx";

export default function Desk({headerHeight, activeWidgets, layout, setLayout, removeWidget}: {
    headerHeight: number; activeWidgets: string[]; layout: any[]; removeWidget: (widget: string) => void; setLayout: (layout: any[]) => void;}) {
    const [screenWidth, setScreenWidth] = useState(window.innerWidth);
    const [screenHeight, setScreenHeight] = useState(window.innerHeight - headerHeight - 40);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<GeolocationPositionError | null | unknown>(null);
    const [city, setCity] = useState<string | null>(null);
    const [countryCode, setCountryCode] = useState<string>("");
    const [coords, setCoords] = useState<{ latitude: number, longitude: number }>({ latitude: 0, longitude: 0 });
    const { showSnackbar, snackbarOpen, snackbarMessage, snackbarSeverity, handleClose: handleSnackbarClose } = useSnackbar();
    const [apiKey, setApiKey] = useState<string | null>(null);
    const DEFAULT_COORDS = {latitude: 51.5074, longitude: -0.1278};
    const DEFAULT_CITY = "London";
    const DEFAULT_COUNTRY_CODE = "GB";

    // Resize event listener
    useEffect(() => {
        const handleResize = () => {
            setScreenWidth(window.innerWidth);
            setScreenHeight(window.innerHeight - headerHeight - 40);
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [headerHeight]);

    // Get user's location
    // Fetch API key on mount
    useEffect(() => {
        const fetchApiKey = async () => {
            try {
                //console.log("fetch api key");
                const apiKeyResponse = await fetch('http://localhost:8000/coordinates/apikey', { credentials: "include" });
                if (!apiKeyResponse.ok) console.error('Failed to fetch API key');
                const { apiKey } = await apiKeyResponse.json();
                setApiKey(apiKey);
                //console.log(apiKey, "api key");
            } catch (error) {
                console.error('API key fetch error:', error);
                showSnackbar("Failed to load location services", "error");
            }
        };
        fetchApiKey().then();
    }, []);

    // Get user's location once API key is ready
    useEffect(() => {
        const fetchCoords = async () => {
            if (!apiKey) return;
            //console.log("getting coords");
            setLoading(true);

            try {
                const position = await Promise.race<GeolocationPosition>([
                    new Promise((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, {
                            enableHighAccuracy: true,
                            maximumAge: 15000,
                        });
                    }),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Geolocation timeout')), 5000))
                ]);

                const { latitude, longitude } = position.coords;
                //console.log("latitude", latitude);
                setCoords({ latitude, longitude });

                const response = await opencage.geocode({
                    q: `${latitude},${longitude}`,
                    key: apiKey,
                    language: 'en',
                });

                if (response.status.code === 200) {
                    const components = response.results[0].components;
                    setCity(components.city || components.town || components.village);
                    setCountryCode(components.country_code.toUpperCase());
                } else {
                    console.error(response.status.message);
                    setCoords(DEFAULT_COORDS);
                    setCity(DEFAULT_CITY);
                    setCountryCode(DEFAULT_COUNTRY_CODE);
                }
            } catch (error) {
                console.error('Geolocation error:', error);
                setError(error);
                setCoords(DEFAULT_COORDS);
                setCity(DEFAULT_CITY);
                setCountryCode(DEFAULT_COUNTRY_CODE);
            } finally {
                setLoading(false);
            }
        };

        if (apiKey) fetchCoords().then();
    }, [apiKey]);

    // Get coordinates from city
    useEffect(() => {
        if (!city || city.trim() === "") return;

        const fetchCoordsFromCity = async () => {
            if(!apiKey) return;
            try {
                const response = await opencage.geocode({ q: city, key: apiKey, language: 'en' });
                //console.log(response.total_results, "response");
                if(response.total_results !== 0 ){
                    if (response.status.code === 200 && response.results.length > 0) {
                        const { lat, lng } = response.results[0].geometry;
                        //console.log("NEW NEW NEW lat", lat, lng);
                        setCoords({ latitude: lat, longitude: lng });
                    }
                }
            } catch (error) {
                console.error("City geocoding error:", error);
                showSnackbar("Failed to fetch coordinates for city", "error");
                setCoords(DEFAULT_COORDS);
                setCity(DEFAULT_CITY);
                setCountryCode(DEFAULT_COUNTRY_CODE);
            }
        };

        fetchCoordsFromCity().then();
    }, [city]);

    // Update layout
    const handleLayoutChange = (newLayout: any[]) => {setLayout(newLayout);};

    //if(loading) console.log("Loading...");
    if(error) console.error("Error:", error);

    return (
        <>
            <GridLayout
                className="layout"
                layout={layout}
                cols={screenWidth < 640 ? 2 : (screenWidth < 768 ? 4 : 8)}
                rowHeight={screenHeight / 3}
                width={screenWidth}
                maxRows={3}
                compactType={null}
                isResizable={screenWidth >= 768}
                isDraggable={screenWidth >= 768}
                preventCollision={true}
                useCSSTransforms={true}
                resizeHandles={['se', 'nw']}
                onLayoutChange={handleLayoutChange}
            >
                {activeWidgets.map((widget) => (
                    <div key={widget} className="w-full h-full flex justify-center items-center relative">
                        {widget === "notes" && <Notes onRemove={() => removeWidget("notes")} />}
                        {widget === "weather" && coords.latitude !== 0 && coords.longitude !== 0 &&
                            <Weather onRemove={() => removeWidget("weather")} loadingDesk={loading} setCity={setCity}
                                                          latitude={coords.latitude} longitude={coords.longitude} city={city} />}
                        {widget === "calendar" && <Calendar onRemove={() => removeWidget("calendar")} />}
                        {widget === "news" && <News onRemove={() => removeWidget("news")} countryCode={countryCode} loadingDesk={loading} />}
                        {widget === "chats" && <Chats onRemove={() => removeWidget("chats")} />}
                    </div>
                ))}
            </GridLayout>
            <CustomSnackbar
                open={snackbarOpen}
                message={snackbarMessage}
                severity={snackbarSeverity}
                onClose={handleSnackbarClose}
            />
        </>
    );
}