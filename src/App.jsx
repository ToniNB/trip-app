import React, { Component } from 'react';
import { Map, GoogleApiWrapper, Polyline, Marker, InfoWindow } from 'google-maps-react';
import decodePolyline from 'decode-google-map-polyline';

import './App.scss';

export class MapContainer extends Component {
  constructor(props) {
    super(props);

    this.state = {
        data: [],
        route: '',
        tripSelected: '',
        stops: [],
        originMarker: '',
        finalMarker: '',
        centerRoute: '',
        showingInfoWindow: false,
        activeMarker: {},
        selectedPlace: {},
    };
  }

  async componentDidMount() {
    const url = "https://europe-west1-metropolis-fe-test.cloudfunctions.net/api/trips";
    const response = await fetch(url);
    const data = await response.json();
    console.log(data);
    this.setState({ data });
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

  render() {
    const { 
      data, 
      route, 
      tripSelected, 
      stops,
      originMarker,
      finalMarker,
      centerRoute, 
    } = { ...this.state };
    const { google } = { ...this.props };

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
          <p>{trip.description}</p>
          <p>{trip.status}</p>
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
              marker={this.state.activeMarker}
              visible={this.state.showingInfoWindow}>
                <div className="infoWindow">
                  <p>{this.state.selectedPlace.name}</p>
                </div>
            </InfoWindow>,
          ]
        : ''
        }
      </Map>
    ;

    return (
      <div className="trip-app">
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