import React from 'react';

interface SidebarProps {
  activePanel: string;
  setActivePanel: (panel: string) => void;
  pendingApprovals: number;
}

const Sidebar: React.FC<SidebarProps> = ({ activePanel, setActivePanel, pendingApprovals }) => {
  const navItems = ['Tasks', 'Approvals', 'Skills', 'Canvas'];

  return (
    <div className="w-64 bg-gray-800 text-white flex flex-col">
      <div className="p-4 font-bold text-xl">ClawPilot</div>
      <nav className="mt-4">
        <ul>
          {navItems.map((item) => (
            <li key={item} className="mb-2">
              <a
                href="#"
                onClick={() => setActivePanel(item)}
                className={`block p-4 rounded-md ${activePanel === item ? 'bg-gray-700' : 'hover:bg-gray-700'}`}>
                <div className="flex justify-between items-center">
                  <span>{item}</span>
                  {item === 'Approvals' && pendingApprovals > 0 && (
                    <span className="bg-red-500 text-white text-xs font-semibold rounded-full px-2 py-1">
                      {pendingApprovals}
                    </span>
                  )}
                </div>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;