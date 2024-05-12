import { Box, useTheme } from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { FC } from "react";
import { useMQTT } from "../../providers/mqtt-provider";
import { useTimeStream } from "../../providers/timestream-provider";
import DeviceChart from "./components/device-chart";
import DashboardHeading from "./components/dashboard-headiing";

const Dashboard: FC = () => {
  const theme = useTheme();
  const { freeVendMessage, statusMessage, vendEventsMessage } = useMQTT();
  const { loading, canQueryTimestream } = useTimeStream();

  if (loading || !canQueryTimestream) {
    return (
      <Stack
        justifyContent="center"
        alignItems="center"
        sx={{ height: "100%" }}
      >
        <CircularProgress />
      </Stack>
    );
  }

  console.log(freeVendMessage);
  console.log(statusMessage);
  console.log(vendEventsMessage);



  return (
    <Box sx={{ height: "100%" }}>
      <Stack p={2} spacing={3}>
        <DashboardHeading/>
        <DeviceChart/>
      </Stack>
    </Box>
  );
};

export default Dashboard;
