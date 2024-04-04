import * as Carousel from "./Carousel.js";
import axios from "axios";

const breedSelect = document.getElementById("breedSelect");
const infoDump = document.getElementById("infoDump");
const progressBar = document.getElementById("progressBar");
const getFavouritesBtn = document.getElementById("getFavouritesBtn");

const API_KEY =
  "live_9NE96Ozt8hP6HX1i6P9DM3XYrPLlTGYu6Rqbd60huQT8LPJ2lt8LTxS8BcnFM43K";

axios.defaults.baseURL = "https://api.thecatapi.com/v1";
axios.defaults.headers.common["x-api-key"] = API_KEY;

const initialLoad = async () => {
  try {
    const response = await axios.get("/breeds");
    const breedSelect = document.getElementById("breedSelect");
    response.data.forEach((breed) => {
      const option = document.createElement("option");
      option.value = breed.id;
      option.text = breed.name;
      breedSelect.appendChild(option);
    });
    loadCarousel(); // Automatically load carousel after breeds are fetched
  } catch (error) {
    console.error("Error fetching breeds:", error);
  }
};

breedSelect.addEventListener("change", loadCarousel);

async function loadCarousel() {
  try {
    const val = breedSelect.value;
    const url = `/images/search?limit=25&breed_ids=${val}`;
    const res = await axios.get(url, { onDownloadProgress: updateProgress });
    buildCarousel(res.data);
  } catch (error) {
    console.error("Error loading carousel:", error);
  }
}

const buildCarousel = (data, favourites) => {
  try {
    Carousel.clear();
    infoDump.innerHTML = "";
    data.forEach((ele) => {
      const item = Carousel.createCarouselItem(
        ele.url,
        breedSelect.value,
        ele.id
      );
      Carousel.appendCarousel(item);
    });
    if (favourites) {
      infoDump.innerHTML = "Here are your saved favourites!";
    } else if (data[0]) {
      const info = data[0].breeds || null;
      if (info && info[0].description) infoDump.innerHTML = info[0].description;
    } else {
      infoDump.innerHTML =
        "<div class='text-center'>No information on this breed, sorry!</div>";
    }
    Carousel.start();
  } catch (error) {
    console.error("Error building carousel:", error);
  }
};

axios.interceptors.request.use((request) => {
  progressBar.style.transition = "none";
  progressBar.style.width = "0%";
  document.body.style.setProperty("cursor", "progress", "important");
  request.metadata = { startTime: new Date().getTime() };
  console.log("Request started:", request);
  return request;
});

axios.interceptors.response.use(
  (response) => {
    response.config.metadata.endTime = new Date().getTime();
    response.config.metadata.durationInMS =
      response.config.metadata.endTime - response.config.metadata.startTime;
    console.log(
      `Request took ${response.config.metadata.durationInMS} milliseconds.`
    );
    document.body.style.cursor = "default";
    return response;
  },
  (error) => {
    error.config.metadata.endTime = new Date().getTime();
    error.config.metadata.durationInMS =
      error.config.metadata.endTime - error.config.metadata.startTime;
    console.error(
      `Request failed after ${error.config.metadata.durationInMS} milliseconds.`,
      error
    );
    document.body.style.cursor = "default";
    throw error;
  }
);

function updateProgress(progressEvent) {
  const total = progressEvent.total;
  const current = progressEvent.loaded;
  const percentage = Math.round((current / total) * 100);
  progressBar.style.transition = "width ease 1s";
  progressBar.style.width = percentage + "%";
}

export async function favourite(imgId) {
  try {
    const isFavorite = await axios(`/favourites?image_id=${imgId}`);
    if (isFavorite.data[0]) {
      await axios.delete(`/favourites/${isFavorite.data[0].id}`);
    } else {
      await axios.post("/favourites", { image_id: imgId });
    }
  } catch (error) {
    console.error("Error favoriting image:", error);
  }
}

getFavouritesBtn.addEventListener("click", getFavourites);

async function getFavourites() {
  try {
    const favourites = await axios(`/favourites`);
    const formattedFavs = favourites.data.map((entry) => entry.image);
    buildCarousel(formattedFavs);
  } catch (error) {
    console.error("Error getting favourites:", error);
  }
}

initialLoad();
