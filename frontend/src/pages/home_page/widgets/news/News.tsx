import React, { useEffect, useRef, useState, useCallback } from "react";
import { Card, CardContent, Typography, IconButton, CircularProgress } from "@mui/material";
import RemoveWidgetButton from "../components/RemoveWidgetButton.tsx";
import RefreshIcon from '@mui/icons-material/Refresh';
import {CustomSnackbar, useSnackbar} from "../../../../components/CustomSnackbar.tsx";
import WidgetLoading from "../components/WidgetLoading.tsx";
import WidgetError from "../components/WidgetError.tsx";
import useResizeObserver from "../components/useResizeObserver.tsx";

const getRandomArticle = (articles: any[]) =>
    articles[Math.floor(Math.random() * articles.length)];

export default function NewsWidget({ onRemove, countryCode, loadingDesk }: { onRemove: () => void, countryCode: string, loadingDesk: boolean }) {
    const mode = localStorage.getItem("mode");
    const [currentArticle, setCurrentArticle] = useState<any>(null);
    const [loading, setLoading] = useState(loadingDesk);
    const [error, setError] = useState("");
    const [lastFetchedTime, setLastFetchedTime] = useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const { showSnackbar, snackbarOpen, snackbarMessage, snackbarSeverity, handleClose: handleSnackbarClose } = useSnackbar();
    const componentWidth = useResizeObserver(containerRef);
    const isSmallWidth: boolean = componentWidth < 400;

    // Get news
    const fetchNews = useCallback(async (countryCode: string) => {
        if(!countryCode) return;

        try {
            const response = await fetch("http://localhost:8000/news/get-news", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ location: countryCode }),
                credentials: "include",
            });

            if (!response.ok) {
                console.error("API request failed with status", response.status);
                showSnackbar("Failed to load news", "error");
            }
            const data = await response.json();

            if (!data.results?.length){
                console.error("No articles found");
                showSnackbar("No articles found", "error");
            }

            return data.results;
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load news");
            showSnackbar("Failed to load news", "error");
            return null;
        }
    }, [countryCode]);

    // Geolocation and data loading
    useEffect(() => {
        const loadData = async () => {
            try {
                const currentTime = Date.now();
                if (!lastFetchedTime || currentTime - lastFetchedTime >= 300000) {
                    const articles = await fetchNews(countryCode);
                    if (articles) {
                        setCurrentArticle(getRandomArticle(articles));
                        setLastFetchedTime(currentTime);
                    }
                }

            } catch (err) {
                setError(err instanceof GeolocationPositionError ?
                    "Enable location access for local news" :
                    "Failed to load news");
            } finally {
                setLoading(false);
            }
        };

        loadData().then();
    }, [fetchNews, lastFetchedTime, countryCode]);

    // Article rotation with proper cleanup
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (currentArticle?.results) {
            interval = setInterval(() => {
                setCurrentArticle((prev: any) => ({
                    ...prev,
                    current: getRandomArticle(prev.results)
                }));
            }, 300000);
        }
        return () => clearInterval(interval);
    }, [currentArticle?.results]);

    const stopPropagation = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    const handleCardClick = useCallback((e: any) => {
        stopPropagation(e);
        if (currentArticle?.link) {
            window.open(currentArticle.link, "_blank", "noopener,noreferrer");
        }
    }, [currentArticle?.link]);

    return (
        <>
            {loading && <WidgetLoading mode={mode === "dark" ? "dark" : "light"} />}
            {error && <WidgetError error={error} mode={mode === "dark" ? "dark" : "light"} onRemove={onRemove} />}
            <div
                ref={containerRef}
                className={`relative h-full w-full rounded-lg p-2 transition-colors ${
                    mode === "dark" ? "bg-gray-800" : "bg-white"
                }`}
            >
                {loading ? (
                    <div className="flex h-full items-center justify-center">
                        <CircularProgress color="secondary" />
                    </div>
                ) : error ? (
                    <div className="flex h-full w-full rounded-lg flex-col items-center justify-center text-red-500">
                        <Typography variant="body1">{error}</Typography>
                        <IconButton onClick={() => window.location.reload()}>
                            <RefreshIcon />
                        </IconButton>
                    </div>
                ) : currentArticle ? (
                    <Card
                        className={`h-full w-full rounded-lg transition-all ${
                            mode === "dark" ? "!bg-gray-700 !text-gray-100" : "!bg-gray-50"
                        }`}
                    >
                        <div key={componentWidth} className="flex h-full" style={{ flexDirection: isSmallWidth ? "column" : "row" }}>

                            <CardContent
                                sx={{
                                    display: "flex",
                                    flexDirection:"column",
                                    overflowY: "auto",
                                    p: 3,
                                    minWidth: 0,
                                    justifyContent:"space-between",
                                }}
                                className={"no-scrollbar"}
                                onMouseDown={(e) => stopPropagation(e)}
                            >
                            <Typography
                                    variant={componentWidth >= 200 ? "subtitle1" : "subtitle2"}
                                    className="!font-bold !mb-3"
                                >
                                    {currentArticle.title}
                                </Typography>


                                <Typography
                                    variant="body2"
                                    className={`mt-1  ${
                                        mode === "dark" ? "text-gray-300" : "text-gray-600"
                                    }`}
                                >
                                    {currentArticle.description}
                                </Typography>

                                <div onMouseDown={(e) => stopPropagation(e)}
                                     className={`relative mt-3 flex gap-2 items-center justify-between`}
                                >
                                    <Typography
                                        component="div"
                                        variant="caption"
                                        className={`rounded-full px-2 py-0.5 ${
                                            mode === "dark"
                                                ? "bg-blue-900 text-blue-100"
                                                : "bg-blue-100 text-blue-800"
                                        }
                                        ${ componentWidth < 200 ? "w-11/12 text-center" : ""
                                        }`}
                                    >
                                        {currentArticle.source_name}
                                    </Typography>
                                    <Typography
                                        component="div"
                                        className={"!underline hover:scale-103 cursor-pointer"}
                                        onClick={(e) => handleCardClick(e)} variant={"caption"}
                                    >
                                        See more..
                                    </Typography>
                                    <Typography
                                        component="div"
                                        variant="caption"
                                        className={mode === "dark" ? "text-gray-400" : "text-gray-500"}
                                    >
                                        {new Date(currentArticle.pubDate).toLocaleDateString()}
                                    </Typography>
                                </div>
                            </CardContent>
                        </div>
                    </Card>
                ) : null}

                <RemoveWidgetButton
                    onRemove={onRemove}
                    darkMode={mode === "dark"}
                />

                <CustomSnackbar
                    open={snackbarOpen}
                    message={snackbarMessage}
                    severity={snackbarSeverity}
                    onClose={handleSnackbarClose}
                />
            </div>
        </>

    );
}