import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import './styles/App.css'

function App() {

  interface Post {
    id: number
    title: string
  }

  const { data } = useQuery<Post[]>({
  queryKey: ["posts"],
  queryFn: () => axios.get("/issues").then(res => res.data)
})

  return (
    <>
      <h1>katakata</h1>
      <div>
        <ul>
          {data?.map(post => (
            <li key={post.id}>{post.title}</li>
          ))}
        </ul>
      </div>
    </>
  )
}

export default App
