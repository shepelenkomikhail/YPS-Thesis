import {Button, InputAdornment, Modal, TextField, Typography} from "@mui/material";
import { format, parseISO } from "date-fns";
import React, { useEffect, useState } from "react";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { textFieldsStyle } from "../components/darkModalStyle.ts";
import { Event } from "../../../../data/types/EventType.ts";

interface EditModalProps {
    event: Event | null;
    showEditModal: boolean;
    setShowEditModal: (show: boolean) => void;
    setEvents: React.Dispatch<React.SetStateAction<Event[]>>;
    mode: string;
    showSnackbar: (message: string, severity: "success" | "error") => void;
}

export default function EditModal({event, showEditModal, setShowEditModal, setEvents, mode, showSnackbar,}: EditModalProps) {
    const [eventTitle, setEventTitle] = useState("");
    const [eventDescription, setEventDescription] = useState("");
    const [eventStartDate, setEventStartDate] = useState("");
    const [eventEndDate, setEventEndDate] = useState("");
    const [eventStartTime, setEventStartTime] = useState("");
    const [eventEndTime, setEventEndTime] = useState("");
    const [eventLocation, setEventLocation] = useState("");

    // Initialize form fields when event changes
    useEffect(() => {
        if (event) {
            const startDate = parseISO(event.startDate.toString());
            const endDate = parseISO(event.endDate.toString());

            setEventTitle(event.title);
            setEventDescription(event.description || "");
            setEventStartDate(format(startDate, "yyyy-MM-dd"));
            setEventEndDate(format(endDate, "yyyy-MM-dd"));
            setEventStartTime(format(startDate, "HH:mm"));
            setEventEndTime(format(endDate, "HH:mm"));
            setEventLocation(event.location || "");
        }
    }, [event]);

    const handleSave = async () => {
        if (!event) return;

        if (!eventTitle || !eventStartDate || !eventEndDate) {
            showSnackbar("Title and dates are required", "error");
            return;
        }

        const updatedEvent = {
            ...event,
            title: eventTitle,
            description: eventDescription,
            startDate: new Date(`${eventStartDate}T${eventStartTime}`),
            endDate: new Date(`${eventEndDate}T${eventEndTime}`),
            location: eventLocation,
        };

        try {
            const response = await fetch(
                `http://localhost:8000/calendar/${event._id}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(updatedEvent),
                    credentials: "include",
                }
            );

            if (response.ok) {
                const savedEvent = await response.json();
                setEvents((prevEvents) =>
                    prevEvents.map((ev) => (ev._id === savedEvent._id ? savedEvent : ev))
                );
                showSnackbar("Event updated successfully", "success");
                setShowEditModal(false);
            } else {
                showSnackbar("Failed to update event", "error");
            }
        } catch (error) {
            console.error("Error updating event:", error);
            showSnackbar("Error updating event", "error");
        }
    };

    return (
        <Modal
            open={showEditModal}
            onClose={() => setShowEditModal(false)}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <div
                className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-4 rounded-lg ${
                    mode === "dark" ? "bg-gray-700" : "bg-white"
                }`}
            >
                <Typography
                    variant="h6"
                    className="!mb-4"
                    sx={{ color: mode === "dark" ? "#f5f5f5" : "" }}
                >
                    Edit Event
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
                    <Button onClick={() => setShowEditModal(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSave}>
                        Save Changes
                    </Button>
                </div>
            </div>
        </Modal>
    );
}