import { useEffect, useState } from 'react'

function App() {
  const [status, setStatus] = useState<string>('Menunggu koneksi...')

  useEffect(() => {
    // Kita panggil /api/status. Vite akan otomatis meneruskannya ke port 8000!
    fetch('/api/status')
      .then((res) => res.json())
      .then((data) => setStatus(data.message))
      .catch(() => setStatus('Gagal terhubung ke backend.'))
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-4">
      <h1 className="text-3xl font-bold text-center">Digital Footprint Map</h1>
      <p className="text-center mt-4 text-gray-600">{status}</p>
    </div>
  )
}

export default App