import { Routes, Route } from 'react-router-dom';
import Background from './components/Background/background';
import AddCount from './components/AddCount/addCount';
import FormsCount from './components/FormsCount/formsCount';
import ShowCount from './components/ShowCount/showCount';
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