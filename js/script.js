// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const gallery = document.getElementById('gallery');
const getImagesButton = document.querySelector('button');
const spaceFactText = document.getElementById('space-fact-text');
const apiUrl = 'https://science.nasa.gov/wp-json/wp/v2/apod-basic';
const imageDetails = new WeakMap();

// Keep these facts local so the page does not need another API request.
const spaceFacts = [
  'A day on Venus is longer than a year on Venus.',
  'Neutron stars are so dense that a teaspoon of their material would weigh about a billion tons on Earth.',
  'Jupiter is the largest planet in our solar system.',
  'The footprints left by Apollo astronauts on the Moon can last for millions of years.',
  'Saturn would float in water because its average density is lower than water.',
  'Light from the Sun takes about eight minutes and 20 seconds to reach Earth.',
  'Mars has the largest volcano in the solar system, Olympus Mons.',
  'There are more stars in the observable universe than grains of sand on all of Earth’s beaches.',
  'The International Space Station travels around Earth at about 17,500 miles per hour.',
  'Our galaxy, the Milky Way, is expected to collide with the Andromeda Galaxy in about 4.5 billion years.'
];

// Show one randomly selected fact each time the page loads.
const displayRandomSpaceFact = () => {
  const randomIndex = Math.floor(Math.random() * spaceFacts.length);
  spaceFactText.textContent = spaceFacts[randomIndex];
};

displayRandomSpaceFact();

// Build the modal once so it can be reused for every gallery image.
const modal = document.createElement('div');
modal.className = 'image-modal';
modal.setAttribute('role', 'dialog');
modal.setAttribute('aria-modal', 'true');
modal.hidden = true;

const modalContent = document.createElement('div');
modalContent.className = 'modal-content';

const closeButton = document.createElement('button');
closeButton.className = 'modal-close';
closeButton.type = 'button';
closeButton.setAttribute('aria-label', 'Close image');
closeButton.textContent = 'X';

const modalImage = document.createElement('img');
const modalTitle = document.createElement('h2');
const modalDate = document.createElement('p');
const modalExplanation = document.createElement('p');
modalExplanation.className = 'modal-explanation';

modalContent.append(closeButton, modalImage, modalTitle, modalDate, modalExplanation);
modal.appendChild(modalContent);
document.body.appendChild(modal);

// Show request progress without replacing the gallery content.
const loadingIndicator = document.createElement('div');
loadingIndicator.className = 'loading-indicator';
loadingIndicator.setAttribute('role', 'status');
loadingIndicator.setAttribute('aria-live', 'polite');
loadingIndicator.hidden = true;

const loadingSpinner = document.createElement('span');
loadingSpinner.className = 'loading-spinner';
loadingSpinner.setAttribute('aria-hidden', 'true');

const loadingMessage = document.createElement('span');
loadingMessage.textContent = 'Loading NASA images and videos...';
loadingIndicator.append(loadingSpinner, loadingMessage);

gallery.parentNode.insertBefore(loadingIndicator, gallery);

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);

// Convert a date input value from YYYY-MM-DD to NASA's YYMMDD format.
const formatDateForApi = (date) => date.replace(/-/g, '').slice(2);

// Show a message in the gallery when images cannot be loaded.
const showGalleryMessage = (message) => {
  gallery.textContent = '';
  const messageElement = document.createElement('p');
  messageElement.textContent = message;
  gallery.appendChild(messageElement);
};

// Return an embeddable URL only for supported video hosts.
const getVideoEmbedUrl = (videoUrl) => {
  try {
    const url = new URL(videoUrl);
    const hostname = url.hostname.toLowerCase();

    if (
      hostname === 'youtube.com'
      || hostname === 'www.youtube.com'
      || hostname === 'youtube-nocookie.com'
      || hostname === 'www.youtube-nocookie.com'
    ) {
      const videoId = url.searchParams.get('v') || url.pathname.split('/').pop();
      return videoId && /^[\w-]{6,}$/.test(videoId)
        ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`
        : '';
    }

    if (hostname === 'youtu.be') {
      const videoId = url.pathname.slice(1).split('/')[0];
      return videoId && /^[\w-]{6,}$/.test(videoId)
        ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`
        : '';
    }

    if (hostname === 'vimeo.com' || hostname === 'www.vimeo.com') {
      const videoId = url.pathname.split('/').filter(Boolean).pop();
      return videoId && /^\d+$/.test(videoId) ? `https://player.vimeo.com/video/${videoId}` : '';
    }
  } catch (error) {
    return '';
  }

  return '';
};

// Build the NASA APOD page URL used when a video cannot be embedded.
const getApodPageUrl = (entry) => {
  if (entry.permalink) {
    try {
      const permalink = new URL(entry.permalink);
      if (permalink.hostname === 'science.nasa.gov' || permalink.hostname === 'apod.nasa.gov') {
        return permalink.href;
      }
    } catch (error) {
      // Use the date-based APOD URL when the API permalink is not valid.
    }
  }

  const dateParts = (entry.date || '').split('-');
  if (dateParts.length !== 3 || dateParts.some((part) => !/^\d+$/.test(part))) {
    return 'https://apod.nasa.gov/apod/astropix.html';
  }

  return `https://apod.nasa.gov/apod/ap${entry.date.replace(/-/g, '').slice(2)}.html`;
};

