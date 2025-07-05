import { NoteType } from './NoteType.ts'

export interface Note {
    id: string;
    type: NoteType;
    content: string;
}