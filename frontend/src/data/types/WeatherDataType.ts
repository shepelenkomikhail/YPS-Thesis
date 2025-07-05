interface HourlyData {
    datetime: string;
    temp: number;
    feelslike: number;
    conditions: string;
}

interface DailyData {
    datetime: string;
    temp: number;
    feelslike: number;
    conditions: string;
    hours: HourlyData[];
}

interface CurrentConditions {
    datetime: string;
    temp: number;
    feelslike: number;
    conditions: string;
}

export default interface WeatherDataType {
    queryCost: number;
    latitude: number;
    longitude: number;
    resolvedAddress: string;
    address: string;
    timezone: string;
    tzoffset: number;
    days: DailyData[];
    alerts: any[];
    currentConditions: CurrentConditions;
}