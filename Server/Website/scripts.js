let cropper;
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const snapButton = document.getElementById('snap-button');
const cropArea = document.getElementById('crop-area');
const cropButton = document.getElementById('crop-button');
const dropArea = document.getElementById('drop-area');
const downloadButton = document.getElementById('download-button');
const cropContainer = document.getElementById('crop-container');
const preview = document.getElementById('image-preview');
const fileInput = document.getElementById("file-input");
const imgPreviewContainer = document.getElementById("img-preview-container");
const deleteButton = document.getElementById("delete-button");

document.body.addEventListener('mousemove', function(e) {
    const x = (e.clientX / window.innerWidth) * 100;
    const y = (e.clientY / window.innerHeight) * 100;
    document.body.style.backgroundPosition = `${x}% ${y}%`;
});

function captureFromLibrary() {
    fileInput.click();
}

function startCamera() {
    navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
        video.srcObject = stream;
        video.style.display = 'block';
        snapButton.style.display = 'block';
    }).catch(err => {
        console.error('Error accessing camera: ', err);
        alert('Unable to access camera. Please check your device permissions.');
    });
}

function snapPhoto() {
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL('image/png');
    video.style.display = 'none';
    snapButton.style.display = 'none';
    showCropArea(imageData);
    preview.src = imageData;
}

function uploadImage(event) {
    const file = event.target.files[0];

    if (file) {
        const reader = new FileReader();
        reader.onload = function () {
            showCropArea(reader.result);
            preview.src = reader.result;
            deleteButton.style.display= 'flex';
        };
        reader.readAsDataURL(file);
    }
}

function deleteImage() {
    fetch('/reset', {
        method: 'POST'
    })
    .then(() => {
        // Redirect to the home page, effectively reloading the site
        window.location.href = '/';
    })
    .catch(error => console.error('Error:', error));
}

function showCropArea(imageData) {
    cropArea.src = imageData;

    cropButton.style.position = 'absolute';
    cropButton.style.bottom = '100px';
    cropButton.style.right = 'center';

    cropArea.onload = function () {
        // Get dimensions of the preview image to match the crop container size
        const previewWidth = preview.clientWidth;
        const previewHeight = preview.clientHeight;

        // Set crop-container to match image-preview dimensions
        cropContainer.style.width = `${previewWidth}px`;
        cropContainer.style.height = `${previewHeight}px`;

        // Show the crop area
        cropArea.style.display = 'block';
        cropButton.style.display = 'block';

        // Initialize cropper
        cropper = new Cropper(cropArea, {
            aspectRatio: NaN,
            viewMode: 1,
            autoCropArea: 1.0,
            background: false,
            guides: false,
            movable: false,
            zoomable: false,
            rotatable: true,
            scalable: true,
        });
    };
}

function cropImage() {
    const croppedCanvas = cropper.getCroppedCanvas();
    const croppedImageData = croppedCanvas.toDataURL('image/png');
    preview.src = croppedImageData;

    cropArea.style.display = 'none';
    cropButton.style.display = 'none';
    cropContainer.style.display = 'none';

    // Ensure the preview becomes visible after cropping
    preview.style.visibility = 'visible';

    sendImageToServer(croppedImageData);
}

function showTextLetterByLetter(text) {
    const resultDiv = document.getElementById('result');
    resultDiv.textContent = ''; // Clear any previous text
    let index = 0;

    function displayNextLetter() {
        if (index < text.length) {
            resultDiv.textContent += text[index];
            index++;
            setTimeout(displayNextLetter, 10); // Adjust the delay for speed (50ms here)
        }
    }

    displayNextLetter();
}

function copyText() {
    const resultDiv = document.getElementById('result');
    const textToCopy = resultDiv.textContent; // Extract the text content

    // Copy text to clipboard
    navigator.clipboard.writeText(textToCopy)
        .then(() => {
            alert("Text copied to clipboard!");
        })
        .catch((error) => {
            console.error("Error copying text: ", error);
            alert("Failed to copy text.");
        });
}

function sendImageToServer(imageData) {
    startProcessing();
    fetch('/process-image', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ image: imageData })
    }).then(response => response.json())
      .then(data => {
        finishProcessing();
          // Update the UI with the extracted and corrected text smoothly
          showTextLetterByLetter(data.extracted_text);

          // Enable download button
          enableDownload();
      }).catch(error => {
        finishProcessing(); // Hide the loading circle even if there's an error
        console.error('Error:', error)});
}

function startProcessing() {
    // Show the loading overlay when processing starts
    document.getElementById("loading-overlay").style.display = "flex";
}

function finishProcessing() {
    // Hide the loading overlay when processing is finished
    document.getElementById("loading-overlay").style.display = "none";
}

function enableDownload() {
    downloadButton.disabled = false;
    downloadButton.classList.remove("cursor-disabled");

    downloadButton.onclick = function() {
        const downloadLink = 'TemporaryDatabase/corrected_text.txt';

        const a = document.createElement('a');
        a.href = downloadLink;
        a.download = 'corrected_text.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        setTimeout(disableDownload, 20000);
    };
}

function disableDownload() {
    downloadButton.disabled = true;
    downloadButton.classList.add("cursor-disabled");
    downloadButton.onclick = null;
}

// Handle drag-and-drop functionality
dropArea.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropArea.classList.add('drag-over');
});

dropArea.addEventListener('dragleave', () => {
    dropArea.classList.remove('drag-over');
});

dropArea.addEventListener('drop', (event) => {
    event.preventDefault();
    dropArea.classList.remove('drag-over');

    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function () {
            showCropArea(reader.result);
            preview.src = reader.result;
        };
        reader.readAsDataURL(file);
    } else {
        alert('Please drop an image file.');
    }
});

disableDownload();
