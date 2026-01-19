// written by ChatGPT | я слишком ленив для этого -_-

document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.files__item a').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();

            const fileName = this.getAttribute('href').substring(1);
            const ext = fileName.split('.').pop().toLowerCase();
            const player = document.getElementById('playerAudio');
            const playerContent = document.querySelector('.player__content');
            const controls = document.querySelector('.player__controls');

            if (['mp4', 'webm', 'ogg'].includes(ext)) {
                // Видео
                hideImage();
                showControls();
                player.src = `img/${fileName}`;
                player.type = `video/${ext}`;
                player.style.display = 'block';
                player.autoplay = true;
                player.loop = true;
                player.load();
            } else if (['mp3', 'wav', 'ogg'].includes(ext)) {
                // Аудио
                hideImage();
                showControls();
                player.src = `img/${fileName}`;
                player.type = `audio/${ext}`;
                player.style.display = 'block';
                player.autoplay = true;
                player.loop = false;
                player.load();
            } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
                // Картинка
                hideControls();
                player.pause();
                player.removeAttribute('src');
                player.load();
                player.style.display = 'none';

                let oldImage = playerContent.querySelector('img.media-image');
                if (oldImage) oldImage.remove();

                const img = document.createElement('img');
                img.src = `img/${fileName}`;
                img.className = 'media-image';
                img.style.maxWidth = '100%';
                playerContent.prepend(img);
            }

            function hideImage() {
                const oldImage = playerContent.querySelector('img.media-image');
                if (oldImage) oldImage.remove();
            }

            function showControls() {
                controls.style.display = 'flex';
            }

            function hideControls() {
                controls.style.display = 'none';
            }
        });
    });
});
