// Generated Using ChatGPT
declare module 'leaflet-minimap' {
  import { Control, Layer, LatLng, Map, PathOptions } from 'leaflet';

  interface MiniMapOptions {
    position?: string;
    toggleDisplay?: boolean;
    zoomLevelOffset?: number;
    zoomLevelFixed?: number | false;
    centerFixed?: LatLng | false;
    zoomAnimation?: boolean;
    autoToggleDisplay?: boolean;
    minimized?: boolean;
    width?: number;
    height?: number;
    collapsedWidth?: number;
    collapsedHeight?: number;
    aimingRectOptions?: PathOptions;
    shadowRectOptions?: PathOptions;
    strings?: {
      hideText?: string;
      showText?: string;
    };
    mapOptions?: L.MapOptions;
  }

  class MiniMap extends Control {
    constructor(layer: Layer, options?: MiniMapOptions);
    addTo(map: Map): this;
    onRemove(map: Map): void;
    changeLayer(layer: Layer): void;
  }
  
  // Expose MiniMap globally as part of L.Control
  export default MiniMap;
}
