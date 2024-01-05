/*
All code here and uses of useOutsideClick hook was taken from this
rwieruch article by Robin Wieruch, posted on Apr 4, 2022
https://www.robinwieruch.de/react-hook-detect-click-outside-component/
*/
import { useEffect, useRef } from "react";

export default function useOutsideClick(callback) {
  const ref = useRef();

  useEffect(() => {
    const handleClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    };

    document.addEventListener('click', handleClick);
    
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [ref]);

  return ref;
}