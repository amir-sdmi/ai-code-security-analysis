// These lines find the dropdowns and table from the HTML file by their IDs. They allow us to modify these elements dynamically using JavaScript.
// companySelect: Refers to the company dropdown.
// departmentSelect: Refers to the department dropdown.
// specializationsTable: Refers to the table that will display the specializations and colleague information.
// tableBody: Refers to the body of the table where the rows (data) will be added.
// The `companies` array contains objects representing companies, each with an `id`, `name`, `departments`, and nested arrays of `specializations` and `colleagues`.
// Each specialization has its own `id`, `name`, and a list of `colleagues` with their `id`, `name`, `email`, and `age`.
// Company names, department names, colleague names, emails, and ages were generated using ChatGPT.

const companies = [
    {
      id: 1,
      name: "Google",
      departments: [
        {
          id: 1,
          name: "AI and Machine Learning",
          specializations: [
            {
              id: 1,
              name: "Natural Language Processing (NLP)",
              colleagues: [
                { id: 1, name: "John Doe", email: "johndoe@google.com", age: 28 },
                { id: 2, name: "Sara Lee", email: "saralee@google.com", age: 27 },
                { id: 3, name: "Alex Brown", email: "alexbrown@google.com", age: 29 }
              ]
            },
            {
              id: 2,
              name: "Computer Vision",
              colleagues: [
                { id: 4, name: "Chris Evans", email: "chrisevans@google.com", age: 30 },
                { id: 5, name: "Anna Taylor", email: "annataylor@google.com", age: 25 }
              ]
            },
            {
              id: 3,
              name: "Reinforcement Learning (RL)",
              colleagues: [
                { id: 6, name: "Olivia Adams", email: "oliviaadams@google.com", age: 26 },
                { id: 7, name: "Mason Clark", email: "masonclark@google.com", age: 27 }
              ]
            }
          ]
        },
        {
          id: 2,
          name: "Cloud Computing",
          specializations: [
            {
              id: 4,
              name: "Cloud Infrastructure",
              colleagues: [
                { id: 8, name: "Henry Wilson", email: "henrywilson@google.com", age: 32 },
                { id: 9, name: "Sophia Martinez", email: "sophiamartinez@google.com", age: 31 }
              ]
            },
            {
              id: 5,
              name: "Cloud Security",
              colleagues: [
                { id: 10, name: "Emma Lopez", email: "emmalopez@google.com", age: 29 },
                { id: 11, name: "James Hill", email: "jameshill@google.com", age: 28 }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 2,
      name: "Microsoft",
      departments: [
        {
          id: 3,
          name: "Productivity and Business Processes",
          specializations: [
            {
              id: 6,
              name: "Microsoft Office Suite",
              colleagues: [
                { id: 12, name: "Lucas Green", email: "lucasgreen@microsoft.com", age: 33 },
                { id: 13, name: "Ava White", email: "avawhite@microsoft.com", age: 30 }
              ]
            },
            {
              id: 7,
              name: "Business Solutions",
              colleagues: [
                { id: 14, name: "Daniel Hall", email: "danielhall@microsoft.com", age: 34 },
                { id: 15, name: "Zoe King", email: "zoeking@microsoft.com", age: 29 }
              ]
            },
            {
              id: 8,
              name: "Enterprise Services",
              colleagues: [
                { id: 16, name: "Jack Scott", email: "jackscott@microsoft.com", age: 31 },
                { id: 17, name: "Amelia Perez", email: "ameliaperez@microsoft.com", age: 28 }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 3,
      name: "Amazon",
      departments: [
        {
          id: 4,
          name: "AWS (Amazon Web Services)",
          specializations: [
            {
              id: 9,
              name: "Web Devlopment",
              colleagues: [
                { id: 18, name: "Noah Baker", email: "noahbaker@amazon.com", age: 32 },
                { id: 19, name: "Ella Edwards", email: "ellaedwards@amazon.com", age: 30 }
              ]
            },
            {
              id: 10,
              name: "App Devlopment",
              colleagues: [
                { id: 20, name: "Liam Carter", email: "liamcarter@amazon.com", age: 28 },
                { id: 21, name: "Charlotte Miller", email: "charlottemiller@amazon.com", age: 27 }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 4,
      name: "Apple",
      departments: [
        {
          id: 5,
          name: "iOS Development",
          specializations: [
            {
              id: 11,
              name: "Web Devlopment",
              colleagues: [
                { id: 22, name: "William Turner", email: "williamturner@apple.com", age: 29 },
                { id: 23, name: "Mia Stewart", email: "miastewart@apple.com", age: 27 }
              ]
            },
            {
              id: 12,
              name: "App Devlopment",
              colleagues: [
                { id: 24, name: "Emily Barnes", email: "emilybarnes@apple.com", age: 28 },
                { id: 25, name: "Benjamin Russell", email: "benjaminrussell@apple.com", age: 30 }
              ]
            }
          ]
        }
      ]
    }
  ];




 // Initialize company, department, and specialization dropdowns and the colleagues table
const companySelect = document.getElementById('companySelect');
const departmentSelect = document.getElementById('departmentSelect');
const specializationSelect = document.getElementById('specializationSelect');
const specializationsTable = document.getElementById('specializationsTable');
const tableBody = specializationsTable.querySelector('tbody');

// Function to render colleagues in the table with row numbers
function renderColleagues(colleagues) {
  tableBody.innerHTML = ''; // Clear the table before rendering
  colleagues.forEach((colleague, index) => {
    const row = document.createElement('tr');

    // Add the row number (1-based index)
    const indexCell = document.createElement('td');
    indexCell.textContent = index + 1; // Row number
    row.appendChild(indexCell);

    // Add name, email, and age columns
    const nameCell = document.createElement('td');
    nameCell.textContent = colleague.name;
    row.appendChild(nameCell);

    const emailCell = document.createElement('td');
    emailCell.textContent = colleague.email;
    row.appendChild(emailCell);

    const ageCell = document.createElement('td');
    ageCell.textContent = colleague.age;
    row.appendChild(ageCell);

    // Append the row to the table body
    tableBody.appendChild(row);
  });
  specializationsTable.style.display = 'table'; // Make sure the table is displayed
}

// Get all colleagues for all specializations in given departments
function getSpecializationColleagues(departments) {
  let colleagues = [];
  departments.forEach(department => {
    department.specializations.forEach(specialization => {
      colleagues = colleagues.concat(specialization.colleagues);
    });
  });
  return colleagues;
}

// Get all colleagues for a specific department
function getDepartmentColleagues(department) {
  let colleagues = [];
  department.specializations.forEach(specialization => {
    colleagues = colleagues.concat(specialization.colleagues);
  });
  return colleagues;
}

// Display all colleagues across all companies on page load
function showAllColleagues() {
  let allColleagues = [];
  companies.forEach(company => {
    allColleagues = allColleagues.concat(getSpecializationColleagues(company.departments));
  });
  renderColleagues(allColleagues);
}

// Populate the company dropdown with company names
companies.forEach(company => {
  const option = document.createElement('option');
  option.value = company.id;
  option.textContent = company.name;
  companySelect.appendChild(option);
});

// Handle company selection
companySelect.addEventListener('change', function () {
  const selectedCompany = companies.find(company => company.id == companySelect.value);

  // Clear department and specialization dropdowns and disable them initially
  departmentSelect.innerHTML = '<option value=""> Select Department </option>';
  specializationSelect.innerHTML = '<option value=""> Select Specialization </option>';
  departmentSelect.disabled = true;
  specializationSelect.disabled = true;

  if (selectedCompany) {
    // Enable department dropdown and populate it with departments
    departmentSelect.disabled = false;
    selectedCompany.departments.forEach(department => {
      const option = document.createElement('option');
      option.value = department.id;
      option.textContent = department.name;
      departmentSelect.appendChild(option);
    });

    // Display all colleagues from the selected company
    const companyColleagues = getSpecializationColleagues(selectedCompany.departments);
    renderColleagues(companyColleagues);
  } else {
    // If no company is selected, show all colleagues
    showAllColleagues();
  }
});

// Handle department selection
departmentSelect.addEventListener('change', function () {
  const selectedCompany = companies.find(company => company.id == companySelect.value);
  const selectedDepartment = selectedCompany?.departments.find(department => department.id == departmentSelect.value);

  // Clear and disable specialization dropdown initially
  specializationSelect.innerHTML = '<option value=""> Select Specialization </option>';
  specializationSelect.disabled = true;

  if (selectedDepartment) {
    // Enable specialization dropdown and populate it with specializations
    specializationSelect.disabled = false;
    selectedDepartment.specializations.forEach(specialization => {
      const option = document.createElement('option');
      option.value = specialization.id;
      option.textContent = specialization.name;
      specializationSelect.appendChild(option);
    });

    // Display all colleagues from the selected department
    const departmentColleagues = getDepartmentColleagues(selectedDepartment);
    renderColleagues(departmentColleagues);
  } else {
    // If no department is selected, show colleagues for the selected company
    const companyColleagues = getSpecializationColleagues(selectedCompany.departments);
    renderColleagues(companyColleagues);
  }
});

// Handle specialization selection
specializationSelect.addEventListener('change', function () {
  const selectedCompany = companies.find(company => company.id == companySelect.value);
  const selectedDepartment = selectedCompany?.departments.find(department => department.id == departmentSelect.value);
  const selectedSpecialization = selectedDepartment?.specializations.find(specialization => specialization.id == specializationSelect.value);

  if (selectedSpecialization) {
    // Display colleagues of the selected specialization
    renderColleagues(selectedSpecialization.colleagues);
  } else if (selectedDepartment) {
    // If no specialization selected, show all colleagues in the department
    const departmentColleagues = getDepartmentColleagues(selectedDepartment);
    renderColleagues(departmentColleagues);
  } else {
    // If no department selected, show all colleagues in the company
    const companyColleagues = getSpecializationColleagues(selectedCompany.departments);
    renderColleagues(companyColleagues);
  }
});

// Display all colleagues when the page loads
showAllColleagues();

  
// This JavaScript code allows users to interact with the page dynamically, showing relevant data only after a company and department are chosen.
// Dropdowns:
// The company dropdown is populated when the page loads.
// The department dropdown is populated based on the selected company.
// The specialization dropdown is populated based on the selected department.
// Table:
// The table is filled with specialization and colleague information based on the selected company, department, or specialization.
// It is initially hidden and only shows up after valid data is selected.
