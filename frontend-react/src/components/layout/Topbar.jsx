import {useState} from "react" ;
import { Search , PersonCircle} from 'react-bootstrap-icons';

function Topbar() {
    return (
        <header className="h-[72px] bg-white border-b px-7 flex items-center justify-between">
            <div>
                <h1 className = "text-gray-900 font-semibold text-xl">
                    Dashboard
                </h1>
            </div>

            <div className= "flex items-center gap-4">

                <div className="flex items-center bg-gray-100 rounded-full px-3 h-9 w-[260px]">
                    <Search size={16} className="text-gray-500" />
                    <input type="text" placeholder = "search ..." className = "bg-transparent  outline-none ml-2 w-full"/>
    
                </div>

                <button className="w-9 h-9 rounded-full hover:bg-gray-100">
                    🔔
                </button>

                <button className ="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center">
                <PersonCircle size ={22}/>
                </button>

            </div>
        </header>
    );
}


export default Topbar ; 