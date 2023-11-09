import React, { useRef, useState, useEffect } from "react";
import { Flex } from "@chakra-ui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faPause } from "@fortawesome/free-solid-svg-icons";

export default function Home() {
	const [videoDuration, setVideoDuration] = useState(0);
	const videoRef = useRef(null);
	const canvasRef = useRef(null);
	const requestId = useRef(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [isHovered, setIsHovered] = useState(false);

	const handleFileChange = (e) => {
		const file = e.target.files[0];
		const videoObject = URL.createObjectURL(file);
		videoRef.current.src = videoObject;

		const videoElement = document.createElement("video");
		videoElement.onloadedmetadata = function () {
			setVideoDuration(videoElement.duration);
		};
		videoElement.src = videoObject;
	};

	const handlePlayPause = () => {
		if (videoRef.current.paused) {
			videoRef.current.play();
			setIsPlaying(true);
		} else {
			videoRef.current.pause();
			setIsPlaying(false);
		}
	};

	useEffect(() => {
		const canvas = canvasRef.current;
		const ctx = canvas.getContext("2d");

		const drawFrame = () => {
			ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
			requestId.current = requestAnimationFrame(drawFrame);
		};

		if (videoRef.current && canvas) {
			requestId.current = requestAnimationFrame(drawFrame);
		}

		return () => {
			cancelAnimationFrame(requestId.current);
		};
	}, []);

	return (
		<Flex
			direction="column"
			align="center"
			justify="center"
			minHeight="100vh"
			minWidth="100vw"
			backgroundColor="#1A202C"
			padding="2rem"
		>
			<Flex
				direction="column"
				align="center"
				justify="center"
				backgroundColor="#2D3748"
				borderRadius="0.5rem"
				marginBottom="2rem"
				padding="2rem"
			>
				<h1 style={{ color: "white", marginBottom: "1rem" }}>Video Player</h1>
				<input
					type="file"
					accept="video/*"
					onChange={handleFileChange}
					style={{ marginBottom: "1rem" }}
				/>
			</Flex>
			<Flex
				direction="column"
				align="center"
				justify="center"
				position="relative"
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
			>
				<canvas
					ref={canvasRef}
					id="canvas"
					width="640"
					height="360"
					style={{ border: "1px solid #718096", marginBottom: "1rem" }}
				></canvas>
				<button
					onClick={handlePlayPause}
					style={{
						position: "absolute",
						top: "50%",
						left: "50%",
						transform: "translate(-50%, -50%)",
						backgroundColor: "#4A5568",
						color: "white",
						padding: "0.5rem 1rem",
						borderRadius: "50%",
						display: isPlaying || !isHovered ? "none" : "block",
					}}
				>
					<FontAwesomeIcon icon={faPlay} />
				</button>
				<button
					onClick={handlePlayPause}
					style={{
						position: "absolute",
						top: "50%",
						left: "50%",
						transform: "translate(-50%, -50%)",
						backgroundColor: "#4A5568",
						color: "white",
						padding: "0.5rem 1rem",
						borderRadius: "50%",
						display: isPlaying && isHovered ? "block" : "none",
					}}
				>
					<FontAwesomeIcon icon={faPause} />
				</button>
				<video
					ref={videoRef}
					width="640"
					height="360"
					style={{ display: "none" }}
				></video>
				<p style={{ color: "white" }}>Video Duration: {videoDuration}</p>
			</Flex>
		</Flex>
	);
}
