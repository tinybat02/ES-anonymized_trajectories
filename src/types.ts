import { DataFrame, Field, Vector } from '@grafana/data';

export interface FeatureGeojson {
  type: string;
  properties: {
    [key: string]: string;
    name: string;
  };
  geometry: {
    type: string;
    coordinates: number[][][];
  };
}

export interface PanelOptions {
  center_lat: number;
  center_lon: number;
  tile_url: string;
  zoom_level: number;
}

export const defaults: PanelOptions = {
  center_lat: 48.262725,
  center_lon: 11.66725,
  tile_url: '',
  zoom_level: 18,
};

export interface MinMax {
  min: number;
  max: number;
}

interface TraceData {
  name: number;
  points_list: { lat: MinMax; long: MinMax; time: MinMax } | Array<{ lat: MinMax; long: MinMax; time: MinMax }>;
  timestamp: number;
}

export interface Buffer extends Vector {
  buffer: TraceData[];
}

export interface FieldBuffer extends Field<any, Vector> {
  values: Buffer;
}

export interface Frame extends DataFrame {
  fields: FieldBuffer[];
}
