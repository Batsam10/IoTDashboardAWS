import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  CircularProgress,
} from "@mui/material";
import { FC } from "react";
import { IDropdown } from "../models/interfaces";

const Dropdown: FC<IDropdown> = ({
  handleChange,
  value,
  label,
  menuItems,
  loading,
}) => {
  return (
    <Stack direction='row' spacing={0.5} alignItems='center'>
      <FormControl fullWidth>
        <InputLabel id="simple-select-label">{label}</InputLabel>
        <Select
          labelId="simple-select-label"
          id="simple-select"
          value={value}
          label={label}
          onChange={handleChange}
          disabled={loading}
          size="small"
        >
          {menuItems.map((item) => (
            <MenuItem key={item.name} value={item.value}>{item.name}</MenuItem>
          ))}
        </Select>
      </FormControl>
      {loading && <CircularProgress/>}
    </Stack>
  );
};

export default Dropdown;
