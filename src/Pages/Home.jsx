import React, { useRef, useState, useEffect } from "react";
import { Flex, VStack, Box } from "@chakra-ui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faPause } from "@fortawesome/free-solid-svg-icons";
import { Toast, useToast } from "@chakra-ui/react";

export default function Home() {
	const [isHovered, setIsHovered] = useState(false);

	const toast = useToast();
	const [videoDuration, setVideoDuration] = useState(0);
	const videoRef = useRef(null);
	const canvasRef = useRef(null);
	const requestId = useRef(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [selectedVideoMetadata, setSelectedVideoMetadata] = useState(null);

	const handleFileChange = async (e) => {
		const file = e.target.files[0];
		const videoObject = URL.createObjectURL(file);

		videoRef.current.src = videoObject;

		const initializeAudioContext = () => {
			const audioContext = new (window.AudioContext ||
				window.webkitAudioContext)();
			const source = audioContext.createMediaElementSource(videoRef.current);
			const analyser = audioContext.createAnalyser();

			source.connect(analyser);
			analyser.fftSize = 2048;

			return { audioContext, analyser };
		};

		const checkForAudio = () => {
			const dataArray = new Uint8Array(analyser.frequencyBinCount);
			analyser.getByteFrequencyData(dataArray);
			const sum = dataArray.reduce((a, value) => a + value, 0);
			return sum > 0;
		};

		const { audioContext, analyser } = initializeAudioContext();
		let audioPresent = false;

		videoRef.current.addEventListener("timeupdate", () => {
			if (!audioPresent && checkForAudio()) {
				console.log("video has audio");
				audioPresent = true;
			}
		});

		videoRef.current.muted = true;
		videoRef.current.play();

		setTimeout(() => {
			videoRef.current.pause();

			if (audioPresent) {
				console.log("Video has audio");
				// Further actions when video has audio
			} else {
				console.log("Video doesn't have audio");
				toast({
					title: "Error",
					description: "The uploaded video has no audio. Please try again.",
					status: "error",
					duration: 5000,
					isClosable: true,
				});
			}
		}, 3000);
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

	const handlePlayPause = () => {
		if (videoRef.current.paused) {
			videoRef.current.play();
			setIsPlaying(true);
		} else {
			videoRef.current.pause();
			setIsPlaying(false);
		}
	};

	return (
		<Flex
			direction="row"
			justifyContent="center"
			alignItems="center"
			minHeight="100vh"
			minWidth="100vw"
			backgroundColor="#1A202C"
			padding="2rem"
		>
			<VStack display="flex" justifyContent="center">
				<Flex
					direction="column"
					align="center"
					justify="center"
					backgroundColor="#2D3748"
					borderRadius="0.5rem"
					marginBottom="2rem"
					padding="2rem"
				>
					<h1
						style={{
							color: "#F7FAFC",
							marginBottom: "1.5rem",
							padding: "0.5rem",
						}}
					>
						Video Player
					</h1>
					<input
						type="file"
						accept="video/*"
						onChange={handleFileChange}
						style={{ display: "none" }}
						id="fileInput"
					/>
					<button
						style={{
							marginBottom: "1.5rem",
							padding: "0.5rem",
							border: "none",
							borderRadius: "0.5rem",
							backgroundColor: "#4A5568",
							color: "#F7FAFC",
							cursor: "pointer",
						}}
						onClick={() => document.getElementById("fileInput").click()}
					>
						Choose File
					</button>
				</Flex>
				<Flex
					direction="row"
					align="center"
					justify="center"
					position="relative"
					style={{ width: "100%" }}
				>
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
					</Flex>
					<Box
						direction="column"
						ml={4}
						p={4}
						backgroundColor="#2D3748"
						borderRadius="0.5rem"
						color="white"
					>
						<h2>Video Metadata</h2>
						{selectedVideoMetadata && (
							<>
								<p>
									<strong>Name:</strong> {selectedVideoMetadata.name}
								</p>
								<p>
									<strong>Size:</strong> {selectedVideoMetadata.size} bytes
								</p>
								<p>
									<strong>Type:</strong> {selectedVideoMetadata.type}
								</p>
								<p>
									<strong>Duration:</strong> {videoDuration} seconds
								</p>
							</>
						)}
					</Box>
				</Flex>
			</VStack>
		</Flex>
	);
}
