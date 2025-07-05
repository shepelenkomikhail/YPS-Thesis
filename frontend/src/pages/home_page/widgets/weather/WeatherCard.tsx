import { Typography, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import conditionsMap from '../../../../data/conditions.json';
import { ConditionsMap } from "../../../../data/types/ConditionsMap.ts";
import { WeatherData } from "../../../../data/types/WeatherData.ts";
import {useEffect, useState, useRef} from "react";
import { Dialog, DialogActions, DialogContent, DialogTitle, TextField, Button } from '@mui/material';

export default function WeatherCard({ data, city, mode, setCity }: { data: WeatherData | null, city: string | null, mode: string, setCity: (city:string)=>void }) {
    const typedConditionsMap: ConditionsMap = conditionsMap;
    const [cityInput, setCityInput] = useState(city || "");

    const getConditionIcon = (conditions: string) => {
        const firstCondition = conditions.split(",")[0].trim();
        return typedConditionsMap[firstCondition] || "./conditions/default.svg";
    };

    const currentHour = new Date().getHours();
    const currentDate = data?.days[0]?.datetime || new Date().toISOString().split("T")[0];

    const nextFiveHours = data ? data.days[0].hours
            .filter((hourData) => {
                const fullDateTime = `${currentDate}T${hourData.datetime}`;
                const hour = new Date(fullDateTime).getHours();
                return hour >= currentHour && hour < currentHour + 5;
            })
            .slice(0, 5)
        : [];

    const [componentWidth, setComponentWidth] = useState(0);
    const [componentHeight, setComponentHeight] = useState(0);
    const isShortHeight: boolean = componentHeight < 200;
    const isSmallWidth: boolean = componentWidth < 300;
    const containerRef = useRef<HTMLDivElement>(null);

    const [openDialog, setOpenDialog] = useState(false);

    const handleDialogOpen = () => {
        setOpenDialog(true);
    };

    const handleDialogClose = () => {
        setOpenDialog(false);
    };

    const handleCityChange = () => {
        if (cityInput) {
            setCity(cityInput);
        }
        setOpenDialog(false);
    };


    // Width observation
    useEffect(() => {
        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                setComponentWidth(entry.contentRect.width);
                //console.log(entry.contentRect.width);
                setComponentHeight(entry.contentRect.height);
            }
        });

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => {
            if (containerRef.current) {
                resizeObserver.unobserve(containerRef.current);
            }
        };
    }, []);

    // useEffect(() => {
    //     console.log("NEW DATA", data);
    // }, [data]);

    const darkMode = mode === "dark";

    return (
        <div className={`flex flex-col h-full w-full p-2 ${mode === 'dark' ? 'text-gray-100' : 'text-gray-900'} 
        ${isSmallWidth && "pt-8 "}`} ref={containerRef}>
            {/* Header Section */}
            <div className={`flex ${isShortHeight ? '' : 'justify-center'} ${isShortHeight && isSmallWidth ? '-mt-6' : 'justify-center'} items-center`}>
                <div className={"relative flex gap-1 items-center "}>
                    {!isShortHeight && (
                        <IconButton
                            aria-label="edit city"
                            className={`!absolute left-0 top-0 transform translate-x-[-1.7rem] ${isSmallWidth ? "translate-y-[-1.2rem]" : "translate-y-[-0.8rem]"} `}
                            color="inherit"
                            onMouseDown={(e) => {e.stopPropagation()}}
                            onClick={() => handleDialogOpen()}
                        >
                            <EditIcon sx={{ fontSize: 18 }}/>
                        </IconButton>
                    )}
                    <Typography
                        variant={isSmallWidth ? 'h6' : 'h5'}
                        component="div"
                        className="truncate"
                    >
                        {city}
                    </Typography>
                </div>
            </div>

            {/* Main Weather Info */}
            {data ? (
                <div className={`h-full flex flex-col justify-between pt-1 ${isShortHeight ? "justify-between" : "justify-center gap-6"}`}>
                    {/* Current Conditions */}
                    <div
                        className={`flex ${isSmallWidth ? "flex-col justify-between" : "justify-center"} items-center space-x-2`}
                    >
                        <div className="flex-auto">
                            <img
                                src={getConditionIcon(data.currentConditions.conditions)}
                                alt="Current weather"
                                className={`mx-auto ${isSmallWidth ? 'w-16 h-16' : 'w-24 h-24'} ${mode !== "dark" && "filter invert"}`}
                            />
                        </div>

                        <div className="flex-auto">
                            <div className="text-center">
                                <Typography
                                    variant={isSmallWidth ? 'h3' : 'h2'}
                                    component="div"
                                >
                                    {Math.round(data.currentConditions.temp)}°C
                                </Typography>
                                {
                                    !isShortHeight && (
                                        <Typography
                                            variant={isSmallWidth ? 'body2' : 'body1'}
                                            component="div"
                                            className={`${isSmallWidth ? "!mt-4" : "!mt-1"} `}
                                        >
                                            Feels like {data.currentConditions.feelslike}°C
                                        </Typography>
                                    )
                                }
                            </div>
                        </div>
                    </div>

                    {/* Hourly Forecast */}
                    {(!isSmallWidth && !isShortHeight) &&
                        <div className={`${componentHeight < 290 ? "-mt-2" : "mt-1"}`}>
                            <Typography
                                variant={isSmallWidth ? 'body2' : 'body1'}
                                className="text-center !mb-1"
                            >
                                Next 5 hours:
                            </Typography>

                            <div
                                className="flex justify-around space-x-1 px-1"
                            >
                                {nextFiveHours.map((hourData, index) => (
                                    <div
                                        className="flex flex-col items-center w-1/5"
                                        key={index}
                                    >
                                        <Typography
                                            variant="caption"
                                            component="div"
                                            className="truncate"
                                        >
                                            {hourData.datetime.slice(0, -3)}
                                        </Typography>

                                        <img
                                            src={getConditionIcon(hourData.conditions)}
                                            alt="Hourly weather"
                                            className={`${isSmallWidth ? 'w-8 h-8' : 'w-10 h-10'} ${mode !== "dark" && "filter invert"}`}
                                        />
                                        <Typography variant="caption">
                                            {Math.round(hourData.temp)}°C
                                        </Typography>

                                    </div>
                                ))}
                            </div>
                        </div>
                    }
                </div>
            ) : (
                <div className="h-full flex items-center justify-center">
                    <Typography variant="body1">No data available</Typography>
                </div>
            )}


            <Dialog open={openDialog} onClose={handleDialogClose} onMouseDown={(e) => {e.stopPropagation()}} sx={{
                '& .MuiDialog-paper': {
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    backgroundColor: darkMode ? '#676279' : '#f5f0e6',
                    color: darkMode ? 'white' : 'inherit',
                },
            }}>
                <DialogTitle>Enter new city</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        fullWidth
                        value={cityInput}
                        onChange={(e) => setCityInput(e.target.value)}
                        label="City"
                        className={"!mt-2 !p-0"}
                        variant="outlined"
                        sx={{
                            '& .MuiInputBase-input': {
                                color: darkMode ? '#fff' : '#000',
                            },
                            '& .MuiOutlinedInput-root': {
                                '& fieldset': {
                                    borderColor: darkMode ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)',
                                },
                                '&:hover fieldset': {
                                    borderColor: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: darkMode ? '#90caf9' : '#1976d2',
                                }
                            },
                            '& .MuiInputLabel-root': {
                                color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                                '&.Mui-focused': {
                                    color: darkMode ? '#90caf9' : '#1976d2',
                                }
                            }
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={handleDialogClose}
                        sx={{ color: darkMode ? '#90caf9' : '#1976d2' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCityChange}
                        sx={{ color: darkMode ? '#90caf9' : '#1976d2' }}
                    >
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>

        </div>
    );
}