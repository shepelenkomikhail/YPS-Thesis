import { IconButton, Typography } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import RemoveWidgetButton from "./RemoveWidgetButton.tsx";
import { useEffect } from "react";

export default function WidgetError({ error, mode, onRemove }: { error: Error | string | null, mode: string, onRemove: () => void }) {
    useEffect(() => {
        if (error) {
            console.error("Widget Error:", error);
        }
    }, [error]);

    const getErrorMessage = () => {
        if (!error) return "An unknown error occurred";
        if (typeof error === 'string') return error;
        return error.message;
    };

    const handleRefresh = () => {
        try {
            window.location.reload();
        } catch (refreshError) {
            console.error("Failed to refresh:", refreshError);
        }
    };

    return (
        <div className={`flex h-full w-full flex-col items-center justify-center p-4 rounded-lg 
            ${mode === "dark" ? "!bg-backgroundviolet" : "!text-red-600 !bg-pearlbush"}`}
        >
            <Typography variant="h6" className="text-center mb-2">
                Widget Error
            </Typography>

            <Typography variant="body2" className="text-center mb-4 max-w-full overflow-hidden text-ellipsis">
                {getErrorMessage()}
            </Typography>

            <div className="flex gap-2">
                <IconButton
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={handleRefresh}
                    color="inherit"
                    aria-label="Refresh widget"
                >
                    <RefreshIcon fontSize="small" />
                </IconButton>

                <RemoveWidgetButton
                    onRemove={onRemove}
                    darkMode={mode === "dark"}
                />
            </div>
        </div>
    );
}