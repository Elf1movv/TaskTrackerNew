import { createRoot } from "react-dom/client"
import App from "./app/App.tsx"
import "./styles/index.css"
import { initPwa } from "./shared/lib/pwa"

initPwa()

createRoot(document.getElementById("root")!).render(<App />)
