import { Button, Menu, MenuItem, Box, IconButton } from '@mui/material';
import React, { useState, useEffect } from 'react';
import { CloudUpload as UploadIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { CustomSnackbar, useSnackbar } from '../../../../../components/CustomSnackbar.tsx';
import defaultBg from '../../../../../assets/default_bg.jpg';

export default function Backgrounds({darkmode}: {darkmode: boolean}) {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [backgrounds, setBackgrounds] = useState<string[]>([]);
    const [selectedBackground, setSelectedBackground] = useState<string>('');

    const { showSnackbar, snackbarOpen, snackbarMessage, snackbarSeverity, handleClose } = useSnackbar();

    useEffect(() => {
        fetchBackgrounds().then();
    }, []);

    const fetchBackgrounds = async () => {
        try {
            const response = await fetch('http://localhost:8000/backgrounds/images', {
                credentials: 'include',
            });
            if (!response.ok) {
                console.error('Failed to fetch backgrounds');
            }
            const data = await response.json();

            const fullImageUrls = data.map((url: string) => {
                if (url.startsWith('http')) {
                    return url;
                }
                return `http://localhost:8000${url}`;
            });

            setBackgrounds([defaultBg, ...fullImageUrls]);
        } catch (error) {
            console.error('Error fetching backgrounds:', error);
            showSnackbar('Failed to fetch backgrounds.', 'error');
        }
    };

    const deleteImage = async (imageUrl: string) => {
        try {
            const url = new URL(imageUrl);
            const pathName = url.pathname;

            const response = await fetch('http://localhost:8000/backgrounds/delete', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ imageUrl: pathName }),
            });

            if (!response.ok) {
                console.error('Failed to delete image');
            }

            setBackgrounds((prev) => prev.filter((url) => url !== imageUrl));
            showSnackbar('Image deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting image:', error);
            showSnackbar('Failed to delete image.', 'error');
        }
    };

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                showSnackbar('Only image files are allowed.', 'error');
                return;
            }

            const fileName = file.name;
            const validFileNameRegex = /^[A-Za-z0-9_\-\.]+$/;
            if (!validFileNameRegex.test(fileName)) {
                showSnackbar('File name can only contain Latin characters, numbers, underscores, hyphens, and periods.', 'error');
                return;
            }

            const formData = new FormData();
            formData.append('image', file);

            try {
                const response = await fetch('http://localhost:8000/backgrounds/upload', {
                    method: 'POST',
                    body: formData,
                    credentials: 'include',
                });

                if (!response.ok) {
                    console.error('Failed to upload image');
                }

                const data = await response.json();
                const fullImageUrl = `http://localhost:8000${data.imageUrl}`;

                setBackgrounds((prev) => [fullImageUrl, ...prev]);
                showSnackbar('Image uploaded successfully!', 'success');
            } catch (error) {
                console.error('Error uploading image:', error);
                showSnackbar('Failed to upload image.', 'error');
            }
        }
    };

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
    };

    const handleImageClick = (imageUrl: string) => {
        setSelectedBackground(imageUrl);
        localStorage.setItem("bgImage", imageUrl);
        location.reload();
        console.log('Selected background:', imageUrl);
        console.log('selectedBackground:', selectedBackground);
    };

    return (
        <div className="relative">
            {/* Background Button */}
            <Button variant="contained" onClick={handleClick}
                    sx={{
                        height: '32px',
                        backgroundColor: darkmode ? "#5e4c7f" : "#7e59a2",
                        '&:hover': { backgroundColor: '#7e59a2'},
                    }}
            >
                Backgrounds
            </Button>

            {/* Dropdown Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleCloseMenu}
                sx={{
                    '.MuiPaper-root': {
                        backgroundColor: darkmode ? "#5e4c7f" : 'white',
                        boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
                        borderRadius: '8px',
                        marginTop: '8px',
                        width: '250px',
                        padding: '8px',
                    },
                }}
                className="z-50"
            >
                {/* Upload Button */}
                <MenuItem className="p-2 hover:bg-gray-100 rounded-md transition-colors duration-200">
                    <label htmlFor="upload-background" className="w-full cursor-pointer">
                        <Box className="flex items-center justify-center space-x-2 p-2 border-2 border-dashed border-gray-300 rounded-md">
                            <UploadIcon className={`${darkmode ? "text-white" : "text-gray-500"}`} />
                            <span className={`text-sm font-medium ${darkmode ? "text-white" : "text-gray-700"}`}>Upload Image</span>
                        </Box>
                    </label>
                    <input id="upload-background" type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                </MenuItem>

                {/* Gallery of Backgrounds */}
                <Box className="flex flex-wrap p-2 gap-3">
                    {backgrounds.map((background, index) => (
                        <Box
                            key={index}
                            className="relative h-16 w-16 bg-cover bg-center rounded-md flex items-center justify-center cursor-pointer hover:opacity-80"
                            style={{ backgroundImage: `url(${background})` }}
                            onClick={() => handleImageClick(background)}
                        >
                            {background !== defaultBg && ( // Only show delete button for non-default images
                                <IconButton
                                    className="-translate-y-2 translate-x-1 top-0 right-0 bg-red-500 hover:bg-red-600 text-white rounded-full"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteImage(background).then();
                                    }}
                                    size="small"
                                    sx={{
                                        backgroundColor: 'red',
                                        position: 'absolute',
                                        '&:hover': {
                                            backgroundColor: 'darkred',
                                        },
                                    }}
                                >
                                    <DeleteIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                            )}
                        </Box>
                    ))}
                </Box>
            </Menu>

            {/* Custom Snackbar */}
            <CustomSnackbar open={snackbarOpen} message={snackbarMessage} severity={snackbarSeverity} onClose={handleClose} />

            {/* Apply the selected background to the entire page */}
            <style>
                {`
                    body {
                        background-image: url(${selectedBackground});
                        background-size: cover;
                        background-position: center;
                        background-repeat: no-repeat;
                    }
                `}
            </style>
        </div>
    );
}