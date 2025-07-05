export interface WeatherData {
    currentConditions: {
        conditions: string;
        temp: number;
        feelslike: number;
    };
    days: {
        datetime: string;
        hours: Array<{
            datetime: string;
            conditions: string;
            temp: number;
        }>;
    }[];
}