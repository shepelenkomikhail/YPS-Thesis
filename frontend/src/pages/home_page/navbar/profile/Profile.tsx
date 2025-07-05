import { Button, Menu, MenuItem } from '@mui/material';
import { useEffect, useState} from 'react';
import { useNavigate } from 'react-router-dom';
import AccountCircle from '@mui/icons-material/AccountCircle';
import {Logout, Settings} from "@mui/icons-material";
import UserSettings from "./UserSettings.tsx";
import {getUser} from "../../utils/getUser.ts";
import { useMyContext} from "../../../../context/MyProvider.tsx";

export default function Profile({darkmode}: {darkmode: boolean}) {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [avatar, setAvatar] = useState('');

    useEffect(() => {
        const fetchUser = async () => {
            const result = await getUser();
            if (result) {
                setUser(result.user);
                setAvatar(result.avatar);
            }
        };

        fetchUser().then();
    }, []);

    const [anchorEl, setAnchorEl] = useState(null);
    const [settingsOpen, setSettingsOpen] = useState(false);

    const handleClick = (e: any) => setAnchorEl(e.currentTarget);
    const handleClose = () => setAnchorEl(null);

    const handleSettingsClick = () => {
        setSettingsOpen(true);
        handleClose();
    };

    const handleSettingsClose = () => {
        setSettingsOpen(false);
    };

    const { socket } = useMyContext();

    const handleLogout = async () => {
        if (socket && user) {
            socket.emit('update_status', 'offline');
        }

        try {
            await fetch('http://localhost:8000/users/logout', {
                method: 'POST',
                credentials: 'include',
            });
            navigate('/login');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    return (
        <div className="relative">
            {/* Profile Button */}
            <Button
                variant="contained"
                sx={{
                    height: '32px',
                    minWidth: '160px',
                    width: 'auto',
                    fontWeight: 'bold',
                    backgroundColor: darkmode ? "#5e4c7f" : "#7e59a2",
                    '&:hover': { backgroundColor: '#7e59a2'},
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}                onClick={handleClick}
            >
                <div className="flex items-center">
                    {avatar ? (
                        <img
                            src={avatar}
                            className="w-6 h-6 rounded-full cursor-pointer border-gray-300 mr-2"
                            alt="Avatar"
                            referrerpolicy="no-referrer"
                        />
                    ) : (
                        <AccountCircle className={`text-white mr-2`} />
                    )}
                    {/*@ts-ignore*/}
                    { <p className={`text-white !font-semibold`}>{user ? user.firstName : "Profile"}</p> }
                </div>
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
                        minWidth: '160px',
                        color: darkmode ? 'secondarydarktext' : 'black',
                    },
                }}
                className="z-50"
            >
                <MenuItem onClick={handleSettingsClick} className={`hover:bg-gray-100 focus:bg-gray-200 `}>
                    <Settings className={`${darkmode ? 'text-white' : 'text-black'} mr-2`} />
                    <p className={`${darkmode ? 'text-white' : 'text-black'}`}>Settings</p>
                </MenuItem>
                <MenuItem onClick={handleLogout} className="hover:bg-gray-100 focus:bg-gray-200">
                    <Logout className={`${darkmode ? 'text-white' : 'text-black'} mr-2`} />
                    <p className={`${darkmode ? 'text-white' : 'text-black'}`}>Logout</p>
                </MenuItem>
            </Menu>

            <UserSettings open={settingsOpen} onClose={handleSettingsClose} user={user} />
        </div>
    );
}