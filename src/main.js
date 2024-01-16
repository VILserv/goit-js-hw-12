import axios from 'axios';
import iziToast from 'izitoast';
import 'izitoast/dist/css/iziToast.min.css';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';
import { Spinner } from 'spin.js';

const API_KEY = '41838094-2685b6b1a22c51550e2439076';
const searchFormEl = document.querySelector('.search-form');
const galleryContainer = document.querySelector('.gallery');
const lightbox = new SimpleLightbox('.gallery a', {
  captionsData: 'alt',
  captionDelay: 250,
});

const spinnerContainer = document.querySelector('.js-loader');
const opts = {
  lines: 12, // The number of lines to draw
  length: 11, // The length of each line
  width: 10, // The line thickness
  radius: 34, // The radius of the inner circle
  scale: 1.45, // Scales overall size of the spinner
  corners: 1, // Corner roundness (0..1)
  speed: 0.9, // Rounds per second
  rotate: 24, // The rotation offset
  animation: 'spinner-line-shrink', // The CSS animation name for the lines
  direction: 1, // 1: clockwise, -1: counterclockwise
  color: '#ffffff', // CSS color or array of colors
  fadeColor: 'transparent', // CSS color or array of colors
  top: '50%', // Top position relative to parent
  left: '50%', // Left position relative to parent
  shadow: '0 0 1px transparent', // Box-shadow for the lines
  zIndex: 2000000000, // The z-index (defaults to 2e9)
  className: 'spinner', // The CSS class to assign to the spinner
  position: 'absolute', // Element positioning
};
const spinner = new Spinner(opts);
spinner.spin(spinnerContainer);

const loaderEl = document.querySelector('.loader');
const loadMoreBtn = document.querySelector('.load-more');
let currentPage = 1;
let totalHits = 0;
let searchQuery = '';
let imagesLoaded = 0;

loaderEl.style.display = 'none';
loadMoreBtn.classList.remove('visible');

searchFormEl.addEventListener('submit', handleFormSubmit);
loadMoreBtn.addEventListener('click', loadMore);

async function handleFormSubmit(event) {
  event.preventDefault();
  searchQuery = event.target.elements.searchQuery.value.trim();

  if (!searchQuery) {
    iziToast.warning({
      title: 'Warning!',
      message: 'Please enter image name!',
      position: 'topRight',
      color: '#FFA000',
    });
    return;
  }

  clearGallery();
  showLoader();
  hideLoadMoreBtn();

  try {
    const response = await axios.get('https://pixabay.com/api/', {
      params: {
        key: API_KEY,
        q: searchQuery,
        image_type: 'photo',
        orientation: 'horizontal',
        safesearch: true,
        page: currentPage,
        per_page: 40,
      },
    });

    hideLoader();

    const data = response.data;

    if (data.hits.length === 0) {
      iziToast.error({
        message:
          'Sorry, there are no images matching your search query. Please try again!',
        position: 'topRight',
        color: '#EF4040',
      });
      return;
    }

    totalHits = data.totalHits;
    imagesLoaded = data.hits.length;
    renderImages(data.hits);
    lightbox.refresh();

    iziToast.info({
      message: `Congrats! We found ${totalHits} images.`,
      position: 'topRight',
      color: '#59A10D',
    });

    if (totalHits > 40) {
      showLoadMoreBtn();
    }
  } catch (error) {
    console.error('Error fetching images:', error);
    hideLoader();
    iziToast.error({
      message: 'Failed to fetch images. Please try again later.',
      position: 'topRight',
      color: '#EF4040',
    });
  }
}

function renderImages(images) {
  const fragment = document.createDocumentFragment();

  images.forEach(image => {
    const imageCardEl = createImageCard(image);
    fragment.appendChild(imageCardEl);
  });

  galleryContainer.appendChild(fragment);
}

function createImageCard(image) {
  const imageCardEl = document.createElement('div');
  imageCardEl.classList.add('card');

  imageCardEl.innerHTML = `
    <a class="gallery-link" href="${image.largeImageURL}">
      <img class="card-image" src="${image.webformatURL}" alt="${image.tags}" loading="lazy">
    </a>
    <div class="card-info">
      <p class="card-text"><b>Likes:</b> ${image.likes}</p>
      <p class="card-text"><b>Views:</b> ${image.views}</p>
      <p class="card-text"><b>Comments:</b> ${image.comments}</p>
      <p class="card-text"><b>Downloads:</b> ${image.downloads}</p>
    </div>
  `;

  return imageCardEl;
}

function clearGallery() {
  galleryContainer.innerHTML = '';
  currentPage = 1;
  hideLoadMoreBtn();
}

async function loadMore() {
  showLoader();
  hideLoadMoreBtn();

  try {
    const response = await axios.get('https://pixabay.com/api/', {
      params: {
        key: API_KEY,
        q: searchQuery,
        image_type: 'photo',
        orientation: 'horizontal',
        safesearch: true,
        page: currentPage + 1,
        per_page: 40,
      },
    });

    hideLoader();

    const data = response.data;

    if (data.hits.length === 0) {
      return;
    }

    currentPage++;

    if (imagesLoaded + data.hits.length > totalHits) {
      data.hits = data.hits.slice(0, totalHits - imagesLoaded);
    }

    imagesLoaded += data.hits.length;

    renderImages(data.hits);
    lightbox.refresh();

    if (imagesLoaded >= totalHits) {
      hideLoadMoreBtn();
      iziToast.info({
        message: `We're sorry, but you've reached the end of search results.`,
        position: 'topRight',
        color: '#EF4040',
      });
    } else {
      showLoadMoreBtn();
    }

    const cards = document.querySelectorAll('.card');
    const newImages = Array.from(cards).slice(-40);
    if (newImages.length > 0) {
      const firstNewImage = newImages[0];

      firstNewImage.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  } catch (error) {
    console.error('Error fetching more images:', error);
    hideLoader();
    iziToast.error({
      message: 'Failed to fetch more images. Please try again later.',
      position: 'topRight',
      color: '#EF4040',
    });
  }
}

function showLoader() {
  loaderEl.style.display = 'block';
}

function hideLoader() {
  loaderEl.style.display = 'none';
}

function showLoadMoreBtn() {
  loadMoreBtn.style.display = 'block';
}

function hideLoadMoreBtn() {
  loadMoreBtn.style.display = 'none';
}
