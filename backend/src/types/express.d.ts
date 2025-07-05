import { UserType } from './UserType';

declare global {
    namespace Express {
        interface Request {
            user?: User;
        }
    }
}