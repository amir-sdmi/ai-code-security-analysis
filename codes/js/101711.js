const selectElement = document.getElementById('book-to-show');

document.addEventListener("DOMContentLoaded", function() {
  const savedOptionIndex = localStorage.getItem('selectedOptionIndex');
  const savedOptionValue = localStorage.getItem('selectedOptionValue');
  const savedPageId = localStorage.getItem('publish-page-id');

  let pageId = savedPageId ? parseInt(savedPageId) : 1;

  if (savedOptionIndex !== null && savedOptionValue !== null) {
    selectElement.selectedIndex = savedOptionIndex;
    selectElement.value = savedOptionValue;
  }

  let selectedValue = selectElement.value;

  fetchData(pageId, selectedValue);
});

selectElement.addEventListener('change', (event) => {
  localStorage.setItem('selectedOptionIndex', event.target.selectedIndex);
  localStorage.setItem('selectedOptionValue', event.target.value);

  let pageId = parseInt(localStorage.getItem('publish-page-id')) ?? 1;

  const selectedValue = event.target.value;

  fetchData(pageId, selectedValue);
});

function fetchData(pageId, selectedValue){
  const url = `?page=${pageId}&show=${selectedValue}`;

  window.history.replaceState(null, null, url);

  fetch(url, {
    method: 'GET',
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
    },
  }).then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  }).then(data => {

    insertDataToBookTable(data);

    updatePagination(data.count, data.page, selectedValue);
  }).catch(error => {
    console.error('Fetch error:', error);
  });
}

function insertDataToBookTable(data) {
  const tableBody = document.querySelector('.customizable');
  tableBody.innerHTML = '';
  const books = data.collection;

  let iterable = (data.page - 1) * data.show + 1;

  books.forEach((book) => {
    let newRow = document.createElement('tr');
    newRow.id = 'book-' + book.bookId;

    let noCell = document.createElement('td');
    noCell.textContent = `${iterable++}`;
    newRow.appendChild(noCell);

    let idCell = document.createElement('td');
    idCell.textContent = book.bookId;
    newRow.appendChild(idCell);

    let titleCell = document.createElement('td');
    titleCell.textContent = book.title;
    newRow.appendChild(titleCell);

    let authorCell = document.createElement('td');
    authorCell.textContent = book.authorName;
    newRow.appendChild(authorCell);

    let yearCell = document.createElement('td');
    yearCell.textContent = book.year;
    newRow.appendChild(yearCell);

    let isbnCell = document.createElement('td');
    isbnCell.textContent = book.isbn;
    newRow.appendChild(isbnCell);

    let createdAtCell = document.createElement('td');
    createdAtCell.textContent = book.createdAt + ' UTC';
    newRow.appendChild(createdAtCell);

    let deleteCell = document.createElement('td');
    deleteCell.classList.add('text-center');
    let deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.classList.add('btn', 'btn-danger');
    deleteButton.setAttribute('data-book-id', book.bookId);
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', function () {
      deleteBook(this);
    });
    deleteCell.appendChild(deleteButton);
    newRow.appendChild(deleteCell);

    tableBody.appendChild(newRow);
  });
}

// This code created by chatgpt
function updatePagination(totalPages, currentPage, howManyShow) {
  const paginationContainer = document.querySelector('.pagination');
  paginationContainer.innerHTML = '';

  const maxPagesToShow = 5;

  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

  if (totalPages <= maxPagesToShow) {
    startPage = 1;
    endPage = totalPages;
  } else {
    if (endPage === totalPages) {
      startPage = Math.max(1, totalPages - maxPagesToShow + 1);
    } else if (startPage === 1) {
      endPage = Math.min(totalPages, maxPagesToShow);
    }
  }

  const createPageLink = (pageNum) => {
    const li = document.createElement('li');
    li.classList.add('page-item');
    const link = document.createElement('a');
    link.classList.add('page-link');
    link.href = `?page=${pageNum}&show=${howManyShow}`;
    link.textContent = pageNum;
    link.addEventListener('click', (event) => {
      event.preventDefault();
      localStorage.setItem('publish-page-id', pageNum);
      fetchData(pageNum, howManyShow);
    });
    if (pageNum === currentPage) {
      li.classList.add('active');
    }
    li.appendChild(link);
    paginationContainer.appendChild(li);
  };

  if (startPage > 1) {
    createPageLink(1);
    if (startPage > 2) {
      const firstEllipsis = document.createElement('li');
      firstEllipsis.classList.add('page-item');
      firstEllipsis.innerHTML = '<span class="page-link">&hellip;</span>';
      paginationContainer.appendChild(firstEllipsis);
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    createPageLink(i);
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      const lastEllipsis = document.createElement('li');
      lastEllipsis.classList.add('page-item');
      lastEllipsis.innerHTML = '<span class="page-link">&hellip;</span>';
      paginationContainer.appendChild(lastEllipsis);
    }
    createPageLink(totalPages);
  }

  paginationContainer.querySelectorAll('.page-item').forEach((item) => {
    if (item.textContent === currentPage) {
      item.classList.add('active');
    }
  });

  selectElement.setAttribute('data-page-id', currentPage);
}