import {Button, Menu, MenuItem, Box, IconButton} from '@mui/material';
import { useState } from 'react';
import {
    Notes as NotesIcon,
    WbSunny as WeatherIcon,
    CalendarToday as CalendarIcon,
    Article as NewsIcon,
    Chat as ChatsIcon,
} from '@mui/icons-material';
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";

export default function Widgets({ onAddWidget, darkmode, activeWidgets, removeWidget }: { onAddWidget: (widget: string) => void, darkmode: boolean, activeWidgets: string[], removeWidget: (widget: string) => void }) {
    const [anchorEl, setAnchorEl] = useState(null);

    const handleClick = (event: any) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const availableWidgets = [
        { id: 'notes', label: 'Notes', icon: <NotesIcon className="text-blue-500" /> },
        { id: 'weather', label: 'Weather', icon: <WeatherIcon className="text-orange-500" /> },
        { id: 'calendar', label: 'Calendar', icon: <CalendarIcon className="text-green-500" /> },
        { id: 'news', label: 'News', icon: <NewsIcon className="text-purple-500" /> },
        { id: 'chats', label: 'Chats', icon: <ChatsIcon className="text-red-500" /> },
    ];

    return (
        <div className="relative">
            {/* Widgets Button */}
            <Button
                variant="contained"
                className="h-8 font-bold text-white"
                onClick={handleClick}
                sx={{
                    backgroundColor: darkmode ? "#5e4c7f" : "#7e59a2",
                    '&:hover': { backgroundColor: '#7e59a2'},
                }}

            >
                Widgets
            </Button>

            {/* Dropdown Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                sx={{
                    '.MuiPaper-root': {
                        backgroundColor: darkmode ? "#5e4c7f" : "white",
                        boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
                        borderRadius: '8px',
                        marginTop: '8px',
                        width: '200px',
                        padding: '8px',
                    },
                }}
                className="z-50"
            >
                {/* Gallery of Widgets */}
                {availableWidgets.map((widget) => {
                    const isActive = activeWidgets.includes(widget.id);

                    return (
                        <MenuItem
                            key={widget.id}
                            onClick={() => {
                                if (!isActive) {
                                    onAddWidget(widget.id);
                                    handleClose();
                                }
                            }}
                            className={`p-2 hover:bg-gray-100 rounded-md transition-colors duration-200 ${
                                isActive ? "opacity-70 cursor-default" : ""
                            }`}
                        >
                            <Box className="flex items-center justify-between w-full">
                                <Box className="flex items-center space-x-2">
                                    <div className="w-6 h-6 flex items-center justify-center">
                                        {widget.icon}
                                    </div>
                                    <span className={`text-sm font-medium ${darkmode ? "text-white" : "text-black"}`}>{widget.label}</span>
                                </Box>
                                {isActive && (
                                    <IconButton className={`ml-2 ${darkmode ? "!text-white" : "!text-black"}`}  disabled={!isActive} onClick={() => removeWidget(widget.id)}>
                                        <RemoveCircleOutlineIcon  />
                                    </IconButton>
                                )}
                            </Box>
                        </MenuItem>
                    );
                })}
            </Menu>
        </div>
    );
}