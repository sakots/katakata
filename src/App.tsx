import './styles/App.css'
import DirectoryTree from './components/DirectoryTree'
import { ErrorBoundary } from './components/ErrorBoundary'

function App() {
  return (
    <>
      <h1>katakata</h1>
      <ErrorBoundary>
        <DirectoryTree />
      </ErrorBoundary>
    </>
  )
}

export default App