const createVideoContent = (entry) => {
  const videoUrl = entry.url || '';
  const embedUrl = getVideoEmbedUrl(videoUrl);

  if (embedUrl) {
    const videoFrame = document.createElement('iframe');
    videoFrame.className = 'gallery-video';
    videoFrame.src = embedUrl;
    videoFrame.title = entry.title || 'NASA APOD video';
    videoFrame.loading = 'lazy';
    videoFrame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    videoFrame.setAttribute('allowfullscreen', '');
    return videoFrame;
  }

  const videoLink = document.createElement('a');
  videoLink.className = 'video-link';
  videoLink.href = getApodPageUrl(entry);
  videoLink.target = '_blank';
  videoLink.rel = 'noopener noreferrer';
  videoLink.textContent = 'Watch video on NASA’s APOD page';
  return videoLink;
};

// Add the returned image and video entries to the existing gallery.
const displayImages = (images) => {
  gallery.textContent = '';

  images.forEach((image) => {
    const galleryItem = document.createElement('div');
    galleryItem.className = 'gallery-item';

    const mediaElement = image.media_type === 'video'
      ? createVideoContent(image)
      : document.createElement('img');

    if (image.media_type === 'image') {
      mediaElement.src = image.hdurl;
      mediaElement.alt = image.title || 'NASA space image';
      mediaElement.tabIndex = 0;
      imageDetails.set(mediaElement, image);
    }

    const titleElement = document.createElement('p');
    titleElement.textContent = `${image.title || 'Untitled'} - ${image.date || 'Date unavailable'}`;

    const explanationElement = document.createElement('p');
    explanationElement.className = 'gallery-explanation';
    explanationElement.textContent = getReadableExplanation(image.explanation);

    galleryItem.append(mediaElement, titleElement, explanationElement);
    gallery.appendChild(galleryItem);
  });
};

// Remove HTML tags from NASA's explanation while keeping the text readable.
const getReadableExplanation = (explanation) => {
  const parsedExplanation = new DOMParser().parseFromString(
    explanation || 'No explanation available.',
    'text/html'
  );
  return parsedExplanation.body.textContent.trim() || 'No explanation available.';
};

// Open the modal with details from the selected NASA image.
const openModal = (image) => {
  modalImage.src = image.hdurl;
  modalImage.alt = image.title || 'NASA space image';
  modalTitle.textContent = image.title || 'Untitled';
  modalDate.textContent = image.date || 'Date unavailable';
  modalExplanation.textContent = getReadableExplanation(image.explanation);
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
  closeButton.focus();
};

// Close the modal and return scrolling to the page.
const closeModal = () => {
  modal.hidden = true;
  document.body.style.overflow = '';
};

// Event delegation keeps clicks working for images added after each fetch.
gallery.addEventListener('click', (event) => {
  const selectedImage = event.target.closest('img');
  if (selectedImage && imageDetails.has(selectedImage)) {
    openModal(imageDetails.get(selectedImage));
  }
});

gallery.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' && event.key !== ' ') {
    return;
  }

  const selectedImage = event.target.closest('img');
  if (selectedImage && imageDetails.has(selectedImage)) {
    event.preventDefault();
    openModal(imageDetails.get(selectedImage));
  }
});

closeButton.addEventListener('click', closeModal);
modal.addEventListener('click', (event) => {
  if (event.target === modal) {
    closeModal();
  }
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !modal.hidden) {
    closeModal();
  }
});

// Fetch and display images for the dates currently selected by the user.
const loadImages = async () => {
  const startDate = startInput.value;
  const endDate = endInput.value;

  if (!startDate || !endDate) {
    showGalleryMessage('Please select a start and end date.');
    return;
  }

  const query = new URLSearchParams({
    date_from: formatDateForApi(startDate),
    date_to: formatDateForApi(endDate)
  });

  getImagesButton.disabled = true;
  loadingIndicator.hidden = false;

  try {
    const response = await fetch(`${apiUrl}?${query}`);

    if (!response.ok) {
      throw new Error('NASA API request failed');
    }

    const data = await response.json();
    const mediaEntries = Array.isArray(data)
      ? data.filter((entry) => (
        (entry.media_type === 'image' && entry.hdurl)
        || (entry.media_type === 'video' && entry.url)
      ))
      : [];

    if (mediaEntries.length === 0) {
      showGalleryMessage('No space images or videos were found for this date range.');
      return;
    }

    displayImages(mediaEntries);
  } catch (error) {
    showGalleryMessage('Unable to load NASA images. Please check your connection and try again.');
  } finally {
    loadingIndicator.hidden = true;
    getImagesButton.disabled = false;
  }
};

getImagesButton.addEventListener('click', loadImages);

// Load the default date range as soon as the page is ready.
loadImages();
