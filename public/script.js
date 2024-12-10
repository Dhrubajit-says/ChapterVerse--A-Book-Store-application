const bookList = document.getElementById('book-list');
const regionSelect = document.getElementById('region');
const randomSeedBtn = document.getElementById('random-seed-btn');
const seedInput = document.getElementById('seed');
const exportCsvBtn = document.getElementById('export-csv-btn');
const galleryViewBtn = document.getElementById('gallery-view-btn');

let currentPage = 1;
const initialBooksCount = 500;
const booksPerPage = 50;
let currentRegion = 'english';
let currentSeed = generateRandomSeed();
let isLoading = false;
let globalBookIndex = 1;
let isGalleryView = false;

const likeSlider = document.getElementById('like-slider');
const likeSliderValue = document.getElementById('like-slider-value');

// Generate random seed
function generateRandomSeed() {
  return Math.floor(Math.random() * 1000000);
}

// Generate HTML for book expansion row
function createExpansionRow(book) {
  const expansionRow = document.createElement('tr');
  expansionRow.classList.add('expansion-row');
  expansionRow.innerHTML = `
    <td colspan="5">
      <div class="book-details">
        <div class="book-info">
          <img src="${book.cover || 'https://via.placeholder.com/100x150?text=No+Image'}" alt="${book.title}" class="book-image">
          <div class="like-value">
            <img src="images/like.png" alt="Like" class="like-image">
            <span>${book.likes}</span>
          </div>
        </div>
        <div class="details-text">
          <p style="font-weight: bold;">${book.title}</p>
          <p style="font-style: italic;">by ${book.authors}, published ${book.year}</p>
          <div class="reviews">
            <h4>Reviews:</h4>
            <ul>
              ${book.reviews.map(review => `
                <li>
                  <p><strong>${review.reviewer}</strong></p>
                  <p style="font-style: italic; color: #555;">"${review.review}"</p>
                </li>
              `).join('')}
            </ul>
          </div>
        </div>
      </div>
    </td>
  `;
  expansionRow.style.display = 'none';
  return expansionRow;
}

// Update displayed like value
likeSlider.addEventListener('input', () => {
  likeSliderValue.textContent = likeSlider.value;
  loadBooks(true, true);
});

// Export to CSV
exportCsvBtn.addEventListener('click', () => {
  const books = Array.from(bookList.querySelectorAll('.book-row')).map(row => {
    const cells = row.querySelectorAll('td');
    return {
      index: cells[0].textContent,
      isbn: cells[1].textContent,
      title: cells[2].textContent,
      authors: cells[3].textContent,
      publisher: cells[4].textContent,
    };
  });

  const csvContent = 'data:text/csv;charset=utf-8,'
    + 'Index,ISBN,Title,Authors,Publisher\n'
    + books.map(book => `${book.index},${book.isbn},${book.title},${book.authors},${book.publisher}`).join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', 'books.csv');
  link.click();
});

// Toggle between gallery view and table view
galleryViewBtn.addEventListener('click', () => {
  isGalleryView = !isGalleryView;
  galleryViewBtn.innerHTML = isGalleryView
    ? '<i class="fa-solid fa-bars"></i>'
    : '<i class="fa-solid fa-table"></i>';
    
  if (isGalleryView) {
    document.querySelector('thead').style.display = 'none';
    bookList.className = 'card-container';
  } else {
    document.querySelector('thead').style.display = '';
    bookList.className = '';
  }

  loadBooks(true, true);
});

// Fetch and display books
async function loadBooks(clearTable = false, initialLoad = false) {
  if (isLoading) return;
  isLoading = true;

  const limit = initialLoad ? initialBooksCount : booksPerPage;

  try {
    const response = await fetch(`/api/books?page=${currentPage}&limit=${limit}&region=${currentRegion}&seed=${currentSeed}`);
    if (!response.ok) throw new Error('Failed to fetch books');

    let books = await response.json();

    if (likeSlider.value > 0) {
      books = books.filter(book => book.likes === parseFloat(likeSlider.value));
    }

    if (clearTable) {
      bookList.innerHTML = '';
      globalBookIndex = 1;
    }

    if (isGalleryView) {
      books.forEach(book => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.innerHTML = `
          <img src="${book.cover || 'https://via.placeholder.com/100x150?text=No+Image'}" alt="${book.title}" class="card-image">
          <div class="card-content">
            <h3>${book.title}</h3>
            <p>${book.authors}</p>
            <p>Publisher: ${book.publisher}, ${book.year}</p>
          </div>
          <div class="card-footer">
            <span>${book.likes} Likes</span>
            <img src="images/like.png" alt="Like">
          </div>
        `;
        bookList.appendChild(card);
      });
    } else {
      books.forEach((book, index) => {
        const row = document.createElement('tr');
        const bookIndex = globalBookIndex++;
        row.classList.add('book-row');
        row.innerHTML = `
          <td>${bookIndex} <br> <img class="expand-toggle" src="/images/expand.png" alt="Expand" style="width: 20px; height: 20px;"></td>
          <td>${book.isbn}</td>
          <td>${book.title}</td>
          <td>${book.authors}</td>
          <td>${book.publisher}, ${book.year}</td>
        `;

        const expansionRow = createExpansionRow(book);
        row.querySelector('.expand-toggle').addEventListener('click', () => {
          const isExpanded = expansionRow.style.display === 'table-row';
          expansionRow.style.display = isExpanded ? 'none' : 'table-row';
        });

        bookList.appendChild(row);
        bookList.appendChild(expansionRow);
      });
    }
  } catch (error) {
    console.error(error.message);
  }

  isLoading = false;
}

// Handle infinite scrolling
window.addEventListener('scroll', () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 50 && !isLoading) {
    currentPage++;
    loadBooks();
  }
});

// Handle region change
regionSelect.addEventListener('change', () => {
  const newRegion = regionSelect.value.toLowerCase();
  if (newRegion !== currentRegion) {
    currentRegion = newRegion;
    currentPage = 1;
    currentSeed = generateRandomSeed();
    seedInput.value = currentSeed;
    globalBookIndex = 1;
    loadBooks(true, true);
  }
});

// Handle random seed button click
randomSeedBtn.addEventListener('click', () => {
  currentSeed = generateRandomSeed();
  seedInput.value = currentSeed;
  currentPage = 1;
  globalBookIndex = 1;
  loadBooks(true, true);
});

// Handle manual seed input
seedInput.addEventListener('input', () => {
  const newSeed = parseInt(seedInput.value);
  if (!isNaN(newSeed)) {
    currentSeed = newSeed;
    currentPage = 1;
    globalBookIndex = 1;
    loadBooks(true, true);
  }
});

// Initialize seed input and load the first page
seedInput.value = currentSeed;
loadBooks(true, true);
