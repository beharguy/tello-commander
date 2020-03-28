import React from 'react';

const Battery = ({progress = 40}) => {
  const progressStyle = {
    width: `${progress}%`
  };
  const progressClassName = `battery-progress ${progress >= 40 ? 'green' : 'red'}`;

  return <div className="battery">
    <div className={progressClassName} style={progressStyle}></div>
  </div>;
};

export default Battery;