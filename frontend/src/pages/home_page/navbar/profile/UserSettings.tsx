import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    IconButton,
    TextField,
    DialogContentText
} from '@mui/material';
import React, {useEffect, useState} from "react";
import { CustomSnackbar, useSnackbar } from "../../../../components/CustomSnackbar.tsx";
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import { useTheme } from '@mui/material/styles';
import AccountCircle from "@mui/icons-material/AccountCircle";
import {patternPassword, patternEmail, patternLetters, patternUsername} from "../../../../data/InputPatterns.ts";
import {useNavigate} from "react-router-dom";

export default function UserSettings({ open, onClose, user }: { open: boolean, onClose: () => void, user: any }) {
    const [formData, setFormData] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
        username: user?.username || '',
        newPassword: '',
        confirmPassword: ''
    });
    const navigate = useNavigate();

    let avatarPath :string = '';
    if (user?.images?.length > 0) {
        const imageUrl = user?.images[0];
        avatarPath = imageUrl.startsWith("http") ? imageUrl : `http://localhost:8000${imageUrl}`;
    }

    const [avatar, setAvatar] = useState(avatarPath);
    const { showSnackbar, snackbarOpen, snackbarMessage, snackbarSeverity, handleClose: handleSnackbarClose } = useSnackbar();
    const [avatarFile, setAvatarFile] = useState<File | null>(null);

    useEffect(() => {
        if (user) {
            setFormData(prevState => ({
                ...prevState,
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || '',
                username: user.username || '',
            }));

            setAvatar(avatarPath);
        }
    }, [user]);

    const theme = useTheme();
    const darkMode = localStorage.getItem('mode') === 'dark';

    const [openConfirmation, setOpenConfirmation] = useState(false);
    const handleCloseConfirmation = () => setOpenConfirmation(false);

    const [editing, setEditing] = useState({
        firstName: false,
        lastName: false,
        email: false,
        username: false,
        newPassword: false,
        confirmPassword: false
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setAvatar(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        const validationErrors = [];
        const lettersRegex = new RegExp(patternLetters);
        const emailRegex = new RegExp(patternEmail);
        const usernameRegex = new RegExp(patternUsername);

        if (!lettersRegex.test(formData.firstName)) {
            validationErrors.push('First name must contain 3-20 letters only');
        }

        if (!lettersRegex.test(formData.lastName)) {
            validationErrors.push('Last name must contain 3-20 letters only');
        }

        if (!emailRegex.test(formData.email)) {
            validationErrors.push('Invalid email format');
        }

        if (!usernameRegex.test(formData.username)) {
            validationErrors.push('Username must be at least 5 lowercase alphanumeric characters');
        }

        if (validationErrors.length > 0) {
            showSnackbar(validationErrors.join(', '), 'error');
            return;
        }

        const formDataToSend = new FormData();
        formDataToSend.append('firstName', formData.firstName);
        formDataToSend.append('lastName', formData.lastName);
        formDataToSend.append('email', formData.email);
        formDataToSend.append('username', formData.username);

        if (avatarFile) {
            formDataToSend.append('avatar', avatarFile);
        }

        try {
            const response = await fetch(`http://localhost:8000/users/${user._id}`, {
                method: 'PUT',
                credentials: 'include',
                body: formDataToSend,
            });

            if (response.ok) {
                location.reload();
                showSnackbar('Profile is updated successfully', 'success');
            } else {
                const error = await response.json();
                showSnackbar(error.message || 'Update failed', 'error');
            }
        } catch (error) {
            showSnackbar('An error occurred while saving', 'error');
        }
    };

    const handleChangePassword = async () => {
        const validationErrors = [];
        const passwordRegex = new RegExp(patternPassword);

        if (!passwordRegex.test(formData.newPassword)) {
            validationErrors.push('');
        }

        if (formData.newPassword !== formData.confirmPassword) {
            validationErrors.push("Passwords don't match", 'error');
        }

        if (validationErrors.length > 0) {
            showSnackbar(validationErrors.join(', '), 'error');
            return;
        }

        try {
            const response = await fetch(`http://localhost:8000/users/change-password`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newPassword: formData.newPassword }),
            });

            if (response.ok) {
                showSnackbar('Password changed successfully', 'success');
                setFormData(prev => ({ ...prev, newPassword: '', confirmPassword: '' }));
            }
        } catch (error) {
            showSnackbar('Password change failed', 'error');
        }
    };

    const handleDeleteAccount = async () => {
        handleCloseConfirmation();

        try {
            const response = await fetch(`http://localhost:8000/users/${user._id}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (response.ok) {
                await fetch('http://localhost:8000/users/logout', {
                    method: 'POST',
                    credentials: 'include',
                });
                setTimeout(() => navigate('/login'), 2000);
            } else {
                const error = await response.json();
                showSnackbar(error.message || 'Delete failed', 'error');
            }
        } catch (error) {
            showSnackbar('An error occurred while delete', 'error');
        }
    }

    const toggleEdit = (field: string) => {
        //@ts-ignore
        setEditing(prev => ({ ...prev, [field]: !prev[field] }));
    };

    return (
        <>
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            sx={{
                '& .MuiDialog-paper': {
                    minHeight: '50vh',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    backgroundColor: darkMode ? '#676279' : '#f5f0e6',
                    color: darkMode ? 'white' : 'inherit',
                },
            }}
        >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                User Settings
                <IconButton onClick={onClose}>
                    <CloseIcon sx={{ color: darkMode ? 'white' : 'inherit' }} />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                <div className="flex flex-col gap-4 mt-4">
                    {/* Avatar, Username, and Email */}
                    <div className="flex flex-col md:flex-row items-center gap-4 w-full">
                        <div className="flex items-center gap-4">
                            <div className="relative group">
                                {avatar ? (
                                    <img
                                        src={avatar}
                                        className="!w-24 !h-24 md:!w-36 md:!h-28 rounded-full cursor-pointer border-2 border-gray-300"
                                        alt="Avatar"
                                    />
                                ) : (
                                    <AccountCircle className={`${darkMode ? "text-white " : "text-gray-700"} mr-2`} sx={{ fontSize: 80 }} />
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                            </div>
                        </div>

                        {/* Username and Email */}
                        <div className="flex flex-col gap-4 w-full">
                            {['username', 'email'].map((field) => (
                                <div key={field} style={{ position: 'relative', width: '100%' }}>
                                    <TextField
                                        fullWidth
                                        variant="outlined"
                                        label={field.charAt(0).toUpperCase() + field.slice(1)}
                                        value={formData[field as keyof typeof formData]}
                                        onChange={handleChange}
                                        name={field}
                                        disabled={!editing[field as keyof typeof editing]}
                                        sx={{
                                            '& .MuiInputBase-input': {
                                                color: darkMode ? 'white' : 'black',
                                            },
                                            '& .MuiOutlinedInput-root': {
                                                '& fieldset': {
                                                    borderColor: darkMode ? 'white' : 'gray',
                                                },
                                                '&:hover fieldset': {
                                                    borderColor: darkMode ? 'white' : 'gray',
                                                },
                                                '&.Mui-focused fieldset': {
                                                    borderColor: darkMode ? 'white' : 'gray',
                                                },
                                                '&.Mui-disabled': {
                                                    '& input': {
                                                        color: darkMode ? '#a0a0a0' : 'rgba(0, 0, 0, 0.38)'
                                                    }
                                                }
                                            },
                                            '& .MuiInputLabel-root': {
                                                color: darkMode ? 'white' : 'rgba(0, 0, 0, 0.6)',
                                                '&.Mui-focused': {
                                                    color: darkMode ? 'white' : 'rgba(0, 0, 0, 0.6)',
                                                },
                                                '&.Mui-disabled': {
                                                    color: darkMode ? '#a0a0a0' : 'rgba(0, 0, 0, 0.38)',
                                                }
                                            }
                                        }}
                                    />
                                    <IconButton
                                        onClick={() => toggleEdit(field)}
                                        sx={{
                                            position: 'absolute',
                                            top: 8,
                                            right: 8,
                                            color: darkMode ? 'white' : 'inherit',
                                            backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'transparent'
                                        }}
                                    >
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* First and Last Name */}
                    <div className="flex flex-col md:flex-row gap-4">
                        {['firstName', 'lastName'].map((field) => (
                            <div key={field} style={{ position: 'relative', flex: 1 }}>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    label={field === 'firstName' ? 'First Name' : 'Last Name'}
                                    value={formData[field as keyof typeof formData]}
                                    onChange={handleChange}
                                    name={field}
                                    disabled={!editing[field as keyof typeof editing]}
                                    sx={{
                                        '& .MuiInputBase-input': {
                                            color: darkMode ? 'white' : 'black',
                                        },
                                        '& .MuiOutlinedInput-root': {
                                            '& fieldset': {
                                                borderColor: darkMode ? 'white' : 'gray',
                                            },
                                            '&:hover fieldset': {
                                                borderColor: darkMode ? 'white' : 'gray',
                                            },
                                            '&.Mui-focused fieldset': {
                                                borderColor: darkMode ? 'white' : 'gray',
                                            },
                                            '&.Mui-disabled': {
                                                '& input': {
                                                    color: darkMode ? '#a0a0a0' : 'rgba(0, 0, 0, 0.38)'
                                                }
                                            }
                                        },
                                        '& .MuiInputLabel-root': {
                                            color: darkMode ? 'white' : 'rgba(0, 0, 0, 0.6)',
                                            '&.Mui-focused': {
                                                color: darkMode ? 'white' : 'rgba(0, 0, 0, 0.6)',
                                            },
                                            '&.Mui-disabled': {
                                                color: darkMode ? '#a0a0a0' : 'rgba(0, 0, 0, 0.38)',
                                            }
                                        }
                                    }}
                                />
                                <IconButton
                                    onClick={() => toggleEdit(field)}
                                    sx={{
                                        position: 'absolute',
                                        top: 8,
                                        right: 8,
                                        color: darkMode ? 'white' : 'inherit',
                                        backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'transparent'
                                    }}
                                >
                                    <EditIcon fontSize="small" />
                                </IconButton>
                            </div>
                        ))}
                    </div>

                    {/* Passwords */}
                    <div className="flex flex-col md:flex-row gap-4">
                        {['newPassword', 'confirmPassword'].map((field) => (
                            <div key={field} style={{ position: 'relative', flex: 1 }}>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    type="password"
                                    label={field === 'newPassword' ? 'New Password' : 'Confirm Password'}
                                    value={formData[field as keyof typeof formData]}
                                    onChange={handleChange}
                                    name={field}
                                    disabled={!editing[field as keyof typeof editing]}
                                    sx={{
                                        '& .MuiInputBase-input': {
                                            color: darkMode ? 'white' : 'black',
                                        },
                                        '& .MuiOutlinedInput-root': {
                                            '& fieldset': {
                                                borderColor: darkMode ? 'white' : 'gray',
                                            },
                                            '&:hover fieldset': {
                                                borderColor: darkMode ? 'white' : 'gray',
                                            },
                                            '&.Mui-focused fieldset': {
                                                borderColor: darkMode ? 'white' : 'gray',
                                            },
                                            '&.Mui-disabled': {
                                                '& input': {
                                                    color: darkMode ? '#a0a0a0' : 'rgba(0, 0, 0, 0.38)',
                                                    '&.Mui-focused': {
                                                        color: darkMode ? 'white' : 'rgba(0, 0, 0, 0.6)',
                                                    },
                                                    '&.Mui-disabled': {
                                                        color: darkMode ? '#a0a0a0' : 'rgba(0, 0, 0, 0.38)',
                                                    }
                                                },
                                            }
                                        },
                                        '& .MuiInputLabel-root': {
                                            color: darkMode ? 'white' : 'rgba(0, 0, 0, 0.6)'
                                        }
                                    }}
                                />
                                <IconButton
                                    onClick={() => toggleEdit(field)}
                                    sx={{
                                        position: 'absolute',
                                        top: 8,
                                        right: 8,
                                        color: darkMode ? 'white' : 'inherit',
                                        backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'transparent'
                                    }}
                                >
                                    <EditIcon fontSize="small" />
                                </IconButton>
                            </div>
                        ))}
                    </div>
                </div>
            </DialogContent>

            <DialogActions sx={{ padding: 3, gap: 2 }}>
                <Button
                    variant="contained"
                    onClick={() => setOpenConfirmation(true)}
                    color="error"
                    sx={{
                        textTransform: 'none',
                        borderRadius: '8px',
                        padding: '8px 20px'
                    }}
                >
                    Delete Account
                </Button>

                <Button
                    variant="outlined"
                    onClick={handleChangePassword}
                    color="warning"
                    sx={{
                        bgcolor: '#ead0b4',
                        '&:hover': { bgcolor: '#fbd88c' },
                        textTransform: 'none',
                        borderRadius: '8px',
                        padding: '8px 20px'
                    }}
                >
                    Change Password
                </Button>

                <div className="flex gap-2">
                    <Button
                        onClick={handleSave}
                        variant="contained"
                        sx={{
                            bgcolor: theme.palette.success.main,
                            '&:hover': { bgcolor: theme.palette.success.dark },
                            textTransform: 'none',
                            borderRadius: '8px',
                            padding: '8px 20px'
                        }}
                    >
                        Save Changes
                    </Button>
                </div>
            </DialogActions>

            <CustomSnackbar
                open={snackbarOpen}
                message={snackbarMessage}
                severity={snackbarSeverity}
                onClose={handleSnackbarClose}
            />
        </Dialog>

            <Dialog
                open={openConfirmation}
                onClose={() => setOpenConfirmation(false)}
            >
                <DialogTitle>Confirm Account Deletion</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete your account?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setOpenConfirmation(false)}
                        color="primary"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDeleteAccount}
                        color="error"
                        autoFocus
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}