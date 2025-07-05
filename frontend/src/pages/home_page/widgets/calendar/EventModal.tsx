import {Button, InputAdornment, Modal, TextField, Typography} from "@mui/material";
import {format} from "date-fns";
import {useState, useEffect} from "react";
import { v4 as uuidv4 } from "uuid";
import {Event} from "../../../../data/types/EventType.ts";
import { Dispatch, SetStateAction } from "react";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { textFieldsStyle } from "../components/darkModalStyle.ts";

interface EventModalProps {
    showSnackbar: (message: string, severity: "success" | "error") => void;
    eventStartDate: string;
    eventEndDate: string;
    showEventModal: boolean;
    setShowEventModal: (show: boolean) => void;
    setEvents: Dispatch<SetStateAction<Event[]>>;
    mode: string;
    selectedDate: Date;
    setEventStartDate: (date: string) => void;
    setEventEndDate: (date: string) => void;
}

export default function EventModal({showSnackbar, eventStartDate, eventEndDate, selectedDate, showEventModal,
         setEventEndDate, setEventStartDate, setShowEventModal, setEvents, mode}: EventModalProps) {
    const [eventTitle, setEventTitle] = useState("");
    const [eventDescription, setEventDescription] = useState("");
    const [eventStartTime, setEventStartTime] = useState("09:00");
    const [eventEndTime, setEventEndTime] = useState("10:00");
    const [eventLocation, setEventLocation] = useState("");
    const [dateError, setDateError] = useState(false);
    const [timeError, setTimeError] = useState(false);

    // Validate dates and times whenever they change
    useEffect(() => {
        const startDateTime = new Date(`${eventStartDate}T${eventStartTime}`);
        const endDateTime = new Date(`${eventEndDate}T${eventEndTime}`);
        
        setDateError(startDateTime >= endDateTime);
        setTimeError(eventStartDate === eventEndDate && eventStartTime >= eventEndTime);
    }, [eventStartDate, eventEndDate, eventStartTime, eventEndTime]);

    // Handle adding a new event
    const handleAddEvent = () => {
        const startDateTime = new Date(`${eventStartDate}T${eventStartTime}`);
        const endDateTime = new Date(`${eventEndDate}T${eventEndTime}`);

        if (startDateTime >= endDateTime) {
            showSnackbar("End date/time must be after start date/time", "error");
            return;
        }

        const newEvent: Event = {
            _id: uuidv4(),
            user: "currentUserId",
            title: eventTitle,
            description: eventDescription,
            startDate: startDateTime,
            endDate: endDateTime,
            location: eventLocation,
        };

        saveEvent(newEvent).then();
        setShowEventModal(false);
    };

    // Save an event to the backend
    const saveEvent = async (event: Event) => {
        try {
            const response = await fetch(`http://localhost:8000/calendar`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(event),
                credentials: "include",
            });
            if (!response.ok)
                console.error("Failed to create event");
            const savedEvent: Event = await response.json();
            setEvents((prev) => [...prev, savedEvent]);
            showSnackbar("Event saved successfully", "success");
        } catch (error) {
            console.error("Error saving event:", error);
            showSnackbar("Failed to save event", "error");
        }
    };

    const getHelperText = () => {
        if (dateError) return "End date must be after start date";
        if (timeError) return "End time must be after start time";
        return "";
    };

    return (
        <Modal open={showEventModal} onClose={() => setShowEventModal(false)} onMouseDown={(e) => e.stopPropagation()}>
            <div
                className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-4 rounded-lg ${
                    mode === "dark" ? "bg-gray-700" : "bg-white"
                }`}
            >
                <Typography variant="h6" className="!mb-4"
                            sx={{color: mode === "dark" ? "#f5f5f5" : ""}}>
                    Add Event - {format(selectedDate, "MMM d, yyyy")}
                </Typography>
                <TextField
                    label="Title"
                    variant="outlined"
                    fullWidth
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    className="!mb-4"
                    sx={mode === "dark" ? textFieldsStyle : {}}
                />
                <TextField
                    label="Description"
                    variant="outlined"
                    fullWidth
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                    className="!mb-4"
                    sx={mode === "dark" ? textFieldsStyle : {}}
                />
                <div className="flex w-full gap-2 mt-4">
                    <TextField
                        label="Start Date"
                        type="date"
                        slotProps={{ inputLabel: { shrink: true }}}
                        fullWidth
                        value={eventStartDate}
                        onChange={(e) => setEventStartDate(e.target.value)}
                        className="!mb-4"
                        error={dateError}
                        helperText={dateError ? getHelperText() : ""}
                        sx={mode === "dark" ? textFieldsStyle : {}}
                    />
                    <TextField
                        label="Start Time"
                        type="time"
                        slotProps={{ inputLabel: { shrink: true }}}
                        fullWidth
                        value={eventStartTime}
                        onChange={(e) => setEventStartTime(e.target.value)}
                        className="!mb-4"
                        error={timeError}
                        helperText={timeError ? getHelperText() : ""}
                        sx={mode === "dark" ? textFieldsStyle : {}}
                    />
                </div>
                <div className="flex w-full gap-2 mb-2">
                    <TextField
                        label="End Date"
                        type="date"
                        slotProps={{ inputLabel: { shrink: true }}}
                        fullWidth
                        value={eventEndDate}
                        onChange={(e) => setEventEndDate(e.target.value)}
                        className="!mb-4"
                        error={dateError}
                        helperText={dateError ? getHelperText() : ""}
                        sx={mode === "dark" ? textFieldsStyle : {}}
                    />
                    <TextField
                        label="End Time"
                        type="time"
                        slotProps={{ inputLabel: { shrink: true }}}
                        fullWidth
                        value={eventEndTime}
                        onChange={(e) => setEventEndTime(e.target.value)}
                        className="!mb-4"
                        error={timeError}
                        helperText={timeError ? getHelperText() : ""}
                        sx={mode === "dark" ? textFieldsStyle : {}}
                    />
                </div>
                <TextField
                    label="Location"
                    variant="outlined"
                    fullWidth
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    className="!mb-4"
                    sx={mode === "dark" ? textFieldsStyle : {}}
                    slotProps={{
                        input: {
                            endAdornment: (
                                <InputAdornment position="end">
                                    <LocationOnIcon />
                                </InputAdornment>
                            ),
                        }
                    }}
                />
                <div className="flex justify-end gap-2 mt-4">
                    <Button onClick={() => setShowEventModal(false)}>Cancel</Button>
                    <Button 
                        variant="contained" 
                        onClick={handleAddEvent}
                        disabled={dateError || timeError}
                    >
                        Save Event
                    </Button>
                </div>
            </div>
        </Modal>
    );
}