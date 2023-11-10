import React from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";

function App() {
	return (
		<div
			style={{
				width: "100vw",
				height: "100vh",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				overflow: "hidden",
			}}
		>
			<>
				<RouterProvider router={router} />
			</>
		</div>
	);
}

export default App;
