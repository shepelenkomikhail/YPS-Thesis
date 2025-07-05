import { IconButton } from "@mui/material";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";

export default function RemoveWidgetButton({onRemove, darkMode}:{onRemove: () => void, darkMode: boolean}) {
    return (
        <IconButton
            onMouseDown={(e) => {e.stopPropagation();}}
            onClick={(e) => {
                e.stopPropagation();
                onRemove();
            }}
            sx={{
                position: "absolute",
                top: "2px", right: "0",
                color: darkMode ? "white" : "default", "&:hover": {backgroundColor: "rgba(255, 255, 255, 0.1)",},}}
        >
            <RemoveCircleOutlineIcon sx={{ fontSize: 24 }} />
        </IconButton>
    );
}