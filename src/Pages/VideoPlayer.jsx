import React, { useState, useRef, useEffect } from "react";
import "./VideoPlayer.css";
import WaveSurfer from "wavesurfer.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faPause } from "@fortawesome/free-solid-svg-icons";

const VideoPlayer = () => {
	const [videoName, setVideoName] = useState(null);

	const videoRef = useRef(null);
	const canvasRef = useRef(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [videoMetadata, setVideoMetadata] = useState(null);
	const [hasAudio, setHasAudio] = useState(false);
	const wavesurferRef = useRef(null);
	const [videoSrc, setVideoSrc] = useState(null);
	const fileSelectUserRef = useRef(null);

	useEffect(() => {
		videoRef.current = document.createElement("video");

		wavesurferRef.current = WaveSurfer.create({
			container: "#waveform",
			waveColor: "#3498db",
			progressColor: "#2980b9",
			backend: "MediaElement",
			barWidth: 2,
			barHeight: 4,
			cursorWidth: 1,
			cursorColor: "#ffffff",
			responsive: true,
			height: 100,
			normalize: true,
			interact: false,
			hideScrollbar: true,
		});

		wavesurferRef.current.on("seek", (progress) => {
			if (videoRef.current) {
				const newTime = videoRef.current.duration * progress;
				videoRef.current.currentTime = newTime;
			}
		});

		return () => {
			if (videoRef.current) {
				URL.revokeObjectURL(videoRef.current.src);
				videoRef.current = null;
			}
			if (wavesurferRef.current) {
				wavesurferRef.current.destroy();
			}
		};
	}, []);

	const formatDuration = (seconds) => {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const remainingSeconds = Math.floor(seconds % 60);

		let formattedDuration = "";

		if (hours > 0) {
			formattedDuration += `${hours}h `;
		}

		if (minutes > 0 || hours > 0) {
			formattedDuration += `${minutes}m `;
		}

		formattedDuration += `${remainingSeconds}s`;

		return formattedDuration.trim();
	};

	const handleVideoSelect = async (event) => {
		const file = event.target.files[0];

		if (!file) {
			return;
		}

		const url = URL.createObjectURL(file);

		const video = videoRef.current;
		setVideoName(file.name);

		video.src = url;
		setVideoSrc(url);

		const initializeAudioContext = () => {
			const audioContext = new (window.AudioContext ||
				window.webkitAudioContext)();
			const source = audioContext.createMediaElementSource(video);
			const analyser = audioContext.createAnalyser();
			const gainNode = audioContext.createGain();

			gainNode.gain.value = 0;

			source.connect(analyser);
			analyser.connect(gainNode);
			gainNode.connect(audioContext.destination);

			analyser.fftSize = 2048;

			return { audioContext, analyser, gainNode };
		};

		const checkForAudio = () => {
			const dataArray = new Uint8Array(analyser.frequencyBinCount);
			analyser.getByteFrequencyData(dataArray);
			const sum = dataArray.reduce((a, value) => a + value, 0);
			return sum > 0;
		};

		const { audioContext, analyser, gainNode } = initializeAudioContext();
		let audioPres = false;

		video.addEventListener("timeupdate", () => {
			if (!audioPres) {
				if (checkForAudio()) {
					console.log("video has audio");
					audioPres = true;
				} else {
					console.log("video doesn't have audio");
				}
			}
		});

		video.play();

		setTimeout(() => {
			video.pause();

			if (audioPres) {
				gainNode.gain.value = 1;
				video.currentTime = 0;
				video.addEventListener("seeked", function drawThumbnail() {
					drawVideoFrame();
					video.pause();
					video.removeEventListener("seeked", drawThumbnail);
				});

				setVideoMetadata({
					duration: video.duration,
					height: video.videoHeight,
					width: video.videoWidth,
					aspectRatio: video.videoWidth / video.videoHeight,
					range: `${video.seekable.start(0)} - ${video.seekable
						.end(0)
						.toFixed(2)}`,
				});
			} else {
				alert("The uploaded video has no Audio. Please try another.");
				window.location.reload();
			}
		}, 2000);

		try {
			const response = await fetch(url);
			const arrayBuffer = await response.arrayBuffer();
			const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

			if (audioBuffer.numberOfChannels === 0) {
				URL.revokeObjectURL(url);
				setVideoSrc(null);
				return;
			}
		} catch (error) {
			console.error("Error fetching or decoding audio data:", error);
		}
	};

	console.log(isPlaying);
	const drawVideoFrame = () => {
		const canvas = canvasRef.current;
		const video = videoRef.current;
		if (!isPlaying) {
			const ctx = canvasRef.current.getContext("2d");
			ctx.drawImage(
				videoRef.current,
				0,
				0,
				canvasRef.current.width,
				canvasRef.current.height
			);
		}
		if (canvas && video) {
			const ctx = canvas.getContext("2d");
			ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
			if (!video.paused && !video.ended) {
				requestAnimationFrame(drawVideoFrame);
			}
		}
	};

	const togglePlayPause = () => {
		const video = videoRef.current;
		if (video.paused || video.ended) {
			setIsPlaying(true);
			video.play();
			drawVideoFrame();
		} else {
			setIsPlaying(false);
			video.pause();
		}
	};

	useEffect(() => {
		if (videoSrc) {
			wavesurferRef.current.load(videoSrc);
		}
	}, [videoSrc]);

	useEffect(() => {
		const video = videoRef.current;
		if (videoRef.current) {
			const onTimeUpdate = () => {
				const currentTime = video.currentTime;
				const duration = video.duration;
				const progress = currentTime / duration;
				wavesurferRef.current.seekTo(progress);
				setVideoMetadata((prevMdata) => ({ ...prevMdata, currentTime }));
			};
			video.addEventListener("timeupdate", onTimeUpdate);
			return () => video.removeEventListener("timeupdate", onTimeUpdate);
		}
	}, [videoSrc]);

	const getFileTypeDescription = (url) => {
		const extension = url.split(".").pop();

		const fileTypeMap = {
			mp4: "MP4 Video",
			webm: "WebM Video",
		};

		return fileTypeMap[extension] || "Unknown File Type";
	};

	return (
		<div className="w-screen flex flex-col justify-center items-center h-screen bg-gray-900">
			<div className="flex flex-col items-center h-15 w-75 rounded-md shadow-md transition-colors duration-300">
				<input
					type="file"
					accept="video/*"
					onChange={handleVideoSelect}
					id="fileInput"
					className="w-87 max-w-full text-gray-900 p-1.25 bg-white rounded-md border-gray-700"
				/>
			</div>

			<div className="flex justify-around w-full max-w-6xl mt-8">
				<div
					className="relative text-center flex flex-col justify-center items-center rounded-md shadow-md transition-shadow duration-300 hover:shadow-lg"
					style={{
						position: "relative",
					}}
				>
					<canvas
						ref={canvasRef}
						width="640"
						height="360"
						onClick={togglePlayPause}
					/>
					<div id="waveform" className="mt-3.75 w-full" />
					<p
						className="absolute top-0 left-2.5 text-gray-400"
						style={{
							zIndex: -1,
						}}
					>
						Audio Waveform
					</p>
					{isPlaying ? (
						<FontAwesomeIcon
							icon={faPause}
							size="3x"
							color="#ffffff"
							onClick={togglePlayPause}
							className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
							style={{
								zIndex: 1,
							}}
						/>
					) : (
						<FontAwesomeIcon
							icon={faPlay}
							size="3x"
							color="#ffffff"
							onClick={togglePlayPause}
							className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
							style={{
								zIndex: 1,
							}}
						/>
					)}
				</div>

				{videoMetadata && (
					<div className="flex flex-col border-2 border-blue-500 h-62.5 justify-start p-5 rounded-md ml-5">
						<h2 className="text-blue-500 font-bold">Video Metadata</h2>
						<div className="text-white mt-2.5">
							Video Name: {videoName}
							<br />
							Duration: {formatDuration(videoMetadata.duration)}
							<br />
							Height: {videoMetadata.height} px
							<br />
							Width: {videoMetadata.width} px
							<br />
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default VideoPlayer;
