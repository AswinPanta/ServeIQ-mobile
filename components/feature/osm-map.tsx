import React from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

interface OSMMapProps {
  latitude: number;
  longitude: number;
  title?: string;
  zoom?: number;
  style?: object;
}

function buildHtml({ latitude, longitude, title, zoom = 15 }: OSMMapProps) {
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html, body, #map { margin:0; padding:0; width:100%; height:100%; }
  .leaflet-control-attribution { display: none !important; }
</style>
</head>
<body>
<div id="map"></div>
<script>
  var map = L.map('map', {
    zoomControl: false,
    attributionControl: false,
    scrollWheelZoom: false,
    dragging: false,
    doubleClickZoom: false,
    touchZoom: false
  }).setView([${latitude}, ${longitude}], ${zoom});
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
  }).addTo(map);
  L.marker([${latitude}, ${longitude}])
    .addTo(map)
    .bindPopup(${JSON.stringify(title || '')})
    .openPopup();
</script>
</body>
</html>`;
}

export function OSMMap({ latitude, longitude, title, zoom, style }: OSMMapProps) {
  return (
    <WebView
      source={{ html: buildHtml({ latitude, longitude, title, zoom }) }}
      style={[styles.map, style]}
      scrollEnabled={false}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  map: { width: '100%', height: '100%' },
});
