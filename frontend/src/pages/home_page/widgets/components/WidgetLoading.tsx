import {CircularProgress} from "@mui/material";

export default function WidgetLoading({mode}: {mode: string}) {
    return (
        <div className={`flex w-full rounded-lg h-full items-center justify-center absolute z-50 ${mode === "dark" ? "bg-backgroundviolet" : "bg-pearlbush"}`}>
            <CircularProgress color={mode === "dark" ? "primary" : "secondary"} />
        </div>
    );
}