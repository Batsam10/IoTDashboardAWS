import { SelectChangeEvent } from '@mui/material';
import { ReactNode } from 'react';

export interface  IApplicationSettings {
    clientId: string;
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken: string;
    region: string;
    endpoint: string;
    topic: string;
}

export interface IQuerySettings { 
    interval:string;
    measures:INameType[]; 
    groupInterval:string; 
    groupAggregation: string; 
    filters: IFilter[]; 
}

export interface IFilter{
    dimention: INameType;
    operator: string;
    value: string;
}

export interface INameType{
    type:string;
    name:string;
}

export interface IProvider{
    children: ReactNode;
    settings: IApplicationSettings;
}

export interface ISeriesItem{
    category: any;
    value: any;
}

export interface ISeries{
    color: string;
    name: string;
    data: ISeriesItem[];
}

export interface IDevice{
    time:string;
    dc: number;
    ambient: number;
    exhaust: number;
    hostname: string;
}

export interface IDropdown{
    handleChange: (event: SelectChangeEvent) => void;
    value: string;
    label: string;
    loading: boolean;
    menuItems: IMenuItem[];
}

export interface IMenuItem{
    name: string;
    value: string;
}