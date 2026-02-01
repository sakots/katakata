import { useState, useEffect } from 'react'
import axios from 'axios'
import './styles/App.css'

function App() {
  const [data, setData] = useState<Array<{id: number; title: string}>>([])

  useEffect(() => {
    axios.get('https://localhost/dev/katakata/backend/index.php')
      .then(response => setData(response.data))
      .catch(error => console.error(error))
  }, [])

  return (
    <>
      <h1>katakata</h1>
      <div>
        <ul>
          {data.map(post => (
            <li key={post.id}>{post.title}</li>
          ))}
        </ul>
      </div>
    </>
  )
}

export default App
