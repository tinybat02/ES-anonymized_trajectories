import React, { PureComponent } from 'react';
import { PanelProps } from '@grafana/data';
import { PanelOptions, Frame } from 'types';
import { Map, View } from 'ol';
import XYZ from 'ol/source/XYZ';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { fromLonLat } from 'ol/proj';
import { defaults, DragPan, MouseWheelZoom } from 'ol/interaction';
import { platformModifierKeyOnly } from 'ol/events/condition';
import Feature from 'ol/Feature';
import { processData, createLayer } from './utils/helpers';
import { nanoid } from 'nanoid';
import 'ol/ol.css';

interface Props extends PanelProps<PanelOptions> {}
interface State {
  currentTrace: string;
  listTrace: string[];
}

export class MainPanel extends PureComponent<Props, State> {
  id = 'id' + nanoid();
  map: Map;
  randomTile: TileLayer;
  traceLayer: VectorLayer;
  traceObj: { [key: string]: Feature[] };

  state: State = {
    currentTrace: 'None',
    listTrace: [],
  };

  componentDidMount() {
    const { tile_url, zoom_level, center_lon, center_lat } = this.props.options;

    const carto = new TileLayer({
      source: new XYZ({
        url: 'https://{1-4}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      }),
    });

    this.map = new Map({
      interactions: defaults({ dragPan: false, mouseWheelZoom: false, onFocusOnly: true }).extend([
        new DragPan({
          condition: function(event) {
            return platformModifierKeyOnly(event) || this.getPointerCount() === 2;
          },
        }),
        new MouseWheelZoom({
          condition: platformModifierKeyOnly,
        }),
      ]),
      layers: [carto],
      view: new View({
        center: fromLonLat([center_lon, center_lat]),
        zoom: zoom_level,
      }),
      target: this.id,
    });

    if (tile_url !== '') {
      this.randomTile = new TileLayer({
        source: new XYZ({
          url: tile_url,
        }),
        zIndex: 1,
      });
      this.map.addLayer(this.randomTile);
    }

    if (this.props.data.series.length > 0) {
      const serie = this.props.data.series[0] as Frame;
      this.traceObj = processData(serie);
      this.setState({ listTrace: Object.keys(this.traceObj) });
    }
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    if (prevProps.data.series !== this.props.data.series) {
      this.setState({ currentTrace: 'None', listTrace: [] });
      this.map.removeLayer(this.traceLayer);

      if (this.props.data.series.length > 0) {
        const serie = this.props.data.series[0] as Frame;
        this.traceObj = processData(serie);
        this.setState({ listTrace: Object.keys(this.traceObj) });
      }
    }

    if (prevProps.options.tile_url !== this.props.options.tile_url) {
      this.map.removeLayer(this.randomTile);
      if (this.props.options.tile_url !== '') {
        this.randomTile = new TileLayer({
          source: new XYZ({
            url: this.props.options.tile_url,
          }),
          zIndex: 1,
        });
        this.map.addLayer(this.randomTile);
      }
    }

    if (prevProps.options.zoom_level !== this.props.options.zoom_level) {
      this.map.getView().setZoom(this.props.options.zoom_level);
    }

    if (
      prevProps.options.center_lat !== this.props.options.center_lat ||
      prevProps.options.center_lon !== this.props.options.center_lon
    ) {
      this.map.getView().animate({
        center: fromLonLat([this.props.options.center_lon, this.props.options.center_lat]),
        duration: 2000,
      });
    }

    if (prevState.currentTrace !== this.state.currentTrace) {
      this.map.removeLayer(this.traceLayer);

      if (this.state.currentTrace !== 'None') {
        this.traceLayer = createLayer(this.traceObj[this.state.currentTrace]);
        this.map.addLayer(this.traceLayer);
      }
    }
  }

  handleSelector = (e: React.ChangeEvent<HTMLSelectElement>) => {
    this.setState({ currentTrace: e.target.value });
  };

  render() {
    const { width, height } = this.props;
    const { currentTrace, listTrace } = this.state;

    return (
      <div style={{ width, height }}>
        <select id="selector" style={{ width: 350 }} onChange={this.handleSelector} value={currentTrace}>
          <option value="None">None</option>
          {listTrace.map(item => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <div
          id={this.id}
          style={{
            width,
            height: height - 40,
          }}
        />
      </div>
    );
  }
}
