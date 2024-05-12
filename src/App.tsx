import "./App.css";
import { applicationData } from "./models/consts";
import Dashboard from "./pages/dashboard";
import MQTTProvider from "./providers/mqtt-provider";
import TimestreamProvider from "./providers/timestream-provider";
import Box from "@mui/material/Box";

function App() {
  return (
    <Box sx={{ height: '100%', width: '100%'}}>
      <TimestreamProvider settings={applicationData}>
        <MQTTProvider settings={applicationData}>
          <Dashboard />
        </MQTTProvider>
      </TimestreamProvider>
    </Box>
  );
}

export default App;
