<template>
  <div class="full-page">
    <button type="button" class="btn" @click="createMarker">Crear marcador</button>
    <div id="map"></div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import mapboxgl from 'mapbox-gl';
import axios from 'axios';
import { Place } from '@/interfaces/interfaces';
import WebsocketService from '@/services/webSocketService';

type resMarkers = Record<string, Place>

@Component
export default class MapBox extends Vue {
  map!: mapboxgl.Map;
  places: resMarkers = {};
  markerMapbox: Record<string, mapboxgl.Marker> = {}
  ws = WebsocketService.instance;

  created() {
    this.listenSockets();
  }

  async mounted() {
    await this.getMarkers();
    this.createMap();
  }

  listenSockets() {
    this.ws.listen('new-marker', (marker: Place) => {
      this.addMarker(marker);
    });

    this.ws.listen('delete-marker', (id: string) => {
      this.markerMapbox[id].remove();
      delete this.markerMapbox[id];
    });

    this.ws.listen('move-marker', (marker: Place) => {
      this.markerMapbox[marker.id].setLngLat([ marker.lng, marker.lat ])
    });
  }

  async getMarkers() {
    const { data } = await axios.get<resMarkers>(`${process.env.VUE_APP_API}/map`);
    this.places = data;
  }

  async createMap(): Promise<void> {
    try {
      mapboxgl.accessToken = process.env.VUE_APP_MAPBOX_TOKEN;
      this.map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [-75.75512993582937, 45.349977429009954],
        zoom: 15.8,
      });
    } catch (err) {
      console.log('map error', err);
    }

    for (const [, marker] of Object.entries(this.places)) {
      this.addMarker(marker);
    }
  }

  addMarker(marker: Place): void {
    /* const html = `<h2>${marker.name}</h2>
                  <br>
                  <button type="button">Delete</button>`; */
    
    const h2 = document.createElement('h2');
    h2.innerText = marker.name;

    const btnDelete = document.createElement('button');
    btnDelete.innerText = 'Delete';

    const div = document.createElement('div');
    div.append(h2, btnDelete);

    const customPopup = new mapboxgl.Popup({
      offset: 25,
      closeOnClick: false,
    /* }).setHTML(div); */
    }).setDOMContent(div);

    const newMarker = new mapboxgl.Marker({
      draggable: true,
      color: marker.color,
    })
      .setLngLat([marker.lng, marker.lat])
      .setPopup(customPopup)
      .addTo(this.map);
    
    btnDelete.addEventListener('click', () => {
      newMarker.remove();
      this.ws.emit('delete-marker', marker.id);
    });

    newMarker.on('drag', () => {
      const lngLat = newMarker.getLngLat();
      const markerEmit = {
        id: marker.id,
        ...lngLat
      }
      this.ws.emit('move-marker', markerEmit);
    });

    this.markerMapbox[marker.id] = newMarker;
  }

  createMarker() {
    const customMarker: Place = {
      id: new Date().toISOString(),
      name: 'empty',
      lng: -75.75512993582937,
      lat: 45.349977429009954,
      color: '#' + Math.floor(Math.random() * 16777215).toString(16)
    }
    this.addMarker(customMarker);
    
    // emitir new-marker
    this.ws.emit('new-marker', customMarker);
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.btn {
  position: fixed;
  top: 10px;
  right: 5px;
  padding: 5px;
  z-index: 1;
}

#map {
  width: 100%;
  height: 100%;
}
</style>
