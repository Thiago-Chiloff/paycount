import { useNavigate } from "react-router-dom"

function BackButton () {
    const navigate = useNavigate()

    const Back = () => {
        navigate(-1)
    }

    return (
        <>
            <button onClick={Back} className="back-button"> 
                ← Voltar 
            </button>
        </>
    ) 
}

export default BackButton