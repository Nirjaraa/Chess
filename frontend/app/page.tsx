import React, { JSX } from "react";

const page = () => {
  const squares: JSX.Element[] = [];
  for (let i = 0; i < 64; i++) {
    const row = Math.floor(i / 8);
    const lightSquare = (row + i) % 2 === 0;
    squares.push(<div key={i} className={`w-full h-full ${lightSquare ? "bg-yellow-100" : "bg-yellow-900"}`}></div>);
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="w-64 h-64 grid grid-cols-8 grid-rows-8">{squares}</div>
      <div className="text-5xl font-bold text-center p-5">Want to play Chess?</div>
      <div className="flex space-x-4">
        <button className="text-2xl font-semibold px-6 py-3 text-white bg-yellow-700 rounded-lg hover:bg-yellow-800">Play With Others</button>
        <button className="text-2xl font-semibold px-6 py-3 text-white bg-green-600 rounded-lg hover:bg-green-700">Play With Computer</button>
      </div>
    </div>
  );
};

export default page;
