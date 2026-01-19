// This code was assisted by ChatGPT, OpenAI.

class UserHandler {
  // Static method to toggle user role between 'user' and 'admin'
  static async toggleRole(email, newRole) {
    try {
      const response = await APIHub.updateRole(email, newRole);
      if (response) {
        alert(SUCCESS_UPDATE_ROLE_WINDOW);
      } else {
        alert(FAILED_UPDATE_ROLE_WINDOW);
      }
    } catch (error) {
      alert(FAILED_UPDATE_WINDOW);
    }
  }

  // Static method to delete a user by email
  static async deleteUser(email) {
    const rowElement = document.getElementById(email);
    if (rowElement) {
      try {
        const response = await APIHub.deleteUser(email);
        if (response) {
          rowElement.remove();
          alert(SUCCESS_DELETE_WINDOW);
        } else {
          alert(FAILED_DELETE_WINDOW);
        }
      } catch (error) {
        alert(FAILED_DELETE_WINDOW);
      }
    }
  }

  // Static method to edit a user's API call limit (value in the table)
  static async editUser(email) {
    const rowElement = document.getElementById(email);
    const apiCell = rowElement.querySelector('.api_calls_left');

    const apiValue = apiCell.textContent;// Get current API calls value
    apiCell.innerHTML = `<input type="number" value="${apiValue}" class="api-input w-20 px-2 py-1 border border-gray-300 rounded"/>`;

    const editButton = rowElement.querySelector(`.edit-button`);
    const saveButton = rowElement.querySelector(`.save-button`);
    editButton.classList.add('hidden');
    saveButton.classList.remove('hidden');
  }

  // Static method to save the updated API call limit after editing
  static async saveUser(email) {
    const rowElement = document.getElementById(email);
    const apiInput = rowElement.querySelector('.api-input');
    const newApiValue = apiInput.value;

    // Check if the new value is valid (non-negative)
    if (newApiValue < 0) {
      alert(FORBIDDEN_UPDATE_WITH_NEGATIVE_API);
      return;
    }

    try {
      const response = await APIHub.updateApiCalls(email, newApiValue);
      if (response) {
        const apiCell = rowElement.querySelector('.api_calls_left');
        apiCell.innerHTML = newApiValue;

        const editButton = rowElement.querySelector(`.edit-button`);
        const saveButton = rowElement.querySelector(`.save-button`);
        editButton.classList.remove('hidden');
        saveButton.classList.add('hidden');
        alert(SUCCESS_UPDATE_API_WINDOW);
      } else {
        alert(FAILED_UPDATE_API_WINDOW);
      }
    } catch (error) {
      alert(FAILED_UPDATE_API_WINDOW);
    }
  }
}