import { IApplicationSettings } from "./interfaces";

export const applicationData: IApplicationSettings = {
  clientId: process.env.REACT_APP_CLIENT_ID as string,
  accessKeyId: process.env.REACT_APP_ACCESS_KEY as string,
  secretAccessKey: process.env.REACT_APP_SECRET_KEY as string,
  sessionToken: "",
  region: process.env.REACT_APP_REGION as string,
  endpoint: process.env.REACT_APP_ENDPOINT as string,
  topic: process.env.REACT_APP_STATUS_TOPIC as string,
};

export const database:string = 'everest';
export const machineStatusTable:string = 'machineStatus';
export const vendEventsTable:string = 'vendEvents';

export const mqqtTopics: TopicType[] = [
  "reactTest/vendEvents",
  "reactTest/status",
  "reactTest/freeVend",
];

export type TopicType =
  | "reactTest/status"
  | "reactTest/vendEvents"
  | "reactTest/freeVend";
