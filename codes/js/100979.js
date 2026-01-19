// This code was assisted by ChatGPT, OpenAI.

class HandleTable {
    // Static method to create a table based on the provided dat
    static createTable(id, data, add_edit = false) {
        const table = document.getElementById(id);
        table.innerHTML = '';
        let insertContent = '';
        const headerList = Object.keys(data[0]);

        // Create the table header
        insertContent += `<table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 mb-10">
            <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>`

        // Loop through each header and add it to the table header
        for (const header of headerList) {
            insertContent += `<th scope="col" class="px-6 py-3">${header}</th>`;
        }

        // If edit buttons are to be added, create an extra column for controls
        if (add_edit) {
            insertContent += `<th scope="col" class="px-6 py-3">${CONTROL_BUTTONS_COL_TEXT}</th>`;
        }
        insertContent += "</tr></thead><tbody>"

        // Loop through each row of data and populate the table rows
        for (const row of data) {
            insertContent += `<tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200" id='${row["email"]}'>`;

            // Loop through each header and insert its corresponding value from the row
            for (const header of headerList) {
                let insertValue = row[header];
                if (header === "api_calls_left" && row[header] === -1) {
                    insertValue = "∞";
                }
                if (header === "role" && add_edit) {
                    // Create a dropdown to toggle user/admin role
                    insertValue = `
                        <select class="role-dropdown border border-gray-300 rounded p-1" 
                                onchange="UserHandler.toggleRole('${row["email"]}', this.value)">
                            <option value="user" ${row[header] === 'user' ? 'selected' : ''}>User</option>
                            <option value="admin" ${row[header] === 'admin' ? 'selected' : ''}>Admin</option>
                        </select>`;
                }
                insertContent += `<td class='px-6 py-4 ${header}'>${insertValue}</td>`;

            }
            if (add_edit && row["role"] !== "admin") {
                insertContent += `<td class='px-6 py-4 flex justify-between' id='${row[1]}'>
                <button class='text-blue-700 edit-button' onClick="UserHandler.editUser('${row["email"]}')">${EDIT_BUTTON_TEXT}</button>
                <button class='text-blue-700 save-button hidden' onClick="UserHandler.saveUser('${row["email"]}')">${SAVE_BUTTON_TEXT}</button>
                <button class='text-red-500' onClick="UserHandler.deleteUser('${row["email"]}')">${DELETE_BUTTON_TEXT}</button>
                </td>`;
            }
            insertContent += "</tr>";
        }
        insertContent += '</tbody></table>';
        table.innerHTML = insertContent;
    }

    // Static method to render a table with user data
    static async renderUserTable() {
        const data = await APIHub.getAllUsers();
        HandleTable.createTable('user-table', data, true);
    }
    // Static method to render a table with API usage statistics
    static async renderApiTable() {
        const data = await APIHub.getApiStats();
        HandleTable.createTable('api-table', data);
    }
    // Static method to render a table with Endpoint usage statistics
    static async renderEndpointTable() {
        const data = await APIHub.getEndpointStats();
        HandleTable.createTable('endpoint-table', data);
    }
}
