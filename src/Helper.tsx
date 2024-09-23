import CloseIcon from "@mui/icons-material/Close";
import {
    Alert,
    AlertTitle,
    Box,
    Collapse,
    IconButton,
    Typography,
} from "@mui/material";
import { useState } from "react";

export function Helper() {
    const [open, setOpen] = useState<boolean>(true);
    return (
        <Box
            sx={{
                position: "absolute",
                bgcolor: "background.paper",
                boxShadow: 2,
                borderRadius: 2,
                bottom: "12px",
                width: "50vw",
                left: "25vw",
            }}
        >
            <Collapse in={open}>
                <Alert
                    severity="info"
                    action={
                        <IconButton
                            aria-label="close"
                            color="inherit"
                            size="small"
                            onClick={() => {
                                setOpen(false);
                            }}
                        >
                            <CloseIcon fontSize="inherit" />
                        </IconButton>
                    }
                >
                    <AlertTitle>
                        <Typography variant="h6">
                            How to determine if an address is within a Custom
                            Road Attributes zone
                        </Typography>
                    </AlertTitle>
                    <Typography gutterBottom>
                        This tutorial illustrates how custom Custom Road
                        Attributes scenarios can be used together with the PTV
                        Geocoding & Places API to determine if an address is
                        within a Custom Road Attributes scenario. The scenario
                        used in this tutorial contains the competition venues.
                    </Typography>
                    <Typography>
                        In this tutorial, time validities contained in the
                        scenario are not considered.
                    </Typography>
                </Alert>
            </Collapse>
        </Box>
    );
}
