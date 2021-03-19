"use strict";

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector(".form");
// const containerWorkouts =;

class Workouts {
  date = new Date();
  id = (Date.now() + "").slice(-10);

  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }
}

class Running extends Workouts {
  type = "running";
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
  }
  calcPace() {
    this.pace = this.duration / this.distance;
  }
}

class Cycling extends Workouts {
  type = "cycling";
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
  }
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
  }
}

const inputType = document.querySelector(".form__input");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");

class App {
  #map;
  #mapEvent;
  #data = [];

  constructor() {
    this._getPosition();
    form.addEventListener("submit", this._newWorkout.bind(this));
    inputType.addEventListener("change", this._toggleElevationField);
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert("could not get location");
        }
      );
  }

  _loadMap(position) {
    console.log(position);
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    console.log(`https://www.google.com/maps/@${latitude},${longitude},13.99z`);
    const coordinates = [latitude, longitude];

    this.#map = L.map("map").setView(coordinates, 15);
    console.log(map);

    L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on("click", this._showForm.bind(this));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove("hidden");
    inputDistance.focus();
  }

  _toggleElevationField() {
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
  }

  _newWorkout(e) {
    const input = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    let workout;

    const isFinite = (...inputs) => inputs.every((inp) => Number.isFinite(inp));
    const isPositive = (...inputs) => inputs.every((el) => el > 0);

    const { lat, lng } = this.#mapEvent.latlng;
    e.preventDefault();

    // show running
    if (input === "running") {
      const cadence = +inputCadence.value;
      if (
        !isFinite(distance, duration, cadence) ||
        !isPositive(distance, duration, cadence)
      )
        return alert("put proper value");
      workout = new Running([lat, lng], distance, duration, cadence);
      this.#data.push(workout);
    }

    // show cycling
    if (input === "cycling") {
      const elevation = +inputElevation.value;
      if (
        !isFinite(distance, duration, elevation) ||
        !isPositive(distance, duration)
      )
        return alert("put proper value");
      workout = new Cycling([lat, lng], distance, duration, elevation);
      console.log(workout);
      this.#data.push(workout);
    }

    this._renderWorkoutOnMap(workout);

    inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value =
      "";
  }

  _renderWorkoutOnMap(data) {
    L.marker(data.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${data.type}-popup`,
        })
      )
      .setPopupContent("workout")
      .openPopup();
  }
}

const app = new App();
console.log();
