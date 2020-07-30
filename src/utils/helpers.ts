import { Vector as VectorLayer } from 'ol/layer';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Polygon from 'ol/geom/Polygon';
import { Frame, MinMax } from '../types';
import { Style, Fill, Stroke, Text } from 'ol/style';

export const createLayer = (features: Feature[]) =>
  new VectorLayer({
    source: new VectorSource({
      features: features,
    }),
    zIndex: 2,
  });

export const createPolygon = (long: MinMax, lat: MinMax, label: string) => {
  const polygonFeature = new Feature({
    type: 'Polygon',
    geometry: new Polygon([
      [
        [long.min, lat.min],
        [long.max, lat.min],
        [long.max, lat.max],
        [long.min, lat.max],
      ],
    ]).transform('EPSG:4326', 'EPSG:3857'),
  });
  polygonFeature.setStyle(
    new Style({
      fill: new Fill({
        color: 'rgba(255, 255, 255, 0.2)',
      }),
      stroke: new Stroke({
        color: '#49A8DE',
      }),
      text: new Text({
        stroke: new Stroke({
          color: '#ccc',
          width: 1,
        }),
        font: '14px Calibri,sans-serif',
        text: label,
        overflow: true,
      }),
    })
  );

  return polygonFeature;
};

export const processData = (data: Frame) => {
  const obj: { [key: string]: Feature[] } = {};
  data.fields[0].values.buffer.map(row => {
    if (!Array.isArray(row.points_list)) {
      if (row.points_list.lat.min !== 0) {
        obj[row.name.toString()] = [createPolygon(row.points_list.long, row.points_list.lat, 'P1')];
      }
    } else {
      const pFeatures: Feature[] = [];
      row.points_list.map((point, i) => {
        if (point.lat.min !== 0) {
          pFeatures.push(createPolygon(point.long, point.lat, `P${i + 1}`));
        }
      });

      obj[row.name.toString()] = pFeatures;
    }
  });

  return obj;
};
