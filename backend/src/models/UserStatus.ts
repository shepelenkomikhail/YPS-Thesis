export interface UserStatus {
    userId: string;
    status: 'online' | 'offline'| 'away';
    lastSeen?: Date;
}