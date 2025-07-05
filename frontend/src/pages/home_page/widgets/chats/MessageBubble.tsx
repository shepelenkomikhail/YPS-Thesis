import { Avatar, Typography } from "@mui/material";
import { format } from "date-fns";
import Message from "../../../../data/types/MessageType";
import React from "react";
import { motion } from "framer-motion";
import CheckIcon from '@mui/icons-material/Check';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { getFileType } from "./getFileType.ts";

const messageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

const MessageBubble = React.memo(function MessageBubble({ message, isOwn, mode, friendUsername }: { message: Message; isOwn: boolean; mode: string | null; friendUsername: string }) {
    const getInitial = (username: string) => {
        return username && username.length > 0 ? username[0].toUpperCase() : '?';
    };

    return (
        <motion.div
            className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-4 -ml-4`}
            initial="hidden"
            animate="visible"
            variants={messageVariants}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <div className={`flex ${isOwn ? "flex-row-reverse" : ""} gap-3`} style={{ maxWidth: "80%" }}>
                {!isOwn && (
                    <Avatar
                        sx={{
                            width: 32,
                            height: 32,
                            bgcolor: mode === 'dark' ? '#374151' : '#e5e7eb',
                            color: mode === 'dark' ? '#e5e7eb' : '#1f2937',
                            fontSize: '0.875rem'
                        }}
                    >
                        {getInitial(friendUsername)}
                    </Avatar>
                )}
                <div className={`px-3 py-1 rounded-lg break-words w-full`}
                     style={{
                         backgroundColor: mode === "dark" ? (isOwn ? "#1E40AF" : "#374151") : (isOwn ? "#DBEAFE" : "#F3F4F6"),
                         wordWrap: "break-word",
                         overflowWrap: "break-word",
                         maxWidth: '100%'
                     }}
                >
                    <Typography variant="body1" sx={{ wordBreak: "break-word" }}>
                        {message.content}
                    </Typography>
                    <div className={`flex flex-wrap gap-2`}>
                        {(message?.attachments || []).map((url, index) => {
                            const fileName = url.split('/').pop() || '';
                            const fileExtension = fileName.split('.').pop()?.toLowerCase();
                            const fileType = getFileType(fileExtension);
                            const fullUrl = `http://localhost:8000${url}`;

                            return (
                                <div key={index} className="mb-2 w-full">
                                    {(fileType === 'Image' || fileType === 'Video') && (
                                        <div className="rounded-lg overflow-hidden" style={{ maxWidth: '250px' }}>
                                            {fileType === 'Image' && (
                                                <img
                                                    src={fullUrl}
                                                    alt={fileName}
                                                    className="w-full h-auto rounded-lg"
                                                    loading="lazy"
                                                />
                                            )}
                                            {fileType === 'Video' && (
                                                <video
                                                    controls
                                                    src={fullUrl}
                                                    className="w-full h-auto rounded-lg"
                                                />
                                            )}
                                        </div>
                                    )}
                                    {fileType === 'Audio' && (
                                        <div className="w-full">
                                            <audio
                                                controls
                                                src={fullUrl}
                                                className="w-full h-10"
                                            />
                                        </div>
                                    )}
                                    <a
                                        href={fullUrl}
                                        download={fileName}
                                        target="_blank"
                                        className={`text-blue-400 hover:underline break-words block mt-1 ${
                                            fileType === 'File' ? 'mt-0' : ''
                                        }`}
                                    >
                                        Download {fileType}
                                    </a>
                                </div>
                            );
                        })}
                    </div>
                    <div className={"flex gap-1 items-center w-full justify-end"}>
                        <Typography variant="caption" className={`block mt-1 ${mode === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            {format(new Date(message.timestamp), 'HH:mm')}
                        </Typography>
                        {isOwn && (
                            <div className="flex items-center">
                                {message.status === 'sent' ? (
                                    <CheckIcon sx={{ fontSize: 16, color: 'gray' }} />
                                ) : (
                                    <DoneAllIcon sx={{ fontSize: 16, color: 'green' }} />
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
});

export default MessageBubble;
