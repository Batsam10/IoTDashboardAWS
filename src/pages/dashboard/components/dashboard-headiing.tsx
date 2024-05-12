import { Button, Stack, Typography, alpha, useTheme } from "@mui/material";
import { FC } from "react";

const DashboardHeading: FC = () => {
  const theme = useTheme();

  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      spacing={1}
      sx={{ background: alpha(theme.palette.primary.main, 0.1), p: 1 }}
    >
      <Typography variant="h6">Dashboard</Typography>
      <Button title="Open dashboard settings" variant="contained">Settings</Button>
    </Stack>
  );
};

export default DashboardHeading;
