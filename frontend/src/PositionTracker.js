import React, {useRef} from 'react';

const getOffsetTop = ( elem ) => {
  var offsetTop = 0;
  do {
    if ( !isNaN( elem.offsetTop ) )
    {
      offsetTop += elem.offsetTop;
    }
  } while( elem = elem.offsetParent );
  return offsetTop;
};

const PositionTracker = ({height, onClick}) => {
  const ref = useRef(null);
  const refPointer = useRef(null);

  const dronePointerStyle ={
    bottom: height
  };

  const handleClick = event => {
    const pointerOffsetTop = getOffsetTop(refPointer.current);
    
    console.log(event.pageY, pointerOffsetTop)
    onClick((event.pageY | 0) - (pointerOffsetTop | 0));
  };

  return <div className="position-tracker"> 
    <div>{height}</div>
    <div ref={ref} className="position-tracker-body" onClick={handleClick}>
      <div ref={refPointer} className="drone-pointer" style={dronePointerStyle}></div>
    </div>
  </div>;
};

export default PositionTracker;