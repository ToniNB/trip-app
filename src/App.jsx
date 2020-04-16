import React, { Component } from 'react';
import { Map, GoogleApiWrapper, Polyline, Marker, InfoWindow } from 'google-maps-react';
import decodePolyline from 'decode-google-map-polyline';
import 'bootstrap/dist/css/bootstrap.css';

import './App.scss';

export class MapContainer extends Component {
  constructor(props) {
    super(props);

    this.state = {
        data: [],
        dataStops: [],
        route: '',
        tripSelected: '',
        stops: [],
        originMarker: '',
        finalMarker: '',
        centerRoute: '',
        showingInfoWindow: false,
        activeMarker: {},
        selectedPlace: {},
        height: '',
    };
    this.updateWindowDimensions = this.updateWindowDimensions.bind(this);
  }

  async componentDidMount() {
    const url = "https://europe-west1-metropolis-fe-test.cloudfunctions.net/api/trips";
    const response = await fetch(url);
    const data = await response.json();
    const urlStops = "https://europe-west1-metropolis-fe-test.cloudfunctions.net/api/stops";
    const responseStops = await fetch(urlStops);
    const dataStops = await responseStops.json();
    console.log(data);
    console.log(dataStops);
    this.setState({ data, dataStops });
    this.updateWindowDimensions();
    window.addEventListener('resize', this.updateWindowDimensions);
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this.updateWindowDimensions);
  }

  updateWindowDimensions() {
    this.setState({ height: window.innerHeight });
  }

  handleClick = (trip, index) => {
    const route = decodePolyline(trip.route);
    const centerRoute = route[Math.round((route.length - 1) / 2)]; 
    const stops = trip.stops;
    const tripSelected = index;
    const originMarker = trip.origin.point;
    const finalMarker = trip.destination.point;

    this.setState({ 
      route, 
      tripSelected, 
      stops,
      originMarker,
      finalMarker,
      centerRoute
     });
  }

  onMarkerClick = (props, marker) => {
    this.setState({
      selectedPlace: props,
      activeMarker: marker,
      showingInfoWindow: true
    });
  }

  dateFormatter = date =>{
    const parts = date.slice(0, -1).split('T');
    const dateComponent = new Date(parts[0]);
    const timeComponent = parts[1].slice(0, -4);;
    const dateOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    const dateFormatted = `${dateComponent.toLocaleDateString('es-ES', dateOptions)} - ${timeComponent}`
    return dateFormatted;
  }

  render() {
    const { 
      data, 
      route, 
      tripSelected, 
      stops,
      originMarker,
      finalMarker,
      centerRoute, 
      height,
      activeMarker,
      showingInfoWindow,
      selectedPlace,
    } = { ...this.state };
    const { google } = { ...this.props };

    const ongoing = "En camino";
    const scheduled = "Programado";
    const cancelled = "Cancelado";
    const finalized = "Finalizado";

    const mapStyles = {
      position: 'relative',
      width: '100%',
      height: '100%'
    };

    const trips = data.map ((trip, index) => (
      (
        <div
          key={index}
          className={`trip-item ${tripSelected === index ? 'selected' : ''}`}
          onClick={this.handleClick.bind(this, trip, index)}
        > 
          <h5>{trip.description}</h5>
          <p>{`Conductor: ${trip.driverName}`}</p>
          <p>Estado: {' '}
            {trip.status === "ongoing" ? ongoing :
              trip.status === "scheduled" ? scheduled :
              trip.status === "cancelled" ? cancelled :
              trip.status === "finalized" ? finalized :
              ''
            }
          </p>
          <p>{this.dateFormatter(trip.startTime)}</p>
          <p>{this.dateFormatter(trip.endTime)}</p>
        </div>
      )
    ));

    const stopMarkers = stops.map (marker => (
      (
        marker.id !== undefined ? 
          <Marker
            key={marker.id}
            position={{lat: marker.point._latitude, lng: marker.point._longitude }}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 5,
            }}
            onClick={this.onMarkerClick}
            name={'Stop'}
          />
        : ''
      )
    ));

    const customMap = 
      <Map
        google={google}
        zoom={11}
        style={mapStyles}
        center={ centerRoute === '' ? {
            lat: 41.496227,
            lng: 1.902768
          } : centerRoute
        }
      >
        {tripSelected !== '' ?
          [
            <Polyline
              path={route}
              options={{ 
                strokeColor: "#FF0000",
                strokeOpacity: 1,
                strokeWeight: 2,
              }}
            />,
            <Marker
              position={{lat: originMarker._latitude, lng: originMarker._longitude }}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 5,
              }}
              onClick={this.onMarkerClick}
              name={'Origen'}
            />,
            <Marker
              position={{lat: finalMarker._latitude, lng: finalMarker._longitude }}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 5,
              }}
              onClick={this.onMarkerClick}
              name={'Destino'}
            />,
            stopMarkers,
            <InfoWindow
              marker={activeMarker}
              visible={showingInfoWindow}>
                <div className="infoWindow">
                  <p>{selectedPlace.name}</p>
                </div>
            </InfoWindow>,
          ]
        : ''
        }
      </Map>
    ;
        console.log(window.innerHeight);
    return (
      <div className="trip-app" style={{height: height}}>
        <div className="container">
          <div className="row">
            <div className="col-4 trip-list">
              {trips}
            </div>
            <div className="col-8">
              {customMap}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default GoogleApiWrapper({
  apiKey: 'AIzaSyD1aCwKJ42a5xoT7lk4EEgdHueW0vMY8TA'
})(MapContainer);