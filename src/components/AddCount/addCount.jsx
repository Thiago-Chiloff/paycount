import { useNavigate } from 'react-router-dom';

function AddCount() {
    const navigate = useNavigate();

    const Counts = () => {
        navigate("/formscount/formscount")
    }

    const ShowCount = () => {
        navigate("/showcount/showcount")
    }


    return(
        <div className="add-count-container">
            <h1><strong> $ Pay Count  $ </strong></h1>
           
            <button onClick={Counts} className="menu-button add-button">
                Adicionar Conta
            </button>
            
            <button onClick={ShowCount} className="menu-button view-button">
                Lista de Contas
            </button>

        </div>
    );
}

export default AddCount;