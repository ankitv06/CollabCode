import { useState } from 'react'
import './App.css'
import {BrowserRouter, Routes, Route} from 'react-router-dom'
import Home from './pages/Home'
import Editor from './pages/Editor'
import {Toaster} from 'react-hot-toast'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <Toaster 
          position="bottom-center"
        ></Toaster>
      </div>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Home/>}></Route>
          <Route path='/editor/:editorId' element={<Editor/>}></Route>
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App