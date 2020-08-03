import { Vector as VectorLayer } from 'ol/layer';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import { Frame, MinMax } from '../types';
import { Style, Fill, Stroke, Text, Circle } from 'ol/style';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';

export const createLayer = (features: Feature[]) =>
  new VectorLayer({
    source: new VectorSource({
      features: features,
    }),
    zIndex: 2,
  });

export const getCenterPolygon = (long: MinMax, lat: MinMax) => {
  // const polygon = createGeoPolygon([
  //   [
  //     [long.min, lat.min],
  //     [long.max, lat.min],
  //     [long.max, lat.max],
  //     [long.min, lat.max],
  //     [long.min, lat.min],
  //   ],
  // ]);

  // return centroid(polygon as FeatureGeojson).geometry.coordinates;
  return [(long.min + long.max) / 2, (lat.min + lat.max) / 2];
};

const createLineString = (arr: number[][]) => {
  const lineFeature = new Feature(new LineString(arr).transform('EPSG:4326', 'EPSG:3857'));
  lineFeature.setStyle(
    new Style({
      stroke: new Stroke({
        color: '#49A8DE',
        width: 15,
      }),
    })
  );
  return lineFeature;
};

const createPoints = (arr: number[][]) => {
  return arr.map((coord, i) => {
    const pointFeature = new Feature(new Point(coord).transform('EPSG:4326', 'EPSG:3857'));

    pointFeature.setStyle(
      new Style({
        image: new Circle({
          radius: 5,
          fill: new Fill({
            color: 'rgba(255, 255, 255, 0.5)',
          }),
        }),
        text: new Text({
          stroke: new Stroke({
            color: '#ccc',
            width: 1,
          }),
          font: '14px Calibri,sans-serif',
          text: `${i + 1}`,
        }),
      })
    );
    return pointFeature;
  });
};

export const processData = (data: Frame) => {
  const obj: { [key: string]: Feature[] } = {};
  data.fields[0].values.buffer.map(row => {
    if (Array.isArray(row.points_list) && row.points_list.length >= 5) {
      const arrPoints: number[][] = [];
      row.points_list.map((point, i) => {
        if (point.lat.min !== 0) {
          arrPoints.push(getCenterPolygon(point.long, point.lat));
        }
      });

      obj[row.name.toString()] = [createLineString(arrPoints), ...createPoints(arrPoints)];
    }
  });

  return obj;
};
