import { useState, useEffect } from 'react'
import axios from 'axios'
import './styles/App.css'

function App() {
  const [data, setData] = useState("")

  useEffect(() => {
    axios.get('https://localhost/dev/katakata/backend/index.php')
      .then(response => setData(response.data))
      .catch(error => console.error(error))
  }, [])

  return (
    <>
      <h1>katakata</h1>
      <div>
        
      </div>
    </>
  )
}

export default App
