import React, {useEffect, useRef} from "react";
import {Note} from "../../../../data/types/Note.ts"

interface NoteInputComponentProps {
    item: string;
    selectedNote: Note;
    index: number;
    updateNoteContent: (content: string) => void;
    handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, index: number) => void;
}

const NoteInputComponent: React.FC<NoteInputComponentProps> = ({
                                                                   item,
                                                                   selectedNote,
                                                                   index,
                                                                   updateNoteContent,
                                                                   handleKeyDown
                                                               }) => {
    const mode = localStorage.getItem("mode");
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus management
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    return (
        <input
            type="text"
            value={item}
            ref={inputRef}
            onKeyDown={(e) => handleKeyDown(e, index)}

            onChange={(e) => {
                const updatedContent = selectedNote.content.split("\n");
                updatedContent[index] = e.target.value;
                updateNoteContent(updatedContent.join("\n"));
            }}
            className={`w-full bg-transparent border-b ${
                mode === "dark" ? "border-gray-600" : "border-gray-300"
            } focus:outline-none`}
        />
    );
};

export default NoteInputComponent;