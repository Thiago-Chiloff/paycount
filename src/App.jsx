import { Routes, Route } from 'react-router-dom';
import Background from './components/Background/background';
import AddCount from './components/AddCount/AddCount';
import FormsCount from './components/FormsCount/FormsCount';
import ShowCount from './components/ShowCount/ShowCount';
import "./App.css"

function App() {
    return (
        <>
            <Background />
            <div className="app-content">
                <Routes>
                    <Route path='/' element={<AddCount />} />
                    <Route path='/formscount/formscount' element={<FormsCount />} />
                    <Route path='/showcount/showcount' element={<ShowCount />} />
                </Routes>
            </div>
        </>
    );
}

export default App;