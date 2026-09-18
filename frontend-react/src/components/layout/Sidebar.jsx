import { useState, createContext, useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronBarRight, ChevronBarLeft, ThreeDotsVertical } from 'react-bootstrap-icons';
import Container from '../../assets/Container.svg';
import Frame20 from '../../assets/Frame20.png';


const SidebarContext = createContext();

export default function Sidebar({ user, children }) {
    const [expanded, setExpanded] = useState(true);
    
    return (
        <aside className="h-screen flex-shrink-0">
            <nav className={`h-full flex flex-col bg-white border-r shadow-sm transition-all duration-300 ${expanded ? 'w-64' : 'w-20'}`}>
                
                <div className="p-4 pb-2 flex justify-between items-center">
                    <img src={Container} className="w-8 h-8 mr-2 flex-shrink-0" alt="Logo" />
                    <div className={`flex items-center overflow-hidden transition-all ${expanded ? 'w-32' : 'w-0'}`}>
                         <span className="font-bold text-xl">SwiftTrack</span>
                    </div>

                    <button 
                        onClick={() => setExpanded((curr) => !curr)} 
                        className="p-2.01 rounded-lg bg-transparent hover:bg-gray-100"
                    >
                        {expanded ? <ChevronBarLeft size={20} /> : <ChevronBarRight size={20} />}
                    </button>
                </div>
                
                <SidebarContext.Provider value={{ expanded }}>
                    <ul className="flex-1 px-3 mt-4 space-y-1">{children}</ul>
                </SidebarContext.Provider>

                <div className="border-t flex p-3 items-center">
                    <img src={Frame20} className="w-10 h-10 rounded-md" alt="Avatar" />
                    
                    <div className={`flex justify-between items-center overflow-hidden transition-all ${expanded ? 'w-52 ml-3' : 'w-0'}`}>
                        <div className="leading-4">
                            <h4 className="font-semibold text-sm whitespace-nowrap">{user.name}</h4>
                            <span className="text-xs text-gray-500 whitespace-nowrap">{user.role}</span>
                        </div>
                        <ThreeDotsVertical size={20} className="cursor-pointer" />
                    </div>
                </div>
            </nav>
        </aside>
    );
}

export function SidebarItem({ icon, text, to, alert }) {
    const { expanded } = useContext(SidebarContext);
    
    return (
        <li>
            <NavLink 
                to={to}
                className={({ isActive }) => `
                    relative flex items-center py-2 px-3
                    font-medium rounded-md cursor-pointer transition-colors group
                    ${isActive 
                        ? 'bg-orange-50 text-orange-600'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}
                `}
            >
                <span className="flex-shrink-0">{icon}</span>
                <span className={`overflow-hidden transition-all whitespace-nowrap ${expanded ? 'w-52 ml-3' : 'w-0'}`}>
                    {text}
                </span>
                
                {alert && (
                    <div className={`absolute w-2 h-2 rounded-full bg-orange-500 ${expanded ? 'right-2' : 'right-2 top-2'}`}/>
                )}

                {!expanded && <div className={`
                    absolute left-full rounded-md px-2 py-1 ml-6
                    bg-orange-50 text-orange-600 text-sm font-medium shadow-lg
                    invisible opacity-20 -translate-x-2 transition-all
                    group-hover:visible group-hover:opacity-100 group-hover:translate-x-0
                    `}>
                    {text}
                </div>}
            </NavLink>
        </li>
    );
}