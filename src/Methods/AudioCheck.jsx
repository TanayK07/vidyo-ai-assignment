function hasAudio(video) {
	return (
		video.mozHasAudio ||
		Boolean(video.webkitAudioDecodedByteCount) ||
		Boolean(video.audioTracks?.length)
	);
}
function hasVideoGotAudio(src) {
	const video = document.createElement("video");
	video.muted = true;
	video.crossOrigin = "anonymous";
	video.preload = "auto";

	return new Promise((resolve, reject) => {
		video.addEventListener("error", reject);

		video.addEventListener(
			"canplay",
			() => {
				video.currentTime = 0.99;
			},
			{ once: true } // Important because 'canplay' can be fired hundreds of times.
		);

		video.addEventListener("seeked", () => resolve(hasAudio(video)), {
			once: true,
		});

		video.src = src;
	});
}

export default hasVideoGotAudio;
