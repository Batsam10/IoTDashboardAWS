import {
  Alert,
  Paper,
  SelectChangeEvent,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { FC, useEffect, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Dropdown from "../../../components/dropdown";
import { database, machineStatusTable } from "../../../models/consts";
import { IDevice, IMenuItem, ISeries } from "../../../models/interfaces";
import { useTimeStream } from "../../../providers/timestream-provider";
import { formatDate } from "../../../utils";

const DeviceChart: FC = () => {
  const [devices, setDevices] = useState<IMenuItem[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<string>();
  const [deviceLineData, setDeviceLineData] = useState<ISeries[]>([]);
  const [allDeviceData, setAllDeviceData] = useState<IDevice[]>([]);

  const theme = useTheme();
  const { rawQuery, canQueryTimestream } = useTimeStream();

  useEffect(() => {
    if (!canQueryTimestream || devices.length > 0) {
      return;
    }
    (async () => {
      setDevicesLoading(true);

      const query1 = `SELECT
            time,
            MAX(if(measure_name = 'DC', measure_value::double)) AS DC,
            MAX(if(measure_name = 'ambient', measure_value::double)) AS ambient,
            MAX(if(measure_name = 'exhaust', measure_value::double)) AS exhaust,
            MAX(if(measure_name = 'hostname', measure_value::varchar)) AS hostname  
        FROM ${database}.${machineStatusTable}
        WHERE time >= ago(1h)
        GROUP BY time
        ORDER BY time`;

      var results = await rawQuery(query1);

      const data = results.Rows?.map((r) => r.Data) as any[];
      const transformedData: IDevice[] = data.map((item) => ({
        time: formatDate(item[0].ScalarValue),
        dc: item[1].ScalarValue,
        ambient: item[2].ScalarValue,
        exhaust: item[3].ScalarValue,
        hostname: item[4].ScalarValue,
      }));

      const uniqueHostnames = [
        ...new Set(transformedData.map((x) => x.hostname)),
      ];

      if (uniqueHostnames.length === 0) {
        return;
      }

      const deviceMenuItems = uniqueHostnames.map((item) => ({
        name: item,
        value: item,
      }));
      setSelectedDevice(deviceMenuItems[0].value);
      setDevices(deviceMenuItems);
      setAllDeviceData(transformedData);
      setDevicesLoading(false);
    })();
  }, [canQueryTimestream]);

  useEffect(() => {
    if (selectedDevice) {
      const data = allDeviceData.filter((x) => x.hostname === selectedDevice);
      const dcSeries: ISeries = {
        color: theme.palette.action.disabled,
        name: "DC",
        data: data.map((item) => ({
          category: formatDate(item.time),
          value: item.dc,
        })),
      };
      const ambientSeries: ISeries = {
        color: theme.palette.primary.main,
        name: "Ambient",
        data: data.map((item) => ({
          category: formatDate(item.time),
          value: item.ambient,
        })),
      };
      const exhaustSeries: ISeries = {
        color: theme.palette.secondary.main,
        name: "Exhaust",
        data: data.map((item) => ({
          category: formatDate(item.time),
          value: item.exhaust,
        })),
      };
      setDeviceLineData([dcSeries, ambientSeries, exhaustSeries]);
    }
  }, [selectedDevice]);

  const handleDeviceChange = (event: SelectChangeEvent) => {
    setSelectedDevice(event.target.value);
  };

  if (deviceLineData.length === 0 && !devicesLoading) {
    return (
      <Alert variant="outlined" severity="info">
        No data found
      </Alert>
    );
  }

  return (
    <Stack spacing={1}>
      <Dropdown
        value={selectedDevice ?? ""}
        loading={devicesLoading}
        label="Select device"
        menuItems={devices}
        handleChange={handleDeviceChange}
      />
      {deviceLineData.length > 0 && !devicesLoading && (
        <Paper>
          <Typography variant="body1" sx={{textAlign:'center'}}>
            Device details (last hour)
          </Typography>
          <ResponsiveContainer width="99%" aspect={3}>
            <LineChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="category"
                type="category"
                allowDuplicatedCategory={false}
              />
              <YAxis dataKey="value" />
              <Tooltip />
              <Legend />
              {deviceLineData.map((s) => (
                <Line
                  dataKey="value"
                  data={s.data}
                  name={s.name}
                  key={s.name}
                  type="monotone"
                  stroke={s.color}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </Paper>
      )}
    </Stack>
  );
};

export default DeviceChart;
