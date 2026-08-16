import React from "react";

function Sidebar() {
  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4">
      <div className="flex flex-col items-center mb-8">
        <img src="/assets/image/logo.png" alt="Logo" className="w-12 h-12 mb-2" />
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900">PRISM</h1>
          <p className="text-sm text-gray-600">SUPERVISOR PORTAL</p>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
