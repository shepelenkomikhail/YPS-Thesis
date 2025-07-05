import React, { useState, useRef, useEffect } from "react";
import { IconButton, Menu, MenuItem, Tooltip,  } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import RemoveWidgetButton from "../components/RemoveWidgetButton.tsx";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import ChecklistIcon from "@mui/icons-material/Checklist";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import {Note} from "../../../../data/types/Note.ts"
import {NoteType} from "../../../../data/types/NoteType.ts"
import {deleteNotesFromAPI, loadNotesFromAPI, saveNoteToAPI} from "./notesApiCalls.ts";
import {CustomSnackbar, useSnackbar} from "../../../../components/CustomSnackbar.tsx";
import useResizeObserver from "../components/useResizeObserver.tsx";
import NoteInputComponent from "./NoteInputComponent.tsx";

export default function Notes({ onRemove }: { onRemove: () => void }) {
    const mode = localStorage.getItem("mode");

    const [notes, setNotes] = useState<Note[]>([]);
    const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
    const [noteType, setNoteType] = useState<NoteType>("text");
    const selectedNote = notes.find(note => note.id === selectedNoteId);

    const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);

    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);

    const componentWidth = useResizeObserver(containerRef);

    const { showSnackbar, snackbarOpen, snackbarMessage, snackbarSeverity, handleClose: handleSnackbarClose } = useSnackbar();
    const saveDebounceTimer = useRef<number | null>(null);


    const isSmallWidget = componentWidth <= 450;
    const isBigWidget = componentWidth >= 600;

    // Load notes from API
    useEffect(() => {
        const loadNotes = async () => {
            const loadedNotes = await loadNotesFromAPI();
            setNotes(loadedNotes);
            if (loadedNotes.length > 0) {
                setSelectedNoteId(loadedNotes[0].id);
            }
        };
        loadNotes().then();
    }, []);

    // Cleanup empty notes when component unmounts
    useEffect(() => {
        return () => {
            notes.forEach(note => {
                if (note.id.startsWith("temp-") && note.content.trim() === "") {
                    setNotes(prev => prev.filter(n => n.id !== note.id));
                }
            });
        };
    }, [notes]);

    // Prevent event propagation
    const stopPropagation = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    // Add a new note
    const addNote = async () => {
        const initialContent = noteType === 'checklist' ? '[ ] ' : '';
        const newNote: Note = {
            id: `temp-${Date.now()}`,
            type: noteType,
            content: initialContent,
        };
        setNotes(prev => [...prev, newNote]);
        setSelectedNoteId(newNote.id);
    };

    // Update note content
    const updateNoteContent = async (content: string) => {
        setNotes((prevNotes) => {
            const updatedNotes = prevNotes.map((note) =>
                note.id === selectedNoteId ? { ...note, content } : note
            );

            const updatedNote = updatedNotes.find((note) => note.id === selectedNoteId);

            if (updatedNote && content.trim() !== "") {
                if (saveDebounceTimer.current) {
                    clearTimeout(saveDebounceTimer.current);
                }

                saveDebounceTimer.current = window.setTimeout(() => {
                    if (updatedNote.id.startsWith("temp-")) {
                        saveNoteToAPI(updatedNote)
                            .then((savedNote) => {
                                setNotes((prev) => [
                                    ...prev.filter((n) => n.id !== updatedNote.id),
                                    savedNote,
                                ]);
                                setSelectedNoteId(savedNote.id);
                            })
                            .catch((error) => {
                                console.error("Error saving note:", error);
                                showSnackbar("Failed to save note", "error");
                                setNotes((prev) =>
                                    prev.filter((n) => n.id !== updatedNote.id)
                                );
                            });
                    } else {
                        saveNoteToAPI(updatedNote).catch((error) => {
                            console.error("Error updating note:", error);
                            showSnackbar("Failed to update note", "error");
                        });
                    }
                }, 200);
            }

            return updatedNotes;
        });
    };

    // Delete note
    const deleteNote = (noteId: string) => async () => {
        const note = notes.find((n) => n.id === noteId);
        if (note) {
            if (note.id.startsWith("temp-")) {
                setNotes((prev) => prev.filter((n) => n.id !== note.id));
            } else {
                try {
                    await deleteNotesFromAPI(note);
                    setNotes((prev) => prev.filter((n) => n.id !== note.id));
                    setSelectedNoteId(null);
                } catch (error) {
                    console.error("Error deleting note:", error);
                    showSnackbar("Failed to delete note", "error");
                }
            }
        }
    };

    // Update note type
    const updateNoteType = async (type: NoteType) => {
        setNotes(prevNotes => {
            const updatedNotes = prevNotes.map(note =>
                note.id === selectedNoteId ? { ...note, type } : note
            );

            const updatedNote = updatedNotes.find(note => note.id === selectedNoteId);
            if (updatedNote) {
                saveNoteToAPI(updatedNote).catch(console.error);
            }

            return updatedNotes;
        });
    };

    // Handle Enter key for ordered lists and checklists
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === "Enter") {
            e.preventDefault();
            const selectedNote = notes.find(note => note.id === selectedNoteId);
            if (selectedNote) {
                const updatedContent = selectedNote.content.split("\n");
                updatedContent.splice(index + 1, 0, "");
                updateNoteContent(updatedContent.join("\n")).then();

                setTimeout(() => {
                    inputRefs.current[index + 1]?.focus();
                }, 0);
            }
        }
    };


    // Ref callback for dynamic input refs
    const createInputRef = (index: number) => (el: HTMLInputElement | null) => {
        if (el) {
            inputRefs.current[index] = el;
        }
    };

    // Generate a name for notes
    const generateNoteName = (note: Note, index: number) => {
        if (note.content.trim().length > 0) {
            const cleanContent = note.content.trim();
            const maxChars: 10|20 = isBigWidget ? 20 : 10;
            return cleanContent.substring(0, maxChars) + (cleanContent.length > maxChars ? ".." : "");
        }
        return `New Note ${index + 1}`;
    };

    // Menu handlers
    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        stopPropagation(event);
        setMenuAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setMenuAnchorEl(null);
    };

    const handleNoteSelect = (noteId: string) => {
        const note = notes.find(n => n.id === noteId);
        if (note) {
            setSelectedNoteId(noteId);
            setNoteType(note.type);
        }
        handleMenuClose();
    };

    const handleCheckboxChange = (index: number) => {
        if (!selectedNote) return;

        const lines = selectedNote.content.split('\n');
        const line = lines[index];
        let newLine: string;

        if (line.startsWith('[ ] ')) {
            newLine = line.replace('[ ] ', '[x] ');
        } else if (line.startsWith('[x] ')) {
            newLine = line.replace('[x] ', '[ ] ');
        } else {
            newLine = `[ ] ${line}`;
        }

        lines[index] = newLine;
        updateNoteContent(lines.join('\n')).then();
    };



    return (
        <div
            ref={containerRef}
            className={`relative w-full h-full rounded-lg py-2 ${
                mode === "dark" ? "bg-gray-800 text-gray-200" : "bg-orange-50 text-black"
            }`}
        >
            {/* Close Button */}
            <RemoveWidgetButton onRemove={onRemove}  darkMode={mode === "dark"} />

            <div className="flex h-full gap-4">
                {/* Sidebar - hidden on small widgets */}
                {!isSmallWidget && (
                    <div className="flex flex-col w-5/12 border-r px-2 pt-1">
                        <div className="flex w-full justify-between pl-2">
                            <h2 className="mb-2 font-semibold">Notes</h2>
                            <IconButton
                                size="small"
                                onClick={addNote}
                                onMouseDown={stopPropagation}
                                color="primary"
                                aria-label="add note"
                            >
                                <AddIcon fontSize="small" />
                            </IconButton>
                        </div>
                        <div className="overflow-y-auto flex-1 no-scrollbar">
                            {notes.map((note, index) => (
                                <div
                                    key={note.id}
                                    className={`p-1 mb-1 text-sm rounded cursor-pointer flex items-center justify-between ${
                                        selectedNoteId === note.id
                                            ? (mode === "dark" ? "bg-blue-900" : "bg-blue-200")
                                            : (mode === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100")
                                    }`}
                                    onClick={(e) => {
                                        stopPropagation(e);
                                        handleNoteSelect(note.id);
                                    }}
                                    onMouseDown={stopPropagation}
                                >
                                    {generateNoteName(note, index)}
                                    <IconButton aria-label="delete" onClick={deleteNote( note.id)}
                                                sx={{ color: "red", fontSize: 10 }} >
                                        <DeleteIcon fontSize="small"/>
                                    </IconButton>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <div className="flex flex-col w-full p-1">
                    {/* Top Bar with Menu and Note Type Buttons */}
                    <div className="flex justify-between items-center mr-8">
                        {isSmallWidget && (
                            <>
                                <IconButton
                                    size="small"
                                    onClick={handleMenuOpen}
                                    aria-label="notes menu"
                                    onMouseDown={stopPropagation}
                                    color={mode === "dark" ? "primary" : "default"}
                                >
                                    <MenuIcon fontSize="small" />
                                </IconButton>
                                <Menu
                                    anchorEl={menuAnchorEl}
                                    open={Boolean(menuAnchorEl)}
                                    onClose={handleMenuClose}
                                    sx={{
                                        "& .MuiPaper-root": {
                                            backgroundColor: mode === "dark" ? "#1e293b" : "white",
                                            color: mode === "dark" ? "#e5e7eb" : "black",
                                        },
                                    }}
                                >
                                    <MenuItem
                                        className="!text-sm"
                                        onClick={addNote}
                                        onMouseDown={stopPropagation}
                                    >
                                        + New Note
                                    </MenuItem>
                                    {notes.map((note, index) => (
                                        <MenuItem
                                            key={note.id}
                                            className="!text-sm"
                                            onClick={(e) => {
                                                stopPropagation(e);
                                                handleNoteSelect(note.id);
                                            }}
                                            selected={selectedNoteId === note.id}
                                        >
                                            <div className="flex justify-between items-center w-full">
                                                {generateNoteName(note, index)}
                                                <IconButton aria-label="delete" onClick={deleteNote( note.id)}
                                                            sx={{ color: "red", fontSize: 10 }} >
                                                    <DeleteIcon fontSize="small"/>
                                                </IconButton>
                                            </div>
                                        </MenuItem>
                                    ))}
                                </Menu>
                            </>
                        )}
                        <div className="flex flex-wrap mb-3">
                            {/* Text Icon Button */}
                            <Tooltip title="Text">
                                <IconButton
                                    size="small"
                                    onClick={(e) => {
                                        stopPropagation(e);
                                        selectedNote && updateNoteType("text");
                                    }}
                                    color={
                                        selectedNote?.type === "text" ? "primary" : mode === "dark" ? "default": "inherit"
                                    }
                                    sx={{
                                        color: selectedNote?.type === "text"
                                            ? undefined
                                            : mode === "dark" ? "#356BB9" : "#91959d",
                                    }}
                                    onMouseDown={stopPropagation}
                                >
                                    <TextFieldsIcon />
                                </IconButton>
                            </Tooltip>

                            {/* List Icon Button */}
                            <Tooltip title="List">
                                <IconButton
                                    size="small"
                                    onClick={(e) => {
                                        stopPropagation(e);
                                        selectedNote && updateNoteType("orderedList");
                                    }}
                                    color={
                                        selectedNote?.type === "orderedList" ? "primary" : mode === "dark" ? "default" : "inherit"
                                    }
                                    sx={{
                                        color: selectedNote?.type === "orderedList"
                                            ? undefined
                                            : mode === "dark" ? "#356BB9" : "#91959d",
                                    }}
                                    onMouseDown={stopPropagation}
                                >
                                    <FormatListBulletedIcon />
                                </IconButton>
                            </Tooltip>

                            {/* Checklist Icon Button */}
                            <Tooltip title="Checklist">
                                <IconButton
                                    size="small"
                                    onClick={(e) => {
                                        stopPropagation(e);
                                        selectedNote && updateNoteType("checklist");
                                    }}
                                    color={
                                        selectedNote?.type === "checklist" ? "primary" : mode === "dark" ? "default" : "inherit"
                                    }
                                    sx={{
                                        color: selectedNote?.type === "checklist"
                                            ? undefined
                                            : mode === "dark" ? "#356BB9" : "#91959d",
                                    }}
                                    onMouseDown={stopPropagation}
                                >
                                    <ChecklistIcon />
                                </IconButton>
                            </Tooltip>
                        </div>
                    </div>

                    {/* Note Editor */}
                    {selectedNote ? (
                        selectedNote.type === "orderedList" ? (
                            <ol className="flex-1 overflow-y-auto px-4 list-decimal text-sm !mx-1">
                                {selectedNote.content.split("\n").map((item: string, index: number) => (
                                    <li key={index} className="mb-1">
                                        <NoteInputComponent
                                            item={item}
                                            selectedNote={selectedNote}
                                            index={index}
                                            updateNoteContent={updateNoteContent}
                                            handleKeyDown={handleKeyDown}
                                        />
                                    </li>
                                ))}
                            </ol>
                        ) : selectedNote.type === "checklist" ? (
                            <ul className="flex-1 overflow-y-auto list-none text-sm !mx-1">
                                {selectedNote.content.split("\n").map((line, index) => {
                                    const isChecked = line.startsWith('[x] ');
                                    const text = line.replace(/^(\[ ] |\[x] )/, '');

                                    return (
                                        <li key={index} className="mb-1 flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => handleCheckboxChange(index)}
                                                className="mr-2"
                                                onMouseDown={stopPropagation}
                                            />
                                            <input
                                                type="text"
                                                value={text}
                                                ref={createInputRef(index)}
                                                onChange={(e) => {
                                                    const lines = selectedNote.content.split('\n');
                                                    const prefix = lines[index].startsWith('[x] ') ? '[x] ' : '[ ] ';
                                                    lines[index] = prefix + e.target.value;
                                                    updateNoteContent(lines.join('\n')).then();
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        const lines = selectedNote.content.split('\n');
                                                        lines.splice(index + 1, 0, '[ ] ');
                                                        updateNoteContent(lines.join('\n')).then(() => {
                                                            setTimeout(() => {
                                                                inputRefs.current[index + 1]?.focus();
                                                            }, 0);
                                                        });
                                                    }
                                                }}
                                                className={`w-full bg-transparent border-b ${
                                                    mode === "dark" ? "border-gray-600" : "border-gray-300"
                                                } focus:outline-none`}
                                                onMouseDown={stopPropagation}
                                            />
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <textarea
                                className="flex-1 overflow-y-auto bg-transparent text-sm !ml-2 resize-none w-11/12 focus:outline-none"
                                value={selectedNote.content}
                                onChange={(e) => updateNoteContent(e.target.value)}
                                onMouseDown={stopPropagation}
                            />
                        )
                    ) : (
                        <div className="flex-1 flex mt-6 justify-center text-center text-gray-500">
                            Select or create a note to begin
                        </div>
                    )}
                </div>
            </div>
            <CustomSnackbar
                open={snackbarOpen}
                message={snackbarMessage}
                severity={snackbarSeverity}
                onClose={handleSnackbarClose}
            />
        </div>
    );
}