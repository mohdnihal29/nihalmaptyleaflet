"use strict";

class Workouts {
  date = new Date();
  id = (Date.now() + "").slice(-10);
  clicks = 0;

  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }

  _setDescripton() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(
      1
    )}  on  ${months[this.date.getMonth()]}  ${this.date.getDate()}`;
  }

  click() {
    this.clicks++;
  }
}

class Running extends Workouts {
  type = "running";
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescripton();
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
    this._setDescripton();
  }
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
  }
}
const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");

class App {
  #map;
  #zoomLevel = 15;
  #mapEvent;
  #data = [];

  constructor() {
    this._getPosition();

    // get data from local storage
    this._getLocalStorage();
    form.addEventListener("submit", this._newWorkout.bind(this));
    inputType.addEventListener("change", this._toggleElevationField);
    containerWorkouts.addEventListener("click", this._moveToMarker.bind(this));
    this.clicks++;
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
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    console.log(`https://www.google.com/maps/@${latitude},${longitude},13.99z`);
    const coordinates = [latitude, longitude];

    this.#map = L.map("map").setView(coordinates, this.#zoomLevel);
    // console.log(map);

    L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on("click", this._showForm.bind(this));

    this.#data.forEach((work) => {
      this._renderWorkoutOnMap(work);
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove("hidden");
    inputDistance.focus();
  }

  _hideForm() {
    inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value =
      "";
    form.style.display = "none";
    form.classList.add("hidden");
    setTimeout(() => (form.style.display = "grid"), 1000);
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
      console.log(workout);
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

      // Add new objects to workout Array
      this.#data.push(workout);
    }

    // Render workout on Map
    this._renderWorkoutOnMap(workout);

    // Render Workout on List
    this._renderWorkoutOnForm(workout);

    //Hide form plus clear input field
    this._hideForm();

    // set content to Local storage
    this._setLocalStorage();
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
      .setPopupContent(
        `${data.type === "running" ? "🏃‍♂️" : "🚴‍♀️"} ${data.description} `
      )
      .openPopup();
  }

  _renderWorkoutOnForm(data) {
    let html = `
       <li class="workout workout--${data.type}" data-id="${data.id}">
          <h2 class="workout__title">${data.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              data.type === "running" ? "🏃‍♂️" : "🚴‍♀️"
            }</span>
            <span class="workout__value">${data.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${data.duration}</span>
            <span class="workout__unit">min</span>
          </div>
          `;

    if (data.type === "running")
      html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${data.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${data.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>
        `;

    if (data.type === "cycling")
      html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${data.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${data.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>
        `;

    form.insertAdjacentHTML("afterend", html);
  }

  _moveToMarker(e) {
    const target = e.target.closest(".workout");

    if (!target) return;
    const workout = this.#data.find((el) => el.id === target.dataset.id);

    this.#map.setView(workout.coords, this.#zoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
    // workout.click();
  }

  _setLocalStorage() {
    localStorage.setItem("workout", JSON.stringify(this.#data));
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem("workout"));

    if (!data) return;

    this.#data = data;
    // console.log(data);

    this.#data.forEach((work) => {
      this._renderWorkoutOnForm(work);
    });
  }

  reset() {
    localStorage.removeItem("workout");
    location.reload();
  }
}

const app = new App();
