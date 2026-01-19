import './bootstrap';

import 'flowbite';

import Alpine from 'alpinejs';

window.Alpine = Alpine;

Alpine.start();


function previewImages(imageArray) {
    const imageContainer = document.getElementById('image-container');
    imageContainer.innerHTML = '';
    imageArray.forEach(imageUrl => {
        const img = document.createElement('img');
        img.src = imageUrl
        img.alt = 'Image'; 
        img.style.width = '200px'; 
        img.style.margin = '10px'; 
        imageContainer.appendChild(img);
    })
}

document.getElementById('image-input').addEventListener('change', function(event) {
    const imageContainer = document.getElementById('image-container');
    imageContainer.innerHTML = '';

    const files = event.target.files;
    Array.from(files).forEach(file => { 
        if (file.type.startsWith('image/')) {
            const img = document.createElement('img');

            const imgDiv = document.createElement('div'); // Create a div to hold the image and delete button
            imgDiv.style.display = 'inline-block';
            imgDiv.style.position = 'relative';
            imgDiv.style.margin = '10px';
            
            img.src = URL.createObjectURL(file);
            img.alt = file.name;
            img.style.width = '200px';
            img.style.margin = '10px';
            imageContainer.appendChild(img);

            //delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.addEventListener('click', function() {
                imgDiv.remove();

                filesArray.splice(index, 1);            //code done with chatgpt, should start learning javascript properly.

                const dataTransfer = new DataTransfer();
                filesArray.forEach(file => {
                    dataTransfer.items.add(file); // Add remaining files back to the DataTransfer
                });

                inputElement.files = dataTransfer.files;
            }); 

            imgDiv.appendChild(img);
            imgDiv.appendChild(deleteBtn);

            imageContainer.appendChild(imgDiv);
        }
    });
});
