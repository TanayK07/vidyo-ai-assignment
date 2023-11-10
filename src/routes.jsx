import { createBrowserRouter } from "react-router-dom";
import VideoPlayer from "./Pages/VideoPlayer";

export const router = createBrowserRouter([
	{
		index: true,
		path: "/",
		element: <VideoPlayer />,
	},
]);
