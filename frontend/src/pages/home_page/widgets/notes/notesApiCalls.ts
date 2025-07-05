import {Note} from "../../../../data/types/Note.ts"

export const loadNotesFromAPI = async (): Promise<Note[]> => {
    try {
        const response = await fetch('http://localhost:8000/notes', {credentials: "include"});
        const data = await response.json();
        return data.map((note: any) => ({
            id: note._id,
            type: note.type,
            content: note.content
        }));
    } catch (error) {
        return [];
    }
};

export const saveNoteToAPI = async (note: Note): Promise<Note> => {
    const isUpdate = note.id.startsWith('temp-');
    const url = isUpdate
        ? 'http://localhost:8000/notes'
        : `http://localhost:8000/notes/${note.id}`;

    const response = await fetch(url, {
        method: isUpdate ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(note),
        credentials: "include"
    });
    const savedNote = await response.json();

    return {
        id: savedNote._id,
        type: savedNote.type,
        content: savedNote.content
    };
};

export const deleteNotesFromAPI = async (note: Note) => {
    try {
        const response = await fetch(`http://localhost:8000/notes/${note.id}`, {
            credentials: "include",
            method: 'DELETE'
        });
        const status =  response.status;
        console.log(status);
    } catch (error) {
        return [];
    }
};
