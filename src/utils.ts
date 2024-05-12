import moment from "moment";

export const cleanName = (name: string) => name.replace("-", "_");

export const convertValue = (type: string, value: string) => {
  switch (type) {
    case "varchar":
      return `'${value}'`;
    default:
      return value;
  }
};

export const formatDate = (date: string) => {
  return moment(date).format("YYYY-MM-DD hh:mm");
};
