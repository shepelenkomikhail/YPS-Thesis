import RemoveWidgetButton from "../components/RemoveWidgetButton.tsx";
import { useEffect, useRef, useState, useCallback } from "react";
import { Typography, Button, IconButton} from "@mui/material";
import {format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameDay, addMonths, subMonths,
    addWeeks, subWeeks, isToday, subDays, isSameMonth} from "date-fns";

import { CustomSnackbar, useSnackbar } from "../../../../components/CustomSnackbar.tsx";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";
import {Event} from "../../../../data/types/EventType.ts";
import EventModal from "./EventModal.tsx";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import EditModal from "./EditModal.tsx";

export default function Calendar({ onRemove }: { onRemove: () => void }) {
    const mode: string = localStorage.getItem("mode") ?? "light";
    const { showSnackbar, snackbarOpen, snackbarMessage, snackbarSeverity, handleClose: handleSnackbarClose } = useSnackbar();
    const containerRef = useRef<HTMLDivElement>(null);
    const [componentWidth, setComponentWidth] = useState(0);
    const [componentHeight, setComponentHeight] = useState(0);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<Event[]>([]);
    const [showEventModal, setShowEventModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [eventStartDate, setEventStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [eventEndDate, setEventEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [currentView, setCurrentView] = useState<"month" | "week" | "day">("month");
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

    //console.log(events);

    // Resize observer
    useEffect(() => {
        const resizeObserver = new ResizeObserver(entries => {
            const entry = entries[0];
            if (entry) {
                setComponentWidth(entry.contentRect.width);
                setComponentHeight(entry.contentRect.height);
            }
        });

        if (containerRef.current) resizeObserver.observe(containerRef.current);
        return () => {
            if (containerRef.current) resizeObserver.unobserve(containerRef.current);
        };
    }, []);

    // Determine available views based on size
    const getAvailableViews = useCallback(() => {
        if (componentWidth >= 600 && componentHeight >= 400) return ["month", "week", "day"];
        if (componentWidth >= 400 && componentHeight >= 200) return ["week", "day"];
        return ["day"];
    }, [componentWidth, componentHeight]);

    // Adjust view when size changes
    useEffect(() => {
        const available = getAvailableViews();
        if (!available.includes(currentView)) setCurrentView(available[0] as any);
    }, [componentWidth, componentHeight, getAvailableViews, currentView]);

    // Navigation handlers
    const navigate = (direction: "prev" | "next" | "today") => {
        const handlers = {
            month: {
                prev: () => setCurrentDate(subMonths(currentDate, 1)),
                next: () => setCurrentDate(addMonths(currentDate, 1)),
                today: () => setCurrentDate(new Date())
            },
            week: {
                prev: () => setCurrentDate(subWeeks(currentDate, 1)),
                next: () => setCurrentDate(addWeeks(currentDate, 1)),
                today: () => setCurrentDate(new Date())
            },
            day: {
                prev: () => setCurrentDate(subDays(currentDate, 1)),
                next: () => setCurrentDate(addDays(currentDate, 1)),
                today: () => setCurrentDate(new Date())
            }
        };

        handlers[currentView][direction]();
    };

    // Event handlers
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await fetch(`http://localhost:8000/calendar`, {
                    credentials: 'include',
                });
                if (!response.ok)
                    console.error("Failed to fetch events");
                const data = await response.json();
                setEvents(data);
            } catch (error) {
                console.error("Error fetching events:", error);
                showSnackbar("Failed to fetch events", "error");
            }
        };

        fetchEvents().then();
    }, []);

    // Handle date click
    const handleDateClick = (date: Date) => {
        setSelectedDate(date);
        setEventStartDate(format(date, "yyyy-MM-dd"));
        setEventEndDate(format(date, "yyyy-MM-dd"));
        setShowEventModal(true);
    };

    const handleEditCLick = (event: Event) => {
        setSelectedEvent(event);
        setShowEditModal(true);
    }

    // Handle delete click
    const handleDeleteClick = async (id:string) => {
       // console.log("Deleting event with id:", id);
        try {
            const response = await fetch(`http://localhost:8000/calendar/${id}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            if (!response.ok)
                console.error("Failed to delete event");
            setEvents(events.filter(e => e._id !== id));
            showSnackbar("Event deleted successfully", "success");
        } catch (error) {
            console.error("Error deleting event:", error);
            showSnackbar("Failed to delete event", "error");
        }
    }

    // View components
    const MonthView = () => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
        const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

        const weeks = [];
        let currentDay = startDate;

        while (currentDay <= endDate) {
            const week = [];
            for (let i = 0; i < 7; i++) {
                week.push(currentDay);
                currentDay = addDays(currentDay, 1);
            }
            weeks.push(week);
        }

        const dayEvents = events
            .filter(e => isSameDay(e.startDate, currentDate))
            .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

        return (
            <div className="flex flex-col p-2 gap-1 h-[80%] " onMouseDown={(e) => e.stopPropagation()}>
                <div className="grid grid-cols-7 gap-1 mb-1">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
                        <Typography key={day} variant="caption" className="text-center">
                            {day}
                        </Typography>
                    ))}
                </div>
                {weeks.map((week, wi) => (
                    <div key={wi} className="grid grid-cols-7 gap-1 ">
                        {week.map((date, di) => (
                            <div
                                key={di}
                                className={`min-h-[80px] h-full p-1 border rounded flex flex-col cursor-pointer !overflow-auto
                                ${
                                    isToday(date) ?
                                        (mode === "dark" ? "border-red-900" : "bg-green-100") : ""
                                } 
                                ${
                                    mode === "dark"
                                        ? "border-gray-600 hover:bg-gray-600"
                                        : "border-gray-400 hover:bg-gray-100"
                                }
                                ${
                                    !isSameMonth(date, currentDate)
                                        ? (mode === "dark" ? "bg-gray-700 opacity-50" : "bg-gray-200 opacity-50")
                                        : isToday(date)
                                            ? (mode === "dark" ? "border-red-900" : "bg-green-100")
                                            : ""
                                }`}
                                onClick={() => handleDateClick(date)}
                                onMouseDown={(e) => e.stopPropagation()}
                            >
                                <Typography
                                    variant="caption"
                                    className={`${isToday(date) ? (mode === "dark" ? "" : "font-bold text-green-600") : ""}`}
                                >
                                    {format(date, "d")}
                                </Typography>
                                <div className="flex overflow-auto items-center">
                                    {dayEvents.filter(e => isSameDay(e.startDate, date)).length === 1 ? (
                                        dayEvents.filter(e => isSameDay(e.startDate, date)).map(event => (
                                            <div
                                                key={event._id}
                                                className={`text-xs p-1 mt-1 rounded ${
                                                    mode === "dark" ? "bg-blue-800" : "bg-blue-100"
                                                }`}
                                            >
                                                {event.title}
                                            </div>
                                        ))
                                    ) : (
                                        events.filter(e => isSameDay(e.startDate, date)).length > 0 ? (
                                            <div className={`text-xs p-1 mt-2 rounded ${
                                                mode === "dark" ? "bg-gray-500" : "bg-blue-100"
                                            }`}>
                                                {events.filter(e => isSameDay(e.startDate, date)).length} events
                                            </div>
                                        ) : null
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        );
    };

    const WeekView = () => {
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        const days = [];
        for (let i = 0; i < 7; i++) {
            days.push(addDays(weekStart, i));
        }

        const dayEvents = events
            .filter(e => isSameDay(e.startDate, currentDate))
            .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

        return (
            <div className="grid grid-cols-7 gap-1 p-2 mt-2 h-[80%]" onMouseDown={(e) => e.stopPropagation()}>
                {days.map((date, i) => (
                    <div
                        key={i}
                        className={`min-h-[100px] h-full p-1 border rounded cursor-pointer overflow-auto
                        ${
                            isToday(date) ? (mode === "dark" ? "border-red-900" : "bg-green-100") : ""
                        } 
                        ${
                            mode === "dark"
                                ? "border-gray-600 hover:bg-gray-600"
                                : "border-gray-400 hover:bg-gray-100"
                        }`}
                        onClick={() => handleDateClick(date)}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <Typography variant="caption" className={`${isToday(date) ? mode === "dark" ? "" : "font-bold text-green-600" : ""}`}>
                            {format(date, "EEE d")}
                        </Typography>
                        {dayEvents.filter(e => isSameDay(e.startDate, date)).map(event => (
                            <div
                                key={event._id}
                                className={`text-xs p-1 mt-3 gap-1 rounded overflow-clip cursor-pointer hover:border hover:border-red-900 ${
                                    mode === "dark" ? "bg-gray-500" : "bg-blue-100"
                                }`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditCLick(event);
                                }}
                            >
                                {event.title}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        );
    };

    const DayView = () => {
        const dayEvents = events
            .filter(e => isSameDay(e.startDate, currentDate))
            .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

        return (
            <div className="p-2" onMouseDown={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center">
                    <Typography variant="h6" className={`mb-2 ${mode == "dark" ? "text-gray-100" : "text-gray-800"}`}>
                        {format(currentDate, "EEEE, MMMM d")}
                    </Typography>
                    <IconButton color={"inherit"} onClick={() => handleDateClick(currentDate)}
                                onMouseDown={(e) => e.stopPropagation()}>
                        <AddIcon />
                    </IconButton>
                </div>
                <div className="space-y-2">
                    {dayEvents.map(event => (
                        <div
                            key={event._id}
                            className={`p-2 rounded flex justify-between items-center mt-4 cursor-pointer ${
                                mode === "dark" ? "bg-gray-600" : "bg-gray-100"
                            }`}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleEditCLick(event);
                            }}
                        >
                            <div>
                                <Typography variant="body2">{event.title}</Typography>
                                {event.startDate && (
                                    <Typography variant="caption">
                                        {format(new Date(event.startDate), "HH:mm")} - {format(new Date(event.endDate), "HH:mm")}
                                    </Typography>
                                )}
                            </div>
                            <div className="flex gap-1">
                                <IconButton color={"inherit"}>
                                    <EditIcon onClick={() => handleEditCLick(event)}/>
                                </IconButton>
                                <IconButton color={"error"}>
                                    <DeleteIcon onClick={() => {handleDeleteClick(event._id).then()}} />
                                </IconButton>
                            </div>
                        </div>

                    ))}
                </div>
            </div>
        );
    };

    return (
        <div
            ref={containerRef}
            className={`relative h-full w-full rounded-lg p-2 transition-colors overflow-auto no-scrollbar
            ${
                mode === "dark" ? "bg-gray-900" : "bg-[#fdfaf6]" 
            }`}
        >
            {/* Controls */}
            <div className={`flex items-center justify-between p-2 rounded-lg ${
                mode === "dark" ? "bg-gray-700" : "bg-zinc-200"
            } rounded-t`} onMouseDown={(e) => e.stopPropagation()}
            >
                <div className="flex gap-2 items-center">
                    <IconButton size="small" onClick={() => navigate("prev")}>
                        <ChevronLeft fontSize="small" className={mode === "dark" ? "text-gray-100" : "text-gray-800"} />
                    </IconButton>
                    <Typography variant="subtitle1" className={`mb-2 ${mode == "dark" ? "text-gray-100" : "text-gray-800"}`}>
                        {format(currentDate, "MMMM yyyy")}
                    </Typography>
                    <IconButton size="small" onClick={() => navigate("next")}>
                        <ChevronRight fontSize="small" className={mode === "dark" ? "text-gray-100" : "text-gray-800"} />
                    </IconButton>
                    {componentWidth > 300 && (
                        <Button variant={"outlined"} className={"!p-0"} onClick={() => navigate("today")}>Today</Button>
                    )}
                </div>

                {/* View Selector */}
                {componentWidth > 400 && (
                    <div className="flex gap-1 mr-6">
                        {getAvailableViews()
                            .map(view => (
                                <Button
                                    key={view}
                                    size="small"
                                    variant={currentView === view ? "contained" : "text"}
                                    onClick={() => setCurrentView(view as any)}
                                >
                                    {view}
                                </Button>
                            ))}
                    </div>
                )}
            </div>

            {/* Calendar Views */}
            {currentView === "month" && <MonthView />}
            {currentView === "week" && <WeekView />}
            {currentView === "day" && <DayView />}

            {/* Event Modal */}
            {showEventModal && (
                <EventModal
                    showSnackbar={showSnackbar}
                    eventStartDate={eventStartDate}
                    eventEndDate={eventEndDate}
                    setShowEventModal={setShowEventModal}
                    setEvents={setEvents}
                    mode={mode}
                    selectedDate={selectedDate}
                    setEventStartDate={setEventStartDate}
                    setEventEndDate={setEventEndDate}
                    showEventModal={showEventModal}
                />
            )}

            {/* Edit Event Modal */}
            {showEditModal && (
                <EditModal
                    event={selectedEvent}
                    showEditModal={showEditModal}
                    setShowEditModal={setShowEditModal}
                    setEvents={setEvents}
                    mode={mode}
                    showSnackbar={showSnackbar}
                />
            )}

            <RemoveWidgetButton onRemove={onRemove} darkMode={mode === "dark"} />
            <CustomSnackbar
                open={snackbarOpen}
                message={snackbarMessage}
                severity={snackbarSeverity}
                onClose={handleSnackbarClose}
            />
        </div>
    );
};